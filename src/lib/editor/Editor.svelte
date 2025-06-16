<script lang="ts">
	import { Schema } from 'prosemirror-model';
	import { EditorState, Plugin } from 'prosemirror-state';
	import { EditorView, Decoration, DecorationSet } from 'prosemirror-view';
	import 'prosemirror-view/style/prosemirror.css';

	let editor = $state<HTMLDivElement>();

	// Plugin to handle live markdown bold formatting
	const markdownBoldPlugin = new Plugin({
		state: {
			init() {
				return DecorationSet.empty;
			},
			apply(tr, oldState) {
				return findBoldDecorations(tr.doc);
			}
		},
		props: {
			decorations(state) {
				return this.getState(state);
			}
		}
	});

	// Function to find **bold** patterns and create decorations
	function findBoldDecorations(doc: any) {
		const decorations: Decoration[] = [];
		
		doc.descendants((node: any, pos: number) => {
			if (node.type.name === 'text' && node.text) {
				const text = node.text;
				const regex = /\*\*([^*]+)\*\*/g;
				let match;
				
				while ((match = regex.exec(text)) !== null) {
					const start = pos + match.index;
					const end = start + match[0].length;
					
					// Add decoration for the entire match including ** symbols
					// But only make the inner text bold
					const innerStart = start + 2; // Skip first **
					const innerEnd = end - 2; // Skip last **
					
					// Make the inner text bold
					decorations.push(
						Decoration.inline(innerStart, innerEnd, {
							style: 'font-weight: bold;'
						})
					);
					
					// Make the ** symbols slightly dimmed
					decorations.push(
						Decoration.inline(start, start + 2, {
							style: 'opacity: 0.5; color: #666;'
						})
					);
					decorations.push(
						Decoration.inline(innerEnd, end, {
							style: 'opacity: 0.5; color: #666;'
						})
					);
				}
			}
		});
		
	return DecorationSet.create(doc, decorations);
	}

	$effect(() => {
		if (!editor) return;

		new EditorView(editor, {
			state: EditorState.create({
				schema: new Schema({
					nodes: {
						doc: {
							content: 'block+',
						},
						paragraph: {
							content: 'inline*',
							group: 'block',
							parseDOM: [{ tag: 'p' }],
							toDOM() {
								return ['p', 0];
							},
						},
						text: {
							group: 'inline',
						},
					},
				}),
				plugins: [markdownBoldPlugin]
			}),
		});
	});
</script>

<div bind:this={editor}></div>

<style>
	:global(.ProseMirror) {
		outline: none;
	}
</style>
