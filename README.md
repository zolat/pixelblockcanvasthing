# CanPix - Blockchain Canvas

CanPix is a decentralized pixel canvas application inspired by Reddit's r/place, where users can place colored pixels on a shared canvas. The key difference is that all pixel data is stored on the Ethereum blockchain, making it permanent and immutable.

## Features

- Interactive canvas where users can place colored pixels
- Each pixel placement is stored on the Ethereum blockchain
- Cooldown period between pixel placements to prevent spam
- Zoom and pan functionality for easy navigation
- Color picker with predefined palette and custom color support
- Wallet connection via MetaMask or other Web3 providers

## Tech Stack

- **Smart Contract**: Solidity
- **Blockchain Development**: Hardhat
- **Frontend**: Next.js, React
- **Styling**: TailwindCSS
- **Blockchain Interaction**: ethers.js

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- MetaMask browser extension

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/canpix.git
   cd canpix
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn install
   ```

### Running the Development Environment

1. Start a local Ethereum node:
   ```
   npx hardhat node
   ```

2. Deploy the smart contract to the local network:
   ```
   npx hardhat run scripts/deploy.js --network localhost
   ```
   
   Note the contract address that is output and update the `CONTRACT_ADDRESS` constant in `src/components/PixelCanvas.js` with this address.

3. Start the Next.js development server:
   ```
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

5. Connect your MetaMask wallet to the local Hardhat network:
   - Network Name: Hardhat
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 1337
   - Currency Symbol: ETH

### Deploying to a Testnet

1. Update the `hardhat.config.js` file with your testnet configuration.

2. Deploy the contract to the testnet:
   ```
   npx hardhat run scripts/deploy.js --network goerli
   ```

3. Update the `CONTRACT_ADDRESS` constant in `src/components/PixelCanvas.js` with the deployed contract address.

## How It Works

1. **Connect Wallet**: Users connect their Ethereum wallet to the application.
2. **Select Color**: Choose a color from the palette or use the color picker.
3. **Place Pixel**: Click on the canvas to place a pixel of the selected color.
4. **Confirm Transaction**: Approve the transaction in your wallet to store the pixel data on the blockchain.
5. **Cooldown Period**: After placing a pixel, users must wait for the cooldown period before placing another pixel in the same location.

## Smart Contract

The `PixelCanvas` smart contract stores the following data for each pixel:
- Owner address
- RGB color values
- Last update timestamp

The contract includes functions for:
- Setting a pixel's color
- Getting pixel data
- Batch loading pixel data
- Checking if a pixel can be updated
- Setting the cooldown period (admin only)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by Reddit's r/place
 