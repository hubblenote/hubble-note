import type { Node as ProseMirrorNode } from 'prosemirror-model';
import { getLinkAttrs } from './schema';

/**
 * Converts a ProseMirror document back to markdown format.
 * 
 * Example usage:
 * ```typescript
 * import { serializeProseMirrorToMarkdown } from './markdown-serializer';
 * 
 * const markdown = serializeProseMirrorToMarkdown(proseMirrorDoc);
 * ```
 * 
 * @param doc - The ProseMirror document to serialize
 * @returns The markdown string representation
 */
export function serializeProseMirrorToMarkdown(doc: ProseMirrorNode): string {
  const blocks: string[] = [];
  
  // Process each block node in the document
  doc.forEach((node) => {
    const blockMarkdown = serializeBlock(node);
    if (blockMarkdown) {
      blocks.push(blockMarkdown);
    }
  });
  
  return blocks.join('\n\n');
}

function serializeBlock(node: ProseMirrorNode): string | null {
  switch (node.type.name) {
    case 'paragraph':
      return serializeParagraph(node);
      
    case 'heading':
      return serializeHeading(node);
      
    case 'bulletedList':
      return serializeBulletedList(node);
      
    default:
      // For unsupported block types, try to extract text content
      const textContent = getTextContent(node);
      return textContent.trim() || null;
  }
}

function serializeParagraph(node: ProseMirrorNode): string {
  return serializeInlineContent(node);
}

function serializeHeading(node: ProseMirrorNode): string {
  // The heading text already contains the ### prefix, so we can use it directly
  return serializeInlineContent(node);
}

function serializeBulletedList(node: ProseMirrorNode): string {
  const items: string[] = [];
  
  node.forEach((listItem) => {
    if (listItem.type.name === 'listItem') {
      // The listItem text already contains the "- " prefix
      const itemContent = serializeInlineContent(listItem);
      if (itemContent.trim()) {
        items.push(itemContent);
      }
    }
  });
  
  return items.join('\n');
}

function serializeInlineContent(node: ProseMirrorNode): string {
  let result = '';
  
  node.forEach((child) => {
    if (child.type.name === 'text') {
      const text = child.text || '';
      
      // Check if this text node has any marks (like links)
      const linkMark = child.marks.find(mark => mark.type.name === 'link');
      
      if (linkMark) {
        // Handle link marks
        const linkAttrs = getLinkAttrs(linkMark);
        if (linkAttrs && linkAttrs.href) {
          // The text already contains square brackets [link], so we just need to add the href
          result += `${text}(${linkAttrs.href})`;
        } else {
          // If no href, just use the text as-is
          result += text;
        }
      } else {
        // No marks, just add the text
        // Other marks like bold, italic, etc. are preserved in the text content
        result += text;
      }
    } else {
      // For other inline nodes, get their text content
      result += getTextContent(child);
    }
  });
  
  return result;
}

function getTextContent(node: ProseMirrorNode): string {
  let text = '';
  
  if (node.type.name === 'text') {
    return node.text || '';
  }
  
  node.forEach((child) => {
    text += getTextContent(child);
  });
  
  return text;
}
