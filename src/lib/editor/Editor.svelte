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
			line-height: 1.7;
		}

		.ProseMirror ::selection {
			background-color: rgba(40, 200, 64, 0.3);
		}

		.ProseMirror ul {
			padding-inline-start: 2rem;
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
		}

		.ProseMirror h1 {
			margin-block-start: 3rem;
			font-size: var(--font-size-2xl);
			font-weight: 900;
		}

		.ProseMirror h2 {
			margin-block-start: 2rem;
			font-size: var(--font-size-xl);
			font-weight: 900;
		}

		.ProseMirror h3 {
			margin-block-start: 1.5rem;
			font-size: var(--font-size-lg);
			font-weight: 900;
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
			font-size: 0.87em;
		}
	}
</style>
