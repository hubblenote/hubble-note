<script lang="ts">
	import { onMount } from 'svelte';
	import { createBaseAppMenu } from '$lib/app-menu';
	import { openFile } from '$lib/shortcuts/open-file';
	import '$lib/reset.css';
	import '$lib/styles.css';

	onMount(async () => {
		const appMenu = await createBaseAppMenu();
		appMenu?.setAsAppMenu();
	});
</script>

<main>
	<h2>Open file</h2>
	<button onclick={openFile}>Select Markdown File</button>
</main>
