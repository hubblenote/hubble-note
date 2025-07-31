import { EditorState, Plugin } from "prosemirror-state";
import type { Transaction } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import type { Node } from "prosemirror-model";
import { schema } from "../schema";
import { keymap } from "prosemirror-keymap";

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
        const textPos = pos + 1;
        if (node.type.name === 'heading') {
            if (typeof node.attrs.level !== 'number') {
                console.warn('Heading level is not a number. Skipping decoration.', node.attrs.level);
            } else if (node.attrs.level < 1 || node.attrs.level > 6) {
                console.warn('Heading level is out of range. Skipping decoration.', node.attrs.level);
            } else {
                decorations.push(
                    Decoration.inline(textPos, textPos + node.attrs.level, {
                        class: 'formatting-delimiter heading-decorator',
                    }, { type: 'formatting-delimiter' }),
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
        // Check if node is immediate parent of inline content
        if (!node.inlineContent) return true;

        const text = node.textContent ?? '';
        const headingPrefix = text.match(/^#+ /)?.[0];
        const headingLevel = (headingPrefix?.length ?? 0) - 1;

        if (headingLevel < 1 || headingLevel > 6) {
            if (node.type.name === 'heading') {
                // Remove heading when the headingLevel string no longer matches
                tr.setNodeMarkup(tr.mapping.map(pos), schema.nodes.paragraph);
            }
            return true;
        }

        tr.setNodeMarkup(tr.mapping.map(pos), schema.nodes.heading, {
            level: headingLevel,
        });

        return false;
    });
    return tr;
}

function createToggleHeadingCommand(level: number) {
    return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
        if (!dispatch) return false;
        const { tr, selection } = state;
        const newHeadingPrefix = '#'.repeat(level) + ' ';
        tr.doc.descendants((node, pos) => {
            // Check if node is immediate parent of inline content
            if (!node.inlineContent) return true;

            const isFromWithinNode = selection.from >= pos && selection.from < pos + node.nodeSize;
            const isToWithinNode = selection.to > pos && selection.to <= pos + node.nodeSize;
            if (!isFromWithinNode && !isToWithinNode) return true;

            const isHeading = node.type.name === 'heading';
            const textPos = pos + 1;
            const text = node.textContent ?? '';
            if (isHeading) {
                const headingPrefix = text.match(/^#+ /)?.[0];
                if (!headingPrefix) {
                    console.warn(`Heading element found without heading prefix. Position: ${pos}`);
                    return false;
                }
                tr.delete(tr.mapping.map(textPos), tr.mapping.map(textPos + headingPrefix.length));
                // If that heading level is already applied, we should remove it (toggle off)
                // Otherwise, we should set the new heading level (toggle on)
                if (newHeadingPrefix !== headingPrefix) {
                    tr.insertText(newHeadingPrefix, tr.mapping.map(textPos));
                }
                return false;
            }

            tr.insertText(newHeadingPrefix, tr.mapping.map(textPos));
            return false;
        });
        dispatch?.(tr);
        return true;
    }
}
export const headingKeymapPlugin = keymap({
    'mod-alt-1': createToggleHeadingCommand(1),
    'mod-alt-2': createToggleHeadingCommand(2),
    'mod-alt-3': createToggleHeadingCommand(3),
});