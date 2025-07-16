<script lang="ts">
	import Editor from '$lib/editor/Editor.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<main class="container">
	<h1>Editing: {data.filePath}</h1>
	<details>
		<summary>File Contents (Debug)</summary>
		<pre>{data.contents}</pre>
	</details>
	<Editor />
</main>
