const hre = require("hardhat");

async function main() {
  console.log("Deploying PixelCanvas contract...");

  // Get the contract factory
  const PixelCanvas = await hre.ethers.getContractFactory("PixelCanvas");
  
  // Deploy the contract
  const pixelCanvas = await PixelCanvas.deploy();
  
  // Wait for deployment to finish
  await pixelCanvas.deployed();
  
  console.log(`PixelCanvas deployed to: ${pixelCanvas.address}`);
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 