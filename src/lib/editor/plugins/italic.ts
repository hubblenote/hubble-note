import { Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

export const ITALIC_MARK = '_';

export const italicPlugin = new Plugin({
  state: {
    init() {
      return DecorationSet.empty;
    },
    apply(tr, _oldState) {
      return findItalicDecorations(tr.doc);
    }
  },
  props: {
    transformPastedHTML(html) {
      // Convert <strong>text</strong> to **text**
      return html
        .replace(/<em[^>]*>([^<]+)<\/em>/gi, '_$1_')
        .replace(/<i[^>]*>([^<]+)<\/i>/gi, '_$1_');
    },
    decorations(state) {
      return this.getState(state);
    }
  }
});

// Function to find **bold** patterns and create decorations
function findItalicDecorations(doc: any) {
  const decorations: Decoration[] = [];

  doc.descendants((node: any, pos: number) => {
    if (node.type.name === 'text' && node.text) {
      const text = node.text;
      const regex = /_([^_]+)_/g;
      let match;

      while ((match = regex.exec(text)) !== null) {
        const start = pos + match.index;
        const end = start + match[0].length;

        // Add decoration for the entire match including ** symbols
        // But only make the inner text bold
        const innerStart = start + 1; // Skip first **
        const innerEnd = end - 1; // Skip last **

        // Make the inner text bold with strong tag
        decorations.push(
          Decoration.inline(start, end, {
            nodeName: 'em',
          }, { type: 'text' })
        );

        // Make the ** symbols slightly dimmed
        decorations.push(
          Decoration.inline(start, innerStart, {
            class: 'boundary-decorator',
          }, { type: 'marker' })
        );
        decorations.push(
          Decoration.inline(innerEnd, end, {
            class: 'boundary-decorator',
          }, { type: 'marker' })
        );
      }
    }
  });

  return DecorationSet.create(doc, decorations);
}
