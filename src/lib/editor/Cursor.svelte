<script lang="ts">
	import type { CursorPosition } from './Cursor.svelte.ts';

	let {
		cursorPosition,
		isEditorFocused,
	}: { cursorPosition: CursorPosition; isEditorFocused: boolean } = $props();
	let cursorEl = $state<HTMLSpanElement | null>(null);
	let isIdle = $state(true);

	// Get cursor position, avoiding multiple calls
	$effect(() => {
		if (cursorEl) {
			const rect = cursorPosition.getBoundingClientRect(true);
			if (rect) {
				cursorEl.style.left = `${rect.left}px`;
				cursorEl.style.top = `${rect.top}px`;
				cursorEl.style.height = `${rect.height}px`;
				isIdle = false;
				setTimeout(() => {
					isIdle = true;
				}, 500);
			}
		}
	});
</script>

<span class="cursor" class:idle={isIdle && isEditorFocused} bind:this={cursorEl}></span>

<style>
	.cursor {
		position: absolute;
		width: 0.15em;
		border-radius: 2px;
		height: 1em; /* fallback height */
		background-color: #28c840;
		transition-property: left, top;
		transition-duration: var(--cursor-transition-duration);
		transition-timing-function: var(--cursor-transition-timing-function);
		pointer-events: none;
	}

	.cursor.idle {
		animation: blink 1s infinite;
	}

	@keyframes blink {
		0%,
		50% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
</style>
