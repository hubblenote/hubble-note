import { keymap } from "prosemirror-keymap";
import { BOLD_MARK, boldPlugin } from "./bold";
import { ITALIC_MARK, italicPlugin } from "./italic";
import { createToggleMarkCommand } from "./commands/toggle-mark";

// Keymap plugin for mark toggle shortcuts
export const markKeymapPlugin = keymap({
  'Mod-b': createToggleMarkCommand(boldPlugin, BOLD_MARK),
  'Mod-i': createToggleMarkCommand(italicPlugin, ITALIC_MARK)
});
