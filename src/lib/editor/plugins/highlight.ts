import { keymap } from "prosemirror-keymap";
import { Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { createToggleMarkCommand } from "../commands/toggle-mark";

export const highlightPlugin = new Plugin({
  state: {
    init() {
      return DecorationSet.empty;
    },
    apply(tr, _oldState) {
      return findHighlightDecorations(tr.doc);
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

// Function to find ==highlight== patterns and create decorations
function findHighlightDecorations(doc: any) {
  const decorations: Decoration[] = [];

  doc.descendants((node: any, pos: number) => {
    if (node.type.name === 'text' && node.text) {
      const text = node.text;
      const regex = /==([^=]+)==/g;
      let match;

      while ((match = regex.exec(text)) !== null) {
        const start = pos + match.index;
        const end = start + match[0].length;

        // Add decoration for the entire match including == symbols
        // But only make the inner text highlighted
        const innerStart = start + 2; // Skip first ==
        const innerEnd = end - 2; // Skip last ==

        // Make the inner text highlighted with mark tag
        decorations.push(
          Decoration.inline(start, end, {
            nodeName: 'mark',
          }, { type: 'text' })
        );

        // Make the == symbols slightly dimmed
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

export const highlightKeymapPlugin = keymap({
  'mod-shift-h': createToggleMarkCommand(highlightPlugin, '=='),
})
