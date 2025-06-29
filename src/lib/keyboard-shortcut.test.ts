import { describe, it, expect, beforeEach, vi } from 'vitest';
import { matchesShortcut } from './keyboard-shortcut';

// Helper function to create a mock KeyboardEvent
function createKeyboardEvent(options: {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
}): KeyboardEvent {
  return {
    key: options.key,
    ctrlKey: options.ctrlKey ?? false,
    metaKey: options.metaKey ?? false,
    altKey: options.altKey ?? false,
    shiftKey: options.shiftKey ?? false,
  } as KeyboardEvent;
}

describe('keyboard-shortcut', () => {
  // Mock navigator.platform for testing CmdOrCtrl behavior
  beforeEach(() => {
    // Mock as macOS by default
    Object.defineProperty(navigator, 'platform', {
      value: 'MacIntel',
      configurable: true,
    });
  });

  describe('matchesShortcut', () => {
    describe('single key', () => {
      it('should match single key "R"', () => {
        const event = createKeyboardEvent({ key: 'r' });
        expect(matchesShortcut(event, 'R')).toBe(true);
      });

      it('should match single key "R" case-insensitive', () => {
        const event = createKeyboardEvent({ key: 'R' });
        expect(matchesShortcut(event, 'r')).toBe(true);
      });

      it('should not match single key "R" when other modifiers are pressed', () => {
        const event = createKeyboardEvent({ key: 'r', ctrlKey: true });
        expect(matchesShortcut(event, 'R')).toBe(false);
      });

      it('should not match different single key', () => {
        const event = createKeyboardEvent({ key: 'r' });
        expect(matchesShortcut(event, 'S')).toBe(false);
      });
    });

    describe('CmdOrCtrl modifier', () => {
      it('should match "CmdOrCtrl+K" with Cmd on macOS', () => {
        const event = createKeyboardEvent({ key: 'k', metaKey: true });
        expect(matchesShortcut(event, 'CmdOrCtrl+K')).toBe(true);
      });

      it('should match "CmdOrCtrl+K" with Ctrl on Windows/Linux', () => {
        // Mock as Windows
        Object.defineProperty(navigator, 'platform', {
          value: 'Win32',
          configurable: true,
        });

        const event = createKeyboardEvent({ key: 'k', ctrlKey: true });
        expect(matchesShortcut(event, 'CmdOrCtrl+K')).toBe(true);
      });

      it('should not match "CmdOrCtrl+K" without any modifier', () => {
        const event = createKeyboardEvent({ key: 'k' });
        expect(matchesShortcut(event, 'CmdOrCtrl+K')).toBe(false);
      });

      it('should not match "CmdOrCtrl+K" with wrong key', () => {
        const event = createKeyboardEvent({ key: 'j', metaKey: true });
        expect(matchesShortcut(event, 'CmdOrCtrl+K')).toBe(false);
      });

      it('should not match "CmdOrCtrl+K" with additional unwanted modifiers', () => {
        const event = createKeyboardEvent({ key: 'k', metaKey: true, altKey: true });
        expect(matchesShortcut(event, 'CmdOrCtrl+K')).toBe(false);
      });
    });

    describe('CmdOrCtrl with additional modifiers', () => {
      it('should match "CmdOrCtrl+Shift+J" with Cmd+Shift on macOS', () => {
        const event = createKeyboardEvent({
          key: 'J',
          metaKey: true,
          shiftKey: true
        });
        expect(matchesShortcut(event, 'CmdOrCtrl+Shift+J')).toBe(true);
      });

      it('should match "CmdOrCtrl+Shift+J" with Ctrl+Shift on Windows/Linux', () => {
        // Mock as Linux
        Object.defineProperty(navigator, 'platform', {
          value: 'Linux x86_64',
          configurable: true,
        });

        const event = createKeyboardEvent({
          key: 'J',
          ctrlKey: true,
          shiftKey: true
        });
        expect(matchesShortcut(event, 'CmdOrCtrl+Shift+J')).toBe(true);
      });

      it('should not match "CmdOrCtrl+Shift+J" without Shift', () => {
        const event = createKeyboardEvent({ key: 'J', metaKey: true });
        expect(matchesShortcut(event, 'CmdOrCtrl+Shift+J')).toBe(false);
      });

      it('should not match "CmdOrCtrl+Shift+J" without CmdOrCtrl', () => {
        const event = createKeyboardEvent({ key: 'J', shiftKey: true });
        expect(matchesShortcut(event, 'CmdOrCtrl+Shift+J')).toBe(false);
      });

      it('should not match "CmdOrCtrl+Shift+J" with wrong key', () => {
        const event = createKeyboardEvent({
          key: 'K',
          metaKey: true,
          shiftKey: true
        });
        expect(matchesShortcut(event, 'CmdOrCtrl+Shift+J')).toBe(false);
      });
    });

    describe('Alt modifier', () => {
      it('should match "Alt+G"', () => {
        const event = createKeyboardEvent({ key: 'g', altKey: true });
        expect(matchesShortcut(event, 'Alt+G')).toBe(true);
      });

      it('should not match "Alt+G" without Alt', () => {
        const event = createKeyboardEvent({ key: 'g' });
        expect(matchesShortcut(event, 'Alt+G')).toBe(false);
      });

      it('should not match "Alt+G" with wrong key', () => {
        const event = createKeyboardEvent({ key: 'h', altKey: true });
        expect(matchesShortcut(event, 'Alt+G')).toBe(false);
      });

      it('should not match "Alt+G" with additional unwanted modifiers', () => {
        const event = createKeyboardEvent({
          key: 'g',
          altKey: true,
          ctrlKey: true
        });
        expect(matchesShortcut(event, 'Alt+G')).toBe(false);
      });
    });

    describe('Alt with multiple modifiers', () => {
      it('should match "Alt+Shift+H"', () => {
        const event = createKeyboardEvent({
          key: 'H',
          altKey: true,
          shiftKey: true
        });
        expect(matchesShortcut(event, 'Alt+Shift+H')).toBe(true);
      });

      it('should match "Alt+Shift+J"', () => {
        const event = createKeyboardEvent({
          key: 'J',
          altKey: true,
          shiftKey: true
        });
        expect(matchesShortcut(event, 'Alt+Shift+J')).toBe(true);
      });

      it('should not match "Alt+Shift+H" without Alt', () => {
        const event = createKeyboardEvent({ key: 'H', shiftKey: true });
        expect(matchesShortcut(event, 'Alt+Shift+H')).toBe(false);
      });

      it('should not match "Alt+Shift+H" without Shift', () => {
        const event = createKeyboardEvent({ key: 'H', altKey: true });
        expect(matchesShortcut(event, 'Alt+Shift+H')).toBe(false);
      });

      it('should not match "Alt+Shift+J" with wrong key', () => {
        const event = createKeyboardEvent({
          key: 'K',
          altKey: true,
          shiftKey: true
        });
        expect(matchesShortcut(event, 'Alt+Shift+J')).toBe(false);
      });

      it('should not match "Alt+Shift+H" with additional unwanted modifiers', () => {
        const event = createKeyboardEvent({
          key: 'H',
          altKey: true,
          shiftKey: true,
          ctrlKey: true
        });
        expect(matchesShortcut(event, 'Alt+Shift+H')).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle empty accelerator string', () => {
        const event = createKeyboardEvent({ key: 'a' });
        expect(matchesShortcut(event, '')).toBe(false);
      });

      it('should handle special keys like Space', () => {
        const event = createKeyboardEvent({ key: ' ' });
        expect(matchesShortcut(event, 'Space')).toBe(true);
      });

      it('should handle arrow keys', () => {
        const event = createKeyboardEvent({ key: 'ArrowUp' });
        expect(matchesShortcut(event, 'Up')).toBe(true);
      });

      it('should handle function keys', () => {
        const event = createKeyboardEvent({ key: 'F5' });
        expect(matchesShortcut(event, 'F5')).toBe(true);
      });
    });
  });

  describe('platform-specific behavior', () => {
    it('should use Cmd on macOS for CmdOrCtrl', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      });

      const cmdEvent = createKeyboardEvent({ key: 'k', metaKey: true });
      const ctrlEvent = createKeyboardEvent({ key: 'k', ctrlKey: true });

      expect(matchesShortcut(cmdEvent, 'CmdOrCtrl+K')).toBe(true);
      expect(matchesShortcut(ctrlEvent, 'CmdOrCtrl+K')).toBe(false);
    });

    it('should use Ctrl on Windows for CmdOrCtrl', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        configurable: true,
      });

      const cmdEvent = createKeyboardEvent({ key: 'k', metaKey: true });
      const ctrlEvent = createKeyboardEvent({ key: 'k', ctrlKey: true });

      expect(matchesShortcut(cmdEvent, 'CmdOrCtrl+K')).toBe(false);
      expect(matchesShortcut(ctrlEvent, 'CmdOrCtrl+K')).toBe(true);
    });

    it('should use Ctrl on Linux for CmdOrCtrl', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Linux x86_64',
        configurable: true,
      });

      const cmdEvent = createKeyboardEvent({ key: 'k', metaKey: true });
      const ctrlEvent = createKeyboardEvent({ key: 'k', ctrlKey: true });

      expect(matchesShortcut(cmdEvent, 'CmdOrCtrl+K')).toBe(false);
      expect(matchesShortcut(ctrlEvent, 'CmdOrCtrl+K')).toBe(true);
    });
  });

  describe('delete shortcut across platforms', () => {
    it('should match CmdOrCtrl+Delete with Cmd+Delete on macOS', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      });

      const event = createKeyboardEvent({ key: 'Delete', metaKey: true });
      expect(matchesShortcut(event, 'CmdOrCtrl+Delete')).toBe(true);
    });

    it('should match CmdOrCtrl+Delete with Ctrl+Delete on Windows', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        configurable: true,
      });

      const event = createKeyboardEvent({ key: 'Delete', ctrlKey: true });
      expect(matchesShortcut(event, 'CmdOrCtrl+Delete')).toBe(true);
    });

    it('should match CmdOrCtrl+Delete with Ctrl+Delete on Linux', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Linux x86_64',
        configurable: true,
      });

      const event = createKeyboardEvent({ key: 'Delete', ctrlKey: true });
      expect(matchesShortcut(event, 'CmdOrCtrl+Delete')).toBe(true);
    });
  });
});
