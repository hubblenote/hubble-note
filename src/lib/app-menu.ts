import { Menu, MenuItem, Submenu } from '@tauri-apps/api/menu';
import { openFile } from './shortcuts/open-file';

export async function setAppMenu() {
    const aboutSubmenu = await Submenu.new({
        text: 'About',
        items: []
    });

    const fileSubmenu = await Submenu.new({
        text: 'File',
        items: [
            await MenuItem.new({
                id: 'open',
                text: 'Open',
                accelerator: 'CmdOrCtrl+O',
                action: () => {
                    openFile();
                },
            }),
        ],
    });

    const editSubmenu = await Submenu.new({
        text: 'Edit',
        items: [
            await MenuItem.new({
                id: 'undo',
                text: 'Undo',
                action: () => {
                    console.log('Undo clicked');
                },
            }),
            await MenuItem.new({
                id: 'redo',
                text: 'Redo',
                action: () => {
                    console.log('Redo clicked');
                },
            }),
        ],
    });

    const menu = await Menu.new({
        items: [
            aboutSubmenu,
            fileSubmenu,
            editSubmenu,
        ],
    });
    await menu.setAsAppMenu();
}