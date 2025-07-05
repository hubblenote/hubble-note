<script lang="ts">
	import { computePosition, shift } from '@floating-ui/dom';
	import type { EditorState } from 'prosemirror-state';
	import { createLinkMark, getLinkAttrs } from './schema';
	import { getSelectedLinkRange } from './plugins/link';
	import type { EditorView } from 'prosemirror-view';
	import { matchesShortcut } from '$lib/keyboard-shortcut';
	import type { CursorPosition } from './Cursor.svelte.ts';
	import Icon from '@iconify/svelte';
	import { openUrl } from '@tauri-apps/plugin-opener';

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
	let status = $state<'idle' | 'focused' | 'hidden'>('idle');

	$effect(() => {
		// Reset the user's escape key press whenever the "from" or "to" positions change.
		// Don't reset on selection change, or it'll reappear as you move your cursor
		// around the link text. Notion does this, and it's annoying!
		from;
		to;
		status = 'idle';
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

	function handleGlobalFocusInput(event: KeyboardEvent) {
		if (matchesShortcut(event, 'Tab')) {
			event.preventDefault();
			status = 'focused';
			queueMicrotask(() => {
				inputEl?.focus();
				inputEl?.select();
			});
		}
	}

	function handleGlobalHidePopover(event: KeyboardEvent) {
		const isInputFocused = document.activeElement === inputEl;
		const editorFocused = document.activeElement === editorView.dom;

		if (isInputFocused && (matchesShortcut(event, 'Enter') || matchesShortcut(event, 'Escape'))) {
			event.preventDefault();
			editorView.focus();
		} else if (editorFocused && matchesShortcut(event, 'Escape')) {
			event.preventDefault();
			status = 'hidden';
		}
	}

	function handleGlobalVisitLink(event: KeyboardEvent) {
		if (matchesShortcut(event, 'Tab') && document.activeElement === inputEl) {
			event.preventDefault();
			handleVisitLink();
		}
	}

	function handleVisitLink() {
		if (!link) return;
		openUrl(link.href);
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
				middleware: [shift()],
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
		handleGlobalFocusInput(event);
		handleGlobalHidePopover(event);
		handleGlobalVisitLink(event);
	}}
/>

{#if link && status !== 'hidden'}
	<div
		class="link-popover"
		bind:this={popoverEl}
		onfocusin={() => (status = 'focused')}
		onfocusout={() => (status = 'idle')}
	>
		<div class="input-container">
			{#if status === 'idle'}
				<span class="tab-label input-tab-label">Tab</span>
			{/if}
			<input type="text" value={link.href} oninput={handleInput} bind:this={inputEl} />
		</div>
		<button onclick={handleVisitLink}>
			<span class="sr-only">Visit link</span>
			{#if status === 'focused'}
				<span class="tab-label">Tab</span>
			{/if}
			<Icon icon="mingcute:arrow-right-fill" />
		</button>
	</div>
{/if}

<style>
	.link-popover {
		position: absolute;
		border: 1px solid #ccc;
		border-radius: 4px;
		width: 200px;
		display: flex;
		align-items: center;
		transition:
			translate 0.15s var(--cursor-transition-timing-function),
			left var(--cursor-transition-duration) var(--cursor-transition-timing-function),
			top var(--cursor-transition-duration) var(--cursor-transition-timing-function);
	}

	.input-container {
		position: relative;
		flex: 1;
	}

	button {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		line-height: 1;
	}

	input {
		width: 100%;
	}

	.tab-label {
		font-size: 11px;
		font-weight: 500;
	}

	.input-tab-label {
		position: absolute;
		top: 1px;
		bottom: 1px;
		right: 4px;
		color: #707170;
		background-color: #eff3f0;
		padding: 2px 4px;
		border-radius: 2px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.link-popover:focus-within {
		translate: 0 -4px;
	}
</style>
