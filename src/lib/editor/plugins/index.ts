import { boldPlugin, boldKeymapPlugin } from './bold';
import { italicPlugin, italicKeymapPlugin } from './italic';
import { underlinePlugin, underlineKeymapPlugin } from './underline';
import { inlineCodePlugin, inlineCodeKeymapPlugin } from './inline-code';
import { highlightPlugin, highlightKeymapPlugin } from './highlight';
import { linkPlugin, linkKeymapPlugin } from './link';
import { headingKeymapPlugin, headingPlugin } from './heading';
import { bulletedListKeymapPlugin, bulletedListPlugin } from './bulletedList';
import { undo, redo, history } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';

export function getEditorPlugins() {
    return [
        boldPlugin,
        italicPlugin,
        underlinePlugin,
        inlineCodePlugin,
        highlightPlugin,
        linkPlugin,
        headingPlugin,
        bulletedListPlugin,
        bulletedListKeymapPlugin,
        boldKeymapPlugin,
        italicKeymapPlugin,
        underlineKeymapPlugin,
        inlineCodeKeymapPlugin,
        highlightKeymapPlugin,
        linkKeymapPlugin,
        headingKeymapPlugin,
        history(),
        // Match system defaults
        keymap({ 'Mod-z': undo, 'Mod-Shift-z': redo }),
        keymap(baseKeymap),
    ];
}