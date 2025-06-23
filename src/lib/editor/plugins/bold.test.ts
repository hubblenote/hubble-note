import { describe, it, expect } from 'vitest';
import { EditorState, TextSelection } from 'prosemirror-state';
import { BOLD_MARK, boldPlugin } from './bold';
import { schema } from '../schema';
import { createToggleMarkCommand } from './commands/toggle-mark';

// Helper function to create editor state with given text and selection
function createState(text: string, from: number, to: number) {
  let state = EditorState.create({
    doc: schema.node('doc', null, [
      schema.node('paragraph', null, [])
    ]),
    plugins: [boldPlugin],
  });

  state = state.apply(state.tr.insertText(text));
  return state.apply(state.tr.setSelection(TextSelection.create(state.doc, from + 1, to + 1)));
}

// Helper function to execute command and return the result text
function executeCommand(text: string, from: number, to: number) {
  const state = createState(text, from, to);
  let newState = state;
  let success = false;

  // Execute the command and get the new state
  const toggleBoldCommand = createToggleMarkCommand(boldPlugin, BOLD_MARK);
  success = toggleBoldCommand(state, (tr) => {
    newState = state.apply(tr);
  });

  const resultText = newState.doc.textContent;

  return { success, resultText };
}

describe('toggleBoldCommand', () => {
  it('should handle selection around bolded text', () => {
    const { success, resultText } = executeCommand('**This** is some example text', 0, 8);

    expect(success).toBe(true);
    expect(resultText).toBe('This is some example text');
  });

  it('should handle selection around unbolded text', () => {
    const { success, resultText } = executeCommand('This is some example text', 0, 4);

    expect(success).toBe(true);
    expect(resultText).toBe('**This** is some example text');
  });

  it('should handle selection within bolded text', () => {
    const { success, resultText } = executeCommand('**This is some** example text', 7, 9);

    expect(success).toBe(true);
    expect(resultText).toBe('**This** is **some** example text');
  });

  it('should handle selection within starting marker', () => {
    const { success, resultText } = executeCommand('**This** is some example text', 1, 8);

    expect(success).toBe(true);
    expect(resultText).toBe('This is some example text');
  });

  it('should handle selection within ending marker', () => {
    const { success, resultText } = executeCommand('**This** is some example text', 0, 7);

    expect(success).toBe(true);
    expect(resultText).toBe('This is some example text');
  });

  it('should handle selection in the middle of a word', () => {
    const { success, resultText } = executeCommand('**This** is some example text', 4, 8);

    expect(success).toBe(true);
    expect(resultText).toBe('This is some example text');
  });

  it('should handle selection from bolded to unbolded text', () => {
    const { success, resultText } = executeCommand('**This** is some example text', 0, 11);

    expect(success).toBe(true);
    expect(resultText).toBe('**This is** some example text');
  });

  it('should handle selection from unbolded to bolded text', () => {
    const { success, resultText } = executeCommand('This is some **example text**', 9, 29);

    expect(success).toBe(true);
    expect(resultText).toBe('This is **some example text**');
  });

  it('should handle selection from bolded to unbolded text, mid-word', () => {
    const { success, resultText } = executeCommand('**This** is some example text', 3, 11);

    expect(success).toBe(true);
    expect(resultText).toBe('**This is** some example text');
  });

  it('should handle selection from unbolded to bolded text, mid-word', () => {
    const { success, resultText } = executeCommand('This is some **example text**', 11, 29);

    expect(success).toBe(true);
    expect(resultText).toBe('This is **some example text**');
  });
});
