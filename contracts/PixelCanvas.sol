// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract PixelCanvas {
    // Canvas dimensions
    uint256 public constant WIDTH = 160;  // 16:9 ratio
    uint256 public constant HEIGHT = 90;   // 16:9 ratio
    uint256 public constant COOLDOWN_PERIOD = 60; // Fixed 1-minute cooldown
    
    // Struct to represent a pixel
    struct Pixel {
        address owner;
        uint8 red;
        uint8 green;
        uint8 blue;
        uint256 lastUpdated;
    }
    
    // Mapping from position (y * WIDTH + x) to pixel data
    mapping(uint256 => Pixel) public pixels;
    
    // Event emitted when a pixel is updated
    event PixelUpdated(
        uint256 indexed x,
        uint256 indexed y,
        address indexed owner,
        uint8 red,
        uint8 green,
        uint8 blue,
        uint256 timestamp
    );
    
    function setPixel(uint256 x, uint256 y, uint8 red, uint8 green, uint8 blue) external {
        // Check if coordinates are within bounds
        require(x < WIDTH, "X coordinate out of bounds");
        require(y < HEIGHT, "Y coordinate out of bounds");
        
        // Calculate position
        uint256 position = y * WIDTH + x;
        
        // Check cooldown period
        if (pixels[position].lastUpdated > 0) {
            require(
                block.timestamp >= pixels[position].lastUpdated + COOLDOWN_PERIOD,
                "Cooldown period not yet elapsed"
            );
        }
        
        // Update pixel data
        pixels[position] = Pixel({
            owner: msg.sender,
            red: red,
            green: green,
            blue: blue,
            lastUpdated: block.timestamp
        });
        
        // Emit event
        emit PixelUpdated(x, y, msg.sender, red, green, blue, block.timestamp);
    }
    
    // Function to get a pixel's data
    function getPixel(uint256 x, uint256 y) external view returns (address, uint8, uint8, uint8, uint256) {
        require(x < WIDTH, "X coordinate out of bounds");
        require(y < HEIGHT, "Y coordinate out of bounds");
        
        uint256 position = y * WIDTH + x;
        Pixel memory pixel = pixels[position];
        
        return (pixel.owner, pixel.red, pixel.green, pixel.blue, pixel.lastUpdated);
    }
    
    // Function to get multiple pixels at once (for efficient loading)
    function getPixelBatch(uint256[] calldata positions) external view returns (Pixel[] memory) {
        Pixel[] memory result = new Pixel[](positions.length);
        
        for (uint256 i = 0; i < positions.length; i++) {
            uint256 position = positions[i];
            require(position < WIDTH * HEIGHT, "Position out of bounds");
            result[i] = pixels[position];
        }
        
        return result;
    }
    
    // Function to check if a pixel can be updated
    function canUpdatePixel(uint256 x, uint256 y) external view returns (bool) {
        require(x < WIDTH, "X coordinate out of bounds");
        require(y < HEIGHT, "Y coordinate out of bounds");
        
        uint256 position = y * WIDTH + x;
        
        if (pixels[position].lastUpdated == 0) {
            return true;
        }
        
        return block.timestamp >= pixels[position].lastUpdated + COOLDOWN_PERIOD;
    }
}