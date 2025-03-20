const PaletteManagerABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "index",
        "type": "uint8"
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
      }
    ],
    "name": "ColorUpdated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "name": "colors",
    "outputs": [
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
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "index",
        "type": "uint8"
      }
    ],
    "name": "getColor",
    "outputs": [
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
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPalette",
    "outputs": [
      {
        "components": [
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
        "internalType": "struct PaletteManager.Color[]",
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
        "internalType": "uint8",
        "name": "index",
        "type": "uint8"
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
    "name": "setColor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export default PaletteManagerABI; 