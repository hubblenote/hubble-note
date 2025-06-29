<script lang="ts">
	import { computePosition } from '@floating-ui/dom';
	import type { EditorState } from 'prosemirror-state';
	import { createLinkMark, getLinkAttrs } from './schema';
	import { getSelectedLinkRange } from './plugins/link';
	import type { EditorView } from 'prosemirror-view';

	let { editorState, editorView }: { editorState: EditorState; editorView: EditorView } = $props();

	let popoverEl = $state<HTMLDivElement | null>(null);
	let link = $derived(getLink());

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

	$effect(() => {
		if (!link?.element || !popoverEl) return;
		computePosition(link.element, popoverEl, {
			placement: 'top',
		}).then(({ x, y }) => {
			if (!popoverEl) return;
			popoverEl.style.left = `${x}px`;
			popoverEl.style.top = `${y}px`;
		});
	});
</script>

{#if link}
	<div class="link-popover" bind:this={popoverEl}>
		<input type="text" value={link.href} oninput={handleInput} />
	</div>
{/if}

<style>
	.link-popover {
		position: absolute;
		top: 0;
		left: 0;
		border: 1px solid #ccc;
		border-radius: 4px;
		min-width: 100px;
	}
</style>
