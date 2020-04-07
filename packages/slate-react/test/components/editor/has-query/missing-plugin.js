/** @jsx h */

import Plain from '@jianghe/slate-plain-serializer'

const defaultValue = Plain.deserialize('')

const plugins = [
  {
    queries: {
      customQuery: () => {},
    },
  },
]

export const input = { defaultValue, plugins }

export default function(editor) {
  return editor.hasQuery('otherQuery')
}

export const output = false
