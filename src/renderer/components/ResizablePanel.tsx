import React, { useRef, useEffect, useState, useCallback } from 'react';

interface ResizablePanelProps {
  direction: 'horizontal' | 'vertical';
  defaultSize: number;
  persistedSize?: number;
  minSize: number;
  maxSize: number;
  children: React.ReactNode;
  className?: string;
  onResize?: (size: number) => void;
  onResizeEnd?: (size: number) => void;
}

export default function ResizablePanel({
  direction,
  defaultSize,
  persistedSize,
  minSize,
  maxSize,
  children,
  className = '',
  onResize,
  onResizeEnd,
}: ResizablePanelProps) {
  const [size, setSize] = useState(persistedSize || defaultSize);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef(0);
  const startSizeRef = useRef(0);

  // Update size when persistedSize changes
  useEffect(() => {
    if (persistedSize !== undefined) {
      setSize(persistedSize);
    }
  }, [persistedSize]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY;
    startSizeRef.current = size;
  }, [direction, size]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - startPosRef.current;
      const newSize = Math.max(minSize, Math.min(maxSize, startSizeRef.current + delta));
      setSize(newSize);
      onResize?.(newSize);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      // Call onResizeEnd when mouse is released
      onResizeEnd?.(size);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, direction, minSize, maxSize, onResize, onResizeEnd, size]);

  const style = direction === 'horizontal'
    ? { width: `${size}px` }
    : { height: `${size}px` };

  return (
    <div
      ref={panelRef}
      className={`resizable-panel ${className}`}
      style={style}
    >
      {children}
      <div
        className={`resize-handle resize-handle-${direction}`}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}
