<script lang="ts">
	let { children } = $props();
</script>

<svelte:boundary>
	{#snippet pending()}
		<div>Loading...</div>
	{/snippet}

	{@render children()}
</svelte:boundary>
