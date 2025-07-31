import { keymap } from "prosemirror-keymap";
import { Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { createToggleFormattingCommand } from "../commands/toggleFormatting";
import { maskInlineCode } from "./utils";

export const italicPlugin = new Plugin({
  state: {
    init() {
      return DecorationSet.empty;
    },
    apply(tr, _oldState) {
      return getDecorations(tr.doc);
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

function getDecorations(doc: any) {
  const decorations: Decoration[] = [];

  doc.descendants((node: any, pos: number) => {
    if (node.type.name === 'text' && node.text) {
      const originalText = node.text;
      const maskedText = maskInlineCode(originalText);
      const regex = /_([^_]+)_/g;
      let match;

      while ((match = regex.exec(maskedText)) !== null) {
        const start = pos + match.index;
        const end = start + match[0].length;

        decorations.push(
          Decoration.inline(start, end, {}, { type: 'formatting' }),
        );

        const innerStart = start + 1;
        const innerEnd = end - 1;

        decorations.push(
          Decoration.inline(innerStart, innerEnd, {
            nodeName: 'em',
          }, { type: 'formatting-content' })
        );

        decorations.push(
          Decoration.inline(start, innerStart, {
            class: 'formatting-delimiter',
          }, { type: 'formatting-delimiter' })
        );
        decorations.push(
          Decoration.inline(innerEnd, end, {
            class: 'formatting-delimiter',
          }, { type: 'formatting-delimiter' })
        );
      }
    }
  });

  return DecorationSet.create(doc, decorations);
}

export const italicKeymapPlugin = keymap({
  'mod-i': createToggleFormattingCommand(italicPlugin, '_'),
})
