<script lang="ts">
	import { onMount } from 'svelte';
	import { createBaseAppMenu } from '$lib/app-menu';
	import { openFile } from '$lib/shortcuts/open-file';

	onMount(async () => {
		const appMenu = await createBaseAppMenu();
		appMenu?.setAsAppMenu();
	});
</script>

<main>
	<div class="container">
		<h2>Welcome to Hubble!</h2>
		<button onclick={openFile}>Select Markdown File</button>
	</div>
</main>

<style>
	main {
		display: grid;
		place-items: center;
		height: 100vh;
		width: 100vw;
	}

	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}
</style>
