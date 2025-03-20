// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract PixelCanvas {
    // Canvas dimensions
    uint256 public constant WIDTH = 160;  // 16:9 ratio
    uint256 public constant HEIGHT = 90;   // 16:9 ratio
    uint256 public constant COOLDOWN_PERIOD = 60; // Fixed 1-minute cooldown
    uint256 public constant MAX_BATCH_SIZE = 100; // Maximum number of pixels in a batch

    // Color palette (index => character)
    string public constant PALETTE = "0123456789ABCDEF"; // 16 colors
    
    // The entire canvas stored as a single string
    string public canvas;
    
    // Mapping to track last update time for each position
    mapping(uint256 => uint256) public lastUpdated;
    
    // Total number of edits made
    uint256 public totalEdits;
    
    // Events
    event PixelUpdated(uint256 indexed x, uint256 indexed y, address indexed owner, string color, uint256 timestamp);
    event PixelBatchUpdated(address indexed owner, uint256 count, uint256 timestamp);
    
    constructor() {
        // Initialize canvas with all '7' characters (white in palette)
        bytes memory initialCanvas = new bytes(WIDTH * HEIGHT);
        for(uint i = 0; i < WIDTH * HEIGHT; i++) {
            initialCanvas[i] = bytes1('7');
        }
        canvas = string(initialCanvas);
    }
    
    function setPixel(uint256 x, uint256 y, string calldata colorIndex) external {
        require(x < WIDTH, "X coordinate out of bounds");
        require(y < HEIGHT, "Y coordinate out of bounds");
        require(bytes(colorIndex).length == 1, "Color index must be a single character");
        require(isValidColor(colorIndex), "Invalid color index");
        
        uint256 position = y * WIDTH + x;
        
        // Check cooldown period
        require(
            block.timestamp >= lastUpdated[position] + COOLDOWN_PERIOD,
            "Cooldown period not yet elapsed"
        );
        
        // Update the canvas
        bytes memory canvasBytes = bytes(canvas);
        canvasBytes[position] = bytes(colorIndex)[0];
        canvas = string(canvasBytes);
        
        // Update metadata
        lastUpdated[position] = block.timestamp;
        totalEdits++;
        
        // Emit event
        emit PixelUpdated(x, y, msg.sender, colorIndex, block.timestamp);
    }
    
    function setPixelBatch(uint256[] calldata xs, uint256[] calldata ys, string[] calldata colorIndices) external {
        require(xs.length == ys.length && ys.length == colorIndices.length, "Array lengths must match");
        require(xs.length <= MAX_BATCH_SIZE, "Batch size exceeds maximum");
        require(xs.length > 0, "Batch is empty");
        
        bytes memory canvasBytes = bytes(canvas);
        
        for(uint256 i = 0; i < xs.length; i++) {
            require(xs[i] < WIDTH, "X coordinate out of bounds");
            require(ys[i] < HEIGHT, "Y coordinate out of bounds");
            require(bytes(colorIndices[i]).length == 1, "Color index must be a single character");
            require(isValidColor(colorIndices[i]), "Invalid color index");
            
            uint256 position = ys[i] * WIDTH + xs[i];
            
            require(
                block.timestamp >= lastUpdated[position] + COOLDOWN_PERIOD,
                "Cooldown period not yet elapsed"
            );
            
            // Update the canvas
            canvasBytes[position] = bytes(colorIndices[i])[0];
            lastUpdated[position] = block.timestamp;
            totalEdits++;
            
            // Emit individual pixel update event
            emit PixelUpdated(xs[i], ys[i], msg.sender, colorIndices[i], block.timestamp);
        }
        
        canvas = string(canvasBytes);
        
        // Emit batch update event
        emit PixelBatchUpdated(msg.sender, xs.length, block.timestamp);
    }
    
    function getCanvas() external view returns (string memory) {
        return canvas;
    }
    
    function getPixel(uint256 x, uint256 y) external view returns (string memory) {
        require(x < WIDTH, "X coordinate out of bounds");
        require(y < HEIGHT, "Y coordinate out of bounds");
        
        uint256 position = y * WIDTH + x;
        return string(abi.encodePacked(bytes(canvas)[position]));
    }
    
    function getPixelBatch(uint256[] calldata positions) external view returns (string memory) {
        bytes memory result = new bytes(positions.length);
        
        for(uint256 i = 0; i < positions.length; i++) {
            require(positions[i] < WIDTH * HEIGHT, "Position out of bounds");
            result[i] = bytes(canvas)[positions[i]];
        }
        
        return string(result);
    }
    
    function canUpdatePixel(uint256 x, uint256 y) external view returns (bool) {
        require(x < WIDTH, "X coordinate out of bounds");
        require(y < HEIGHT, "Y coordinate out of bounds");
        
        uint256 position = y * WIDTH + x;
        return block.timestamp >= lastUpdated[position] + COOLDOWN_PERIOD;
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