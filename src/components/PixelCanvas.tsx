import React, { useEffect, useRef, useState } from 'react';
import { ethers } from 'ethers';
import PixelCanvasABI from '@/utils/PixelCanvasABI';
import { PixelCanvasProps, PixelData, Position, Pixel } from '@/types';
import ColorPicker from '@/components/ColorPicker';

// Contract address - this will be set after deployment
const CONTRACT_ADDRESS = '0xD84379CEae14AA33C123Af12424A37803F885889';
const CANVAS_WIDTH = 160;
const CANVAS_HEIGHT = 90;
const PIXEL_SIZE = 8;

// Add WebSocket RPC URL
const WS_RPC_URL = "ws://127.0.0.1:8545";
const HTTP_RPC_URL = "http://127.0.0.1:8545";

const PixelCanvas: React.FC<PixelCanvasProps> = ({ signer, selectedColor, setSelectedColor }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [pixelData, setPixelData] = useState<PixelData[]>([]);
  const [hoveredPixel, setHoveredPixel] = useState<Position | null>(null);
  const [placingPixel, setPlacingPixel] = useState<boolean>(false);
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
  const ZOOM_INTERVAL = 100; // How often to zoom while holding (in ms)

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

          wsContract.on("PixelUpdated", (x: number, y: number, owner: string, red: number, green: number, blue: number, timestamp: number) => {
            setPixelData(prevData => {
              const newData = [...prevData];
              const index = Number(y) * CANVAS_WIDTH + Number(x);
              
              newData[index] = {
                ...newData[index],
                x: Number(x),
                y: Number(y),
                color: `rgb(${red}, ${green}, ${blue})`,
                owner,
                lastUpdated: Number(timestamp)
              };
              
              return newData;
            });
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
  useEffect(() => {
    if (!contract) return;

    const loadCanvasData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setLoadingProgress(0);

        const positions = Array.from(
          { length: CANVAS_HEIGHT * CANVAS_WIDTH },
          (_, i) => i
        );

        const batchSize = 500;
        const pixelDataArray: Pixel[] = [];

        for (let i = 0; i < positions.length; i += batchSize) {
          const batch = positions.slice(i, i + batchSize);
          const batchData = await contract.getPixelBatch(batch);
          pixelDataArray.push(...batchData);

          const progress = Math.min(100, Math.floor((i + batchSize) / positions.length * 100));
          setLoadingProgress(progress);
        }

        const formattedData: PixelData[] = pixelDataArray.map((pixel, index) => ({
          x: index % CANVAS_WIDTH,
          y: Math.floor(index / CANVAS_WIDTH),
          owner: pixel.owner,
          color: pixel.red > 0 || pixel.green > 0 || pixel.blue > 0
            ? `rgb(${pixel.red}, ${pixel.green}, ${pixel.blue})`
            : null,
          lastUpdated: Number(pixel.lastUpdated)
        }));

        setPixelData(formattedData);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading canvas data:', err);
        setError('Failed to load canvas data. Please try again.');
        setIsLoading(false);
      }
    };

    loadCanvasData();
  }, [contract]);

  // Draw the canvas whenever pixel data changes
  useEffect(() => {
    if (!canvasRef.current || isLoading) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear and set background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
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
    
    // Draw pixels with proper positioning
    pixelData.forEach(pixel => {
      if (pixel.color) {
        const xPos = pixel.x * PIXEL_SIZE;
        const yPos = pixel.y * PIXEL_SIZE;
        ctx.fillStyle = pixel.color;
        ctx.fillRect(xPos, yPos, PIXEL_SIZE, PIXEL_SIZE);
      }
    });
    
    // Draw hovered pixel with proper positioning
    if (hoveredPixel) {
      const xPos = hoveredPixel.x * PIXEL_SIZE;
      const yPos = hoveredPixel.y * PIXEL_SIZE;
      
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(xPos, yPos, PIXEL_SIZE, PIXEL_SIZE);
      
      ctx.fillStyle = selectedColor + '80';
      ctx.fillRect(xPos, yPos, PIXEL_SIZE, PIXEL_SIZE);
    }
  }, [pixelData, hoveredPixel, selectedColor, isLoading]);

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

  const handleCanvasClick = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isReadOnly) {
      setError('Please connect your wallet to place pixels');
      return;
    }

    if (!contract || !hoveredPixel || placingPixel) return;
    
    try {
      setPlacingPixel(true);
      setError(null);
      
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
      };
      
      const rgb = hexToRgb(selectedColor);
      
      const tx = await contract.setPixel(
        hoveredPixel.x,
        hoveredPixel.y,
        rgb.r,
        rgb.g,
        rgb.b
      );
      
      await tx.wait();
      
      setPixelData(prevData => {
        const newData = [...prevData];
        const index = hoveredPixel.y * CANVAS_WIDTH + hoveredPixel.x;
        
        newData[index] = {
          ...newData[index],
          color: selectedColor,
          lastUpdated: Math.floor(Date.now() / 1000)
        };
        
        return newData;
      });
      
      setPlacingPixel(false);
    } catch (err) {
      console.error('Error placing pixel:', err);
      let errorMessage = 'Failed to place pixel. Please try again.';
      
      if (err instanceof Error) {
        // Check for common MetaMask errors
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

  return (
    <div className="relative">
      {isReadOnly && (
        <div className="mb-4 text-center">
          <span className="text-yellow-600 dark:text-yellow-400 text-sm bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2 rounded-full">
            Connect wallet to place pixels
          </span>
        </div>
      )}
      
      <div 
        className="relative w-screen h-screen overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden">
          {isLoading && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 dark:bg-gray-900/90 px-4 py-2 rounded-full shadow-lg z-10 flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
              <span className="text-sm">{loadingProgress}%</span>
            </div>
          )}
          
          {placingPixel && (
            <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 px-4 py-2 rounded-full shadow-lg z-10 flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
              <span className="text-sm">Placing pixel...</span>
            </div>
          )}
          
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

          {/* Floating Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg z-50 flex items-center space-x-4">
            <button
              onMouseDown={handleZoomOutStart}
              onMouseUp={handleZoomOutEnd}
              onMouseLeave={handleZoomOutEnd}
              onTouchStart={handleZoomOutStart}
              onTouchEnd={handleZoomOutEnd}
              className={`text-white hover:text-blue-400 transition-colors ${
                zoomLevel <= MIN_ZOOM ? 'opacity-50 cursor-not-allowed hover:text-white' : ''
              }`}
              disabled={zoomLevel <= MIN_ZOOM}
            >
              <span className="text-2xl">−</span>
            </button>
            <span className="text-white/90 text-sm">{Math.round(zoomLevel * 100)}%</span>
            <button
              onMouseDown={handleZoomInStart}
              onMouseUp={handleZoomInEnd}
              onMouseLeave={handleZoomInEnd}
              onTouchStart={handleZoomInStart}
              onTouchEnd={handleZoomInEnd}
              className={`text-white hover:text-blue-400 transition-colors ${
                zoomLevel >= MAX_ZOOM ? 'opacity-50 cursor-not-allowed hover:text-white' : ''
              }`}
              disabled={zoomLevel >= MAX_ZOOM}
            >
              <span className="text-2xl">+</span>
            </button>
            <div className="w-px h-4 bg-white/20" /> {/* Divider */}
            <button
              onClick={resetPosition}
              className="text-white hover:text-blue-400 transition-colors flex items-center space-x-1"
            >
              <span className="text-lg">🎯</span>
              <span className="text-sm">Center</span>
            </button>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-red-100 text-red-800 dark:bg-red-900/90 dark:text-red-200 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default PixelCanvas; 