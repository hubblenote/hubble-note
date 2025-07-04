<script lang="ts">
	import { computePosition } from '@floating-ui/dom';
	import type { EditorState } from 'prosemirror-state';
	import { createLinkMark, getLinkAttrs } from './schema';
	import { getSelectedLinkRange } from './plugins/link';
	import type { EditorView } from 'prosemirror-view';
	import { matchesShortcut } from '$lib/keyboard-shortcut';
	import type { CursorPosition } from './Cursor.svelte.ts';

	let {
		editorState,
		editorView,
		cursorPosition,
	}: { editorState: EditorState; editorView: EditorView; cursorPosition: CursorPosition } =
		$props();

	let popoverEl = $state<HTMLDivElement | null>(null);
	let inputEl = $state<HTMLInputElement | null>(null);
	let link = $derived(getLink());
	let from = $derived(link?.from);
	let to = $derived(link?.to);
	let isManuallyHidden = $state(false);

	$effect(() => {
		// Reset the user's escape key press whenever the "from" or "to" positions change.
		// Don't reset on selection change, or it'll reappear as you move your cursor
		// around the link text. Notion does this, and it's annoying!
		from;
		to;
		isManuallyHidden = false;
	});

	function getLink() {
		const linkRange = getSelectedLinkRange(editorState.tr);
		if (!linkRange) return null;
		const { from, to } = linkRange;
		const mark = editorState.doc
			// Need to adjust by 1 for resolved positions. Still not sure why
			.resolve(from + 1)
			.marks()
			.find((mark) => mark.type.name === 'link');
		if (!mark) return null;
		const attrs = getLinkAttrs(mark);
		if (!attrs) return null;
		const linkEl = editorView?.domAtPos(from + 1)?.node;
		if (!linkEl) return null;
		return {
			from,
			to,
			mark,
			href: attrs.href,
			element: linkEl as HTMLElement,
		};
	}

	function handleInput(event: Event) {
		if (!link) return;

		const input = event.target as HTMLInputElement;
		const href = input.value;

		const tr = editorState.tr;
		tr.removeMark(link.from, link.to, link.mark);
		tr.addMark(link.from, link.to, createLinkMark(href));
		editorView.dispatch(tr);
	}

	function handleFocusInput(event: KeyboardEvent) {
		if (matchesShortcut(event, 'CmdOrCtrl+L')) {
			isManuallyHidden = false;
			queueMicrotask(() => {
				inputEl?.focus();
				inputEl?.select();
			});
		}
	}

	function handleHidePopover(event: KeyboardEvent) {
		const isInputFocused = document.activeElement === inputEl;
		if (
			(isInputFocused && matchesShortcut(event, 'Tab')) ||
			(isInputFocused && matchesShortcut(event, 'Enter')) ||
			matchesShortcut(event, 'Escape')
		) {
			event.preventDefault();
			editorView.focus();
			isManuallyHidden = matchesShortcut(event, 'Escape');
		}
	}

	$effect(() => {
		if (!popoverEl) return;

		const rect = cursorPosition.getBoundingClientRect();
		if (rect) {
			const virtualElement = {
				getBoundingClientRect() {
					return rect;
				},
			};

			computePosition(virtualElement, popoverEl, {
				placement: 'top',
			}).then(({ x, y }) => {
				if (!popoverEl) return;
				popoverEl.style.left = `${x}px`;
				popoverEl.style.top = `${y}px`;
			});
		}
	});
</script>

<svelte:window
	onkeydown={(event) => {
		handleFocusInput(event);
		handleHidePopover(event);
	}}
/>

{#if link && !isManuallyHidden}
	<div class="link-popover" bind:this={popoverEl}>
		<input type="text" value={link.href} oninput={handleInput} bind:this={inputEl} />
	</div>
{/if}

<style>
	.link-popover {
		position: absolute;
		border: 1px solid #ccc;
		border-radius: 4px;
		min-width: 100px;
		transition-property: left, top;
		transition-duration: var(--cursor-transition-duration);
		transition-timing-function: var(--cursor-transition-timing-function);
	}
</style>
