import { useState, useEffect } from 'react';
import Head from 'next/head';
import { ethers } from 'ethers';
import PixelCanvas from '@/components/PixelCanvas';
import ConnectWallet from '@/components/ConnectWallet';
import ColorPicker from '@/components/ColorPicker';
import type { ExtendedExternalProvider } from '@/types/ethereum';
import { UpdateMode, StagedPixel } from '@/types';
import PixelCanvasABI from '@/utils/PixelCanvasABI';

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

declare global {
  interface Window {
    ethereum?: ExtendedExternalProvider;
  }
}

export default function Home() {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#FF0000');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [colorPickerPosition, setColorPickerPosition] = useState({ x: 0, y: 0 });
  const [isDraggingPicker, setIsDraggingPicker] = useState(false);
  const [dragStartPicker, setDragStartPicker] = useState({ x: 0, y: 0 });
  const [activePanel, setActivePanel] = useState<'color' | 'help' | 'connect'>('color');
  const [updateMode, setUpdateMode] = useState<UpdateMode>('instant');
  const [stagedPixels, setStagedPixels] = useState<StagedPixel[]>([]);
  const [placingPixel, setPlacingPixel] = useState<boolean>(false);
  const [isCommitHovered, setIsCommitHovered] = useState<boolean>(false);
  const [totalEdits, setTotalEdits] = useState<number>(0);

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request?.({ method: 'eth_accounts' });
          
          if (accounts && accounts.length > 0) {
            const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
            const web3Signer = web3Provider.getSigner();
            
            setProvider(web3Provider);
            setSigner(web3Signer);
            setAccount(accounts[0]);
            setIsConnected(true);
          }
        } catch (error) {
          console.error("Error connecting to MetaMask", error);
        }
      }
    };
    
    checkConnection();
    
    if (window.ethereum) {
      window.ethereum.on?.('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        } else {
          setAccount(null);
          setIsConnected(false);
        }
      });
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners?.();
      }
    };
  }, []);

  useEffect(() => {
    if (placingPixel && updateMode === 'batch') {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.dispatchEvent(new Event('commitStagedPixels'));
      }
    }
  }, [placingPixel, updateMode]);

  useEffect(() => {
    const loadTotalEdits = async () => {
      if (signer) {
        try {
          const contract = new ethers.Contract(
            '0x5FbDB2315678afecb367f032d93F642f64180aa3',
            PixelCanvasABI,
            signer
          );
          const total = await contract.totalEdits();
          setTotalEdits(total.toNumber());
        } catch (error) {
          console.error("Error fetching total edits:", error);
        }
      }
    };

    loadTotalEdits();

    // Set up event listeners for updates
    if (signer) {
      const contract = new ethers.Contract(
        '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        PixelCanvasABI,
        signer
      );

      const handlePixelUpdate = () => {
        loadTotalEdits();
      };

      contract.on("PixelUpdated", handlePixelUpdate);
      contract.on("PixelBatchUpdated", handlePixelUpdate);

      return () => {
        contract.off("PixelUpdated", handlePixelUpdate);
        contract.off("PixelBatchUpdated", handlePixelUpdate);
      };
    }
  }, [signer]);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request?.({ method: 'eth_requestAccounts' });
        
        if (accounts) {
          const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
          const web3Signer = web3Provider.getSigner();
          
          setProvider(web3Provider);
          setSigner(web3Signer);
          setAccount(accounts[0]);
          setIsConnected(true);
        }
      } catch (error) {
        console.error("Error connecting to MetaMask", error);
      }
    } else {
      alert("Please install MetaMask to place pixels on the canvas");
    }
  };

  const handlePickerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLButtonElement) return; // Don't drag when clicking buttons
    setIsDraggingPicker(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragStartPicker({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handlePickerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingPicker) return;
    e.preventDefault();
    const newX = e.clientX - dragStartPicker.x;
    const newY = e.clientY - dragStartPicker.y;
    
    // Ensure the picker stays within the viewport
    const maxX = window.innerWidth - 256; // width of the picker
    const maxY = window.innerHeight - 100; // approximate height of picker
    
    setColorPickerPosition({
      x: Math.max(0, Math.min(maxX, newX)),
      y: Math.max(0, Math.min(maxY, newY))
    });
  };

  const handlePickerMouseUp = () => {
    setIsDraggingPicker(false);
  };

  const commitStagedPixels = async () => {
    if (!signer || stagedPixels.length === 0) return;

    try {
      setPlacingPixel(true);
      const contract = new ethers.Contract(
        '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        PixelCanvasABI,
        signer
      );

      // Prepare arrays for batch update
      const xs = stagedPixels.map(p => p.x);
      const ys = stagedPixels.map(p => p.y);
      const colorIndices = stagedPixels.map(p => HEX_TO_INDEX[p.color.toUpperCase()] || '0');

      const tx = await contract.setPixelBatch(xs, ys, colorIndices);
      await tx.wait();

      // Clear staged pixels after successful transaction
      setStagedPixels([]);
    } catch (err) {
      console.error('Error placing pixels:', err);
      if (err instanceof Error && err.message.includes('Cooldown period')) {
        alert('Please wait a moment before placing more pixels.');
      }
    } finally {
      setPlacingPixel(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 relative overflow-hidden">
      <Head>
        <title>CanPix - Create Together! ✨</title>
        <meta name="description" content="Join our creative community and make pixel art together on the blockchain! 🎨" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Stats Bar */}
      <div className="fixed top-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-2 flex justify-between items-center z-50">
        <div className="text-white/80 text-sm">
          {isConnected ? (
            <span>
              Connected: {account?.slice(0, 6)}...{account?.slice(-4)} | Total Edits: {totalEdits.toLocaleString()}
            </span>
          ) : (
            <span>Not connected</span>
          )}
        </div>
        <ConnectWallet
          connectWallet={connectWallet}
          isConnected={isConnected}
          account={account}
        />
      </div>

      {/* Tiled App Name Background */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none select-none">
        <div className="flex flex-wrap -rotate-12 scale-150">
          {Array.from({ length: 50 }).map((_, i) => (
            <div key={i} className="whitespace-nowrap m-8">
              {Array.from({ length: 10 }).map((_, j) => (
                <span key={j} className="mx-8 text-2xl font-bold">CanPix ✨</span>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      <div className="fixed inset-0 w-screen h-screen">
        <div className="relative w-full h-full">
          <PixelCanvas 
            signer={signer} 
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            updateMode={updateMode}
            setUpdateMode={setUpdateMode}
            stagedPixels={stagedPixels}
            setStagedPixels={setStagedPixels}
            placingPixel={placingPixel}
            setPlacingPixel={setPlacingPixel}
            isCommitHovered={isCommitHovered}
          />
          <div 
            className="absolute z-50 w-64 bg-black/50 rounded-2xl shadow-2xl backdrop-blur-sm border border-white/20 cursor-move"
            style={{ 
              top: colorPickerPosition.y || 16,
              right: colorPickerPosition.x ? 'auto' : 16,
              left: colorPickerPosition.x || 'auto',
              userSelect: 'none'
            }}
            onMouseDown={(e) => {
              if (e.target instanceof HTMLButtonElement) {
                e.stopPropagation();
                return;
              }
              handlePickerMouseDown(e);
            }}
            onMouseMove={handlePickerMouseMove}
            onMouseUp={handlePickerMouseUp}
            onMouseLeave={handlePickerMouseUp}
            onClick={(e) => e.stopPropagation()}
          >
            {isConnected ? (
              <>
                {/* Accordion Header */}
                <div className="flex border-b border-white/10">
                  <button
                    onClick={() => setActivePanel('color')}
                    className={`flex-1 p-2 text-sm text-center transition-colors ${
                      activePanel === 'color' 
                        ? 'text-white bg-white/10' 
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    🎨 Colors
                  </button>
                  <button
                    onClick={() => setActivePanel('help')}
                    className={`flex-1 p-2 text-sm text-center transition-colors ${
                      activePanel === 'help' 
                        ? 'text-white bg-white/10' 
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    💡 Help
                  </button>
                </div>

                {/* Panel Content */}
                <div className="p-4">
                  {activePanel === 'color' && (
                    <ColorPicker
                      selectedColor={selectedColor}
                      setSelectedColor={setSelectedColor}
                      updateMode={updateMode}
                      setUpdateMode={setUpdateMode}
                      stagedPixels={stagedPixels}
                      setStagedPixels={setStagedPixels}
                      placingPixel={placingPixel}
                      setPlacingPixel={setPlacingPixel}
                      setIsCommitHovered={setIsCommitHovered}
                      commitStagedPixels={commitStagedPixels}
                    />
                  )}
                  {activePanel === 'help' && (
                    <div className="space-y-4 text-white/90">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">🎨</span>
                        <p className="text-sm">Pick a color</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">👆</span>
                        <p className="text-sm">Click to place pixel</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">🖱️</span>
                        <p className="text-sm">Right-click to move</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">⚡</span>
                        <p className="text-sm">Scroll to zoom</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Drag Handle */}
                <div className="p-2 border-t border-white/10 text-white/70 text-xs text-center select-none">
                  Drag to move • Click tabs to switch
                </div>
              </>
            ) : (
              <div className="p-4 space-y-4">
                <div className="text-center">
                  <h3 className="text-white font-medium mb-2">Welcome to CanPix! ✨</h3>
                  <p className="text-white/90 text-sm">Connect your wallet to start creating!</p>
                </div>
                <button
                  onClick={connectWallet}
                  className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  Connect Wallet 🦊
                </button>
                <div className="text-white/70 text-xs text-center">
                  Drag panel to move
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 