import { keymap } from "prosemirror-keymap";
import { Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { createToggleMarkCommand } from "../commands/toggle-mark";

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

        decorations.push(
          Decoration.inline(start, end, {}, { type: 'mark' }),
        );

        const innerStart = start + 1;
        const innerEnd = end - 1;

        decorations.push(
          Decoration.inline(innerStart, innerEnd, {
            nodeName: 'em',
          }, { type: 'text' })
        );

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

export const italicKeymapPlugin = keymap({
  'mod-i': createToggleMarkCommand(italicPlugin, '_'),
})
