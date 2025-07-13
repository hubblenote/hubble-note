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
    heading: {
      attrs: { level: { default: 1, validate: "number" } },
      content: "inline*",
      group: "block",
      defining: true,
      parseDOM: [{ tag: "h1", attrs: { level: 1 } },
      { tag: "h2", attrs: { level: 2 } },
      { tag: "h3", attrs: { level: 3 } },
      { tag: "h4", attrs: { level: 4 } },
      { tag: "h5", attrs: { level: 5 } },
      { tag: "h6", attrs: { level: 6 } }],
      toDOM(node) { return ["h" + node.attrs.level, 0] }
    },
    bulletedList: {
      content: 'listItem+',
      group: 'block',
      parseDOM: [{ tag: 'ul' }],
      toDOM() { return ['ul', 0] }
    },
    listItem: {
      content: 'inline*',
      group: 'block',
      parseDOM: [{ tag: 'li' }],
      toDOM() { return ['li', 0] }
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