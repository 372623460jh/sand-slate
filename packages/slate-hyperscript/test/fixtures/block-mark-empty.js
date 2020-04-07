/** @jsx h */

import h from '@jianghe/slate-hyperscript'

export const input = (
  <block type="paragraph">
    <mark type="bold" />
  </block>
)

export const output = {
  object: 'block',
  type: 'paragraph',
  data: {},
  nodes: [
    {
      object: 'text',
      text: '',
      marks: [
        {
          object: 'mark',
          type: 'bold',
          data: {},
        },
      ],
    },
  ],
}
