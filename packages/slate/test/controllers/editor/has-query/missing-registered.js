/** @jsx h */

import { Editor } from '@jianghe/slate'

export const input = new Editor().registerQuery('customQuery')

export default function(editor) {
  return editor.hasQuery('otherQuery')
}

export const output = false
