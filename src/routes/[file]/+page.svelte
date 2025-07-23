<script lang="ts">
	import Editor from '$lib/editor/Editor.svelte';
	import type { PageData } from './$types';
	import { debounce } from 'es-toolkit';
	import { writeTextFile } from '@tauri-apps/plugin-fs';
	import type { Node } from 'prosemirror-model';
	import { serializeProseMirrorToMarkdown } from '$lib/editor/markdown-serializer';
	import { EditorController } from '$lib/editor/controller.svelte';
	import { onMount } from 'svelte';
	import { createAppMenu } from './app-menu';

	let { data }: { data: PageData } = $props();

	const save = debounce(
		(doc: Node) => writeTextFile(data.filePath, serializeProseMirrorToMarkdown(doc)),
		100
	);

	const editorController = new EditorController();

	$effect(() => {
		if (editorController.state?.doc) {
			save(editorController.state.doc);
		}
	});

	onMount(async () => {
		const appMenu = await createAppMenu({
			saveAction: () => {
				if (editorController.state?.doc) {
					save(editorController.state.doc);
				}
			},
		});
		appMenu?.setAsAppMenu();
	});
</script>

<main class="container">
	<h1>Editing: {data.filePath}</h1>
	<details>
		<summary>File Contents (Debug)</summary>
		<pre>{data.contents}</pre>
	</details>
	<Editor controller={editorController} markdown={data.contents} />
</main>
