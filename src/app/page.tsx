'use client';

import { useState, useCallback, useEffect } from 'react';
import SlideCanvas from '@/components/canvas/SlideCanvas';
import InspectorPanel from '@/components/sidebar/InspectorPanel';
import LayersPanel from '@/components/sidebar/LayersPanel';
import SlideSidebar from '@/components/sidebar/SlideSidebar';
import { sampleSlide } from '@/lib/sample-data/sampleSlide';
import { SceneNode } from '@/lib/scene-graph/types';
import { PatchOperation, applyPatch } from '@/lib/scene-graph/patches';
import { HistoryState, createHistory, pushState, undo, redo } from '@/lib/scene-graph/history';
import { Undo2, Redo2, Copy, Trash2, RotateCcw, Type, Image as ImageIcon } from 'lucide-react';

const STORAGE_KEY = 'slidenova-state-v2';

interface SlideData {
  id: string;
  name: string;
  history: HistoryState;
}

export default function Home() {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { slides: savedSlides, activeSlideId: savedActiveId } = JSON.parse(saved);
        setSlides(savedSlides);
        setActiveSlideId(savedActiveId);
      } catch (e) {
        console.error('Failed to restore state:', e);
      }
    } else {
      const initialId = sampleSlide.id;
      setSlides([{
        id: initialId,
        name: "Welcome Slide",
        history: createHistory(sampleSlide.nodes)
      }]);
      setActiveSlideId(initialId);
    }
    setIsLoaded(true);
  }, []);

  // Save state on change
  useEffect(() => {
    if (isLoaded && slides.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ slides, activeSlideId }));
    }
  }, [slides, activeSlideId, isLoaded]);

  const activeSlide = slides.find(s => s.id === activeSlideId) || slides[0];
  const history = activeSlide?.history;
  const nodes = history?.present || [];
  const selectedNode = nodes.find(node => node.id === selectedId) || null;

  const handleReset = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to reset the presentation? All slides and changes will be lost.')) {
      localStorage.removeItem(STORAGE_KEY);
      const initialId = sampleSlide.id;
      setSlides([{
        id: initialId,
        name: "Welcome Slide",
        history: createHistory(sampleSlide.nodes)
      }]);
      setActiveSlideId(initialId);
      setSelectedId(null);
    }
  }, []);

  const updateActiveHistory = useCallback((updater: (h: HistoryState) => HistoryState) => {
    setSlides(prev => prev.map(s => s.id === activeSlideId ? { ...s, history: updater(s.history) } : s));
  }, [activeSlideId]);

  const handleApplyPatch = useCallback((patch: PatchOperation | PatchOperation[]) => {
    updateActiveHistory(prevHistory => {
      const patches = Array.isArray(patch) ? patch : [patch];
      let nextNodes = prevHistory.present;
      
      patches.forEach(p => {
        nextNodes = applyPatch(nextNodes, p);
      });
      
      return pushState(prevHistory, nextNodes);
    });
  }, [updateActiveHistory]);

  const handleDuplicate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedNode) return;

    const newId = `${selectedNode.type}-${Math.random().toString(36).substr(2, 9)}`;
    const newNode = {
      ...selectedNode,
      id: newId,
      x: selectedNode.x + 20,
      y: selectedNode.y + 20,
    } as SceneNode;

    handleApplyPatch({
      type: 'add_node',
      nodeId: newId,
      node: newNode
    });
    
    setSelectedId(newId);
  }, [selectedNode, handleApplyPatch]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedId) return;

    handleApplyPatch({
      type: 'delete_node',
      nodeId: selectedId
    });
    
    setSelectedId(null);
  }, [selectedId, handleApplyPatch]);

  const handleUndo = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    updateActiveHistory(prev => undo(prev));
  }, [updateActiveHistory]);

  const handleRedo = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    updateActiveHistory(prev => redo(prev));
  }, [updateActiveHistory]);

  const handleAddText = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = `text-${Math.random().toString(36).substr(2, 9)}`;
    const newNode: SceneNode = {
      id: newId,
      type: 'text',
      x: 400 + (Math.random() * 40 - 20),
      y: 300 + (Math.random() * 40 - 20),
      width: 300,
      height: 60,
      content: "New Text Node",
      fontSize: 24,
      textAlign: 'left',
      fontWeight: 400,
      color: '#111111'
    };

    handleApplyPatch({
      type: 'add_node',
      nodeId: newId,
      node: newNode
    });
    
    setSelectedId(newId);
  }, [handleApplyPatch]);

  const handleAddImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = `image-${Math.random().toString(36).substr(2, 9)}`;
    const newNode: SceneNode = {
      id: newId,
      type: 'image',
      x: 400 + (Math.random() * 40 - 20),
      y: 200 + (Math.random() * 40 - 20),
      width: 400,
      height: 300,
      src: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80"
    };

    handleApplyPatch({
      type: 'add_node',
      nodeId: newId,
      node: newNode
    });
    
    setSelectedId(newId);
  }, [handleApplyPatch]);

  const handleCreateSlide = useCallback(() => {
    const newId = `slide-${Math.random().toString(36).substr(2, 9)}`;
    const newSlide: SlideData = {
      id: newId,
      name: `Slide ${slides.length + 1}`,
      history: createHistory([])
    };
    setSlides(prev => [...prev, newSlide]);
    setActiveSlideId(newId);
    setSelectedId(null);
  }, [slides.length]);

  const handleDeleteSlide = useCallback((id: string) => {
    if (slides.length <= 1) return;
    
    setSlides(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (activeSlideId === id) {
        setActiveSlideId(filtered[0].id);
      }
      return filtered;
    });
    setSelectedId(null);
  }, [slides.length, activeSlideId]);

  const handleSelectSlide = useCallback((id: string) => {
    setActiveSlideId(id);
    setSelectedId(null);
  }, []);

  if (!isLoaded) return null;

  return (
    <main 
      className="flex flex-col h-screen bg-[#f8f9fa] overflow-hidden select-none" 
      onClick={() => setSelectedId(null)}
    >
      {/* Top Bar Controls */}
      <header 
        className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-30 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-blue-600 tracking-tight mr-4">SlideNova</h1>
          <div className="h-6 w-px bg-gray-200" />
          
          {/* Creation Tools */}
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={handleAddText}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-xs font-semibold"
              title="Add Text (T)"
            >
              <Type className="w-4 h-4" />
              <span>Text</span>
            </button>
            <button
              onClick={handleAddImage}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-xs font-semibold"
              title="Add Image (I)"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Image</span>
            </button>
          </div>

          <div className="h-6 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={!history || history.past.length === 0}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!history || history.future.length === 0}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-5 h-5 text-gray-600" />
            </button>
            <div className="h-6 w-px bg-gray-200 mx-1" />
            <button
              onClick={handleDuplicate}
              disabled={!selectedId}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Duplicate (Ctrl+D)"
            >
              <Copy className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleDelete}
              disabled={!selectedId}
              className="p-2 rounded hover:bg-gray-100 text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Delete (Backspace)"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-gray-200 mx-1" />
            <button
              onClick={handleReset}
              className="p-2 rounded hover:bg-gray-100 text-orange-500 hover:bg-orange-50 transition-colors"
              title="Reset Presentation"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="text-xs font-medium text-gray-400">
          Slide ID: {activeSlideId}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Slide Navigator */}
        <aside onClick={(e) => e.stopPropagation()}>
          <SlideSidebar
            slides={slides}
            activeSlideId={activeSlideId}
            onSelect={handleSelectSlide}
            onCreate={handleCreateSlide}
            onDelete={handleDeleteSlide}
          />
        </aside>

        {/* Main Canvas Area */}
        <div className="flex-1 relative overflow-auto flex items-center justify-center p-20 bg-gray-200/50">
          <div className="flex-shrink-0">
            {history && (
              <SlideCanvas
                nodes={nodes}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onApplyPatch={handleApplyPatch}
              />
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <aside 
          className="flex-shrink-0 z-20 flex flex-col h-full border-l border-gray-200 bg-white"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-1 overflow-y-auto min-h-0">
            <InspectorPanel 
              selectedNode={selectedNode} 
              onApplyPatch={handleApplyPatch}
              nodes={nodes}
            />
          </div>
          <div className="h-2/5 border-t border-gray-200 overflow-y-auto bg-white min-h-0">
            <LayersPanel
              nodes={nodes}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onApplyPatch={handleApplyPatch}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}

