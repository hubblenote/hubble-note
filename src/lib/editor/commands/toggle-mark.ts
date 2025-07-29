import { type Plugin, type Command, TextSelection } from 'prosemirror-state';
import type { Decoration } from 'prosemirror-view';

export type MarkDecorationSpec = {
  type: 'marker' | 'text' | 'mark';
}

// Create command to toggle marks like `**` bold and `_` italic
// TODO: handle multi-line selections. Doesn't work as expected yet
// TODO handle marks that are adjacent but separated by spaces
export const createToggleMarkCommand = (pluginRef: Plugin, mark: string, closingMark?: string): Command => {
  closingMark ??= mark;
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

    const textDecorations = decorations.find(from, to, (spec: MarkDecorationSpec) => spec.type === 'mark');
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
        const toPos = tr.mapping.map(to);
        tr = tr.insertText(closingMark, toPos);
        // Move cursor in front of the closing mark if the selection is empty
        if (state.selection.empty) {
          tr = tr.setSelection(TextSelection.create(tr.doc, toPos));
        }
      }
    } else {
      if (isAppliedAtStart) {
        // move by 1 to place after the space rather than before
        // ex: generate "**bold** text" instead of "**bold **text"
        tr = tr.insertText(mark, tr.mapping.map(from - 1));
      }
      if (isAppliedAtEnd) {
        tr = tr.insertText(closingMark, tr.mapping.map(to + 1));
      }
    }

    dispatch(tr);

    return true;
  }
}

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

