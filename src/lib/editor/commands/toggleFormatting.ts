import { type Plugin, type Command, TextSelection } from 'prosemirror-state';
import type { Decoration, DecorationSet } from 'prosemirror-view';

export type FormattingDecorationSpec = {
  type: 'formatting' | 'formatting-delimiter' | 'formatting-content';
}

// Create command to toggle formatting like `**` bold and `_` italic
// TODO: handle multi-line selections. Doesn't work as expected yet
// TODO handle formatting that is adjacent but separated by spaces
export const createToggleFormattingCommand = (pluginRef: Plugin, delimiter: string, closingDelimiter?: string): Command => {
  closingDelimiter ??= delimiter;

  return (state, dispatch) => {
    const decorations: DecorationSet = pluginRef.getState(state);
    if (!decorations) return false;
    if (!dispatch) return true;

    const { selection, tr } = state;

    // First, check if the cursor is behind a closing delimiter.
    // This should move the cursor outside the formatting range instead of toggling.
    if (selection.empty && selection.from) {
      const [adjacentDecoration] = decorations.find(selection.from, selection.from, (spec: FormattingDecorationSpec) => spec.type === 'formatting-delimiter');
      if (adjacentDecoration?.from === selection.from) {
        tr.setSelection(TextSelection.create(tr.doc, selection.from + closingDelimiter.length));
        dispatch(tr);
        return true;
      }
    }

    // Move `from` to the start of the word, and `to` to the end of the word.
    // Ex: Ex[ample te]xt -> [Example text]
    const fromOffset = getStartOfWordOffset(state.doc.resolve(selection.from).nodeBefore?.textContent ?? '');
    const toOffset = getEndOfWordOffset(state.doc.resolve(selection.to).nodeAfter?.textContent ?? '');
    const from = selection.from - fromOffset;
    const to = selection.to + toOffset;

    const formattingRanges = decorations.find(from, to, (spec: FormattingDecorationSpec) => spec.type === 'formatting');
    const delimiters = decorations.find(from, to, (spec: FormattingDecorationSpec) => spec.type === 'formatting-delimiter');

    const shouldApplyFormatting = checkShouldApplyFormatting(from, to, formattingRanges);
    const firstFormattingRange = formattingRanges[0];
    const lastFormattingRange = formattingRanges.at(-1);
    const isAppliedAtStart = firstFormattingRange && from > firstFormattingRange.from;
    const isAppliedAtEnd = lastFormattingRange && to < lastFormattingRange.to;
    for (let delimiter of delimiters) {
      tr.delete(tr.mapping.map(delimiter.from), tr.mapping.map(delimiter.to));
    }

    if (shouldApplyFormatting) {
      if (!isAppliedAtStart) {
        tr.insertText(delimiter, tr.mapping.map(from));
      }
      if (!isAppliedAtEnd) {
        const toPos = tr.mapping.map(to);
        tr.insertText(closingDelimiter, toPos);
        // Move cursor in front of the closing delimiter if the selection is empty
        if (state.selection.empty) {
          tr.setSelection(TextSelection.create(tr.doc, toPos));
        }
      }
    } else {
      if (isAppliedAtStart) {
        // move by 1 to place after the space rather than before
        // ex: generate "**bold** text" instead of "**bold **text"
        tr.insertText(delimiter, tr.mapping.map(from - 1));
      }
      if (isAppliedAtEnd) {
        tr.insertText(closingDelimiter, tr.mapping.map(to + 1));
      }
    }

    dispatch(tr);

    return true;
  }
}

/** A selection should become formatted if any part of the selection is not included by a formatting decoration */
function checkShouldApplyFormatting(from: number, to: number, decorations: Decoration[]): boolean {
  const formattingStart = decorations[0]?.from;
  const formattingEnd = decorations.at(-1)?.to;
  if (!formattingStart || !formattingEnd) return true;
  if (from < formattingStart || to > formattingEnd) return true;

  // Otherwise, looks for breaks in formatting in the middle of the text
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

