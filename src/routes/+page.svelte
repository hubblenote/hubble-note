<script lang="ts">
	import { goto } from '$app/navigation';
	import { open } from '@tauri-apps/plugin-dialog';

	async function handleOpenFile() {
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
</script>

<main>
	<h2>Open file</h2>
	<button on:click={handleOpenFile}>Select Markdown File</button>
</main>
