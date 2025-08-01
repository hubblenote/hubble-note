import { keymap } from "prosemirror-keymap";
import { Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { createToggleFormattingCommand } from "../commands/toggleFormatting";
import type { Node } from "prosemirror-model";

export const inlineCodePlugin = new Plugin({
    state: {
        init() {
            return DecorationSet.empty;
        },
        apply(tr, _oldState) {
            return getDecorations(tr.doc);
        }
    },
    props: {
        transformPastedHTML(html) {
            return html
                .replace(/<code[^>]*>([^<]+)<\/code>/gi, '`$1`');
        },
        decorations(state) {
            return this.getState(state);
        }
    }
});

function getDecorations(doc: Node) {
    const decorations: Decoration[] = [];

    doc.descendants((node: Node, pos: number) => {
        if (node.type.name === 'text' && node.text) {
            const text = node.text;
            // Handle individual ` characters.
            // Satoshi tries to combine the ` with the next character as an accent.
            // We need to apply a wrapper class to this character to change the font family.
            const singleBacktickRegex = /`/g;
            const singleBacktickMatches = text.matchAll(singleBacktickRegex);
            if (singleBacktickMatches) {
                for (const match of singleBacktickMatches) {
                    decorations.push(Decoration.inline(pos + match.index, pos + match.index + 1, { class: 'inline-code-decorator' }, { type: 'none' }));
                }
            }

            // Handle inline code blocks
            const regex = /`([^`]+)`/g;
            let match;

            while ((match = regex.exec(text)) !== null) {
                const start = pos + match.index;
                const end = start + match[0].length;

                decorations.push(
                    Decoration.inline(start, end, {}, { type: 'formatting' }),
                );

                const innerStart = start + 1;
                const innerEnd = end - 1;

                decorations.push(
                    Decoration.inline(innerStart, innerEnd, {
                        nodeName: 'code',
                    }, { type: 'formatting-content' })
                );

                decorations.push(
                    Decoration.inline(start, innerStart, {
                        class: 'formatting-delimiter',
                    }, { type: 'formatting-delimiter' })
                );
                decorations.push(
                    Decoration.inline(innerEnd, end, {
                        class: 'formatting-delimiter',
                    }, { type: 'formatting-delimiter' })
                );
            }
        }
    });

    return DecorationSet.create(doc, decorations);
}

export const inlineCodeKeymapPlugin = keymap({
    'mod-e': createToggleFormattingCommand(inlineCodePlugin, '`'),
})
