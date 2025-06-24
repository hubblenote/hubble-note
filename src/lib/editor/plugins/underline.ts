import { keymap } from "prosemirror-keymap";
import { Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { createToggleMarkCommand } from "../commands/toggle-mark";

export const underlinePlugin = new Plugin({
  state: {
    init() {
      return DecorationSet.empty;
    },
    apply(tr, _oldState) {
      return findUnderlineDecorations(tr.doc);
    }
  },
  props: {
    transformPastedHTML(html) {
      // Convert <u>text</u> to ~text~
      return html
        .replace(/<u[^>]*>([^<]+)<\/u>/gi, '~$1~');
    },
    decorations(state) {
      return this.getState(state);
    }
  }
});

// Function to find ~underline~ patterns and create decorations
function findUnderlineDecorations(doc: any) {
  const decorations: Decoration[] = [];

  doc.descendants((node: any, pos: number) => {
    if (node.type.name === 'text' && node.text) {
      const text = node.text;
      const regex = /~([^~]+)~/g;
      let match;

      while ((match = regex.exec(text)) !== null) {
        const start = pos + match.index;
        const end = start + match[0].length;

        // Add decoration for the entire match including ~ symbols
        // But only make the inner text underlined
        const innerStart = start + 1; // Skip first ~
        const innerEnd = end - 1; // Skip last ~

        // Make the inner text underlined with u tag
        decorations.push(
          Decoration.inline(start, end, {
            nodeName: 'u',
          }, { type: 'text' })
        );

        // Make the ~ symbols slightly dimmed
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

export const underlineKeymapPlugin = keymap({
  'mod-u': createToggleMarkCommand(underlinePlugin, '~'),
})
