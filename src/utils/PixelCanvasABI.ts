const PixelCanvasABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "x",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "y",
        "type": "uint256"
      }
    ],
    "name": "canUpdatePixel",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "x",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "y",
        "type": "uint256"
      }
    ],
    "name": "getPixel",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256[]",
        "name": "positions",
        "type": "uint256[]"
      }
    ],
    "name": "getPixelBatch",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "uint8",
            "name": "red",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "green",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "blue",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "lastUpdated",
            "type": "uint256"
          }
        ],
        "internalType": "struct PixelCanvas.Pixel[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "x",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "y",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "red",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "green",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "blue",
        "type": "uint8"
      }
    ],
    "name": "setPixel",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "x",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "y",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "red",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "green",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "blue",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "PixelUpdated",
    "type": "event"
  }
] as const;

export default PixelCanvasABI; 