import { readTextFile } from '@tauri-apps/plugin-fs';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
	try {
		const filePath = decodeURIComponent(params.file);
		const contents = await readTextFile(filePath);

		return {
			filePath,
			contents
		};
	} catch (e) {
		console.error(e);
		error(404, 'File not found');
	}
};
