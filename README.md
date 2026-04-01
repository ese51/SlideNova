# SlideNova

SlideNova is an AI-powered slide editor built around a structured layer system and patch-based edits. It allows users to build presentations through direct manipulation and natural language instructions.

## Core Concept
SlideNova uses a **patch-based architecture**. Every action—whether it's dragging a node, changing a color, or an AI-generated edit—is converted into a small, validated patch operation. This ensures consistency, simplifies state management, and makes undo/redo and local persistence inherently robust.

## Current Features
- **Multi-Slide Support**: Build complex presentations with multiple independent slides.
- **Node Types**: Create and edit both **Text** and **Image** nodes.
- **Direct Manipulation**: Drag to move and use corner handles to resize any element on the canvas.
- **Inline Text Editing**: Double-click text nodes to edit content directly on the slide.
- **Advanced Text Styling**: Full control over font size, weight (Regular/Medium/Bold), alignment, color, italic, and underline.
- **Layers Panel**: View and manage the stacking order (z-index) of all nodes in a slide.
- **AI Assistant**: Edit nodes using natural language instructions (e.g., "make this red and bigger") powered by Gemini AI.
- **Undo/Redo**: Complete history tracking for every action.
- **Local Persistence**: Automatic state saving to `localStorage`, so your work is never lost on refresh.

## Getting Started

### Prerequisites
- Node.js (v18 or later)
- A Gemini API Key (get one at [Google AI Studio](https://aistudio.google.com/))

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   - Open `.env.local` and add your Gemini API key:
     ```text
     NEXT_PUBLIC_GEMINI_API_KEY=your_real_key_here
     ```

### Development
Run the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to start building.

## Roadmap
- [ ] **Global AI Editing**: Apply instructions to the entire slide (e.g., "make all titles blue").
- [ ] **Component System**: Reusable slide templates and themed components.
- [ ] **Export Options**: Export slides to PDF or high-resolution images.
- [ ] **Real-time Collaboration**: Multi-user editing support using CRDTs.

## License
MIT
