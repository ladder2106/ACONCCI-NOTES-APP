export const BLOCK_DOCUMENT_VERSION = 1;

export interface ParagraphBlock {
  id: string;
  type: "paragraph";
  text: string;
}

export interface HeadingBlock {
  id: string;
  type: "heading";
  text: string;
  level: 1 | 2 | 3;
}

export type NoteBlock = ParagraphBlock | HeadingBlock;

export interface BlockDocument {
  version: number;
  blocks: NoteBlock[];
}
