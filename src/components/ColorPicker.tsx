import React, { useState, useEffect } from 'react';
import { ColorPickerProps } from '@/types';

type PaletteType = 'snes' | 'vivid' | 'greyscale' | 'custom';

const DEFAULT_CUSTOM_COLORS = [
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF',
  '#00FFFF', '#FF8800', '#884400', '#FF99AA', '#442222',
  '#00AA44', '#003366', '#66CCFF', '#663311', '#CCAA88',
  '#FFFFFF', '#000000', '#FF2200', '#44FF44', '#4444FF'
];

const STORAGE_KEY = 'canpix-custom-palette';

const PALETTES: Record<PaletteType, { name: string, colors: string[] }> = {
  snes: {
    name: '🎮 SNES',
    colors: [
      '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF',
      '#FF8800', '#884400', '#FF99AA', '#442222', '#FFDDCC',
      '#00AA44', '#003366', '#66CCFF', '#663311', '#CCAA88',
      '#FFFFFF', '#000000', '#FF2200', '#44FF44', '#4444FF'
    ]
  },
  vivid: {
    name: '🌈 Vivid',
    colors: [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
      '#FFD93D', '#FF8B94', '#A8E6CF', '#DCD6F7', '#95E1D3',
      '#FF6F61', '#6B5B95', '#88D8B0', '#FFA07A', '#B5EAD7',
      '#FFBE0B', '#FB5607', '#FF006E', '#8338EC', '#3A86FF'
    ]
  },
  greyscale: {
    name: '◐ Mono',
    colors: [
      '#FFFFFF', '#E6E6E6', '#CCCCCC', '#B3B3B3', '#999999',
      '#808080', '#666666', '#4D4D4D', '#333333', '#1A1A1A',
      '#000000', '#EFEFEF', '#DFDFDF', '#BFBFBF', '#8F8F8F',
      '#6F6F6F', '#5F5F5F', '#3F3F3F', '#2F2F2F', '#1F1F1F'
    ]
  },
  custom: {
    name: '✨ Custom',
    colors: DEFAULT_CUSTOM_COLORS
  }
};

const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  setSelectedColor
}) => {
  const [activePalette, setActivePalette] = useState<PaletteType>('snes');
  const [customColors, setCustomColors] = useState<string[]>(DEFAULT_CUSTOM_COLORS);

  // Load custom palette from localStorage
  useEffect(() => {
    const savedColors = localStorage.getItem(STORAGE_KEY);
    if (savedColors) {
      try {
        const colors = JSON.parse(savedColors);
        if (Array.isArray(colors) && colors.length === 20) {
          setCustomColors(colors);
          PALETTES.custom.colors = colors;
        }
      } catch (e) {
        console.error('Failed to load custom palette:', e);
      }
    }
  }, []);

  // Save custom palette to localStorage
  const saveCustomPalette = (colors: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
    } catch (e) {
      console.error('Failed to save custom palette:', e);
    }
  };

  // Add color to custom palette
  const addToCustomPalette = () => {
    if (activePalette === 'custom') return; // Don't add if we're already in custom palette
    
    const newColors = [...customColors];
    newColors.unshift(selectedColor);
    newColors.pop(); // Remove last color to keep array at 20 colors
    
    setCustomColors(newColors);
    PALETTES.custom.colors = newColors;
    saveCustomPalette(newColors);
  };

  return (
    <div className="p-3">
      {/* Palette Selector */}
      <div className="flex space-x-1 mb-3">
        {(Object.keys(PALETTES) as PaletteType[]).map((paletteKey) => (
          <button
            key={paletteKey}
            onClick={() => setActivePalette(paletteKey)}
            className={`flex-1 px-2 py-1 text-xs rounded-md transition-colors ${
              activePalette === paletteKey
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            {PALETTES[paletteKey].name}
          </button>
        ))}
      </div>

      {/* Color Display and Picker */}
      <div className="flex items-center mb-3 space-x-2">
        <div
          className="w-8 h-8 rounded-lg shadow-lg"
          style={{ 
            backgroundColor: selectedColor,
            boxShadow: `0 2px 8px ${selectedColor}40`
          }}
        />
        {activePalette === 'custom' && (
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded-lg border border-white/20"
          />
        )}
        <div className="flex-1 text-right flex items-center justify-end space-x-2">
          <span className="text-xs text-white/70 bg-white/10 px-2 py-1 rounded-md font-mono">
            {selectedColor.toUpperCase()}
          </span>
          {activePalette !== 'custom' && (
            <button
              onClick={addToCustomPalette}
              className="text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md transition-colors"
              title="Add to custom palette"
            >
              Save
            </button>
          )}
        </div>
      </div>
      
      {/* Color Grid */}
      <div className="grid grid-cols-5 gap-2">
        {(activePalette === 'custom' ? customColors : PALETTES[activePalette].colors).map((color) => (
          <button
            key={color}
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
            title={color}
          />
        ))}
      </div>

      {/* Help Text */}
      <div className="mt-3 px-2 py-1.5 bg-white/5 rounded-lg">
        <p className="text-xs text-white/70">
          {activePalette === 'custom' 
            ? '🎨 Use color picker for custom colors'
            : '🎨 Click squares to select • Click Save to add to custom palette'}
        </p>
      </div>
    </div>
  );
};

export default ColorPicker; 