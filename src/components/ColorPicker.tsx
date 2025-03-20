import React, { useState, useEffect } from 'react';
import { ColorPickerProps, ColorMap } from '@/types';

// Define the 16-color palette with hex values
const PALETTE_COLORS: ColorMap = {
  '0': '#000000', // Black
  '1': '#FF0000', // Red
  '2': '#00FF00', // Green
  '3': '#0000FF', // Blue
  '4': '#FFFF00', // Yellow
  '5': '#FF00FF', // Magenta
  '6': '#00FFFF', // Cyan
  '7': '#FFFFFF', // White
  '8': '#808080', // Gray
  '9': '#FF8000', // Orange
  'A': '#800000', // Dark Red
  'B': '#008000', // Dark Green
  'C': '#000080', // Dark Blue
  'D': '#808000', // Dark Yellow
  'E': '#800080', // Dark Magenta
  'F': '#008080'  // Dark Cyan
};

// Reverse mapping from hex to index
const HEX_TO_INDEX: { [key: string]: string } = Object.entries(PALETTE_COLORS)
  .reduce((acc, [index, hex]) => ({ ...acc, [hex.toUpperCase()]: index }), {});

const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  setSelectedColor,
  updateMode,
  setUpdateMode,
  stagedPixels,
  setStagedPixels,
  placingPixel,
  setPlacingPixel,
  setIsCommitHovered,
  commitStagedPixels
}) => {
  // Convert selected hex color to palette index
  const getColorIndex = (hex: string): string => {
    return HEX_TO_INDEX[hex.toUpperCase()] || '0';
  };

  // Convert palette index to hex color
  const getHexColor = (index: string): string => {
    return PALETTE_COLORS[index] || '#000000';
  };

  return (
    <div className="space-y-4 p-4">
      {/* Color Display */}
      <div className="flex items-center space-x-2">
        <div
          className="w-8 h-8 rounded-lg shadow-lg"
          style={{ 
            backgroundColor: selectedColor,
            boxShadow: `0 2px 8px ${selectedColor}40`
          }}
        />
        <div className="flex-1 text-right">
          <span className="text-xs text-white/70 bg-white/10 px-2 py-1 rounded-md font-mono">
            {selectedColor.toUpperCase()} (#{getColorIndex(selectedColor)})
          </span>
        </div>
      </div>
      
      {/* Color Grid */}
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(PALETTE_COLORS).map(([index, color]) => (
          <button
            key={index}
            onClick={() => setSelectedColor(color)}
            className={`w-8 h-8 rounded-lg transform transition-all duration-150 hover:scale-110 ${
              selectedColor === color
                ? 'ring-2 ring-white/50 ring-offset-1 ring-offset-black/50'
                : 'hover:ring-1 hover:ring-white/30 hover:ring-offset-1 hover:ring-offset-black/50'
            }`}
            style={{ 
              backgroundColor: color,
              boxShadow: `0 2px 8px ${color}40`
            }}
            title={`Color #${index} (${color})`}
          />
        ))}
      </div>

      {/* Update Mode Toggle */}
      <div className="flex space-x-2">
        <button
          onClick={() => setUpdateMode('instant')}
          className={`flex-1 px-2 py-1 text-xs rounded-md transition-colors ${
            updateMode === 'instant'
              ? 'bg-white/20 text-white'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          Instant
        </button>
        <button
          onClick={() => setUpdateMode('batch')}
          className={`flex-1 px-2 py-1 text-xs rounded-md transition-colors ${
            updateMode === 'batch'
              ? 'bg-white/20 text-white'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          Batch
        </button>
      </div>

      {/* Batch Controls */}
      {updateMode === 'batch' && stagedPixels.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs text-white/70">
            <span>{stagedPixels.length} pixels staged</span>
            <button
              onClick={() => setStagedPixels([])}
              className="hover:text-white"
            >
              Clear
            </button>
          </div>
          <button
            onClick={commitStagedPixels}
            onMouseEnter={() => setIsCommitHovered(true)}
            onMouseLeave={() => setIsCommitHovered(false)}
            disabled={placingPixel}
            className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              placingPixel
                ? 'bg-white/20 text-white/50 cursor-not-allowed'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            {placingPixel ? 'Placing pixels...' : 'Place Pixels'}
          </button>
        </div>
      )}

      {/* Help Text */}
      <div className="px-2 py-1.5 bg-white/5 rounded-lg">
        <p className="text-xs text-white/70">
          {updateMode === 'batch' 
            ? '🎨 Click to stage pixels • Click again to unstage'
            : '🎨 Click to place pixels instantly'}
        </p>
      </div>
    </div>
  );
};

export default ColorPicker; 