<script lang="ts">
	import { openFile } from '$lib/shortcuts/open-file';
</script>

<main>
	<h2>Open file</h2>
	<button on:click={openFile}>Select Markdown File</button>
</main>
