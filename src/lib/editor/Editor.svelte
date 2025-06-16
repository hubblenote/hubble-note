<script lang="ts">
	import { Schema } from 'prosemirror-model';
	import { EditorState, TextSelection } from 'prosemirror-state';
	import { EditorView } from 'prosemirror-view';
	import { markdownBoldPlugin } from './plugins/bold';
	import 'prosemirror-view/style/prosemirror.css';

	let editor = $state<HTMLDivElement>();

	// Plugin to handle live markdown bold formatting

	$effect(() => {
		if (!editor) return;

		const schema = new Schema({
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
		});

	const view = new EditorView(editor, {
		state: EditorState.create({
			doc: schema.node('doc', null, [
				schema.node('paragraph', null, [schema.text('This should be **bold** text')]),
			]),
			schema,
			plugins: [markdownBoldPlugin],
		}),
	});
	
	// Autofocus the editor and position cursor at end
	setTimeout(() => {
		const doc = view.state.doc;
		const endPos = doc.content.size;
		const tr = view.state.tr.setSelection(
			TextSelection.create(doc, endPos)
		);
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
