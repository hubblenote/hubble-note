import { Menu, MenuItem, PredefinedMenuItem, Submenu } from '@tauri-apps/api/menu';
import { openFile } from './shortcuts/open-file';

export async function createAboutSubmenu(): Promise<Submenu> {
    return Submenu.new({
        text: 'About',
        items: [
            await PredefinedMenuItem.new({
                text: 'Quit',
                item: 'Quit',
            }),
        ],
    });
}

export async function createFileSubmenu(): Promise<Submenu> {
    return Submenu.new({
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
}

export async function createEditSubmenu(): Promise<Submenu> {
    return Submenu.new({
        text: 'Edit',
        items: [],
    });
}

export async function createBaseAppMenu(): Promise<Menu | null> {
    return await Menu.new({
        items: [
            await createAboutSubmenu(),
            await createFileSubmenu(),
        ],
    });
}