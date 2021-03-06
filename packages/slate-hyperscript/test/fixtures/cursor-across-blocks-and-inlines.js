/** @jsx h */

import h from '@jianghe/slate-hyperscript'

export const input = (
  <value>
    <document>
      <block type="paragraph">
        <text />
        <inline type="link">
          on
          <anchor />e
        </inline>
        <text />
      </block>
      <block type="paragraph">
        <text />
        <inline type="link">
          t<focus />
          wo
        </inline>
        <text />
      </block>
    </document>
  </value>
)

export const options = {
  preserveSelection: true,
  preserveKeys: true,
}

export const output = {
  object: 'value',
  document: {
    object: 'document',
    key: '10',
    data: {},
    nodes: [
      {
        object: 'block',
        key: '4',
        type: 'paragraph',
        data: {},
        nodes: [
          {
            object: 'text',
            key: '0',
            text: '',
            marks: [],
          },
          {
            object: 'inline',
            key: '2',
            type: 'link',
            data: {},
            nodes: [
              {
                object: 'text',
                key: '1',
                text: 'one',
                marks: [],
              },
            ],
          },
          {
            object: 'text',
            key: '3',
            text: '',
            marks: [],
          },
        ],
      },
      {
        object: 'block',
        key: '9',
        type: 'paragraph',
        data: {},
        nodes: [
          {
            object: 'text',
            key: '5',
            text: '',
            marks: [],
          },
          {
            object: 'inline',
            key: '7',
            type: 'link',
            data: {},
            nodes: [
              {
                object: 'text',
                key: '6',
                text: 'two',
                marks: [],
              },
            ],
          },
          {
            object: 'text',
            key: '8',
            text: '',
            marks: [],
          },
        ],
      },
    ],
  },
  selection: {
    object: 'selection',
    anchor: {
      object: 'point',
      key: '1',
      path: [0, 1, 0],
      offset: 2,
    },
    focus: {
      object: 'point',
      key: '6',
      path: [1, 1, 0],
      offset: 1,
    },
    isFocused: true,
    marks: null,
  },
}
