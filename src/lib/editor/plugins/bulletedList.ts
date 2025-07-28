import { EditorState, Plugin, PluginKey, TextSelection, Transaction } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import type { Node } from "prosemirror-model";
import { schema } from "../schema";
import { keymap } from "prosemirror-keymap";
import { keymatch } from "keymatch";

interface BulletedListPluginState {
    decorations: DecorationSet;
    // Flag to track when enter key was pressed during a transaction.
    // If it was, we should handle appending a "- " prefix
    // from appendTransaction.
    shouldHandleEnterKey: boolean;
}

const BULLETED_LIST_PREFIX = '- ';

export const bulletedListPlugin = new Plugin<BulletedListPluginState>({
    state: {
        init() {
            return {
                decorations: DecorationSet.empty,
                shouldHandleEnterKey: false
            };
        },
        apply(tr, oldState) {
            return {
                decorations: getDecorations(tr.doc),
                shouldHandleEnterKey: tr.getMeta('shouldHandleEnterKey') ?? oldState.shouldHandleEnterKey
            };
        }
    },
    appendTransaction(transactions, _oldState, newState) {
        if (!transactions.some(tr => tr.docChanged)) return;
        const pluginState = this.getState(newState);

        const tr = newState.tr;
        updateBulletedLists(tr, pluginState);
        joinAdjacentBulletedLists(tr);
        return tr;
    },
    props: {
        handleKeyDown(view, event) {
            const tr = view.state.tr;
            const resolvedPos = tr.doc.resolve(tr.selection.head);
            const listItemNode = resolvedPos.node(resolvedPos.depth);
            if (listItemNode.type.name !== 'listItem') return false;
            const isAtStartOfListItem = resolvedPos.parentOffset === BULLETED_LIST_PREFIX.length;

            if (keymatch(event, 'enter') || keymatch(event, 'CmdOrCtrl+Enter')) {
                if (isAtStartOfListItem) {
                    tr.delete(tr.mapping.map(resolvedPos.pos - BULLETED_LIST_PREFIX.length), tr.mapping.map(resolvedPos.pos));
                    view.dispatch(tr);
                    return true;
                }

                tr.setMeta('shouldHandleEnterKey', true);
                view.dispatch(tr);

                return false;
            }
            if (keymatch(event, 'CmdOrCtrl+Left')) {
                if (!isAtStartOfListItem) {
                    const listItemPos = resolvedPos.start() + BULLETED_LIST_PREFIX.length;
                    tr.setSelection(TextSelection.create(tr.doc, listItemPos));
                    view.dispatch(tr);
                    return true;
                }
                return false;
            }
            // When the user hits backspace at the start of a list item,
            // we want to delete the decoration.
            if (event.key === 'Backspace') {
                if (!isAtStartOfListItem) return false;
                // Ignore range selections
                if (!view.state.selection.empty) return false;

                tr.delete(tr.mapping.map(resolvedPos.pos - BULLETED_LIST_PREFIX.length), tr.mapping.map(resolvedPos.pos));
                view.dispatch(tr);
                return true;
            }
        },
        decorations(state) {
            return this.getState(state)?.decorations;
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
                    class: 'boundary-decorator bullet-decorator',
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

function joinAdjacentBulletedLists(tr: Transaction) {
    const bulletedListRanges: Map<number, number> = new Map();
    tr.doc.descendants((node, pos) => {
        if (node.type.name === 'bulletedList') {
            bulletedListRanges.set(pos, pos + node.nodeSize);
        }
        return true;
    });
    for (const [start, end] of combineAdjacentRanges(bulletedListRanges)) {
        const nodesToJoin: Node[] = [];

        tr.doc.nodesBetween(start, end, (node) => {
            if (node.type.name === 'bulletedList') {
                nodesToJoin.push(node);
                return false;
            }
        });
        if (nodesToJoin.length > 1) {
            const prevSelection = tr.selection.head;
            tr.replaceWith(start, end, schema.node('bulletedList', null, nodesToJoin.map(node => node.children).flat()));
            if (prevSelection >= start && prevSelection <= end) {
                // We are combining the start and end of the bulletedList preceding the selection.
                // So, adjust by 2 (accounts for start and end of joined bulletedList blocks)
                tr.setSelection(TextSelection.create(tr.doc, prevSelection - 2));
            }
        }
    }
}

function updateBulletedLists(tr: Transaction, pluginState?: BulletedListPluginState) {
    tr.doc.descendants((node, pos) => {
        // Check if node is immediate parent of inline content
        if (!node.inlineContent) return true;

        const text = node.textContent ?? '';
        const bulletedListPrefix = text.match(/^(-|\*)\s/)?.[0];
        const isListItem = node.type.name === 'listItem';

        if (pluginState?.shouldHandleEnterKey && isListItem && !bulletedListPrefix) {
            tr.insertText('- ', tr.mapping.map(pos) + 1);
            tr.setMeta('shouldHandleEnterKey', false);
            return false;
        }

        if (isListItem && !bulletedListPrefix) {
            applyListSplitAtSelection(tr);
            return false;
        }

        if (!isListItem && bulletedListPrefix) {
            tr.setNodeMarkup(tr.mapping.map(pos), schema.nodes.listItem);

            // Wrap the listItem in a bulletedList
            const listItemPos = tr.mapping.map(pos);
            const listItemNode = tr.doc.nodeAt(listItemPos);
            if (listItemNode) {
                const prevSelection = tr.selection.head;
                tr.replaceWith(listItemPos, listItemPos + listItemNode.nodeSize,
                    schema.node('bulletedList', null, [listItemNode]));
                // We're wrapping the listItem with an element, increasing the depth by 1.
                // Adjust the selection accordingly.
                tr.setSelection(TextSelection.create(tr.doc, prevSelection + 1));
            }
            return false;
        }

        return true;
    });
}

function combineAdjacentRanges(rangeMap: Map<number, number>): Array<[number, number]> {
    let rangesToJoin: Array<[number, number]> = [];
    let contiguousRange: [number, number] | null = null;
    for (const [start, end] of rangeMap) {
        if (!contiguousRange) {
            contiguousRange = [start, end];
            continue;
        }
        if (contiguousRange[1] === start) {
            contiguousRange[1] = end;
            continue;
        }
        rangesToJoin.push(contiguousRange);
        contiguousRange = null;
    }
    if (contiguousRange) {
        rangesToJoin.push(contiguousRange);
    }
    return rangesToJoin;
}

/**
 * Splits the list at the selection.
 * @param tr - The transaction to apply the split to.
 * @returns True if the split was applied, false otherwise.
 */
function applyListSplitAtSelection(tr: Transaction): boolean {
    const resolvedPos = tr.doc.resolve(tr.mapping.map(tr.selection.head));
    const listItemNode = resolvedPos.node(resolvedPos.depth);

    // Go up in depth by 1 to get the bulletedList properties
    const bulletedListNode = resolvedPos.node(-1);
    const bulletedListPos = resolvedPos.start(-1) - 1;
    // Index within parent. Used to find list items before and after
    const listItemIndex = resolvedPos.index(-1);

    if (bulletedListPos === -1 || listItemIndex === -1 || bulletedListNode.type.name !== 'bulletedList') {
        return false;
    }

    // Collect list items before and after the current list item
    const beforeItems = [];
    const afterItems = [];

    for (let i = 0; i < bulletedListNode.childCount; i++) {
        if (i < listItemIndex) {
            beforeItems.push(bulletedListNode.child(i));
        } else if (i > listItemIndex) {
            afterItems.push(bulletedListNode.child(i));
        }
    }

    // Build replacement nodes
    const beforeList = beforeItems.length > 0 ? schema.node('bulletedList', null, beforeItems) : null;
    const afterList = afterItems.length > 0 ? schema.node('bulletedList', null, afterItems) : null;

    const replacements = [beforeList, schema.node('paragraph', null, listItemNode.content), afterList].filter((list): list is Node => list !== null);

    // Replace the entire bulletedList with the new structure
    const fromPos = tr.mapping.map(bulletedListPos);
    const toPos = tr.mapping.map(bulletedListPos + bulletedListNode.nodeSize);
    tr.replaceWith(fromPos, toPos, replacements);

    // Set selection to the start of the new paragraph content
    const newParagraphPos = fromPos + (beforeList?.nodeSize ?? 0);
    tr.setSelection(TextSelection.create(tr.doc, newParagraphPos + 1));

    return true;
}