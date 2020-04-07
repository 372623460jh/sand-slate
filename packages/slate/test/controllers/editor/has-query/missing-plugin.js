/** @jsx h */

import { Editor } from '@jianghe/slate'

const plugins = [
  {
    queries: {
      customquery: () => {},
    },
  },
]

export const input = new Editor({ plugins })

export default function(editor) {
  return editor.hasQuery('otherquery')
}

export const output = false
