import { readTextFile } from '@tauri-apps/plugin-fs';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { homeDir } from '@tauri-apps/api/path';

export const load: PageLoad = async ({ params }) => {
	try {
		const filePath = decodeURIComponent(params.file);
		const contents = await readTextFile(filePath);

		const homeDirPath = await homeDir();
		const displayPath = formatDisplayPath(filePath, homeDirPath);

		return {
			filePath,
			contents,
			displayPath,
		};
	} catch (e) {
		console.error(e);
		error(404, 'File not found');
	}
};

// Format file path to use ~ for home directory
function formatDisplayPath(filePath: string, homeDirPath: string): string {
	if (filePath.startsWith(homeDirPath)) {
		return '~' + filePath.slice(homeDirPath.length);
	}
	return filePath;
}