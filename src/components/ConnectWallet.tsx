import React from 'react';
import { ConnectWalletProps } from '@/types';

const ConnectWallet: React.FC<ConnectWalletProps> = ({
  connectWallet,
  isConnected,
  account
}) => {
  return (
    <div className="flex items-center space-x-4">
      {isConnected ? (
        <div className="flex items-center px-6 py-3 bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl backdrop-blur-sm border border-white/20">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-ping absolute"></div>
              </div>
            </div>
            <span className="text-gray-600 dark:text-gray-300 font-medium">
              {account?.slice(0, 6)}...{account?.slice(-4)}
            </span>
          </div>
        </div>
      ) : (
        <button
          onClick={connectWallet}
          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white font-bold rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
        >
          <span>Connect Wallet</span>
          <span className="text-xl">🦊</span>
        </button>
      )}
    </div>
  );
};

export default ConnectWallet; 