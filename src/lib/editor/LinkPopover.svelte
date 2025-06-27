<script lang="ts">
	import { computePosition } from '@floating-ui/dom';
	import { linkPopoverState } from './LinkPopoverState.svelte';

	let popoverEl = $state<HTMLDivElement | null>(null);
	let linkEl = $derived(linkPopoverState.getElement());

	$effect(() => {
		if (!linkEl || !popoverEl) return;
		computePosition(linkEl, popoverEl, {
			placement: 'top',
		}).then(({ x, y }) => {
			if (!popoverEl) return;
			popoverEl.style.left = `${x}px`;
			popoverEl.style.top = `${y}px`;
		});
	});
</script>

<div hidden={!linkEl} class="link-popover" bind:this={popoverEl}>
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
