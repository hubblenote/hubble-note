<script lang="ts">
	import Editor from '$lib/editor/Editor.svelte';
	import type { PageData } from './$types';
	import { debounce } from 'es-toolkit';
	import { writeTextFile } from '@tauri-apps/plugin-fs';
	import type { Node } from 'prosemirror-model';
	import { serializeProseMirrorToMarkdown } from '$lib/editor/markdown-serializer';
	import { createAboutSubmenu, createEditSubmenu, createFileSubmenu } from '$lib/app-menu';
	import { EditorController } from '$lib/editor/controller.svelte';
	import { Menu, MenuItem, PredefinedMenuItem } from '@tauri-apps/api/menu';
	import { onMount } from 'svelte';

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

	async function createAppMenu() {
		const aboutSubmenu = await createAboutSubmenu();
		const fileSubmenu = await createFileSubmenu();
		fileSubmenu.append([
			await MenuItem.new({
				id: 'save',
				text: 'Save',
				accelerator: 'CmdOrCtrl+S',
				action: () => {
					if (editorController.state?.doc) {
						save(editorController.state.doc);
					}
				},
			}),
		]);
		const editSubmenu = await createEditSubmenu();
		editSubmenu.append([
			await PredefinedMenuItem.new({
				text: 'Undo',
				item: 'Undo',
			}),
			await PredefinedMenuItem.new({
				text: 'Redo',
				item: 'Redo',
			}),
			await PredefinedMenuItem.new({
				text: 'separator-text',
				item: 'Separator',
			}),
			await PredefinedMenuItem.new({
				text: 'Cut',
				item: 'Cut',
			}),
			await PredefinedMenuItem.new({
				text: 'Copy',
				item: 'Copy',
			}),
			await PredefinedMenuItem.new({
				text: 'Paste',
				item: 'Paste',
			}),
			await PredefinedMenuItem.new({
				text: 'Select All',
				item: 'SelectAll',
			}),
		]);

		const appMenu = await Menu.new({
			items: [aboutSubmenu, fileSubmenu, editSubmenu],
		});
		appMenu?.setAsAppMenu();
	}

	onMount(() => {
		createAppMenu();
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
