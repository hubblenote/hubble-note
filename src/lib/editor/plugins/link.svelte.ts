import { keymap } from "prosemirror-keymap";
import { EditorState, Plugin, Transaction } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { createToggleMarkCommand } from "../commands/toggle-mark";
import { linkPopoverState } from "../LinkPopoverState.svelte";
import type { Node } from "prosemirror-model";
import { schema } from "../schema";

export const linkPlugin = new Plugin({
    state: {
        init() {
            return DecorationSet.empty;
        },
        apply(tr, _oldState) {
            const decorations = getDecorations(tr.doc);
            if (tr.selectionSet) {
                linkPopoverState.elementId = getSelectedLinkId(tr);
            }
            return decorations;
        }
    },
    appendTransaction(transactions, _oldState, newState) {
        if (!transactions.some(tr => tr.docChanged)) return;
        return updateMarks(newState.tr);
    },
    props: {
        transformPastedHTML(html) {
            return html
                .replace(/<a[^>]*>([^<]+)<\/a>/gi, '[$1]');
        },
        decorations(state) {
            return this.getState(state);
        },
    }
});

function getSelectedLinkId(tr: Transaction): string | null {
    const bracketMatches = getBracketMatches(tr.doc);
    console.log('bracketMatches', bracketMatches);
    const { selection } = tr;

    const match = bracketMatches.find(match => {
        return selection.from >= match.from && selection.to <= match.to;
    });

    if (match) {
        return getLinkId(match.from, match.to);
    }

    return null;
}

function getLinkId(from: number, to: number): string {
    return `link-${from}-${to}`;
}

type Range = { from: number, to: number };

function getBracketMatches(doc: Node): Range[] {
    const matches: Range[] = [];

    doc.descendants((node, pos) => {
        if (node.inlineContent) {
            const text = node.textContent;
            const regex = /\[([^\[]+)\]/g;
            let match;

            while ((match = regex.exec(text)) !== null) {
                const start = pos + 1 + match.index;
                const end = start + match[0].length;

                matches.push({ from: start, to: end });
            }
            return false;
        }
    });

    return matches;
}

function getDecorations(doc: Node) {
    const matches = getBracketMatches(doc);
    const decorations: Decoration[] = [];

    for (const match of matches) {
        const innerStart = match.from + 1;
        const innerEnd = match.to - 1;

        decorations.push(
            Decoration.inline(match.from, innerStart, {
                class: 'boundary-decorator',
            }, { type: 'marker' }),
        );

        decorations.push(
            Decoration.inline(innerEnd, match.to, {
                class: 'boundary-decorator',
            }, { type: 'marker' }),
        );

        decorations.push(
            Decoration.inline(innerStart, innerEnd, {
                class: 'link-text',
                id: getLinkId(match.from, match.to),
            }, { type: 'text' })
        );
    }

    return DecorationSet.create(doc, decorations);
}

function updateMarks(tr: Transaction) {
    tr.doc.descendants((node, pos) => {
        if (node.isText && node.marks.some(mark => mark.type === schema.marks.link)) {
            const hasOpeningBracket = tr.doc.textBetween(pos, pos + 1) === '[';
            const hasClosingBracket = tr.doc.textBetween(pos + node.nodeSize - 1, pos + node.nodeSize) === ']';
            if (!hasOpeningBracket || !hasClosingBracket) {
                tr.removeMark(tr.mapping.map(pos), tr.mapping.map(pos + node.nodeSize), schema.marks.link);
            }
        }
    });

    const matches = getBracketMatches(tr.doc);
    matches.forEach(match => {
        if (tr.doc.rangeHasMark(match.from, match.to, schema.marks.link)) return;
        tr.addMark(tr.mapping.map(match.from), tr.mapping.map(match.to), schema.marks.link.create({ 'data-href': '#' }));
    });

    return tr;
}

export const linkKeymapPlugin = keymap({
    'mod-k': createToggleMarkCommand(linkPlugin, '[', ']'),
})
