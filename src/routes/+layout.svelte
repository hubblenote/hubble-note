<script lang="ts">
	import { onMount } from 'svelte';
	import { register, isRegistered, unregister } from '@tauri-apps/plugin-global-shortcut';
	import { openFile } from '$lib/shortcuts/open-file';

	let { children } = $props();

	onMount(() => {
		(async () => {
			if (await isRegistered('CmdOrCtrl+O')) {
				// Note: can raise a warning on page reload
				// that it can't find an associated page ID.
				// This is safe to ignore.
				await unregister('CmdOrCtrl+O');
			}
			await register('CmdOrCtrl+O', async (event) => {
				if (event.state === 'Pressed') {
					await openFile();
				}
			});
		})();
	});
</script>

{@render children()}
