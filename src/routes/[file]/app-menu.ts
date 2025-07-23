import { createAboutSubmenu, createEditSubmenu, createFileSubmenu } from "$lib/app-menu";
import { Menu, MenuItem, PredefinedMenuItem } from "@tauri-apps/api/menu";

export async function createAppMenu(actions: {
    saveAction: () => void;
}) {
    const aboutSubmenu = await createAboutSubmenu();
    const fileSubmenu = await createFileSubmenu();
    fileSubmenu.append([
        await MenuItem.new({
            id: 'save',
            text: 'Save',
            accelerator: 'CmdOrCtrl+S',
            action: actions.saveAction,
        }),
    ]);
    const editSubmenu = await createEditSubmenu();
    editSubmenu.append([
        await PredefinedMenuItem.new({
            text: 'Undo',
            item: 'Undo',
        }),
        await PredefinedMenuItem.new({
            text: 'Redo',
            item: 'Redo',
        }),
        await PredefinedMenuItem.new({
            text: 'separator-text',
            item: 'Separator',
        }),
        await PredefinedMenuItem.new({
            text: 'Cut',
            item: 'Cut',
        }),
        await PredefinedMenuItem.new({
            text: 'Copy',
            item: 'Copy',
        }),
        await PredefinedMenuItem.new({
            text: 'Paste',
            item: 'Paste',
        }),
        await PredefinedMenuItem.new({
            text: 'Select All',
            item: 'SelectAll',
        }),
    ]);

    const appMenu = await Menu.new({
        items: [aboutSubmenu, fileSubmenu, editSubmenu],
    });

    return appMenu;
}