import { ethers } from 'ethers';

export type UpdateMode = 'instant' | 'batch';

export interface Position {
  x: number;
  y: number;
}

export interface StagedPixel extends Position {
  color: string;
}

export interface PixelData extends Position {
  color: string;
  lastUpdate: number;
}

export interface PixelUpdate extends Position {
  colorIndex: string;
}

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

export interface ColorMap {
  [key: string]: string;
}

export interface ExtendedExternalProvider extends ethers.providers.ExternalProvider {
  selectedAddress?: string;
  on?: (event: string, callback: (...args: any[]) => void) => void;
  removeListener?: (event: string, callback: (...args: any[]) => void) => void;
}