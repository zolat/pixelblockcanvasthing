import { ethers } from 'ethers';

type ExtendedExternalProvider = ethers.providers.ExternalProvider & {
  isMetaMask?: boolean;
  request?: (args: { method: string; params?: any[] }) => Promise<any>;
  on?: (event: string, callback: (...args: any[]) => void) => void;
  removeAllListeners?: () => void;
};

declare global {
  interface Window {
    ethereum?: ExtendedExternalProvider;
  }
} 