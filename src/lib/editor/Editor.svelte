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

<div class="editor-container">
	<div
		class="editor-input-container"
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
</div>

<style>
	.editor-container {
		/*
		 * Set a relative position so absolute elements, like the cursor,
		 * can be positioned relative to the editor.
		 */
		position: relative;
		min-height: 100%;
		display: flex;
		flex-direction: column;
	}

	.editor-input-container {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	:global {
		.ProseMirror {
			font-size: var(--font-size-base);
			/* Hide the default blinking cursor */
			caret-color: transparent;
			outline: none;
			line-height: 1.8;
			flex: 1;
			padding-block-end: 5rem;
			padding-block-start: 1rem;
		}

		.ProseMirror ::selection {
			background-color: rgba(40, 200, 64, 0.3);
		}

		.ProseMirror p {
			margin-block: 0;
		}

		.ProseMirror ul {
			padding-inline-start: 2.5rem;
			margin-block: 0;
		}

		.ProseMirror li {
			list-style-type: none;
		}

		.ProseMirror li .bullet-decorator {
			/* Width of a `- ` character */
			margin-inline-start: -0.68em;
		}

		.ProseMirror :is(code, .inline-code-decorator) {
			font-family: var(--font-family-mono);
			font-size: 0.9em;
		}

		.ProseMirror code {
			background-color: #f0f0f0;
			padding: 0.1em;
			border-radius: 0.2em;
		}

		.ProseMirror h1 {
			margin-block-start: 1rem;
			font-size: var(--font-size-2xl);
			font-weight: 900;
		}

		.ProseMirror h2 {
			margin-block-start: 1rem;
			font-size: var(--font-size-xl);
			font-weight: 900;
		}

		.ProseMirror h3 {
			margin-block-start: 0.75rem;
			font-size: var(--font-size-lg);
			font-weight: 700;
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
			font-weight: 400;
		}

		h1 .heading-decorator {
			margin-inline-start: 0.32em;
		}

		h2 .heading-decorator {
			letter-spacing: -0.05em;
		}

		h3 .heading-decorator {
			letter-spacing: -0.05em;
			font-size: 0.85em;
		}
	}
</style>
