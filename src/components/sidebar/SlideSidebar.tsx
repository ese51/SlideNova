'use client';

import { Plus, Trash2, Monitor } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface SlideInfo {
  id: string;
  name: string;
}

interface SlideSidebarProps {
  slides: SlideInfo[];
  activeSlideId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export default function SlideSidebar({ 
  slides, 
  activeSlideId, 
  onSelect, 
  onCreate, 
  onDelete 
}: SlideSidebarProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col shadow-sm">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Slides</h2>
        <button
          onClick={onCreate}
          className="p-1.5 rounded-md bg-white border border-gray-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm"
          title="Add Slide"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {slides.map((slide, index) => {
          const isActive = slide.id === activeSlideId;
          
          return (
            <div
              key={slide.id}
              onClick={() => onSelect(slide.id)}
              className={cn(
                "group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all duration-200",
                isActive 
                  ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm ring-1 ring-blue-100" 
                  : "bg-white border-transparent hover:border-gray-200 hover:bg-gray-50 text-gray-500"
              )}
            >
              <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded flex items-center justify-center transition-colors",
                isActive ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
              )}>
                <span className="text-[10px] font-bold">{index + 1}</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "text-xs font-semibold truncate leading-none mb-1",
                  isActive ? "text-blue-900" : "text-gray-700"
                )}>
                  {slide.name}
                </div>
                <div className="text-[9px] font-mono text-gray-400 uppercase tracking-tighter truncate">
                  {slide.id}
                </div>
              </div>

              {slides.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(slide.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all"
                  title="Delete Slide"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-gray-100 bg-gray-50/30">
        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
          <Monitor className="w-3.5 h-3.5" />
          <span>{slides.length} {slides.length === 1 ? 'Slide' : 'Slides'}</span>
        </div>
      </div>
    </div>
  );
}
