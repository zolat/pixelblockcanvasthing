import React, { useEffect, useRef, useState } from 'react';
import { ethers } from 'ethers';
import type { PixelCanvasProps, PixelData, Position, StagedPixel, PixelUpdate } from '@/types';
import PixelCanvasABI from '@/utils/PixelCanvasABI';
import ColorPicker from '@/components/ColorPicker';

// Contract address - this will be set after deployment
const CONTRACT_ADDRESS = '0x5fbdb2315678afecb367f032d93f642f64180aa3';
const CANVAS_WIDTH = 160;
const CANVAS_HEIGHT = 90;
const PIXEL_SIZE = 8;
const MAX_BATCH_SIZE = 100;

// Add WebSocket RPC URL
const WS_RPC_URL = "ws://127.0.0.1:8545";
const HTTP_RPC_URL = "http://127.0.0.1:8545";

// Define the 16-color palette with hex values
const PALETTE_COLORS: { [key: string]: string } = {
  '0': '#000000', // Black
  '1': '#FF0000', // Red
  '2': '#00FF00', // Green
  '3': '#0000FF', // Blue
  '4': '#FFFF00', // Yellow
  '5': '#FF00FF', // Magenta
  '6': '#00FFFF', // Cyan
  '7': '#FFFFFF', // White
  '8': '#808080', // Gray
  '9': '#FF8000', // Orange
  'A': '#800000', // Dark Red
  'B': '#008000', // Dark Green
  'C': '#000080', // Dark Blue
  'D': '#808000', // Dark Yellow
  'E': '#800080', // Dark Magenta
  'F': '#008080'  // Dark Cyan
};

// Reverse mapping from hex to index
const HEX_TO_INDEX: { [key: string]: string } = Object.entries(PALETTE_COLORS)
  .reduce((acc, [index, hex]) => ({ ...acc, [hex.toUpperCase()]: index }), {});

const PixelCanvas: React.FC<PixelCanvasProps> = ({ 
  signer, 
  selectedColor, 
  setSelectedColor,
  updateMode,
  setUpdateMode,
  stagedPixels,
  setStagedPixels,
  placingPixel,
  setPlacingPixel,
  isCommitHovered
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [pixels, setPixels] = useState<PixelData[]>([]);
  const [hoveredPixel, setHoveredPixel] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [wsProvider, setWsProvider] = useState<ethers.providers.WebSocketProvider | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.2);
  
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 5;
  const ZOOM_STEP = 0.2;
  const ZOOM_INTERVAL = 100;

  // Add refs to store interval IDs
  const zoomInInterval = useRef<NodeJS.Timeout | null>(null);
  const zoomOutInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebSocket provider for events
  useEffect(() => {
    const provider = new ethers.providers.WebSocketProvider(WS_RPC_URL);
    setWsProvider(provider);

    return () => {
      if (provider) {
        provider.removeAllListeners();
        provider._websocket.close();
      }
    };
  }, []);

  // Initialize contract with signer or provider
  useEffect(() => {
    const initializeContract = async () => {
      try {
        let contractInstance: ethers.Contract;
        
        if (signer) {
          contractInstance = new ethers.Contract(
            CONTRACT_ADDRESS,
            PixelCanvasABI,
            signer
          );
          setIsReadOnly(false);
        } else {
          const provider = new ethers.providers.JsonRpcProvider(HTTP_RPC_URL);
          contractInstance = new ethers.Contract(
            CONTRACT_ADDRESS,
            PixelCanvasABI,
            provider
          );
          setIsReadOnly(true);
        }
        
        setContract(contractInstance);

        if (wsProvider) {
          const wsContract = new ethers.Contract(
            CONTRACT_ADDRESS,
            PixelCanvasABI,
            wsProvider
          );

          // Listen for pixel updates
          wsContract.on("PixelUpdated", (x: number, y: number, owner: string, colorIndex: string, timestamp: number) => {
            console.log('Pixel update received:', { x, y, colorIndex });
            setPixels(prevData => {
              const newData = [...prevData];
              const index = Number(y) * CANVAS_WIDTH + Number(x);
              newData[index] = {
                x: Number(x),
                y: Number(y),
                color: PALETTE_COLORS[colorIndex] || '#FFFFFF',
                lastUpdate: Number(timestamp)
              };
              return newData;
            });
          });

          // Listen for batch updates
          wsContract.on("PixelBatchUpdated", (owner: string, count: number, timestamp: number) => {
            console.log(`Batch update of ${count} pixels by ${owner}`);
            // Reload the affected portion of the canvas
            loadCanvasData();
          });
        }
      } catch (err) {
        console.error('Error initializing contract:', err);
        setError('Failed to initialize contract connection');
      }
    };

    initializeContract();
  }, [signer, wsProvider]);

  // Load initial canvas data
  const loadCanvasData = async () => {
    if (!contract) return;
    
    try {
      setIsLoading(true);
      setError(null);
      setLoadingProgress(0);

      const CHUNK_SIZE = 1000; // Load 1000 pixels at a time
      const totalPixels = CANVAS_WIDTH * CANVAS_HEIGHT;
      
      // Initialize all pixels with default values
      const newPixels: PixelData[] = Array(totalPixels).fill(null).map((_, index) => ({
        x: index % CANVAS_WIDTH,
        y: Math.floor(index / CANVAS_WIDTH),
        color: '#FFFFFF', // Default to white
        lastUpdate: Date.now()
      }));

      for (let start = 0; start < totalPixels; start += CHUNK_SIZE) {
        const length = Math.min(CHUNK_SIZE, totalPixels - start);
        try {
          const canvasString = await contract.getCanvasPortion(start, length);
          
          // Convert the string into pixel data
          for (let i = 0; i < length; i++) {
            const index = start + i;
            const colorIndex = canvasString[i] || '7'; // Default to white (7) if no color
            newPixels[index] = {
              x: index % CANVAS_WIDTH,
              y: Math.floor(index / CANVAS_WIDTH),
              color: PALETTE_COLORS[colorIndex] || '#FFFFFF',
              lastUpdate: Date.now()
            };
          }
          
          setLoadingProgress(Math.min(100, Math.round((start + length) / totalPixels * 100)));
          setPixels([...newPixels]); // Update pixels after each chunk
        } catch (chunkError) {
          console.error(`Error loading chunk starting at ${start}:`, chunkError);
          // Continue with next chunk even if one fails
          continue;
        }
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading canvas data:', err);
      setError('Failed to load canvas data. Please try refreshing the page.');
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadCanvasData();
  }, [contract]);

  // Draw the canvas whenever pixel data or staged pixels change
  useEffect(() => {
    if (!canvasRef.current || isLoading) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear and set background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw pixels with proper positioning
    pixels.forEach(pixel => {
      if (!pixel) return; // Skip undefined pixels
      
      const xPos = pixel.x * PIXEL_SIZE;
      const yPos = pixel.y * PIXEL_SIZE;
      ctx.fillStyle = pixel.color;
      ctx.fillRect(xPos, yPos, PIXEL_SIZE, PIXEL_SIZE);
    });

    // Draw staged pixels with a special effect
    stagedPixels.forEach(pixel => {
      const xPos = pixel.x * PIXEL_SIZE;
      const yPos = pixel.y * PIXEL_SIZE;
      
      // Draw staged pixel with full opacity
      ctx.fillStyle = pixel.color;
      ctx.fillRect(xPos, yPos, PIXEL_SIZE, PIXEL_SIZE);
      
      // Add a border to indicate it's staged, with enhanced highlight when commit is hovered
      ctx.strokeStyle = isCommitHovered ? '#FFA500' : '#FFD700';
      ctx.lineWidth = isCommitHovered ? 2 : 1;
      ctx.strokeRect(xPos, yPos, PIXEL_SIZE, PIXEL_SIZE);
      
      // Add a glow effect when commit is hovered
      if (isCommitHovered) {
        ctx.shadowColor = '#FFA500';
        ctx.shadowBlur = 4;
        ctx.strokeRect(xPos, yPos, PIXEL_SIZE, PIXEL_SIZE);
        ctx.shadowBlur = 0;
      }
    });
    
    // Draw grid with proper alignment
    ctx.strokeStyle = '#EEEEEE';
    ctx.lineWidth = 0.5;
    
    // Draw vertical grid lines
    for (let x = 0; x <= CANVAS_WIDTH; x++) {
      const xPos = x * PIXEL_SIZE;
      ctx.beginPath();
      ctx.moveTo(xPos, 0);
      ctx.lineTo(xPos, CANVAS_HEIGHT * PIXEL_SIZE);
      ctx.stroke();
    }
    
    // Draw horizontal grid lines
    for (let y = 0; y <= CANVAS_HEIGHT; y++) {
      const yPos = y * PIXEL_SIZE;
      ctx.beginPath();
      ctx.moveTo(0, yPos);
      ctx.lineTo(CANVAS_WIDTH * PIXEL_SIZE, yPos);
      ctx.stroke();
    }
    
    // Draw hovered pixel with proper positioning
    if (hoveredPixel) {
      const xPos = hoveredPixel.x * PIXEL_SIZE;
      const yPos = hoveredPixel.y * PIXEL_SIZE;
      
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(xPos, yPos, PIXEL_SIZE, PIXEL_SIZE);
      
      // Only show preview if not already staged
      if (!stagedPixels.some(p => p.x === hoveredPixel.x && p.y === hoveredPixel.y)) {
        ctx.fillStyle = selectedColor + '80';
        ctx.fillRect(xPos, yPos, PIXEL_SIZE, PIXEL_SIZE);
      }
    }
  }, [pixels, hoveredPixel, selectedColor, isLoading, stagedPixels, isCommitHovered]);

  const handleCanvasClick = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isReadOnly) {
      setError('Please connect your wallet to place pixels');
      return;
    }

    if (!contract || !hoveredPixel || placingPixel) return;

    e.stopPropagation();
    e.preventDefault();

    // Check if pixel is already staged
    const isStaged = stagedPixels.some(p => p.x === hoveredPixel.x && p.y === hoveredPixel.y);
    if (isStaged) {
      setStagedPixels(stagedPixels.filter(p => p.x !== hoveredPixel.x || p.y !== hoveredPixel.y));
      return;
    }
    
    if (updateMode === 'batch') {
      if (stagedPixels.length >= MAX_BATCH_SIZE) {
        setError(`Cannot stage more than ${MAX_BATCH_SIZE} pixels at once`);
        return;
      }
      
      setStagedPixels([...stagedPixels, {
        x: hoveredPixel.x,
        y: hoveredPixel.y,
        color: selectedColor
      }]);
      return;
    }
    
    // Instant mode - place pixel immediately
    try {
      setPlacingPixel(true);
      setError(null);
      
      const colorIndex = HEX_TO_INDEX[selectedColor.toUpperCase()] || '7';
      
      const tx = await contract.setPixel(
        hoveredPixel.x,
        hoveredPixel.y,
        colorIndex.toString()
      );
      
      await tx.wait();
      
      // Update local state with the new pixel
      setPixels(prevData => {
        const newData = [...prevData];
        const index = hoveredPixel.y * CANVAS_WIDTH + hoveredPixel.x;
        
        // Ensure the pixel data is properly initialized
        newData[index] = {
          x: hoveredPixel.x,
          y: hoveredPixel.y,
          color: selectedColor,
          lastUpdate: Date.now()
        };
        
        return newData;
      });
      
      setPlacingPixel(false);
    } catch (err) {
      console.error('Error placing pixel:', err);
      let errorMessage = 'Failed to place pixel. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('user rejected transaction')) {
          errorMessage = 'Transaction cancelled. No worries, you can try again when ready! 😊';
        } else if (err.message.includes('insufficient funds')) {
          errorMessage = 'Not enough ETH in your wallet to place a pixel. 💰';
        } else if (err.message.includes('Cooldown period')) {
          errorMessage = 'Please wait a moment before placing another pixel. ⏳';
        }
      }
      
      setError(errorMessage);
      setPlacingPixel(false);
    }
  };

  const commitStagedPixels = async () => {
    if (!contract || stagedPixels.length === 0 || placingPixel) return;

    try {
      setPlacingPixel(true);
      setError(null);

      // Prepare arrays for batch update
      const xs = stagedPixels.map(p => p.x);
      const ys = stagedPixels.map(p => p.y);
      const colorIndices = stagedPixels.map(p => HEX_TO_INDEX[p.color.toUpperCase()] || '0');

      console.log('Sending batch update:', { xs, ys, colorIndices });
      const tx = await contract.setPixelBatch(xs, ys, colorIndices);
      console.log('Transaction sent:', tx.hash);
      await tx.wait();
      console.log('Transaction confirmed');

      // Update local state after successful transaction
      setPixels(prevData => {
        const newData = [...prevData];
        stagedPixels.forEach(pixel => {
          const index = pixel.y * CANVAS_WIDTH + pixel.x;
          newData[index] = {
            x: pixel.x,
            y: pixel.y,
            color: pixel.color,
            lastUpdate: Math.floor(Date.now() / 1000)
          };
        });
        return newData;
      });

      // Clear staged pixels
      setStagedPixels([]);
      setPlacingPixel(false);
    } catch (err) {
      console.error('Error placing pixels:', err);
      let errorMessage = 'Failed to place pixels. Please try again.';
      
      if (err instanceof Error) {
        console.error('Detailed error:', err.message);
        console.error('Error stack:', err.stack);
        if (err.message.includes('user rejected transaction')) {
          errorMessage = 'Transaction cancelled. Your staged pixels are still available! 😊';
        } else if (err.message.includes('insufficient funds')) {
          errorMessage = 'Not enough ETH in your wallet to place pixels. 💰';
        } else if (err.message.includes('Cooldown period')) {
          errorMessage = 'Please wait a moment before placing these pixels. ⏳';
        }
      }
      
      setError(errorMessage);
      setPlacingPixel(false);
    }
  };

  const clearStagedPixels = () => {
    setStagedPixels([]);
  };

  // Update handleWheel to work in both modes
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    // Calculate new zoom level
    const delta = -Math.sign(e.deltaY) * ZOOM_STEP;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel + delta));
    
    if (newZoom !== zoomLevel) {
      // Get mouse position relative to canvas
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calculate position adjustment to keep the point under mouse cursor fixed
      const scaleChange = newZoom / zoomLevel;
      const newX = mouseX - (mouseX - position.x) * scaleChange;
      const newY = mouseY - (mouseY - position.y) * scaleChange;
      
      setZoomLevel(newZoom);
      setPosition({ x: newX, y: newY });
    }
  };

  // Update mouse move handler to account for zoom
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate position relative to canvas origin, accounting for zoom
    const x = Math.floor((e.clientX - rect.left) / (PIXEL_SIZE * zoomLevel));
    const y = Math.floor((e.clientY - rect.top) / (PIXEL_SIZE * zoomLevel));
    
    if (x >= 0 && x < CANVAS_WIDTH && y >= 0 && y < CANVAS_HEIGHT) {
      setHoveredPixel({ x, y });
    } else {
      setHoveredPixel(null);
    }
    
    if (isDragging) {
      const newX = position.x + (e.clientX - dragStart.x);
      const newY = position.y + (e.clientY - dragStart.y);
      setPosition({ x: newX, y: newY });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || e.button === 2) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setHoveredPixel(null);
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY 
      });
    }
  };

  // Update touch move handler to account for zoom
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !isDragging || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Update position with bounds checking
    const newX = position.x + (touch.clientX - dragStart.x);
    const newY = position.y + (touch.clientY - dragStart.y);
    setPosition({ x: newX, y: newY });
    setDragStart({ x: touch.clientX, y: touch.clientY });
    
    // Calculate position relative to canvas origin, accounting for zoom
    const x = Math.floor((touch.clientX - rect.left) / (PIXEL_SIZE * zoomLevel));
    const y = Math.floor((touch.clientY - rect.top) / (PIXEL_SIZE * zoomLevel));
    
    if (x >= 0 && x < CANVAS_WIDTH && y >= 0 && y < CANVAS_HEIGHT) {
      setHoveredPixel({ x, y });
    } else {
      setHoveredPixel(null);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const resetPosition = () => {
    setPosition({ x: 0, y: 0 });
  };

  // Add handlers for zoom button interactions
  const handleZoomInStart = () => {
    if (zoomInInterval.current) return;
    
    const zoom = () => {
      setZoomLevel(prev => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
    };
    
    zoom(); // Initial zoom
    zoomInInterval.current = setInterval(zoom, ZOOM_INTERVAL);
  };

  const handleZoomInEnd = () => {
    if (zoomInInterval.current) {
      clearInterval(zoomInInterval.current);
      zoomInInterval.current = null;
    }
  };

  const handleZoomOutStart = () => {
    if (zoomOutInterval.current) return;
    
    const zoom = () => {
      setZoomLevel(prev => Math.max(MIN_ZOOM, prev - ZOOM_STEP));
    };
    
    zoom(); // Initial zoom
    zoomOutInterval.current = setInterval(zoom, ZOOM_INTERVAL);
  };

  const handleZoomOutEnd = () => {
    if (zoomOutInterval.current) {
      clearInterval(zoomOutInterval.current);
      zoomOutInterval.current = null;
    }
  };

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (zoomInInterval.current) clearInterval(zoomInInterval.current);
      if (zoomOutInterval.current) clearInterval(zoomOutInterval.current);
    };
  }, []);

  if (error) {
    // Only show full-screen error for critical errors, not for cooldown messages
    if (!error.includes('Cooldown period') && !error.includes('Please wait a moment')) {
      return (
        <div className="flex items-center justify-center w-full h-full bg-gray-900 text-white">
          <p className="text-red-500">{error}</p>
        </div>
      );
    }
  }

  return (
    <div className="relative">
      {isReadOnly && (
        <div className="mb-4 text-center">
          <span className="text-yellow-600 dark:text-yellow-400 text-sm bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2 rounded-full">
            Connect wallet to place pixels
          </span>
        </div>
      )}
      
      <div className="relative w-screen h-screen overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 dark:bg-gray-900/90 px-4 py-2 rounded-full shadow-lg z-10 flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
              <span className="text-sm">{loadingProgress}%</span>
            </div>
          )}
          
          {/* Placing pixel indicator */}
          {placingPixel && (
            <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 px-4 py-2 rounded-full shadow-lg z-10 flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
              <span className="text-sm">
                {updateMode === 'batch' ? 'Placing pixels...' : 'Placing pixel...'}
              </span>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-full shadow-lg z-10">
              <span className="text-red-600 dark:text-red-400 text-sm">{error}</span>
            </div>
          )}
          
          {/* Canvas */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative" style={{
              transform: `scale(${zoomLevel})`,
              transition: 'transform 0.3s ease'
            }}>
              <div className="absolute inset-0 bg-slate-200/[0.03] blur-xl rounded-full"></div>
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH * PIXEL_SIZE}
                height={CANVAS_HEIGHT * PIXEL_SIZE}
                onClick={handleCanvasClick}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onWheel={handleWheel}
                onContextMenu={(e) => e.preventDefault()}
                className={`cursor-${isReadOnly || placingPixel ? 'not-allowed' : 'pointer'} shadow-2xl relative`}
                style={{ 
                  transform: `translate(${position.x}px, ${position.y}px)`,
                  touchAction: 'none',
                  filter: placingPixel ? 'brightness(0.95)' : 'none',
                  transition: 'filter 0.2s ease'
                }}
              />
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full p-2 shadow-lg border border-white/20 flex items-center gap-2">
            <button
              onMouseDown={handleZoomOutStart}
              onMouseUp={handleZoomOutEnd}
              onMouseLeave={handleZoomOutEnd}
              onTouchStart={handleZoomOutStart}
              onTouchEnd={handleZoomOutEnd}
              disabled={zoomLevel <= MIN_ZOOM}
              className={`p-2 rounded-full ${
                zoomLevel <= MIN_ZOOM
                  ? 'text-gray-500 cursor-not-allowed'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              🔍-
            </button>
            <span className="text-white text-sm px-2">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onMouseDown={handleZoomInStart}
              onMouseUp={handleZoomInEnd}
              onMouseLeave={handleZoomInEnd}
              onTouchStart={handleZoomInStart}
              onTouchEnd={handleZoomInEnd}
              disabled={zoomLevel >= MAX_ZOOM}
              className={`p-2 rounded-full ${
                zoomLevel >= MAX_ZOOM
                  ? 'text-gray-500 cursor-not-allowed'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              🔍+
            </button>
            <div className="w-px h-6 bg-white/20"></div>
            <button
              onClick={resetPosition}
              className="p-2 rounded-full text-white hover:bg-white/10"
            >
              🎯
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PixelCanvas; 