import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { goto } from '$app/navigation';

export async function createFile() {
    try {
        const filePath = await save({
            title: 'Create New Markdown File',
            defaultPath: 'untitled.md',
            filters: [
                {
                    name: 'Markdown',
                    extensions: ['md', 'markdown'],
                },
            ],
        });

        if (!filePath) return;

        await writeTextFile(filePath, '');

        const encodedPath = encodeURIComponent(filePath);
        goto(`/${encodedPath}`);
    } catch (error) {
        console.error('Error creating file:', error);
    }
}
