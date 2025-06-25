<script lang="ts">
	import { computePosition } from '@floating-ui/dom';
	import { linkPopoverState } from './LinkPopoverState.svelte';

	let popoverEl = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (!linkPopoverState.elementId || !popoverEl) return;
		const linkDecoration = document.getElementById(linkPopoverState.elementId);
		if (linkDecoration) {
			computePosition(linkDecoration, popoverEl, {
				placement: 'top',
			}).then(({ x, y }) => {
				popoverEl.style.left = `${x}px`;
				popoverEl.style.top = `${y}px`;
			});
		}
	});
</script>

<div hidden={!linkPopoverState.elementId} class="link-popover" bind:this={popoverEl}>
	<input type="text" />
</div>

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
