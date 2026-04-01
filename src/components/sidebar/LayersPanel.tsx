import { SceneNode } from "@/lib/scene-graph/types";
import { PatchOperation } from "@/lib/scene-graph/patches";
import { Type, Image, ChevronUp, ChevronDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayersPanelProps {
  nodes: SceneNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onApplyPatch: (patch: PatchOperation) => void;
}

export default function LayersPanel({ nodes, selectedId, onSelect, onApplyPatch }: LayersPanelProps) {
  // Display nodes in reverse order (top of stack first)
  const reversedNodes = [...nodes].reverse();

  return (
    <div className="w-72 bg-white border-l border-gray-200 p-6 h-full flex flex-col shadow-sm overflow-y-auto">
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Layers</h2>
      
      <div className="space-y-1">
        {reversedNodes.length === 0 ? (
          <div className="text-xs text-gray-400 text-center py-8">No layers yet</div>
        ) : (
          reversedNodes.map((node, reversedIndex) => {
            const index = nodes.length - 1 - reversedIndex;
            const isSelected = selectedId === node.id;
            const Icon = node.type === 'text' ? Type : Image;
            const label = node.type === 'text' ? node.content.substring(0, 20) || 'Empty Text' : 'Image';
            
            return (
              <div
                key={node.id}
                onClick={() => onSelect(node.id)}
                className={cn(
                  "group flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all",
                  isSelected ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100" : "hover:bg-gray-50 text-gray-600"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded",
                  isSelected ? "bg-blue-100" : "bg-gray-100 group-hover:bg-gray-200"
                )}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold truncate leading-none mb-1">
                    {label}
                  </div>
                  <div className="text-[9px] font-mono text-gray-400 uppercase tracking-tighter">
                    {node.id}
                  </div>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onApplyPatch({ type: 'reorder_node', nodeId: node.id, direction: 'up' });
                    }}
                    disabled={index === nodes.length - 1}
                    className="p-1 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Move Up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onApplyPatch({ type: 'reorder_node', nodeId: node.id, direction: 'down' });
                    }}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Move Down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
