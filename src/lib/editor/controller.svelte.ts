import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { parseMarkdownToProseMirror } from "./markdown-parser";
import { schema } from "./schema";
import { getEditorPlugins } from "./plugins";

export type CursorPosition = {
    relativeToWindow: DOMRect;
    relativeToEditor: DOMRect;
}

export class EditorController {
    view: EditorView | null = $state(null);
    // State is tracked separately from the view to push reactive updates on `dispatchTransaction`
    state: EditorState | null = $state(null);

    cursorPosition: CursorPosition | null = $derived.by(() => {
        if (!this.state || !this.view) return null;
        const pos = this.state.selection.head;
        try {
            const coords = this.view.coordsAtPos(pos);
            const left = coords.left;
            const top = coords.top;
            const width = 0;
            const height = coords.bottom - coords.top;

            return {
                relativeToWindow: new DOMRect(left + window.scrollX, top + window.scrollY, width, height),
                relativeToEditor: new DOMRect(left, top, width, height),
            };
        } catch (error) {
            console.warn('Could not get cursor position:', error);
            return null;
        }
    });

    initView = (el: HTMLElement, markdown?: string): EditorView => {
        const view = new EditorView(el, {
            dispatchTransaction: (tr) => {
                const state = view.state.apply(tr);
                view.updateState(state);
                this.state = state;
            },
            state: EditorState.create({
                doc: markdown
                    ? parseMarkdownToProseMirror(markdown)
                    : schema.node('doc', null, [schema.node('paragraph', null, [schema.text('')])]),
                schema,
                plugins: getEditorPlugins(),
            }),
        });

        this.view = view;
        return view;
    }
}