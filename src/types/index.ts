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

export interface StagedPixel {
  x: number;
  y: number;
  color: string;
}

export interface PixelUpdate {
  x: number;
  y: number;
  red: number;
  green: number;
  blue: number;
}

export type UpdateMode = 'instant' | 'batch';

export interface PixelCanvasProps {
  signer: ethers.Signer | null;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  updateMode: UpdateMode;
  setUpdateMode: (mode: UpdateMode) => void;
  stagedPixels: StagedPixel[];
  setStagedPixels: (pixels: StagedPixel[]) => void;
  placingPixel: boolean;
  setPlacingPixel: (placing: boolean) => void;
  isCommitHovered: boolean;
}

export interface ConnectWalletProps {
  connectWallet: () => Promise<void>;
  isConnected: boolean;
  account: string | null;
}

export interface ColorPickerProps {
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  updateMode: UpdateMode;
  setUpdateMode: (mode: UpdateMode) => void;
  stagedPixels: StagedPixel[];
  setStagedPixels: (pixels: StagedPixel[]) => void;
  placingPixel: boolean;
  setPlacingPixel: (placing: boolean) => void;
  setIsCommitHovered: (hovered: boolean) => void;
  commitStagedPixels: () => Promise<void>;
} 