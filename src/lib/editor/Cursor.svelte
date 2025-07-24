<script lang="ts">
	import type { CursorPosition } from './controller.svelte.ts';

	let {
		cursorPosition,
		isEditorFocused,
	}: { cursorPosition: CursorPosition; isEditorFocused: boolean } = $props();
	let cursorEl = $state<HTMLSpanElement | null>(null);
	let isIdle = $state(true);

	$effect(() => {
		if (cursorEl) {
			const rect = cursorPosition.relativeToWindow;
			const scale = 1.5;
			const height = rect.height * scale;
			const topOffset = (height - rect.height) / 2;
			cursorEl.style.left = `${rect.left}px`;
			cursorEl.style.top = `${rect.top - topOffset}px`;
			cursorEl.style.height = `${height}px`;
			cursorEl.style.width = `calc(${height * 0.02}px + 0.12rem)`;
			isIdle = false;
			setTimeout(() => {
				isIdle = true;
			}, 500);
		}
	});
</script>

<span
	class="cursor"
	class:collapsed-into-popover={!isEditorFocused}
	class:idle={isIdle && isEditorFocused}
	bind:this={cursorEl}
></span>

<style>
	.cursor {
		position: absolute;
		border-radius: 4px;
		background-color: var(--accent-color);
		transition:
			transform 0.15s var(--cursor-transition-timing-function),
			left var(--cursor-transition-duration) var(--cursor-transition-timing-function),
			top var(--cursor-transition-duration) var(--cursor-transition-timing-function),
			width var(--cursor-transition-duration) var(--cursor-transition-timing-function),
			height var(--cursor-transition-duration) var(--cursor-transition-timing-function);
		pointer-events: none;
		transform-origin: top;
	}

	.cursor.collapsed-into-popover {
		transform: scaleY(0.1) translateY(-35%);
		z-index: -1;
	}

	.cursor.idle {
		animation: blink 1s infinite;
	}

	@keyframes blink {
		0%,
		40% {
			opacity: 1;
		}
		80% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}
</style>
