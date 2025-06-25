import { keymap } from "prosemirror-keymap";
import { Plugin, Transaction } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { createToggleMarkCommand } from "../commands/toggle-mark";
import { linkPopoverState } from "../LinkPopoverState.svelte";

export const linkPlugin = new Plugin({
    state: {
        init() {
            return DecorationSet.empty;
        },
        apply(tr, _oldState) {
            const decorations = applyDecorations(tr.doc);
            if (tr.selectionSet) {
                linkPopoverState.elementId = getSelectedLinkId(tr, decorations);
            }
            return decorations;
        }
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

function getSelectedLinkId(tr: Transaction, decorations: DecorationSet): string | null {
    const { selection } = tr;
    const { from, to } = selection;

    const markDecorations = decorations.find(from, to, (spec) => {
        return spec && spec.type === 'mark';
    });

    const match = markDecorations.find((decoration) => {
        return from >= decoration.from && to <= decoration.to;
    });

    if (match) {
        return getLinkId(match.from, match.to);
    }

    return null;
}

function getLinkId(from: number, to: number): string {
    return `link-${from}-${to}`;
}

function applyDecorations(doc: any) {
    const decorations: Decoration[] = [];

    doc.descendants((node: any, pos: number) => {
        if (node.type.name === 'text' && node.text) {
            const text = node.text;
            const regex = /\[([^\[]+)\]/g;
            let match;

            while ((match = regex.exec(text)) !== null) {
                const start = pos + match.index;
                const end = start + match[0].length;

                decorations.push(
                    Decoration.inline(start, end, {
                        class: 'link-mark',
                        'data-href': '',
                    }, { type: 'mark' }),
                );

                const innerStart = start + 1;
                const innerEnd = end - 1;

                decorations.push(
                    Decoration.inline(innerStart, innerEnd, {
                        class: 'link-text',
                        id: getLinkId(start, end),
                    }, { type: 'text' })
                );

                decorations.push(
                    Decoration.inline(start, innerStart, {
                        class: 'boundary-decorator',
                    }, { type: 'marker' })
                );

                decorations.push(
                    Decoration.inline(innerEnd, end, {
                        class: 'boundary-decorator',
                    }, { type: 'marker' })
                );
            }
        }
    });

    return DecorationSet.create(doc, decorations);
}

export const linkKeymapPlugin = keymap({
    'mod-k': createToggleMarkCommand(linkPlugin, '[', ']'),
})
