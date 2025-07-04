<script lang="ts">
	import type { CursorPosition } from './Cursor.svelte.ts';

	let { cursorPosition }: { cursorPosition: CursorPosition } = $props();
	let cursorEl = $state<HTMLSpanElement | null>(null);

	// Get cursor position, avoiding multiple calls
	$effect(() => {
		if (cursorEl) {
			const rect = cursorPosition.getBoundingClientRect();
			if (rect) {
				cursorEl.style.left = `${rect.left}px`;
				cursorEl.style.top = `${rect.top}px`;
				cursorEl.style.height = `${rect.height}px`;
			}
		}
	});
</script>

<span
	class="cursor"
	bind:this={cursorEl}
></span>

<style>
	.cursor {
		position: absolute;
		width: 2px;
		height: 1em; /* fallback height */
		background-color: #28c840;
		transition:
			left 0.15s ease-in-out,
			top 0.15s ease-in-out;
		animation: blink 1s infinite;
		pointer-events: none;
		z-index: 1000;
	}

	@keyframes blink {
		0%, 50% { opacity: 1; }
		51%, 100% { opacity: 0; }
	}
</style>
