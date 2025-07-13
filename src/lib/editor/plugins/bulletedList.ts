import { EditorState, Plugin, TextSelection, Transaction } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import type { Node } from "prosemirror-model";
import { schema } from "../schema";
import { keymap } from "prosemirror-keymap";
import { keymatch } from "$lib/keymatch";

export const bulletedListPlugin = new Plugin({
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
        return updateBulletedLists(newState.tr);
    },
    props: {
        handleKeyDown(view, event) {
            const resolvedPos = view.state.doc.resolve(view.state.selection.head);
            const isInListItem = resolvedPos.node(resolvedPos.depth)?.type.name === 'listItem';
            // if (keymatch(event, 'enter') && isInListItem) {
            //     let tr = view.state.tr.insert(view.state.selection.head, schema.node('paragraph', null, [
            //         schema.text('- ')
            //     ]));
            //     // Move selection to position after the "- " text
            //     const newPos = tr.mapping.map(view.state.selection.head) + 3;
            //     tr.setSelection(TextSelection.create(tr.doc, newPos));
            //     view.dispatch(tr);
            //     return true;
            // }
        },
        decorations(state) {
            return this.getState(state);
        },
    }
});

function getDecorations(doc: Node) {
    const decorations: Decoration[] = [];
    doc.descendants((node, pos) => {
        const textPos = pos + 1;
        if (node.type.name === 'listItem') {
            decorations.push(
                Decoration.inline(textPos, textPos + 1, {
                    class: 'boundary-decorator',
                }, { type: 'marker' }),
            );
            return false;
        }
        return true;
    });
    return DecorationSet.create(doc, decorations);
}

export const bulletedListKeymapPlugin = keymap({
    'mod-shift-8': toggleBulletedListCommand,
});

function toggleBulletedListCommand(state: EditorState, dispatch?: (tr: Transaction) => void) {
    if (!dispatch) return false;
    const { tr, selection } = state;
    tr.doc.descendants((node, pos) => {
        // Check if node is immediate parent of inline content
        if (!node.inlineContent) return true;

        const isFromWithinNode = selection.from >= pos && selection.from < pos + node.nodeSize;
        const isToWithinNode = selection.to > pos && selection.to <= pos + node.nodeSize;
        if (!isFromWithinNode && !isToWithinNode) return true;

        const text = node.textContent ?? '';
        const textPos = pos + 1;
        const bulletedListPrefix = text.match(/^(-|\*)\s/)?.[0];
        if (!bulletedListPrefix) {
            tr.insertText('- ', tr.mapping.map(textPos));
        } else {
            tr.delete(tr.mapping.map(textPos), tr.mapping.map(textPos + bulletedListPrefix.length));
        }

        return false;
    });
    dispatch?.(tr);
    return true;

}


function updateBulletedLists(tr: Transaction) {
    tr.doc.descendants((node, pos) => {
        // Check if node is immediate parent of inline content
        if (!node.inlineContent) return true;

        const text = node.textContent ?? '';
        const bulletedListPrefix = text.match(/^(-|\*)\s/)?.[0];
        const isListItem = node.type.name === 'listItem';


        if (isListItem && !bulletedListPrefix) {
            tr.insertText('- ', tr.mapping.map(pos) + 1);
            return false;
        }

        if (!isListItem && bulletedListPrefix) {
            tr.setNodeMarkup(tr.mapping.map(pos), schema.nodes.listItem);

            // Wrap the listItem in a bulletedList
            const listItemPos = tr.mapping.map(pos);
            const listItemNode = tr.doc.nodeAt(listItemPos);
            if (listItemNode) {
                tr.replaceWith(listItemPos, listItemPos + listItemNode.nodeSize,
                    schema.node('bulletedList', null, [listItemNode]));
            }
            return false;
        }

        return true;
    });
    return tr;
}
