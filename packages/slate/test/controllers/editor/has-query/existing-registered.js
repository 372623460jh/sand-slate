/** @jsx h */

import { Editor } from '@jianghe/slate'

export const input = new Editor().registerQuery('customQuery')

export default function(editor) {
  return editor.hasQuery('customQuery')
}

export const output = true
