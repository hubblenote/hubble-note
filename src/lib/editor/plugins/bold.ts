import { Plugin, EditorState, Transaction } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { keymap } from "prosemirror-keymap";

// Command to toggle bold marks around selected text
export const toggleBoldCommand = (state: EditorState, dispatch?: (tr: Transaction) => void) => {
  const { from, to } = state.selection;

  if (from === to) {
    // No selection, do nothing for now
    return false;
  }

  const selectedText = state.doc.textBetween(from, to);
  
  // Check if selection includes ** markers
  const selectionHasMarkers = selectedText.includes('**');
  
  // Check if selection is entirely within a single bold block (not touching the markers)
  // Use textBetween to get text around the selection with correct position mapping
  const beforeText = state.doc.textBetween(Math.max(1, from - 2), from); // Start at 1 to avoid the doc boundary
  const afterText = state.doc.textBetween(to, Math.min(state.doc.content.size - 1, to + 2));
  const surroundedByMarkers = beforeText.endsWith('**') && afterText.startsWith('**') && !selectionHasMarkers;
  
  if (surroundedByMarkers) {
    // Case 1: Selection is inside a bold block - remove the surrounding ** markers
    if (dispatch) {
      const tr = state.tr
        .delete(to, to + 2)     // Remove trailing **
        .delete(from - 2, from); // Remove leading **
      dispatch(tr);
    }
    return true;
  } else if (selectionHasMarkers) {
    // Case 2: Selection contains ** markers - could be removing or consolidating
    
    // Check if we need to extend the selection to include partial ** markers or nearby bold blocks
    let extendedFrom = from;
    let extendedTo = to;
    
    // Check if selection starts in the middle of a ** marker or right before one
    const beforeSelectionText = state.doc.textBetween(Math.max(1, from - 2), from);
    if (beforeSelectionText.endsWith('*') && selectedText.startsWith('*')) {
      // Selection starts at the second * of a ** marker
      extendedFrom = from - 1;
    }
    
    // Check if selection ends in the middle of a ** marker
    const afterSelectionText = state.doc.textBetween(to, Math.min(state.doc.content.size - 1, to + 2));
    if (selectedText.endsWith('*') && afterSelectionText.startsWith('*')) {
      // Selection ends at the first * of a ** marker
      extendedTo = to + 1;
    }
    
    // Also check if selection ends right before a ** marker and we should extend to include it
    if (afterSelectionText.startsWith('**')) {
      extendedTo = to + 2;
    }
    
    // Get the full text including any extended parts
    const fullSelectedText = state.doc.textBetween(extendedFrom, extendedTo);
    
    // Handle leading and trailing spaces specially
    let leadingSpaces = '';
    let trailingSpaces = '';
    let contentText = fullSelectedText;
    
    // Extract leading spaces
    const leadingSpaceMatch = contentText.match(/^(\s+)/);
    if (leadingSpaceMatch) {
      leadingSpaces = leadingSpaceMatch[1];
      contentText = contentText.slice(leadingSpaces.length);
    }
    
    // Extract trailing spaces
    const trailingSpaceMatch = contentText.match(/(\s+)$/);
    if (trailingSpaceMatch) {
      trailingSpaces = trailingSpaceMatch[1];
      contentText = contentText.slice(0, -trailingSpaces.length);
    }
    
    // Clean up ** markers from the content
    const cleanedText = contentText.replace(/\*\*/g, '');
    
    // If the cleaned text is empty, don't add bold markers
    if (cleanedText.trim() === '') {
      if (dispatch) {
        const tr = state.tr.replaceWith(extendedFrom, extendedTo, state.schema.text(`${leadingSpaces}${cleanedText}${trailingSpaces}`));
        dispatch(tr);
      }
      return true;
    }
    
    // If the content starts and ends with **, just remove them
    if (contentText.startsWith('**') && contentText.endsWith('**') && 
        contentText.split('**').length === 3) {
      // Simple case: "**text**" selected
      if (dispatch) {
        const tr = state.tr.replaceWith(extendedFrom, extendedTo, state.schema.text(`${leadingSpaces}${cleanedText}${trailingSpaces}`));
        dispatch(tr);
      }
      return true;
    } else {
      // Complex case: multiple ** markers or partial selection - consolidate into one bold block
      if (dispatch) {
        const tr = state.tr.replaceWith(extendedFrom, extendedTo, state.schema.text(`${leadingSpaces}**${cleanedText}**${trailingSpaces}`));
        dispatch(tr);
      }
      return true;
    }
  } else {
    // Case 3: No ** markers in selection - add bold marks
    if (dispatch) {
      const tr = state.tr.replaceWith(from, to, state.schema.text(`**${selectedText}**`));
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

