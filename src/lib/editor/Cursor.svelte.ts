import type { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

export class CursorPosition {
    constructor(private editorView: EditorView, private editorState: EditorState) { }

    getBoundingClientRect(): DOMRect | null {
        const pos = this.editorState.selection.head;

        try {
            const coords = this.editorView.coordsAtPos(pos);
            const left = coords.left + window.scrollX;
            const top = coords.top + window.scrollY;
            const width = 0;
            const height = coords.bottom - coords.top;

            return new DOMRect(left, top, width, height);
        } catch (error) {
            console.warn('Could not get cursor coordinates:', error);
            return null;
        }
    }
}