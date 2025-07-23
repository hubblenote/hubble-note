<script lang="ts">
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

		return () => {
			controller.destroyView();
		};
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
	:global {
		.ProseMirror {
			font-size: var(--font-size-base);
			/* Hide the default blinking cursor */
			caret-color: transparent;
			outline: none;
		}

		.ProseMirror ::selection {
			background-color: rgba(40, 200, 64, 0.3);
		}

		.ProseMirror li {
			list-style-type: none;
		}

		.link-text {
			color: #565656;
			text-decoration: underline;
		}

		.boundary-attr {
			visibility: hidden;
		}

		.boundary-decorator {
			color: #cbcbcb;
		}
	}
</style>
