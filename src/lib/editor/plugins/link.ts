import { keymap } from "prosemirror-keymap";
import { Plugin } from "prosemirror-state";
import type { Transaction } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { createToggleFormattingCommand } from "../commands/toggleFormatting";
import type { Node } from "prosemirror-model";
import { createLinkMark, schema } from "../schema";
import type { Range } from "../types";
import { maskInlineCode } from "./utils";

export const linkPlugin = new Plugin({
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

export function getSelectedLinkRange(tr: Transaction): Range | null {
    const bracketMatches = getBracketMatches(tr.doc);
    const { selection } = tr;

    const match = bracketMatches.find(match => {
        return selection.from >= match.from && selection.to <= match.to;
    });

    if (match) {
        return match;
    }

    return null;
}

function getBracketMatches(doc: Node): Range[] {
    const matches: Range[] = [];

    doc.descendants((node, pos) => {
        if (node.inlineContent) {
            const originalText = node.textContent;
            const maskedText = maskInlineCode(originalText);
            const regex = /\[([^\[]+)\]/g;
            let match;

            while ((match = regex.exec(maskedText)) !== null) {
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
                class: 'formatting-delimiter',
            }, { type: 'formatting-delimiter' }),
        );

        decorations.push(
            Decoration.inline(innerEnd, match.to, {
                class: 'formatting-delimiter',
            }, { type: 'formatting-delimiter' }),
        );

        decorations.push(
            Decoration.inline(innerStart, innerEnd, {
                class: 'link-text',
            }, { type: 'formatting-content' })
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
        const from = tr.mapping.map(match.from);
        const to = tr.mapping.map(match.to);
        tr.addMark(from, to, createLinkMark());
    });

    return tr;
}

export const linkKeymapPlugin = keymap({
    'mod-k': createToggleFormattingCommand(linkPlugin, '[', ']'),
})
