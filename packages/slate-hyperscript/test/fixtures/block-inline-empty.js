/** @jsx h */

import h from '@jianghe/slate-hyperscript'

export const input = (
  <block type="paragraph">
    <inline type="link" />
  </block>
)

export const output = {
  object: 'block',
  type: 'paragraph',
  data: {},
  nodes: [
    {
      object: 'inline',
      type: 'link',
      data: {},
      nodes: [],
    },
  ],
}
