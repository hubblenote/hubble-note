import { Schema } from "prosemirror-model";

const LINK_ID_ATTR = 'data-id';

export const schema = new Schema({
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
  marks: {
    link: {
      attrs: {
        'data-href': {
          default: null,
        },
        [LINK_ID_ATTR]: {
          default: null,
        }
      },
      parseDOM: [
        { tag: 'span', getAttrs: (dom) => ({ 'data-href': dom.getAttribute('data-href') }) },
        // TODO: test this works for pasted links
        // { tag: 'a', getAttrs: (dom) => ({ 'data-href': dom.getAttribute('href') }) }
      ],
      toDOM(node) {
        return ['span', node.attrs, 0];
      },
    }
  }
});

export function createLinkMark(from: number, to: number) {
  return schema.marks.link.create({ 'data-href': '#', [LINK_ID_ATTR]: getLinkId(from, to) });
}

export function getLinkSelector(from: number, to: number) {
  return `[${LINK_ID_ATTR}="${getLinkId(from, to)}"]`;
}

function getLinkId(from: number, to: number) {
  return `link-${from}-${to}`;
}
