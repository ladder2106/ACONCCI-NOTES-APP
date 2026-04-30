import { BlockDocument } from "@/types/blocks";

function getBlockText(block: BlockDocument["blocks"][number]): string {
  return (block.text || "").trim();
}

export function serializeBlocksToPlainText(document: BlockDocument): string {
  const content = document.blocks.map(getBlockText).join("\n\n").trim();
  return content;
}

function getWordCount(value: string): number {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

function getByteLength(value: string): number {
  return unescape(encodeURIComponent(value)).length;
}

export function getBlockDerivedMetrics(document: BlockDocument, title: string) {
  const derivedContent = serializeBlocksToPlainText(document);
  const contentByteLength = getByteLength(derivedContent);
  const titleByteLength = getByteLength(title);

  return {
    derivedContent,
    wordCount: getWordCount(derivedContent),
    characterCount: derivedContent.length,
    size: titleByteLength + contentByteLength,
  };
}
