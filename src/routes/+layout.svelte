<script lang="ts">
	import '$lib/reset.css';
	import '$lib/styles.css';

	let { children } = $props();
</script>

<svelte:boundary>
	{#snippet pending()}
		<div>Loading...</div>
	{/snippet}

	{@render children()}
</svelte:boundary>
