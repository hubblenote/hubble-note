/**
 * Utility for matching keyboard events against Electron accelerator strings
 * 
 * Examples of accelerator strings:
 * - "CmdOrCtrl+N"
 * - "Cmd+Shift+P"
 * - "Alt+F4"
 * - "F5"
 * - "Escape"
 */

interface ModifierKeys {
  cmd: boolean;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

/**
 * Parses an Electron-style match string into its components
 */
function parseMatchString(matchString: string): { modifiers: ModifierKeys; key: string } {
  if (!matchString || matchString.trim() === '') {
    return {
      modifiers: {
        cmd: false,
        ctrl: false,
        alt: false,
        shift: false,
        meta: false,
      },
      key: ''
    };
  }

  const parts = matchString.split('+');
  const key = parts[parts.length - 1]?.toLowerCase();
  if (!key) {
    throw new Error(`Invalid accelerator: ${matchString}`);
  }
  const modifierParts = parts.slice(0, -1).map(part => part.toLowerCase());

  const modifiers: ModifierKeys = {
    cmd: false,
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
  };

  for (const modifier of modifierParts) {
    switch (modifier) {
      case 'cmd':
      case 'command':
        modifiers.meta = true; // Cmd maps to metaKey
        break;
      case 'ctrl':
      case 'control':
        modifiers.ctrl = true;
        break;
      case 'cmdorctrl':
      case 'commandorcontrol':
        // On macOS, use Cmd (meta); on Windows/Linux, use Ctrl
        if (navigator.platform.toLowerCase().includes('mac')) {
          modifiers.meta = true;
        } else {
          modifiers.ctrl = true;
        }
        break;
      case 'alt':
      case 'option':
        modifiers.alt = true;
        break;
      case 'shift':
        modifiers.shift = true;
        break;
      case 'meta':
      case 'super':
        modifiers.meta = true;
        break;
    }
  }

  return { modifiers, key };
}

/**
 * Normalizes a key from a KeyboardEvent to match Electron's key naming
 */
function normalizeKey(key: string): string {
  const keyMap: Record<string, string> = {
    ' ': 'space',
    'arrowup': 'up',
    'arrowdown': 'down',
    'arrowleft': 'left',
    'arrowright': 'right',
    'delete': 'backspace', // On some systems
    'del': 'delete',
  };

  const normalized = key.toLowerCase();
  return keyMap[normalized] || normalized;
}

/**
 * Checks if a KeyboardEvent matches an Electron-style match string
 * 
 * @param event - The KeyboardEvent to check
 * @param matchString - The Electron-style match string (e.g., "CmdOrCtrl+N")
 * @returns true if the event matches the match string
 * 
 * @example
 * ```typescript
 * document.addEventListener('keydown', (event) => {
 *   if (matchesShortcut(event, 'CmdOrCtrl+N')) {
 *     // Handle new file shortcut
 *     event.preventDefault();
 *     createNewFile();
 *   }
 * });
 * ```
 */
export function matchesShortcut(event: KeyboardEvent, matchString: string): boolean {
  const { modifiers, key } = parseMatchString(matchString);
  const eventKey = normalizeKey(event.key);

  // Check if the main key matches
  if (eventKey !== key) {
    return false;
  }

  // Check modifiers - only compare the ones that matter
  return (
    event.ctrlKey === modifiers.ctrl &&
    event.altKey === modifiers.alt &&
    event.shiftKey === modifiers.shift &&
    event.metaKey === modifiers.meta
  );
}
