import { open } from '@tauri-apps/plugin-dialog';
import { goto } from '$app/navigation';

export async function openFile() {
    console.log('openFile');
    try {
        const filePath = await open({
            multiple: false,
            filters: [
                {
                    name: 'Markdown',
                    extensions: ['md', 'markdown'],
                },
            ],
        });

        if (!filePath) return;

        const encodedPath = encodeURIComponent(filePath);
        goto(`/${encodedPath}`);
    } catch (error) {
        console.error('Error opening file:', error);
    }
}