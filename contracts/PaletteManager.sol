// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PaletteManager {
    struct Color {
        uint8 r;
        uint8 g;
        uint8 b;
    }
    
    Color[] public palette;
    mapping(uint8 => bool) public isColorActive;
    address public admin;
    
    event ColorAdded(uint8 indexed colorIndex, uint8 r, uint8 g, uint8 b);
    
    constructor() {
        admin = msg.sender;
        // Initialize with a default palette
        addColor(0, 0, 0);       // 0: Black
        addColor(255, 255, 255); // 1: White
        addColor(255, 0, 0);     // 2: Red
        addColor(0, 255, 0);     // 3: Green
        addColor(0, 0, 255);     // 4: Blue
        addColor(255, 255, 0);   // 5: Yellow
        addColor(255, 0, 255);   // 6: Magenta
        addColor(0, 255, 255);   // 7: Cyan
        addColor(128, 128, 128); // 8: Gray
    }
    
    function addColor(uint8 r, uint8 g, uint8 b) public {
        require(msg.sender == admin, "Only admin can add colors");
        require(palette.length < 256, "Palette full"); // Keep indices in uint8
        
        palette.push(Color(r, g, b));
        uint8 newColorIndex = uint8(palette.length - 1);
        isColorActive[newColorIndex] = true;
        
        emit ColorAdded(newColorIndex, r, g, b);
    }
    
    function getPaletteSize() public view returns (uint256) {
        return palette.length;
    }
    
    function getColor(uint8 index) public view returns (Color memory) {
        require(index < palette.length, "Color index out of bounds");
        require(isColorActive[index], "Color not active");
        return palette[index];
    }
    
    function getAllColors() public view returns (Color[] memory) {
        return palette;
    }
} 