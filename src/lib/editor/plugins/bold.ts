import { Plugin, EditorState, Transaction, type Command } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { keymap } from "prosemirror-keymap";

type MarkDecorationSpec = {
  type: 'marker' | 'text';
}

// Create command to toggle marks like `**` bold and `_` italic
// TODO: handle multi-line selections. Doesn't work as expected yet
// TODO handle marks that are adjacent but separated by spaces
export const createToggleMarkCommand = (pluginRef: Plugin, mark: string): Command => {
  return (state, dispatch) => {
    const decorations = pluginRef.getState(state);
    if (!decorations) return false;
    if (!dispatch) return true;

    const { selection } = state;
    // Move `from` to the start of the word, and `to` to the end of the word.
    // Ex: Ex[ample te]xt -> [Example text]
    const fromOffset = getStartOfWordOffset(state.doc.resolve(selection.from).nodeBefore?.textContent ?? '');
    const toOffset = getEndOfWordOffset(state.doc.resolve(selection.to).nodeAfter?.textContent ?? '');
    const from = selection.from - fromOffset;
    const to = selection.to + toOffset;

    const textDecorations = decorations.find(from, to, (spec: MarkDecorationSpec) => spec.type === 'text');
    const markerDecorations = decorations.find(from, to, (spec: MarkDecorationSpec) => spec.type === 'marker');

    let tr = state.tr;

    const shouldApplyMark = checkShouldApplyMark(from, to, textDecorations);
    const firstMarker = textDecorations[0];
    const lastMarker = textDecorations.at(-1);
    const isAppliedAtStart = firstMarker && from > firstMarker.from;
    const isAppliedAtEnd = lastMarker && to < lastMarker.to;
    for (let decoration of markerDecorations) {
      tr = tr.delete(tr.mapping.map(decoration.from), tr.mapping.map(decoration.to));
    }

    if (shouldApplyMark) {
      if (!isAppliedAtStart) {
        tr = tr.insertText(mark, tr.mapping.map(from));
      }
      if (!isAppliedAtEnd) {
        tr = tr.insertText(mark, tr.mapping.map(to));
      }
    } else {
      if (isAppliedAtStart) {
        // move by 1 to place after the space rather than before
        // ex: generate "**bold** text" instead of "**bold **text"
        tr = tr.insertText(mark, tr.mapping.map(from - 1));
      }
      if (isAppliedAtEnd) {
        tr = tr.insertText(mark, tr.mapping.map(to + 1));
      }
    }

    dispatch(tr);

    return true;
  }
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

  const boldDecorations = decorations.find(from, to, (spec: MarkDecorationSpec) => spec.type === 'text');
  const markerDecorations = decorations.find(from, to, (spec: MarkDecorationSpec) => spec.type === 'marker');

  let tr = state.tr;

  const shouldBecomeBold = checkShouldApplyMark(from, to, boldDecorations);
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
function checkShouldApplyMark(from: number, to: number, decorations: Decoration[]): boolean {
  const markStart = decorations[0]?.from;
  const markEnd = decorations.at(-1)?.to;
  if (!markStart || !markEnd) return true;
  if (from < markStart || to > markEnd) return true;

  // Otherwise, looks for breaks in bold in the middle of the text
  let prevDecoration = decorations[0];
  for (let decoration of decorations) {
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
            toggleBoldCommand, 
  'Mod-B': toggleBoldCommand
});


