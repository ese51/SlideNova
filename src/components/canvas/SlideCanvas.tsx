'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { SceneNode, TextNode } from "@/lib/scene-graph/types";
import { PatchOperation } from "@/lib/scene-graph/patches";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ResizeState {
  nodeId: string;
  handleId: 'tl' | 'tr' | 'bl' | 'br';
  initialX: number;
  initialY: number;
  initialWidth: number;
  initialHeight: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface DragState {
  nodeId: string;
  initialX: number;
  initialY: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  snappedX?: number;
  snappedY?: number;
}

interface ActiveGuides {
  x: number | null;
  y: number | null;
}

interface SlideCanvasProps {
  nodes: SceneNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onApplyPatch: (patch: PatchOperation | PatchOperation[]) => void;
}

export default function SlideCanvas({ nodes, selectedId, onSelect, onApplyPatch }: SlideCanvasProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [activeGuides, setActiveGuides] = useState<ActiveGuides>({ x: null, y: null });
  const editRef = useRef<HTMLDivElement>(null);

  const SLIDE_WIDTH = 1280;
  const SLIDE_HEIGHT = 720;
  const SNAP_THRESHOLD = 8;
  const MARGIN = 40;

  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [editingId]);

  const handleBlur = (id: string) => {
    if (editRef.current) {
      onApplyPatch({ type: 'set_text', nodeId: id, content: editRef.current.innerText });
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      editRef.current?.blur();
    }
    if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  const onMouseDown = useCallback((e: React.MouseEvent, node: SceneNode) => {
    if (editingId === node.id) return;
    
    e.stopPropagation();
    onSelect(node.id);

    setDragState({
      nodeId: node.id,
      initialX: node.x,
      initialY: node.y,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
    });
  }, [editingId, onSelect]);

  const onResizeMouseDown = useCallback((e: React.MouseEvent, node: SceneNode, handleId: ResizeState['handleId']) => {
    e.stopPropagation();
    onSelect(node.id);

    setResizeState({
      nodeId: node.id,
      handleId,
      initialX: node.x,
      initialY: node.y,
      initialWidth: node.width,
      initialHeight: node.height,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
    });
  }, [onSelect]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragState) {
        const node = nodes.find(n => n.id === dragState.nodeId);
        if (!node) return;

        let dx = e.clientX - dragState.startX;
        let dy = e.clientY - dragState.startY;

        const newX = dragState.initialX + dx;
        const newY = dragState.initialY + dy;
        
        const centerX = newX + node.width / 2;
        const centerY = newY + node.height / 2;
        const rightX = newX + node.width;
        const bottomY = newY + node.height;

        let snappedX = newX;
        let snappedY = newY;
        let guideX: number | null = null;
        let guideY: number | null = null;

        // Snap X (Vertical guides)
        const vGuides = [0, MARGIN, SLIDE_WIDTH / 2, SLIDE_WIDTH - MARGIN, SLIDE_WIDTH];
        for (const g of vGuides) {
          if (Math.abs(newX - g) < SNAP_THRESHOLD) { snappedX = g; guideX = g; break; }
          if (Math.abs(centerX - g) < SNAP_THRESHOLD) { snappedX = g - node.width / 2; guideX = g; break; }
          if (Math.abs(rightX - g) < SNAP_THRESHOLD) { snappedX = g - node.width; guideX = g; break; }
        }

        // Snap Y (Horizontal guides)
        const hGuides = [0, MARGIN, SLIDE_HEIGHT / 2, SLIDE_HEIGHT - MARGIN, SLIDE_HEIGHT];
        for (const g of hGuides) {
          if (Math.abs(newY - g) < SNAP_THRESHOLD) { snappedY = g; guideY = g; break; }
          if (Math.abs(centerY - g) < SNAP_THRESHOLD) { snappedY = g - node.height / 2; guideY = g; break; }
          if (Math.abs(bottomY - g) < SNAP_THRESHOLD) { snappedY = g - node.height; guideY = g; break; }
        }

        setActiveGuides({ x: guideX, y: guideY });
        setDragState(prev => prev ? { 
          ...prev, 
          currentX: e.clientX, 
          currentY: e.clientY,
          snappedX,
          snappedY
        } : null);
      }

      if (resizeState) {
        setResizeState(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);
      }
    };

    const handleMouseUp = () => {
      if (dragState) {
        const finalX = dragState.snappedX ?? (dragState.initialX + (dragState.currentX - dragState.startX));
        const finalY = dragState.snappedY ?? (dragState.initialY + (dragState.currentY - dragState.startY));
        
        if (Math.abs(finalX - dragState.initialX) > 1 || Math.abs(finalY - dragState.initialY) > 1) {
          onApplyPatch({
            type: 'set_position',
            nodeId: dragState.nodeId,
            x: finalX,
            y: finalY,
          });
        }
        setDragState(null);
        setActiveGuides({ x: null, y: null });
      }

      if (resizeState) {
        const dx = resizeState.currentX - resizeState.startX;
        const dy = resizeState.currentY - resizeState.startY;
        
        let newX = resizeState.initialX;
        let newY = resizeState.initialY;
        let newWidth = resizeState.initialWidth;
        let newHeight = resizeState.initialHeight;

        const MIN_SIZE = 20;

        switch (resizeState.handleId) {
          case 'br':
            newWidth = Math.max(MIN_SIZE, resizeState.initialWidth + dx);
            newHeight = Math.max(MIN_SIZE, resizeState.initialHeight + dy);
            break;
          case 'bl':
            const blActualDx = Math.min(dx, resizeState.initialWidth - MIN_SIZE);
            newX = resizeState.initialX + blActualDx;
            newWidth = resizeState.initialWidth - blActualDx;
            newHeight = Math.max(MIN_SIZE, resizeState.initialHeight + dy);
            break;
          case 'tr':
            const trActualDy = Math.min(dy, resizeState.initialHeight - MIN_SIZE);
            newY = resizeState.initialY + trActualDy;
            newWidth = Math.max(MIN_SIZE, resizeState.initialWidth + dx);
            newHeight = resizeState.initialHeight - trActualDy;
            break;
          case 'tl':
            const tlActualDx = Math.min(dx, resizeState.initialWidth - MIN_SIZE);
            const tlActualDy = Math.min(dy, resizeState.initialHeight - MIN_SIZE);
            newX = resizeState.initialX + tlActualDx;
            newY = resizeState.initialY + tlActualDy;
            newWidth = resizeState.initialWidth - tlActualDx;
            newHeight = resizeState.initialHeight - tlActualDy;
            break;
        }

        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          const patches: PatchOperation[] = [
            { type: 'set_size', nodeId: resizeState.nodeId, width: newWidth, height: newHeight },
            { type: 'set_position', nodeId: resizeState.nodeId, x: newX, y: newY }
          ];
          onApplyPatch(patches);
        }
        setResizeState(null);
      }
    };

    if (dragState || resizeState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, resizeState, onApplyPatch, nodes]);

  return (
    <div 
      className="relative w-[1280px] h-[720px] bg-white shadow-2xl overflow-hidden ring-1 ring-gray-200"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(null);
        setEditingId(null);
      }}
    >
      {/* Alignment Guides */}
      {activeGuides.x !== null && (
        <div 
          className="absolute top-0 bottom-0 w-px bg-blue-400 z-50 pointer-events-none"
          style={{ left: activeGuides.x }}
        />
      )}
      {activeGuides.y !== null && (
        <div 
          className="absolute left-0 right-0 h-px bg-blue-400 z-50 pointer-events-none"
          style={{ top: activeGuides.y }}
        />
      )}

      {nodes.map((node) => {
        const isSelected = selectedId === node.id;
        const isEditing = editingId === node.id;
        const isDragging = dragState?.nodeId === node.id;
        const isResizing = resizeState?.nodeId === node.id;
        
        let displayX = node.x;
        let displayY = node.y;
        let displayWidth = node.width;
        let displayHeight = node.height;

        if (isDragging && dragState) {
          displayX = dragState.snappedX ?? (dragState.initialX + (dragState.currentX - dragState.startX));
          displayY = dragState.snappedY ?? (dragState.initialY + (dragState.currentY - dragState.startY));
        }

        if (isResizing && resizeState) {
          const dx = resizeState.currentX - resizeState.startX;
          const dy = resizeState.currentY - resizeState.startY;
          const MIN_SIZE = 20;

          switch (resizeState.handleId) {
            case 'br':
              displayWidth = Math.max(MIN_SIZE, resizeState.initialWidth + dx);
              displayHeight = Math.max(MIN_SIZE, resizeState.initialHeight + dy);
              break;
            case 'bl':
              const blDx = Math.min(dx, resizeState.initialWidth - MIN_SIZE);
              displayX = resizeState.initialX + blDx;
              displayWidth = resizeState.initialWidth - blDx;
              displayHeight = Math.max(MIN_SIZE, resizeState.initialHeight + dy);
              break;
            case 'tr':
              const trDy = Math.min(dy, resizeState.initialHeight - MIN_SIZE);
              displayY = resizeState.initialY + trDy;
              displayWidth = Math.max(MIN_SIZE, resizeState.initialWidth + dx);
              displayHeight = resizeState.initialHeight - trDy;
              break;
            case 'tl':
              const tlDx = Math.min(dx, resizeState.initialWidth - MIN_SIZE);
              const tlDy = Math.min(dy, resizeState.initialHeight - MIN_SIZE);
              displayX = resizeState.initialX + tlDx;
              displayY = resizeState.initialY + tlDy;
              displayWidth = resizeState.initialWidth - tlDx;
              displayHeight = resizeState.initialHeight - tlDy;
              break;
          }
        }

        const resizeHandleClasses = "absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full z-40 shadow-sm hover:scale-125 transition-transform";

        return (
          <div
            key={node.id}
            onMouseDown={(e) => onMouseDown(e, node)}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => {
              if (node.type === 'text') {
                e.stopPropagation();
                setEditingId(node.id);
                setDragState(null);
                onSelect(node.id);
              }
            }}
            className={cn(
              "absolute transition-shadow duration-150 group",
              !isEditing && "cursor-move hover:ring-2 hover:ring-blue-200",
              isSelected && !isEditing && "ring-2 ring-blue-500 hover:ring-blue-500 z-10",
              isEditing && "ring-2 ring-blue-600 z-20 shadow-lg cursor-text",
              isDragging && "opacity-80 z-30 ring-2 ring-blue-400 cursor-grabbing transition-none",
              isResizing && "z-30 ring-2 ring-blue-400 transition-none"
            )}
            style={{
              left: displayX,
              top: displayY,
              width: displayWidth,
              height: displayHeight,
            }}
          >
            {node.type === 'text' && (
              <div 
                ref={isEditing ? editRef : null}
                contentEditable={isEditing}
                suppressContentEditableWarning
                onBlur={() => handleBlur(node.id)}
                onKeyDown={(e) => handleKeyDown(e, node.id)}
                className={cn(
                  "w-full h-full p-2 break-words leading-tight outline-none select-none",
                  isEditing && "bg-white select-text"
                )}
                style={{ 
                  fontSize: `${node.fontSize}px`,
                  textAlign: node.textAlign || 'left',
                  fontWeight: node.fontWeight || 400,
                  color: node.color || '#111111',
                  fontStyle: node.fontStyle || 'normal',
                  textDecoration: node.textDecoration || 'none'
                }}
              >
                {node.content}
              </div>
            )}
            {node.type === 'image' && (
              <img 
                src={node.src} 
                alt="" 
                className="w-full h-full object-cover select-none pointer-events-none" 
              />
            )}

            {/* Resize Handles for Selected Node */}
            {isSelected && !isEditing && (
              <>
                <div 
                  className={cn(resizeHandleClasses, "top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize")}
                  onMouseDown={(e) => onResizeMouseDown(e, node, 'tl')}
                />
                <div 
                  className={cn(resizeHandleClasses, "top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize")}
                  onMouseDown={(e) => onResizeMouseDown(e, node, 'tr')}
                />
                <div 
                  className={cn(resizeHandleClasses, "bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize")}
                  onMouseDown={(e) => onResizeMouseDown(e, node, 'bl')}
                />
                <div 
                  className={cn(resizeHandleClasses, "bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize")}
                  onMouseDown={(e) => onResizeMouseDown(e, node, 'br')}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
