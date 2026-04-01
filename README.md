# SlideNova

SlideNova is an AI-powered presentation editor built with Next.js, React, and TypeScript. Unlike traditional editors that treat slides as flat documents, SlideNova manages slides as a hierarchy of structured layers. Every edit—from moving an image to changing a font color—flows through a system of validated patch operations. This architectural choice makes direct manipulation, undo/redo history, and AI-assisted editing exceptionally reliable and consistent.

## Why this project exists
Traditional slide formats are often opaque or unstructured, making it difficult for AI models to edit them reliably without breaking the layout or losing data. SlideNova explores a better model for human-AI collaboration by using structured layers and atomic, patch-based changes. Our goal is to enable precise, iterative design where the AI acts as a surgical assistant rather than just a "one-shot" generator.

## Current Features
- **Multi-slide editing**: Build complete presentations with multiple independent pages.
- **Text and image nodes**: Create, edit, and arrange rich media elements.
- **Inline text editing**: Double-click any text node to edit content directly on the canvas.
- **Drag and resize**: Fluid direct manipulation for positioning and sizing all elements.
- **Text styling controls**: Precise control over font size, weight, alignment, and emphasis.
- **Layers panel**: Manage stacking order and selection through a dedicated z-index inspector.
- **Undo/redo history**: Full state tracking for every patch operation.
- **Local persistence**: Automatic state saving to `localStorage` to prevent work loss.
- **Gemini-powered AI patch editing**: Edit nodes using natural language instructions that generate structured patches.

## Tech Stack
- **Next.js** (App Router)
- **React** (Server & Client Components)
- **TypeScript** for type-safe scene graph operations
- **Tailwind CSS** for responsive, utility-first styling
- **Gemini API** for intelligent instruction processing

## Local Development

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Set up your environment variables:
   - Create a `.env.local` file in the root directory.
   - Add your Gemini API key (get one at [Google AI Studio](https://aistudio.google.com/)):
     ```text
     NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
     ```

3. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser to start building.
