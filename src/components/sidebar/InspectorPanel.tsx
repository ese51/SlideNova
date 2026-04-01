import { useState } from 'react';
import { SceneNode, TextNode } from "@/lib/scene-graph/types";
import { PatchOperation, validatePatch } from "@/lib/scene-graph/patches";
import { AlignLeft, AlignCenter, AlignRight, Italic, Underline, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { generatePatchesFromInstruction } from "@/lib/ai/aiService";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InspectorPanelProps {
  selectedNode: SceneNode | null;
  onApplyPatch: (patch: PatchOperation | PatchOperation[]) => void;
  nodes: SceneNode[]; // Pass all nodes for validation context
}

export default function InspectorPanel({ selectedNode, onApplyPatch, nodes }: InspectorPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!selectedNode) {
    return (
      <div className="w-72 bg-white border-l border-gray-200 p-6 h-full flex flex-col shadow-sm">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Inspector</h2>
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
            <span className="text-gray-300 text-lg">?</span>
          </div>
          <p className="text-xs text-gray-400 font-medium px-4">Select a node on the canvas to edit its properties.</p>
        </div>
      </div>
    );
  }

  const nodeId = selectedNode.id;

  const handleAiSubmit = async () => {
    if (!prompt.trim() || isLoading) return;
    
    setIsLoading(true);
    setAiError(null);

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

    if (!apiKey) {
      setAiError("API Key missing. Please set NEXT_PUBLIC_GEMINI_API_KEY.");
      setIsLoading(false);
      return;
    }

    try {
      const patches = await generatePatchesFromInstruction(selectedNode, prompt, apiKey);
      
      if (patches && patches.length > 0) {
        // Validate patches against current slide state
        const validPatches = patches.filter(p => {
          const res = validatePatch(nodes, p);
          if (!res.isValid) {
            console.warn("AI generated invalid patch:", res.error, p);
          }
          return res.isValid;
        });

        if (validPatches.length > 0) {
          onApplyPatch(validPatches);
          setPrompt("");
        } else {
          setAiError("AI suggested invalid changes for this node.");
        }
      } else {
        setAiError("AI didn't know how to handle this request.");
      }
    } catch (err) {
      console.error(err);
      setAiError("AI request failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-72 bg-white border-l border-gray-200 p-6 h-full flex flex-col shadow-sm overflow-y-auto">
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Inspector</h2>
      
      <div className="space-y-6">
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <h3 className="text-xs font-medium text-gray-500 uppercase">AI Assistant</h3>
          </div>
          <div className="space-y-2">
            <div className="relative">
              <input 
                type="text"
                placeholder={isLoading ? "AI is thinking..." : "Ask AI to edit node..."}
                disabled={isLoading}
                className={cn(
                  "w-full text-xs bg-purple-50/50 border border-purple-100 p-2 pr-8 rounded text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-400 focus:bg-white transition-all",
                  aiError && "border-red-300 ring-1 ring-red-100",
                  isLoading && "opacity-60 cursor-not-allowed"
                )}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAiSubmit();
                  }
                }}
              />
              <button 
                onClick={handleAiSubmit}
                disabled={isLoading}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 transition-colors",
                  isLoading ? "text-purple-300" : "text-purple-400 hover:text-purple-600"
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            {aiError && (
              <div className="flex items-center gap-1.5 text-red-500">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                <p className="text-[10px] font-medium leading-tight">{aiError}</p>
              </div>
            )}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-medium text-gray-500 mb-2 uppercase">Information</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Node ID</label>
              <div className="text-xs font-mono bg-gray-50 border border-gray-100 p-2 rounded text-gray-400 select-all">{nodeId}</div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Type</label>
              <div className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded-full w-fit capitalize">{selectedNode.type}</div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-medium text-gray-500 mb-2 uppercase">Content</h3>
          {selectedNode.type === 'text' && (
            <div className="space-y-3">
              <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Text Content</label>
              <textarea 
                className="w-full text-xs bg-gray-50 border border-gray-200 p-2 rounded text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:bg-white resize-none h-20"
                value={selectedNode.content}
                onChange={(e) => onApplyPatch({ type: 'set_text', nodeId, content: e.target.value })}
              />
            </div>
          )}
          {selectedNode.type === 'image' && (
            <div className="space-y-3">
              <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Image URL</label>
              <input 
                type="text"
                className="w-full text-xs bg-gray-50 border border-gray-200 p-2 rounded text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:bg-white"
                value={selectedNode.src}
                onChange={(e) => onApplyPatch({ type: 'set_image_src', nodeId, src: e.target.value })}
              />
            </div>
          )}
        </section>

        <section>
          <h3 className="text-xs font-medium text-gray-500 mb-2 uppercase">Layout</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">X Position</label>
              <input 
                type="number"
                className="w-full text-xs bg-gray-50 border border-gray-200 p-2 rounded text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:bg-white"
                value={Math.round(selectedNode.x)}
                onChange={(e) => onApplyPatch({ type: 'set_position', nodeId, x: parseFloat(e.target.value), y: selectedNode.y })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Y Position</label>
              <input 
                type="number"
                className="w-full text-xs bg-gray-50 border border-gray-200 p-2 rounded text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:bg-white"
                value={Math.round(selectedNode.y)}
                onChange={(e) => onApplyPatch({ type: 'set_position', nodeId, x: selectedNode.x, y: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Width</label>
              <input 
                type="number"
                className="w-full text-xs bg-gray-50 border border-gray-200 p-2 rounded text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:bg-white"
                value={Math.round(selectedNode.width)}
                onChange={(e) => onApplyPatch({ type: 'set_size', nodeId, width: parseFloat(e.target.value), height: selectedNode.height })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Height</label>
              <input 
                type="number"
                className="w-full text-xs bg-gray-50 border border-gray-200 p-2 rounded text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:bg-white"
                value={Math.round(selectedNode.height)}
                onChange={(e) => onApplyPatch({ type: 'set_size', nodeId, width: selectedNode.width, height: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        </section>

        {selectedNode.type === 'text' && (
          <section>
            <h3 className="text-xs font-medium text-gray-500 mb-2 uppercase">Text Style</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Font Size</label>
                <input 
                  type="number"
                  className="w-full text-xs bg-gray-50 border border-gray-200 p-2 rounded text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:bg-white"
                  value={selectedNode.fontSize}
                  onChange={(e) => onApplyPatch({ type: 'set_style', nodeId, fontSize: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Alignment</label>
                <div className="flex bg-gray-50 p-1 rounded border border-gray-100 w-fit">
                  {(['left', 'center', 'right'] as const).map((align) => {
                    const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : AlignRight;
                    const isActive = (selectedNode as TextNode).textAlign === align || (! (selectedNode as TextNode).textAlign && align === 'left');
                    return (
                      <button
                        key={align}
                        onClick={() => onApplyPatch({ type: 'set_style', nodeId, textAlign: align })}
                        className={cn(
                          "p-1.5 rounded transition-all",
                          isActive ? "bg-white shadow-sm text-blue-600 ring-1 ring-gray-200/50" : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Weight</label>
                <div className="flex bg-gray-50 p-1 rounded border border-gray-100 w-fit gap-1">
                  {[400, 500, 700].map((weight) => {
                    const isActive = (selectedNode as TextNode).fontWeight === weight || (! (selectedNode as TextNode).fontWeight && weight === 400);
                    return (
                      <button
                        key={weight}
                        onClick={() => onApplyPatch({ type: 'set_style', nodeId, fontWeight: weight })}
                        className={cn(
                          "px-2 py-1 text-[10px] font-semibold rounded transition-all",
                          isActive ? "bg-white shadow-sm text-blue-600 ring-1 ring-gray-200/50" : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        {weight === 400 ? 'Regular' : weight === 500 ? 'Medium' : 'Bold'}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Emphasis</label>
                <div className="flex bg-gray-50 p-1 rounded border border-gray-100 w-fit gap-1">
                  <button
                    onClick={() => onApplyPatch({ 
                      type: 'set_style', 
                      nodeId, 
                      fontStyle: (selectedNode as TextNode).fontStyle === 'italic' ? 'normal' : 'italic' 
                    })}
                    className={cn(
                      "p-1.5 rounded transition-all",
                      (selectedNode as TextNode).fontStyle === 'italic' ? "bg-white shadow-sm text-blue-600 ring-1 ring-gray-200/50" : "text-gray-400 hover:text-gray-600"
                    )}
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onApplyPatch({ 
                      type: 'set_style', 
                      nodeId, 
                      textDecoration: (selectedNode as TextNode).textDecoration === 'underline' ? 'none' : 'underline' 
                    })}
                    className={cn(
                      "p-1.5 rounded transition-all",
                      (selectedNode as TextNode).textDecoration === 'underline' ? "bg-white shadow-sm text-blue-600 ring-1 ring-gray-200/50" : "text-gray-400 hover:text-gray-600"
                    )}
                    title="Underline"
                  >
                    <Underline className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Color</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color"
                    className="w-8 h-8 rounded border border-gray-200 cursor-pointer bg-white"
                    value={(selectedNode as TextNode).color || '#111111'}
                    onChange={(e) => onApplyPatch({ type: 'set_style', nodeId, color: e.target.value })}
                  />
                  <input 
                    type="text"
                    className="flex-1 text-xs bg-gray-50 border border-gray-200 p-2 rounded text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:bg-white font-mono"
                    value={(selectedNode as TextNode).color || '#111111'}
                    onChange={(e) => onApplyPatch({ type: 'set_style', nodeId, color: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
