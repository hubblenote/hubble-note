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
            const listItemNode = resolvedPos.node(resolvedPos.depth);
            if (keymatch(event, 'backspace') && listItemNode?.type.name === 'listItem') {
                const pluginState = this.getState(view.state);
                const [decorationToTheRight] = pluginState?.find(view.state.selection.head - 1) ?? [];
                if (!decorationToTheRight) return false;

                // Find the bulletedList parent and the position of the current listItem
                let bulletedListPos = -1;
                let listItemIndex = -1;
                let bulletedListNode = null;

                for (let depth = resolvedPos.depth - 1; depth >= 0; depth--) {
                    const node = resolvedPos.node(depth);
                    if (node.type.name === 'bulletedList') {
                        bulletedListPos = resolvedPos.start(depth) - 1;
                        bulletedListNode = node;
                        // Find which child is our listItem
                        let childPos = resolvedPos.start(depth);
                        for (let i = 0; i < node.childCount; i++) {
                            const child = node.child(i);
                            if (childPos <= resolvedPos.pos && resolvedPos.pos <= childPos + child.nodeSize) {
                                listItemIndex = i;
                                break;
                            }
                            childPos += child.nodeSize;
                        }
                        break;
                    }
                }

                if (bulletedListPos === -1 || listItemIndex === -1 || !bulletedListNode) {
                    return false;
                }

                let tr = view.state.tr;

                // Remove the bullet decoration first
                tr.delete(tr.mapping.map(decorationToTheRight.from), tr.mapping.map(decorationToTheRight.to));

                // Find the updated bulletedList and listItem after bullet removal
                const updatedBulletedListPos = tr.mapping.map(bulletedListPos);
                const updatedBulletedListNode = tr.doc.nodeAt(updatedBulletedListPos);
                if (!updatedBulletedListNode) return false;

                const updatedListItemNode = updatedBulletedListNode.child(listItemIndex);

                // Convert the listItem content to a paragraph
                const paragraphNode = schema.node('paragraph', null, updatedListItemNode.content);

                // Split the bulletedList
                const beforeItems = [];
                const afterItems = [];

                for (let i = 0; i < updatedBulletedListNode.childCount; i++) {
                    if (i < listItemIndex) {
                        beforeItems.push(updatedBulletedListNode.child(i));
                    } else if (i > listItemIndex) {
                        afterItems.push(updatedBulletedListNode.child(i));
                    }
                }

                // Build replacement nodes
                const replacements = [];

                // Add bulletedList with items before (if any)
                if (beforeItems.length > 0) {
                    replacements.push(schema.node('bulletedList', null, beforeItems));
                }

                // Add the converted paragraph
                replacements.push(paragraphNode);

                // Add bulletedList with items after (if any)
                if (afterItems.length > 0) {
                    replacements.push(schema.node('bulletedList', null, afterItems));
                }

                // Replace the entire bulletedList with the new structure
                const fromPos = updatedBulletedListPos;
                const toPos = updatedBulletedListPos + updatedBulletedListNode.nodeSize;
                tr.replaceWith(fromPos, toPos, replacements);

                view.dispatch(tr);
                return true;
            }
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
