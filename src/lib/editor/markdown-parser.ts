import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { schema } from './schema';
import type { Node as ProseMirrorNode } from 'prosemirror-model';
import type { Node as UnistNode } from 'unist';

interface MarkdownNode extends UnistNode {
  type: string;
  value?: string;
  children?: MarkdownNode[];
  depth?: number;
}

export function parseMarkdownToProseMirror(markdown: string): ProseMirrorNode {
  const processor = unified().use(remarkParse);
  const ast = processor.parse(markdown);
  
  const blocks = convertAstToBlocks(ast as MarkdownNode);
  
  return schema.node('doc', null, blocks);
}

function convertAstToBlocks(ast: MarkdownNode): ProseMirrorNode[] {
  const blocks: ProseMirrorNode[] = [];
  
  if (ast.children) {
    for (const child of ast.children) {
      const block = convertNodeToBlock(child);
      if (block) {
        blocks.push(block);
      }
    }
  }
  
  return blocks;
}

function convertNodeToBlock(node: MarkdownNode): ProseMirrorNode | null {
  switch (node.type) {
    case 'paragraph':
      return schema.node('paragraph', null, [
        schema.text(convertInlineNodesToText(node.children || []))
      ]);
      
    case 'heading':
      const headingPrefix = '#'.repeat(node.depth || 1) + ' ';
      const headingText = convertInlineNodesToText(node.children || []);
      return schema.node('heading', { level: node.depth || 1 }, [
        schema.text(headingPrefix + headingText)
      ]);
      
    case 'list':
      // Convert all list items to listItem nodes
      const listItems: ProseMirrorNode[] = [];
      if (node.children) {
        for (const listItem of node.children) {
          if (listItem.type === 'listItem') {
            // Get the text content from the first paragraph in the list item
            const textContent = getListItemText(listItem);
            listItems.push(schema.node('listItem', null, [
              schema.text('- ' + textContent)
            ]));
          }
        }
      }
      return schema.node('bulletedList', null, listItems);
      
    // Fallback: treat other block nodes as paragraphs
    case 'blockquote':
    case 'code':
    case 'html':
    case 'thematicBreak':
    default:
      // For unsupported block types, convert to paragraph
      const fallbackText = getNodeText(node);
      if (fallbackText.trim()) {
        return schema.node('paragraph', null, [schema.text(fallbackText)]);
      }
      return null;
  }
}

function convertInlineNodesToText(nodes: MarkdownNode[]): string {
  let result = '';
  
  for (const node of nodes) {
    switch (node.type) {
      case 'text':
        result += node.value || '';
        break;
        
      case 'strong':
        // Preserve markdown syntax for bold
        const strongText = convertInlineNodesToText(node.children || []);
        result += `**${strongText}**`;
        break;
        
      case 'emphasis':
        // Preserve markdown syntax for italic
        const emphasisText = convertInlineNodesToText(node.children || []);
        result += `_${emphasisText}_`;
        break;
        
      case 'link':
        // Preserve links as text for now
        const linkText = convertInlineNodesToText(node.children || []);
        result += linkText;
        break;
        
      case 'inlineCode':
        // Preserve inline code as text
        result += node.value || '';
        break;
        
      default:
        // For any other inline node, just get its text content
        result += getNodeText(node);
        break;
    }
  }
  
  return result;
}

function getListItemText(listItem: MarkdownNode): string {
  // List items typically contain paragraph nodes
  if (listItem.children) {
    for (const child of listItem.children) {
      if (child.type === 'paragraph') {
        return convertInlineNodesToText(child.children || []);
      }
    }
  }
  
  // Fallback to getting all text content
  return getNodeText(listItem);
}

function getNodeText(node: MarkdownNode): string {
  if (node.value) {
    return node.value;
  }
  
  if (node.children) {
    return node.children.map(child => getNodeText(child)).join('');
  }
  
  return '';
}
