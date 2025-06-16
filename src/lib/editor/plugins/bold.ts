import { Plugin, EditorState, Transaction } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { keymap } from "prosemirror-keymap";

// Command to toggle bold marks around selected text
const toggleBoldCommand = (state: EditorState, dispatch?: (tr: Transaction) => void) => {
  const { from, to } = state.selection;

  if (from === to) {
    // No selection, do nothing for now
    return false;
  }

  const selectedText = state.doc.textBetween(from, to);

  // Check if the selection is already wrapped with **
  const startPos = Math.max(0, from - 2);
  const endPos = Math.min(state.doc.content.size, to + 2);
  const surroundingText = state.doc.textBetween(startPos, endPos);

  const beforeSelection = surroundingText.substring(0, from - startPos);
  const afterSelection = surroundingText.substring(from - startPos + selectedText.length);

  if (beforeSelection.endsWith('**') && afterSelection.startsWith('**')) {
    // Remove bold marks
    if (dispatch) {
      const tr = state.tr
        .delete(to, to + 2) // Remove trailing **
        .delete(from - 2, from); // Remove leading **
      dispatch(tr);
    }
    return true;
  } else {
    // Add bold marks
    if (dispatch) {
      const tr = state.tr
        .insertText('**', to)
        .insertText('**', from);
      dispatch(tr);
    }
    return true;
  }
};

export const boldPlugin = new Plugin({
  state: {
    init() {
      return DecorationSet.empty;
    },
    apply(tr, _oldState) {
      return findBoldDecorations(tr.doc);
    }
  },
  props: {
    transformPastedHTML(html) {
      // Convert <strong>text</strong> to **text**
      return html
        .replace(/<strong[^>]*>([^<]+)<\/strong>/gi, '**$1**')
        .replace(/<b[^>]*>([^<]+)<\/b>/gi, '**$1**');
    },
    decorations(state) {
      return this.getState(state);
    }
  }
});

// Function to find **bold** patterns and create decorations
function findBoldDecorations(doc: any) {
  const decorations: Decoration[] = [];

  doc.descendants((node: any, pos: number) => {
    if (node.type.name === 'text' && node.text) {
      const text = node.text;
      const regex = /\*\*([^*]+)\*\*/g;
      let match;

      while ((match = regex.exec(text)) !== null) {
        const start = pos + match.index;
        const end = start + match[0].length;

        // Add decoration for the entire match including ** symbols
        // But only make the inner text bold
        const innerStart = start + 2; // Skip first **
        const innerEnd = end - 2; // Skip last **

        // Make the inner text bold with strong tag
        decorations.push(
          Decoration.inline(innerStart, innerEnd, {
            nodeName: 'strong',
          })
        );

        // Make the ** symbols slightly dimmed
        decorations.push(
          Decoration.inline(start, start + 2, {
            class: 'boundary-decorator',
          })
        );
        decorations.push(
          Decoration.inline(innerEnd, end, {
            class: 'boundary-decorator',
          })
        );
      }
    }
  });

  return DecorationSet.create(doc, decorations);
}

// Keymap plugin for bold shortcuts
export const boldKeymapPlugin = keymap({
  'Mod-b': toggleBoldCommand,
  'Mod-B': toggleBoldCommand
});

