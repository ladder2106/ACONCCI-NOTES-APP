import { BLOCK_DOCUMENT_VERSION, BlockDocument } from "@/types/blocks";
import { createEmptyBlockDocument, parseContentToBlockDocument } from "@/utils/blocks/parse";

function isBlockDocument(value: unknown): value is BlockDocument {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as BlockDocument;
  return typeof candidate.version === "number" && Array.isArray(candidate.blocks);
}

export function ensureBlockDocument(blocks: unknown, fallbackContent: string): BlockDocument {
  if (!isBlockDocument(blocks)) {
    if (!fallbackContent.trim()) {
      return createEmptyBlockDocument();
    }
    return parseContentToBlockDocument(fallbackContent);
  }

  if (blocks.version !== BLOCK_DOCUMENT_VERSION) {
    // Versioned block migrations can be added here.
    return {
      ...blocks,
      version: BLOCK_DOCUMENT_VERSION,
    };
  }

  if (blocks.blocks.length === 0) {
    return createEmptyBlockDocument();
  }

  return blocks;
}
