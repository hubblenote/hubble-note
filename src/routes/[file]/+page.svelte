<script lang="ts">
	import Editor from '$lib/editor/Editor.svelte';
	import type { PageData } from './$types';
	import { debounce } from 'es-toolkit';
	import { writeTextFile } from '@tauri-apps/plugin-fs';
	import type { Node } from 'prosemirror-model';
	import { serializeProseMirrorToMarkdown } from '$lib/editor/markdown-serializer';

	let { data }: { data: PageData } = $props();

	const save = debounce(
		(doc: Node) => writeTextFile(data.filePath, serializeProseMirrorToMarkdown(doc)),
		100
	);
</script>

<main class="container">
	<h1>Editing: {data.filePath}</h1>
	<details>
		<summary>File Contents (Debug)</summary>
		<pre>{data.contents}</pre>
	</details>
	<Editor markdown={data.contents} onUpdate={save} />
</main>
