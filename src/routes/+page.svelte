<script lang="ts">
	import { createBaseAppMenu } from '$lib/app-menu';
	import { openFile } from '$lib/shortcuts/open-file';

	const appMenu = await createBaseAppMenu();
	appMenu?.setAsAppMenu();
</script>

<main>
	<h2>Open file</h2>
	<button onclick={openFile}>Select Markdown File</button>
</main>
