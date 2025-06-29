import { Mark, Schema } from "prosemirror-model";

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

export function createLinkMark(href = '') {
  return schema.marks.link.create({ 'data-href': href });
}


export function getLinkAttrs(mark: Mark) {
  const href = mark.attrs['data-href'];
  if (typeof href !== 'string') return null;
  return { href };
}