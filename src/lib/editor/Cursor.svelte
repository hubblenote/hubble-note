<script lang="ts">
	import type { CursorPosition } from './Cursor.svelte.ts';

	let { cursorPosition }: { cursorPosition: CursorPosition } = $props();
	let cursorEl = $state<HTMLSpanElement | null>(null);
</script>

<span
	class="cursor"
	bind:this={cursorEl}
	style="left: {cursorPosition.getBoundingClientRect()
		?.left}px; top: {cursorPosition.getBoundingClientRect()?.top}px;"
></span>

<style>
	.cursor {
		position: absolute;
		width: 2px;
		height: 1em;
		background-color: #28c840;
		transition:
			left 0.15s ease-in-out,
			top 0.15s ease-in-out;
	}
</style>
