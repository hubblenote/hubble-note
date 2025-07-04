<script lang="ts">
	import './styles.css';
	import { EditorState, TextSelection } from 'prosemirror-state';
	import { EditorView } from 'prosemirror-view';
	import 'prosemirror-view/style/prosemirror.css';
	import { keymap } from 'prosemirror-keymap';
	import { baseKeymap } from 'prosemirror-commands';
	import { history, undo, redo } from 'prosemirror-history';
	import { schema } from './schema';
	import { boldPlugin, boldKeymapPlugin } from './plugins/bold';
	import { italicPlugin, italicKeymapPlugin } from './plugins/italic';
	import { underlinePlugin, underlineKeymapPlugin } from './plugins/underline';
	import { highlightPlugin, highlightKeymapPlugin } from './plugins/highlight';
	import { linkPlugin, linkKeymapPlugin } from './plugins/link';
	import LinkPopover from './LinkPopover.svelte';
	import Cursor from './Cursor.svelte';
	import { CursorPosition } from './Cursor.svelte.ts';

	let editorEl = $state<HTMLDivElement>();
	let editorState: EditorState | null = $state(null);
	let editorView: EditorView | null = $state(null);
	let cursorPosition = $derived.by(() => {
		if (!editorView || !editorState) return null;
		return new CursorPosition(editorView, editorState);
	});

	$effect(() => {
		if (!editorEl) return;

		const view = new EditorView(editorEl, {
			dispatchTransaction: (tr) => {
				const state = view.state.apply(tr);
				view.updateState(state);
				editorState = state;
			},
			state: EditorState.create({
				doc: schema.node('doc', null, [
					schema.node('paragraph', null, [schema.text('This should be **bold** text')]),
				]),
				schema,
				plugins: [
					boldPlugin,
					italicPlugin,
					underlinePlugin,
					highlightPlugin,
					linkPlugin,
					boldKeymapPlugin,
					italicKeymapPlugin,
					underlineKeymapPlugin,
					highlightKeymapPlugin,
					linkKeymapPlugin,
					history(),
					keymap({ 'Mod-z': undo, 'Mod-y': redo }),
					keymap(baseKeymap),
				],
			}),
		});

		editorView = view;

		// Autofocus the editor and position cursor at end
		setTimeout(() => {
			if (!editorState) return;
			const doc = editorState.doc;
			const endPos = doc.content.size;
			const tr = editorState.tr.setSelection(TextSelection.create(doc, endPos));
			view.dispatch(tr);
			view.focus();
		}, 0);
	});
</script>

<div bind:this={editorEl}></div>
{#if editorState && editorView && cursorPosition && editorState.selection.empty}
	<LinkPopover {editorState} {editorView} {cursorPosition} />
	<Cursor {cursorPosition} />
{/if}

<style>
	:global(.ProseMirror) {
		outline: none;
	}
	:global(.boundary-decorator) {
		color: #cbcbcb;
	}
</style>
