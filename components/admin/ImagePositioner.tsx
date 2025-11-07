/**
 * NEW FILE: Image Positioner - Apple-Level Image Upload Preview
 * 
 * Purpose: Live preview with drag-to-reposition and zoom controls
 * Shows EXACTLY how the image will appear on the menu
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';

interface ImagePositionerProps {
  imageUrl: string;
  onPositionChange: (position: ImagePosition) => void;
  initialPosition?: ImagePosition;
}

export interface ImagePosition {
  x: number;      // Horizontal position (-100 to 100)
  y: number;      // Vertical position (-100 to 100)
  scale: number;  // Zoom level (1 to 3)
}

const ImagePositioner: React.FC<ImagePositionerProps> = ({
  imageUrl,
  onPositionChange,
  initialPosition = { x: 0, y: -20, scale: 1.2 }
}) => {
  const [position, setPosition] = useState<ImagePosition>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Update parent when position changes
  useEffect(() => {
    onPositionChange(position);
  }, [position, onPositionChange]);

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  // Handle dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - dragStart.x) / rect.width) * 200 - 100; // -100 to 100
    const y = ((e.clientY - dragStart.y) / rect.height) * 200 - 100;

    setPosition(prev => ({
      ...prev,
      x: Math.max(-100, Math.min(100, x)),
      y: Math.max(-100, Math.min(100, y))
    }));
  };

  // Handle drag end
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom controls
  const handleZoomIn = () => {
    setPosition(prev => ({
      ...prev,
      scale: Math.min(3, prev.scale + 0.1)
    }));
  };

  const handleZoomOut = () => {
    setPosition(prev => ({
      ...prev,
      scale: Math.max(1, prev.scale - 0.1)
    }));
  };

  // Reset to default
  const handleReset = () => {
    setPosition({ x: 0, y: -20, scale: 1.2 });
  };

  return (
    <div className="space-y-4">
      {/* Live Preview - EXACTLY as it will appear on menu */}
      <div className="relative">
        <div className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
          Live Menu Preview (Drag to Reposition)
        </div>
        
        <div
          ref={containerRef}
          className="relative w-full h-64 bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-orange-300 cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ touchAction: 'none' }}
        >
          {/* The actual image with positioning */}
          <img
            src={imageUrl}
            alt="Preview"
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: `${50 + position.x}% ${50 + position.y}%`,
              transform: `scale(${position.scale})`,
              transition: isDragging ? 'none' : 'all 0.1s ease',
              userSelect: 'none',
              pointerEvents: 'none'
            }}
          />

          {/* Drag hint overlay */}
          {!isDragging && (
            <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors flex items-center justify-center pointer-events-none">
              <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg opacity-0 hover:opacity-100 transition-opacity">
                <Move size={20} className="text-orange-600 mx-auto mb-1" />
                <p className="text-xs font-semibold text-gray-800">Click & Drag to Reposition</p>
              </div>
            </div>
          )}

          {/* Grid overlay for alignment */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={18} className="text-gray-700" />
          </button>
          
          <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2">
            <input
              type="range"
              min="100"
              max="300"
              value={position.scale * 100}
              onChange={(e) => setPosition(prev => ({ ...prev, scale: parseInt(e.target.value) / 100 }))}
              className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #f97316 0%, #f97316 ${(position.scale - 1) / 2 * 100}%, #e5e7eb ${(position.scale - 1) / 2 * 100}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>100%</span>
              <span className="font-bold text-orange-600">{Math.round(position.scale * 100)}%</span>
              <span>300%</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={18} className="text-gray-700" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="p-2 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg transition-colors flex items-center gap-2 px-3"
          title="Reset Position"
        >
          <RotateCcw size={18} />
          <span className="text-sm font-semibold">Reset</span>
        </button>
      </div>

      {/* Position Info */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <div className="font-bold text-gray-500">X Position</div>
          <div className="text-lg font-black text-gray-800">{position.x.toFixed(0)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <div className="font-bold text-gray-500">Y Position</div>
          <div className="text-lg font-black text-gray-800">{position.y.toFixed(0)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <div className="font-bold text-gray-500">Scale</div>
          <div className="text-lg font-black text-orange-600">{position.scale.toFixed(1)}x</div>
        </div>
      </div>

      {/* Helper Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800 font-semibold">
          💡 <strong>Live Preview:</strong> This shows exactly how your image will appear on the customer menu. 
          Drag to reposition, use zoom slider to scale, or click Reset to start over.
        </p>
      </div>
    </div>
  );
};

export default ImagePositioner;

