<script lang="ts">
	import Editor from '$lib/editor/Editor.svelte';
	import type { PageData } from './$types';
	import { debounce } from 'es-toolkit';
	import { writeTextFile } from '@tauri-apps/plugin-fs';
	import type { Node } from 'prosemirror-model';
	import { serializeProseMirrorToMarkdown } from '$lib/editor/markdown-serializer';
	import { createAboutSubmenu, createEditSubmenu, createFileSubmenu } from '$lib/app-menu';
	import { EditorController } from '$lib/editor/controller.svelte';
	import { Menu, MenuItem } from '@tauri-apps/api/menu';
	import { redo, undo } from 'prosemirror-history';
	import type { EditorView } from 'prosemirror-view';

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

	async function handleInitEditorView(view: EditorView) {
		const editSubmenu = await createEditSubmenu();
		editSubmenu.append([
			await MenuItem.new({
				text: 'Undo',
				accelerator: 'CmdOrCtrl+Z',
				action: () => {
					undo(view.state, view.dispatch);
				},
			}),
			await MenuItem.new({
				text: 'Redo',
				accelerator: 'CmdOrCtrl+Y',
				action: () => {
					redo(view.state, view.dispatch);
				},
			}),
		]);

		const appMenu = await Menu.new({
			items: [await createAboutSubmenu(), await createFileSubmenu(), editSubmenu],
		});
		appMenu?.setAsAppMenu();
	}
</script>

<main class="container">
	<h1>Editing: {data.filePath}</h1>
	<details>
		<summary>File Contents (Debug)</summary>
		<pre>{data.contents}</pre>
	</details>
	<Editor
		controller={editorController}
		markdown={data.contents}
		onInitView={handleInitEditorView}
	/>
</main>
