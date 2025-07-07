import { Plugin, Transaction } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import type { Node } from "prosemirror-model";
import { schema } from "../schema";

export const headingPlugin = new Plugin({
    state: {
        init() {
            return DecorationSet.empty;
        },
        apply(tr, _oldState) {
            return getDecorations(tr.doc);
        }
    },
    appendTransaction(transactions, _oldState, newState) {
        if (!transactions.some(tr => tr.docChanged)) return;
        return updateHeadings(newState.tr);
    },
    props: {
        decorations(state) {
            return this.getState(state);
        },
    }
});

function getDecorations(doc: Node) {
    const decorations: Decoration[] = [];
    doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
            if (typeof node.attrs.level !== 'number') {
                console.warn('Heading level is not a number. Skipping decoration.', node.attrs.level);
            } else if (node.attrs.level < 1 || node.attrs.level > 6) {
                console.warn('Heading level is out of range. Skipping decoration.', node.attrs.level);
            } else {
                decorations.push(
                    // Add one to enter text contents
                    Decoration.inline(pos + 1, pos + node.attrs.level + 1, {
                        class: 'boundary-decorator',
                    }, { type: 'marker' }),
                );
            }
            return false;
        }
        return true;
    });
    return DecorationSet.create(doc, decorations);
}

function updateHeadings(tr: Transaction) {
    tr.doc.descendants((node, pos) => {
        if (!node.isText) return true;

        const text = node.text ?? '';
        const { parent, depth } = tr.doc.resolve(pos);
        const headingPrefix = text.match(/^#+ /)?.[0];
        const headingLevel = (headingPrefix?.length ?? 0) - 1;

        if (headingLevel < 1 || headingLevel > 6) {
            if (parent.type.name === 'heading') {
                // Remove heading when the headingLevel string no longer matches
                tr.setNodeMarkup(tr.mapping.map(pos - depth), schema.nodes.paragraph);
            }
            return true;
        }

        tr.setNodeMarkup(tr.mapping.map(pos - depth), schema.nodes.heading, {
            level: headingLevel,
        });

        return false;
    });
    return tr;
}
