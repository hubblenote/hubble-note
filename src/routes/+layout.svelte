<script lang="ts">
	import { onMount } from 'svelte';
	import { setAppMenu } from '$lib/app-menu';

	let { children } = $props();

	onMount(() => {
		setAppMenu();
	});
</script>

{@render children()}
