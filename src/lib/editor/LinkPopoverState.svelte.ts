import { getLinkSelector } from "./schema";
import type { Range } from "./types";

class LinkPopoverState {
    #selectedRange: Range | null = $state(null);

    setRange(range: Range | null) {
        this.#selectedRange = range;
    }

    getElement() {
        if (!this.#selectedRange) return null;
        return document.querySelector(getLinkSelector(this.#selectedRange.from, this.#selectedRange.to));
    }
}

export const linkPopoverState = new LinkPopoverState();
