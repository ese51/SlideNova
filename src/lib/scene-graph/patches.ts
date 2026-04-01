import { SceneNode, NodeType, TextNode } from "./types";

export type PatchType = 
  | 'set_text'
  | 'set_position'
  | 'set_size'
  | 'set_style'
  | 'set_image_src'
  | 'add_node'
  | 'delete_node'
  | 'reorder_node';

export interface BasePatch {
  type: PatchType;
  nodeId: string;
}

export interface SetTextPatch extends BasePatch {
  type: 'set_text';
  content: string;
}

export interface SetPositionPatch extends BasePatch {
  type: 'set_position';
  x: number;
  y: number;
}

export interface SetSizePatch extends BasePatch {
  type: 'set_size';
  width: number;
  height: number;
}

export interface SetStylePatch extends BasePatch {
  type: 'set_style';
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  fontWeight?: number;
  color?: string;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
}

export interface SetImageSrcPatch extends BasePatch {
  type: 'set_image_src';
  src: string;
}

export interface AddNodePatch extends BasePatch {
  type: 'add_node';
  node: SceneNode;
}

export interface DeleteNodePatch extends BasePatch {
  type: 'delete_node';
}

export interface ReorderNodePatch extends BasePatch {
  type: 'reorder_node';
  direction: 'up' | 'down';
}

export type PatchOperation = 
  | SetTextPatch 
  | SetPositionPatch 
  | SetSizePatch 
  | SetStylePatch 
  | SetImageSrcPatch
  | AddNodePatch
  | DeleteNodePatch
  | ReorderNodePatch;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validatePatch(nodes: SceneNode[], patch: PatchOperation): ValidationResult {
  if (patch.type === 'add_node') {
    if (nodes.some(n => n.id === patch.node.id)) {
      return { isValid: false, error: `Node with ID ${patch.node.id} already exists.` };
    }
    return { isValid: true };
  }

  const node = nodes.find(n => n.id === patch.nodeId);
  
  if (!node) {
    return { isValid: false, error: `Node with ID ${patch.nodeId} not found.` };
  }

  switch (patch.type) {
    case 'set_text':
      if (node?.type !== 'text') return { isValid: false, error: 'Cannot set text on non-text node.' };
      break;
    case 'set_image_src':
      if (node?.type !== 'image') return { isValid: false, error: 'Cannot set image src on non-image node.' };
      break;
    case 'set_position':
      if (isNaN(patch.x) || isNaN(patch.y)) return { isValid: false, error: 'Invalid coordinates.' };
      break;
    case 'set_size':
      if (isNaN(patch.width) || isNaN(patch.height) || patch.width < 0 || patch.height < 0) {
        return { isValid: false, error: 'Invalid dimensions.' };
      }
      break;
    case 'set_style':
      if (patch.fontSize !== undefined && (isNaN(patch.fontSize) || patch.fontSize <= 0)) {
        return { isValid: false, error: 'Invalid font size.' };
      }
      if (patch.fontWeight !== undefined && ![400, 500, 700].includes(patch.fontWeight)) {
        return { isValid: false, error: 'Invalid font weight.' };
      }
      if (patch.color !== undefined && !/^#([A-Fa-f0-9]{3}){1,2}$/.test(patch.color)) {
        return { isValid: false, error: 'Invalid color format.' };
      }
      if (patch.fontStyle !== undefined && !['normal', 'italic'].includes(patch.fontStyle)) {
        return { isValid: false, error: 'Invalid font style.' };
      }
      if (patch.textDecoration !== undefined && !['none', 'underline'].includes(patch.textDecoration)) {
        return { isValid: false, error: 'Invalid text decoration.' };
      }
      break;
    case 'reorder_node':
      const index = nodes.findIndex(n => n.id === patch.nodeId);
      if (patch.direction === 'up' && index === nodes.length - 1) {
        return { isValid: false, error: 'Cannot move node up, already at top.' };
      }
      if (patch.direction === 'down' && index === 0) {
        return { isValid: false, error: 'Cannot move node down, already at bottom.' };
      }
      break;
  }

  return { isValid: true };
}

export function applyPatch(nodes: SceneNode[], patch: PatchOperation): SceneNode[] {
  const validation = validatePatch(nodes, patch);
  if (!validation.isValid) {
    console.error('Patch validation failed:', validation.error);
    return nodes;
  }

  if (patch.type === 'add_node') {
    return [...nodes, patch.node];
  }

  if (patch.type === 'delete_node') {
    return nodes.filter(node => node.id !== patch.nodeId);
  }

  if (patch.type === 'reorder_node') {
    const index = nodes.findIndex(node => node.id === patch.nodeId);
    if (index === -1) return nodes;

    const newNodes = [...nodes];
    const nodeToMove = newNodes[index];
    const newIndex = patch.direction === 'up' ? index + 1 : index - 1;

    if (newIndex < 0 || newIndex >= nodes.length) return nodes;

    newNodes.splice(index, 1);
    newNodes.splice(newIndex, 0, nodeToMove);
    return newNodes;
  }

  return nodes.map(node => {
    if (node.id !== patch.nodeId) return node;

    switch (patch.type) {
      case 'set_text':
        return { ...node, content: (patch as SetTextPatch).content } as SceneNode;
      case 'set_position':
        return { ...node, x: (patch as SetPositionPatch).x, y: (patch as SetPositionPatch).y } as SceneNode;
      case 'set_size':
        return { ...node, width: (patch as SetSizePatch).width, height: (patch as SetSizePatch).height } as SceneNode;
      case 'set_style':
        const stylePatch = patch as SetStylePatch;
        const nextNode = { ...node };
        if (stylePatch.fontSize !== undefined) (nextNode as TextNode).fontSize = stylePatch.fontSize;
        if (stylePatch.textAlign !== undefined) (nextNode as TextNode).textAlign = stylePatch.textAlign;
        if (stylePatch.fontWeight !== undefined) (nextNode as TextNode).fontWeight = stylePatch.fontWeight;
        if (stylePatch.color !== undefined) (nextNode as TextNode).color = stylePatch.color;
        if (stylePatch.fontStyle !== undefined) (nextNode as TextNode).fontStyle = stylePatch.fontStyle;
        if (stylePatch.textDecoration !== undefined) (nextNode as TextNode).textDecoration = stylePatch.textDecoration;
        return nextNode as SceneNode;
      case 'set_image_src':
        return { ...node, src: (patch as SetImageSrcPatch).src } as SceneNode;
      default:
        return node;
    }
  });
}
