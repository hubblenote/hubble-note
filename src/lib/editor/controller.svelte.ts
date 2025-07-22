import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { parseMarkdownToProseMirror } from "./markdown-parser";
import { schema } from "./schema";
import { getEditorPlugins } from "./plugins";

export class EditorController {
    view: EditorView | null = $state(null);
    state: EditorState | null = $state(null);

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