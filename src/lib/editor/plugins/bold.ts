import { Plugin, EditorState, Transaction } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { keymap } from "prosemirror-keymap";

type BoldDecorationSpec = {
  type: 'marker' | 'text';
}

// Command to toggle bold marks around selected text
export const toggleBoldCommand = (state: EditorState, dispatch?: (tr: Transaction) => void) => {
  const decorations = boldPlugin.getState(state);
  if (!decorations) return false;
  if (!dispatch) return true;

  const { selection } = state;
  // Move `from` to the start of the word, and `to` to the end of the word.
  // Ex: Ex[ample te]xt -> [Example text]
  const fromOffset = getStartOfWordOffset(state.doc.resolve(selection.from).nodeBefore?.textContent ?? '');
  const toOffset = getEndOfWordOffset(state.doc.resolve(selection.to).nodeAfter?.textContent ?? '');
  const from = selection.from - fromOffset;
  const to = selection.to + toOffset;

  const boldDecorations = decorations.find(from, to, (spec: BoldDecorationSpec) => spec.type === 'text');
  const markerDecorations = decorations.find(from, to, (spec: BoldDecorationSpec) => spec.type === 'marker');

  let tr = state.tr;

  const shouldBecomeBold = checkShouldBecomeBold(from, to, boldDecorations);
  const firstMarker = boldDecorations[0];
  const lastMarker = boldDecorations.at(-1);
  const isBoldAtStart = firstMarker && from > firstMarker.from;
  const isBoldAtEnd = lastMarker && to < lastMarker.to;
  for (let decoration of markerDecorations) {
    tr = tr.delete(tr.mapping.map(decoration.from), tr.mapping.map(decoration.to));
  }

  if (shouldBecomeBold) {
    if (!isBoldAtStart) {
      tr = tr.insertText('**', tr.mapping.map(from));
    }
    if (!isBoldAtEnd) {
      tr = tr.insertText('**', tr.mapping.map(to));
    }
  } else {
    if (isBoldAtStart) {
      // move by 1 to place after the space rather than before
      // ex: generate "**bold** text" instead of "**bold **text"
      tr = tr.insertText('**', tr.mapping.map(from - 1));
    }
    if (isBoldAtEnd) {
      tr = tr.insertText('**', tr.mapping.map(to + 1));
    }
  }

  dispatch(tr);

  return true;
};

/** A selection should become bold if any part of the selection is not included by a bold decoration */
function checkShouldBecomeBold(from: number, to: number, boldDecorations: Decoration[]): boolean {
  const boldStart = boldDecorations[0]?.from;
  const boldEnd = boldDecorations.at(-1)?.to;
  if (!boldStart || !boldEnd) return true;
  if (from < boldStart || to > boldEnd) return true;

  // Otherwise, looks for breaks in bold in the middle of the text
  let prevDecoration = boldDecorations[0];
  for (let decoration of boldDecorations) {
    if (decoration == prevDecoration) continue;
    if (!prevDecoration) return true;
    if (prevDecoration.to < decoration.from) return true;
    prevDecoration = decoration;
  }
  return false;
}

function getStartOfWordOffset(text: string): number {
  let offset = text.length - 1;
  while (offset >= 0 && text[offset] !== ' ') {
    offset--;
  }
  return text.length - 1 - offset;
}

function getEndOfWordOffset(text: string): number {
  let offset = 0;
  while (offset < text.length && text[offset] !== ' ') {
    offset++;
  }
  return offset;
}

function getOffsetInParent(state: EditorState, pos: number): number {
  const resolved = state.doc.resolve(pos);
  return resolved.parentOffset;
}

/** Get offset of the start of the selected bold range, accounting for ** characters */
function getBoldedOffsetStart(selectedText: string): number {
  if (selectedText[0] === '*' && selectedText[1] === '*') {
    return 2;
  } else if (selectedText[0] === '*') {
    return 1;
  } else {
    return 0;
  }
}

/** Get offset of the end of the selected bold range, accounting for ** characters */
function getBoldedOffsetEnd(selectedText: string): number {
  if (selectedText.at(-2) === '*' && selectedText.at(-1) === '*') {
    return -2;
  } else if (selectedText.at(-1) === '*') {
    return -1;
  } else {
    return 0;
  }
}

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
          Decoration.inline(start, end, {
            nodeName: 'strong',
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

// Keymap plugin for bold shortcuts
export const boldKeymapPlugin = keymap({
  'Mod-b': toggleBoldCommand,
  'Mod-B': toggleBoldCommand
});

