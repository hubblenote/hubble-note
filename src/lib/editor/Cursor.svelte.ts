import type { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

export class CursorPosition {
    constructor(private editorView: EditorView, private editorState: EditorState) { }

    getBoundingClientRect(): DOMRect | null {
        // Get the current selection from the editor state
        const selection = this.editorState.selection;

        // Get the cursor position (head of the selection)
        const pos = selection.head;

        try {
            // Get the coordinates of the cursor position
            const coords = this.editorView.coordsAtPos(pos);

            // Create a DOMRect-like object with the cursor position
            // Note: The cursor is essentially a point, so width and height are 0
            const rect = new DOMRect(
                coords.left,
                coords.top,
                0, // width
                coords.bottom - coords.top // height (line height)
            );

            return rect;
        } catch (error) {
            // If we can't get coordinates (e.g., position is not visible), return null
            console.warn('Could not get cursor coordinates:', error);
            return null;
        }
    }
}