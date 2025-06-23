<script lang="ts">
	import { EditorState, TextSelection } from 'prosemirror-state';
	import { EditorView } from 'prosemirror-view';
	import 'prosemirror-view/style/prosemirror.css';
	import { keymap } from 'prosemirror-keymap';
	import { baseKeymap } from 'prosemirror-commands';
	import { history, undo, redo } from 'prosemirror-history';
	import { schema } from './schema';
	import { boldPlugin } from './plugins/bold';
	import { italicPlugin } from './plugins/italic';
	import { markKeymapPlugin } from './plugins/keymaps';

	let editor = $state<HTMLDivElement>();

	// Plugin to handle live markdown bold formatting

	$effect(() => {
		if (!editor) return;

		const view = new EditorView(editor, {
			state: EditorState.create({
				doc: schema.node('doc', null, [
					schema.node('paragraph', null, [schema.text('This should be **bold** text')]),
				]),
				schema,
				plugins: [
					boldPlugin,
					italicPlugin,
					markKeymapPlugin,
					history(),
					keymap({ 'Mod-z': undo, 'Mod-y': redo }),
					keymap(baseKeymap),
				],
			}),
		});

		// Autofocus the editor and position cursor at end
		setTimeout(() => {
			const doc = view.state.doc;
			const endPos = doc.content.size;
			const tr = view.state.tr.setSelection(TextSelection.create(doc, endPos));
			view.dispatch(tr);
			view.focus();
		}, 0);
	});
</script>

<div bind:this={editor}></div>

<style>
	:global(.ProseMirror) {
		outline: none;
	}
	:global(.boundary-decorator) {
		color: #cbcbcb;
	}
</style>
