import { boldPlugin, boldKeymapPlugin } from './bold';
import { italicPlugin, italicKeymapPlugin } from './italic';
import { underlinePlugin, underlineKeymapPlugin } from './underline';
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
        highlightPlugin,
        linkPlugin,
        headingPlugin,
        bulletedListPlugin,
        bulletedListKeymapPlugin,
        boldKeymapPlugin,
        italicKeymapPlugin,
        underlineKeymapPlugin,
        highlightKeymapPlugin,
        linkKeymapPlugin,
        headingKeymapPlugin,
        history(),
        keymap({ 'Mod-z': undo, 'Mod-y': redo }),
        keymap(baseKeymap),
    ];
}