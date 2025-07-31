<script lang="ts">
	let { scrollContainer, title = '' }: { scrollContainer: HTMLElement | null; title: string } =
		$props();

	let scrolled = $state(false);

	$effect(() => {
		if (scrollContainer) {
			const editorScrollListener = () => {
				scrolled = scrollContainer.scrollTop > 0;
			};
			scrollContainer.addEventListener('scroll', editorScrollListener);
			return () => {
				scrollContainer.removeEventListener('scroll', editorScrollListener);
			};
		}
	});
</script>

<p data-tauri-drag-region class:scrolled>{title}</p>

<style>
	p {
		height: var(--title-bar-height);
		display: flex;
		align-items: center;
		justify-content: center;

		-webkit-user-select: none;
		user-select: none;
		cursor: default;

		margin: 0;
		padding-inline: 78px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;

		background-color: white;
		font-size: var(--font-size-sm);
	}

	p.scrolled {
		/* dashed border */
		--border-width: 2px;
		border-bottom: 1px solid transparent;
		border-image: repeating-linear-gradient(
				to right,
				transparent 0 var(--border-width),
				#eaeaea var(--border-width) calc(2 * var(--border-width))
			)
			1;
	}
</style>
