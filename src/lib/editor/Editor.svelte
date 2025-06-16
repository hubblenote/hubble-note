<script lang="ts">
	import { Schema } from 'prosemirror-model';
	import { EditorState } from 'prosemirror-state';
	import { EditorView } from 'prosemirror-view';
	import 'prosemirror-view/style/prosemirror.css';

	let editor = $state<HTMLDivElement>();

	$effect(() => {
		if (!editor) return;

		new EditorView(editor, {
			state: EditorState.create({
				schema: new Schema({
					nodes: {
						doc: {
							content: 'block+',
						},
						paragraph: {
							content: 'inline*',
							group: 'block',
							parseDOM: [{ tag: 'p' }],
							toDOM() {
								return ['p', 0];
							},
						},
						text: {
							group: 'inline',
						},
					},
				}),
			}),
		});
	});
</script>

<div bind:this={editor}></div>

<style>
	:global(.ProseMirror) {
		outline: none;
	}
</style>
