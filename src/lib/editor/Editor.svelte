<script lang="ts">
	import './styles.css';
	import { TextSelection } from 'prosemirror-state';
	import 'prosemirror-view/style/prosemirror.css';
	import LinkPopover from './LinkPopover.svelte';
	import Cursor from './Cursor.svelte';
	import type { EditorController } from './controller.svelte.ts';

	interface Props {
		controller: EditorController;
		markdown?: string;
	}

	let { controller, markdown }: Props = $props();

	let editorEl = $state<HTMLDivElement>();
	let isEditorFocused = $state(false);

	$effect(() => {
		if (!editorEl) return;

		const view = controller.initView(editorEl, markdown);

		// Autofocus and position cursor at end once view is ready
		queueMicrotask(() => {
			const doc = view.state.doc;
			const endPos = doc.content.size - 1;
			const tr = view.state.tr.setSelection(TextSelection.create(doc, endPos));
			view.dispatch(tr);
			view.focus();
		});
	});
</script>

<div
	bind:this={editorEl}
	onfocusin={() => (isEditorFocused = true)}
	onfocusout={() => (isEditorFocused = false)}
></div>
{#if controller.state?.selection.empty && controller.view && controller.cursorPosition}
	<LinkPopover
		editorState={controller.state}
		editorView={controller.view}
		cursorPosition={controller.cursorPosition}
	/>
	<Cursor cursorPosition={controller.cursorPosition} {isEditorFocused} />
{/if}

<style>
	:global(.ProseMirror) {
		outline: none;
	}
	:global(.boundary-decorator) {
		color: #cbcbcb;
	}
</style>
