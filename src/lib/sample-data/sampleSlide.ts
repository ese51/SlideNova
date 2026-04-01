import { Slide } from "../scene-graph/types";

export const sampleSlide: Slide = {
  id: "slide-1",
  nodes: [
    {
      id: "node-1",
      type: "text",
      x: 100,
      y: 100,
      width: 400,
      height: 100,
      content: "Welcome to SlideNova",
      fontSize: 48,
      fontWeight: 700,
      color: "#2563eb",
    },
    {
      id: "node-2",
      type: "image",
      x: 100,
      y: 250,
      width: 400,
      height: 300,
      src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    },
  ],
};
