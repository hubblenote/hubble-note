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
	import TitleBar from './TitleBar.svelte';

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

<svelte:window
	onresize={() => {
		editorController.updateCursorPosition();
	}}
/>

<main class="container">
	<TitleBar title={data.filePath} />
	<div class="content">
		<article>
			<Editor controller={editorController} markdown={data.contents} />
		</article>
	</div>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}

	.content {
		flex: 1;
		overflow-y: scroll;
		overscroll-behavior: contain;
	}

	article {
		padding-inline: 16px;
		max-width: 65ch;
		margin-inline: auto;
		padding-block-end: 5rem;
	}
</style>
