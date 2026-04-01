import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { SceneNode, TextNode } from "../scene-graph/types";
import { PatchOperation } from "../scene-graph/patches";

/**
 * Real Gemini API service to generate patches from natural language instructions.
 */

const SYSTEM_PROMPT = `
You are a design assistant for SlideNova, a slide builder app. 
Your task is to convert a user's natural language instruction into a JSON array of patch operations for a selected node.

Allowed Patch Types:
1. set_text: { type: 'set_text', nodeId: string, content: string }
2. set_position: { type: 'set_position', nodeId: string, x: number, y: number }
3. set_size: { type: 'set_size', nodeId: string, width: number, height: number }
4. set_style: { 
     type: 'set_style', 
     nodeId: string, 
     fontSize?: number, 
     textAlign?: 'left' | 'center' | 'right',
     fontWeight?: number (400, 500, 700),
     color?: string (hex format like #RRGGBB),
     fontStyle?: 'normal' | 'italic',
     textDecoration?: 'none' | 'underline'
   }
5. set_image_src: { type: 'set_image_src', nodeId: string, src: string }

Rules:
- You must ONLY return a JSON array of objects that match the PatchOperation type.
- Do NOT include any explanations, markdown formatting (except for JSON tags if requested), or other text.
- ONLY modify the selected node (the one provided in the context).
- If the instruction is unclear or impossible, return an empty array [].
- All patches must reference the correct nodeId.
- Use the current state of the node to perform relative changes (e.g., "make it bigger" means increase width/height or fontSize).
- For text nodes, only use set_text and set_style (fontSize, textAlign, etc.).
- For image nodes, only use set_position, set_size, and set_image_src.
- Both types can use set_position and set_size.
- Return ONLY valid JSON.

Selected Node State:
`;

export async function generatePatchesFromInstruction(
  node: SceneNode,
  instruction: string,
  apiKey: string
): Promise<PatchOperation[]> {
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please set NEXT_PUBLIC_GEMINI_API_KEY.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const nodeContext = JSON.stringify(node, null, 2);
  const prompt = `${SYSTEM_PROMPT}\n${nodeContext}\n\nUser Instruction: "${instruction}"\n\nJSON Output:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Clean up markdown if the model included it
    if (text.startsWith("```json")) {
      text = text.substring(7);
    }
    if (text.endsWith("```")) {
      text = text.substring(0, text.length - 3);
    }
    text = text.trim();

    const patches = JSON.parse(text);

    if (!Array.isArray(patches)) {
      console.error("AI returned non-array response:", patches);
      return [];
    }

    // Ensure all patches have the correct nodeId
    return patches.map(p => ({ ...p, nodeId: node.id }));
  } catch (error) {
    console.error("Gemini AI API Error:", error);
    throw error;
  }
}
