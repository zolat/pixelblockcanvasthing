import { ethers } from 'ethers';

export interface Pixel {
  owner: string;
  red: number;
  green: number;
  blue: number;
  lastUpdated: number;
}

export interface PixelData {
  x: number;
  y: number;
  owner: string;
  color: string | null;
  lastUpdated: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface PixelCanvasProps {
  signer: ethers.Signer | null;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
}

export interface ConnectWalletProps {
  connectWallet: () => Promise<void>;
  isConnected: boolean;
  account: string | null;
}

export interface ColorPickerProps {
  selectedColor: string;
  setSelectedColor: (color: string) => void;
} 