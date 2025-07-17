<script lang="ts">
	import Editor from '$lib/editor/Editor.svelte';
	import type { PageData } from './$types';
	import { debounce } from 'es-toolkit';
	import { writeTextFile } from '@tauri-apps/plugin-fs';

	let { data }: { data: PageData } = $props();

	const save = debounce((markdown: string) => writeTextFile(data.filePath, markdown), 1000);
</script>

<main class="container">
	<h1>Editing: {data.filePath}</h1>
	<details>
		<summary>File Contents (Debug)</summary>
		<pre>{data.contents}</pre>
	</details>
	<Editor markdown={data.contents} onUpdate={save} />
</main>
