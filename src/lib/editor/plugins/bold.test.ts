import { describe, it, expect } from 'vitest';
import { EditorState, TextSelection } from 'prosemirror-state';
import { toggleBoldCommand } from './bold';
import { schema } from '../schema';

// Helper function to create editor state with given text and selection
function createState(text: string, from: number, to: number) {
  const doc = schema.node('doc', null, [
    schema.node('paragraph', null, [schema.text(text)])
  ]);

  const state = EditorState.create({
    doc,
    selection: TextSelection.create(doc, from + 1, to + 1) // +1 to account for paragraph wrapper
  });

  return state;
}

// Helper function to execute command and return the result text
function executeCommand(text: string, from: number, to: number) {
  const state = createState(text, from, to);
  let resultText = text;

  const success = toggleBoldCommand(state, (tr) => {
    const newState = state.apply(tr);
    resultText = newState.doc.textContent;
  });

  return { success, resultText };
}

describe('toggleBoldCommand', () => {
  it('should wrap selected text with ** when not already bold', () => {
    const { success, resultText } = executeCommand('Hello world', 0, 5);

    expect(success).toBe(true);
    expect(resultText).toBe('**Hello** world');
  });

  it('should remove ** when text is already wrapped', () => {
    const { success, resultText } = executeCommand('**Hello** world', 2, 7);

    expect(success).toBe(true);
    expect(resultText).toBe('Hello world');
  });

  it('should clean up nested ** within selection', () => {
    const { success, resultText } = executeCommand('This is **bold** text', 0, 22);

    expect(success).toBe(true);
    expect(resultText).toBe('**This is bold text**');
  });

  it('should handle multiple ** pairs within selection', () => {
    const { success, resultText } = executeCommand('**Hello** and **world**', 0, 24);

    expect(success).toBe(true);
    expect(resultText).toBe('**Hello and world**');
  });

  it('should handle selection that includes ** markers', () => {
    const { success, resultText } = executeCommand('**Hello** world', 0, 9);

    expect(success).toBe(true);
    expect(resultText).toBe('Hello world');
  });

  it('should preserve single * characters within selected text', () => {
    const { success, resultText } = executeCommand('Hello*world*test', 0, 16);

    expect(success).toBe(true);
    expect(resultText).toBe('**Hello*world*test**');
  });

  it('should handle selections that stop before the ** markers', () => {
    const { success, resultText } = executeCommand('Start **bold** middle **more** end', 6, 28);

    expect(success).toBe(true);
    expect(resultText).toBe('Start **bold middle more** end');
  });

  it('should handle selections in the middle of a ** end marker', () => {
    const { success, resultText } = executeCommand('Start **bold** middle **more** end', 6, 29);

    expect(success).toBe(true);
    expect(resultText).toBe('Start **bold middle more** end');
  })

  it('should handle selections in the middle of a ** start marker', () => {
    const { success, resultText } = executeCommand('Start **bold** middle **more** end', 5, 28);

    expect(success).toBe(true);
    expect(resultText).toBe('Start **bold middle more** end');
  })
});
