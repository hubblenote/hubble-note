import { keymap } from "prosemirror-keymap";
import { Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { createToggleMarkCommand } from "../commands/toggle-mark";
import { maskInlineCode } from "./utils";

export const highlightPlugin = new Plugin({
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
      // Convert <mark>text</mark> to ==text==
      return html
        .replace(/<mark[^>]*>([^<]+)<\/mark>/gi, '==$1==');
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
      const regex = /==([^=]+)==/g;
      let match;

      while ((match = regex.exec(maskedText)) !== null) {
        const start = pos + match.index;
        const end = start + match[0].length;

        decorations.push(
          Decoration.inline(start, end, {}, { type: 'formatting' }),
        );

        const innerStart = start + 2;
        const innerEnd = end - 2;

        decorations.push(
          Decoration.inline(innerStart, innerEnd, {
            nodeName: 'mark',
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

export const highlightKeymapPlugin = keymap({
  'mod-shift-h': createToggleMarkCommand(highlightPlugin, '=='),
})
