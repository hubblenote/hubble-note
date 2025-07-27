<script lang="ts">
	import { computePosition, shift } from '@floating-ui/dom';
	import type { EditorState } from 'prosemirror-state';
	import { createLinkMark, getLinkAttrs } from './schema';
	import { getSelectedLinkRange } from './plugins/link';
	import type { EditorView } from 'prosemirror-view';
	import { keymatch } from '$lib/keymatch.ts';
	import type { CursorPosition } from './controller.svelte.ts';
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
		if (keymatch(event, 'Tab')) {
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

		if (isInputFocused && (keymatch(event, 'Enter') || keymatch(event, 'Escape'))) {
			event.preventDefault();
			editorView.focus();
		} else if (editorFocused && keymatch(event, 'Escape')) {
			event.preventDefault();
			status = 'hidden';
		}
	}

	function handleGlobalVisitLink(event: KeyboardEvent) {
		if (keymatch(event, 'Tab') && document.activeElement === inputEl) {
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

		const rect = cursorPosition.relativeToWindow;

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
		<div class="link-popover-inner">
		<div class="input-container">
			{#if status === 'idle'}
				<span class="tab-label input-tab-label">Tab</span>
			{/if}
			<input type="text" value={link.href} oninput={handleInput} bind:this={inputEl} />
		</div>
		<button onclick={handleVisitLink}>
			<span class="sr-only">Visit link</span>
			<Icon icon="mingcute:arrow-right-fill" />
		</button>
		</div>
	</div>
{/if}

<style>
	.link-popover-inner {
		width: 100%;
		background: #fff;
		box-shadow:
			0 -6px 3px 0 rgba(79, 95, 81, 0) inset,
			0 -4px 3px 0 rgba(79, 95, 81, 0.01) inset,
			0 -2px 2px 0 rgba(79, 95, 81, 0.05) inset,
			0 -1px 2px 0 rgba(79, 95, 81, 0.09) inset,
			0 0 1px 0 rgba(79, 95, 81, 0.1) inset;
		border: none;
		outline: none;
		border-radius: 2px;
		display: flex;
		align-items: center;
		gap: 0.2rem;
	}

	.link-popover {
		position: absolute;
		border-radius: 4px;
		width: 300px;
		display: flex;
		font-size: var(--font-size-sm);
		background-color: #fff;
		transition:
			scale 0.15s var(--cursor-transition-timing-function),
			left var(--cursor-transition-duration) var(--cursor-transition-timing-function),
			top var(--cursor-transition-duration) var(--cursor-transition-timing-function);

		border-radius: 2px;
		background: rgba(39, 170, 58, 0.98);
		box-shadow:
			0 8px 2px 0 rgba(91, 123, 91, 0.01),
			0 5px 2px 0 rgba(91, 123, 91, 0.04),
			0 3px 2px 0 rgba(91, 123, 91, 0.14),
			0 1px 1px 0 rgba(91, 123, 91, 0.24),
			0 0 1px 0 rgba(91, 123, 91, 0.28);
		padding-block-end: 2px;

		translate: 0 -4px;
		z-index: 1;
	}

	.link-popover:focus-within {
		scale: 1.05;
	}

	.input-container {
		position: relative;
		flex: 1;
	}

	button {
		height: 100%;
		border: none;
		border-radius: 0 2px 2px 0;
		background: #28c840;
		color: white;
		font-size: var(--font-size-base);
		box-shadow:
			0 -6px 2px 0 rgba(39, 170, 58, 0.02) inset,
			0 -4px 2px 0 rgba(39, 170, 58, 0.15) inset,
			0 -2px 1px 0 rgba(39, 170, 58, 0.5) inset,
			0 -1px 1px 0 rgba(39, 170, 58, 0.85) inset,
			0 0 1px 0 rgba(39, 170, 58, 0.98) inset;
		padding-inline: 0.6rem;
		margin-block: -2px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	input {
		width: 100%;
		height: 100%;
		border: none;
		outline: none;
		padding: 0.4rem;
		background-color: transparent;
	}

	.tab-label {
		font-size: var(--font-size-xs);
		font-family: var(--font-family-mono);
		position: absolute;
		top: 10%;
		bottom: 10%;
		right: 1%;
		color: #707170;
		background-color: #eff3f0;
		padding: 2px 4px;
		border-radius: 2px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
