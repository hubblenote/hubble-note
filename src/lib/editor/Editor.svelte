<script lang="ts">
	import './styles.css';
	import { TextSelection } from 'prosemirror-state';
	import 'prosemirror-view/style/prosemirror.css';
	import LinkPopover from './LinkPopover.svelte';
	import Cursor from './Cursor.svelte';
	import { CursorPosition } from './Cursor.svelte.ts';
	import type { EditorController } from './controller.svelte.ts';
	import type { EditorView } from 'prosemirror-view';

	interface Props {
		controller: EditorController;
		markdown?: string;
		onInitView?: (view: EditorView) => void;
	}

	let { controller, markdown, onInitView }: Props = $props();

	let editorEl = $state<HTMLDivElement>();
	let isEditorFocused = $state(false);

	let cursorPosition = $derived.by(() => {
		if (!controller.view || !controller.state) return null;
		return new CursorPosition(controller.view, controller.state);
	});

	$effect(() => {
		if (!editorEl) return;

		const view = controller.initView(editorEl, markdown);
		onInitView?.(view);

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
{#if controller.state && controller.view && cursorPosition && controller.state.selection.empty}
	<LinkPopover editorState={controller.state} editorView={controller.view} {cursorPosition} />
	<Cursor {cursorPosition} {isEditorFocused} />
{/if}

<style>
	:global(.ProseMirror) {
		outline: none;
	}
	:global(.boundary-decorator) {
		color: #cbcbcb;
	}
</style>
