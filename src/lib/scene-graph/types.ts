export type NodeType = 'text' | 'image';

export interface BaseNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextNode extends BaseNode {
  type: 'text';
  content: string;
  fontSize: number;
  textAlign?: 'left' | 'center' | 'right';
  fontWeight?: number;
  color?: string;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
}

export interface ImageNode extends BaseNode {
  type: 'image';
  src: string;
}

export type SceneNode = TextNode | ImageNode;

export interface Slide {
  id: string;
  nodes: SceneNode[];
}
