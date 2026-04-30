import { BLOCK_DOCUMENT_VERSION, BlockDocument, NoteBlock } from "@/types/blocks";

function generateBlockId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function stripHtml(value: string): string {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function textToBlocks(text: string): NoteBlock[] {
  const normalized = text.trim();
  if (!normalized) {
    return [{ id: generateBlockId(), type: "paragraph", text: "" }];
  }

  return normalized.split(/\n{2,}/).map((paragraph) => ({
    id: generateBlockId(),
    type: "paragraph",
    text: paragraph.trim(),
  }));
}

export function createEmptyBlockDocument(): BlockDocument {
  return {
    version: BLOCK_DOCUMENT_VERSION,
    blocks: [{ id: generateBlockId(), type: "paragraph", text: "" }],
  };
}

export function parseContentToBlockDocument(content: string): BlockDocument {
  const text = stripHtml(content || "");
  return {
    version: BLOCK_DOCUMENT_VERSION,
    blocks: textToBlocks(text),
  };
}
