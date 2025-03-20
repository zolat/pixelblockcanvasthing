// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract PixelCanvas {
    // Canvas dimensions
    uint256 public constant WIDTH = 160;  // 16:9 ratio
    uint256 public constant HEIGHT = 90;   // 16:9 ratio
    uint256 public constant MAX_BATCH_SIZE = 100; // Maximum number of pixels in a batch
    uint256 public constant CHUNKS_PER_ROW = (WIDTH + 31) / 32; // Number of bytes32 chunks per row
    uint256 public constant TOTAL_CHUNKS = CHUNKS_PER_ROW * HEIGHT; // Total number of chunks

    // Color palette (index => character)
    string public constant PALETTE = "0123456789ABCDEF"; // 16 colors
    
    // The canvas stored as an array of bytes32 chunks
    bytes32[TOTAL_CHUNKS] private canvas;
    
    // Total number of edits made
    uint256 public totalEdits;
    
    // Events
    event PixelUpdated(uint256 indexed x, uint256 indexed y, address indexed owner, string color, uint256 timestamp);
    event PixelBatchUpdated(address indexed owner, uint256 count, uint256 timestamp);
    
    constructor() {
        // Initialize canvas with all '7' characters (white in palette)
        bytes1 white = bytes1('7');
        for(uint i = 0; i < TOTAL_CHUNKS; i++) {
            bytes32 chunk;
            for(uint j = 0; j < 32; j++) {
                chunk |= bytes32(uint256(uint8(white)) << (j * 8));
            }
            canvas[i] = chunk;
        }
    }
    
    function setPixel(uint256 x, uint256 y, string calldata colorIndex) external {
        require(x < WIDTH, "X coordinate out of bounds");
        require(y < HEIGHT, "Y coordinate out of bounds");
        require(bytes(colorIndex).length == 1, "Color index must be a single character");
        require(isValidColor(colorIndex), "Invalid color index");
        
        // Calculate chunk index and position within chunk
        uint256 chunkIndex = (y * CHUNKS_PER_ROW) + (x / 32);
        uint256 byteOffset = (x % 32) * 8;
        
        // Update the pixel in the chunk
        bytes32 chunk = canvas[chunkIndex];
        bytes32 mask = bytes32(uint256(0xFF) << byteOffset);
        bytes32 newValue = bytes32(uint256(uint8(bytes(colorIndex)[0])) << byteOffset);
        canvas[chunkIndex] = (chunk & ~mask) | newValue;
        
        // Update metadata
        totalEdits++;
        
        // Emit event
        emit PixelUpdated(x, y, msg.sender, colorIndex, block.timestamp);
    }
    
    function setPixelBatch(uint256[] calldata xs, uint256[] calldata ys, string[] calldata colorIndices) external {
        require(xs.length == ys.length && ys.length == colorIndices.length, "Array lengths must match");
        require(xs.length <= MAX_BATCH_SIZE, "Batch size exceeds maximum");
        require(xs.length > 0, "Batch is empty");
        
        for(uint256 i = 0; i < xs.length; i++) {
            require(xs[i] < WIDTH, "X coordinate out of bounds");
            require(ys[i] < HEIGHT, "Y coordinate out of bounds");
            require(bytes(colorIndices[i]).length == 1, "Color index must be a single character");
            require(isValidColor(colorIndices[i]), "Invalid color index");
            
            // Calculate chunk index and position within chunk
            uint256 chunkIndex = (ys[i] * CHUNKS_PER_ROW) + (xs[i] / 32);
            uint256 byteOffset = (xs[i] % 32) * 8;
            
            // Update the pixel in the chunk
            bytes32 chunk = canvas[chunkIndex];
            bytes32 mask = bytes32(uint256(0xFF) << byteOffset);
            bytes32 newValue = bytes32(uint256(uint8(bytes(colorIndices[i])[0])) << byteOffset);
            canvas[chunkIndex] = (chunk & ~mask) | newValue;
            
            // Update metadata
            totalEdits++;
            
            // Emit individual pixel update event
            emit PixelUpdated(xs[i], ys[i], msg.sender, colorIndices[i], block.timestamp);
        }
        
        // Emit batch update event
        emit PixelBatchUpdated(msg.sender, xs.length, block.timestamp);
    }
    
    function getCanvas() external view returns (string memory) {
        bytes memory result = new bytes(WIDTH * HEIGHT);
        for (uint256 y = 0; y < HEIGHT; y++) {
            for (uint256 x = 0; x < WIDTH; x++) {
                result[y * WIDTH + x] = _getPixel(x, y);
            }
        }
        return string(result);
    }

    function getCanvasPortion(uint256 start, uint256 length) public view returns (string memory) {
        require(start + length <= WIDTH * HEIGHT, "Invalid range");
        bytes memory result = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = _getPixel((start + i) % WIDTH, (start + i) / WIDTH);
        }
        return string(result);
    }
    
    function getPixel(uint256 x, uint256 y) external view returns (string memory) {
        require(x < WIDTH, "X coordinate out of bounds");
        require(y < HEIGHT, "Y coordinate out of bounds");
        return string(abi.encodePacked(_getPixel(x, y)));
    }
    
    function getPixelBatch(uint256[] calldata positions) external view returns (string memory) {
        bytes memory result = new bytes(positions.length);
        for (uint256 i = 0; i < positions.length; i++) {
            result[i] = _getPixel(positions[i] % WIDTH, positions[i] / WIDTH);
        }
        return string(result);
    }
    
    function _getPixel(uint256 x, uint256 y) internal view returns (bytes1) {
        uint256 chunkIndex = (y * CHUNKS_PER_ROW) + (x / 32);
        uint256 byteOffset = (x % 32) * 8;
        bytes32 chunk = canvas[chunkIndex];
        return bytes1(uint8(uint256(chunk >> byteOffset) & 0xFF));
    }
    
    function isValidColor(string memory colorIndex) internal pure returns (bool) {
        bytes memory colorBytes = bytes(colorIndex);
        if(colorBytes.length != 1) return false;
        
        bytes memory palette = bytes(PALETTE);
        bytes1 color = colorBytes[0];
        
        for(uint i = 0; i < palette.length; i++) {
            if(palette[i] == color) return true;
        }
        
        return false;
    }
}