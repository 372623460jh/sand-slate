/** @jsx h */

import Plain from '@jianghe/slate-plain-serializer'

const defaultValue = Plain.deserialize('')

export const input = { defaultValue }

export default function(editor) {
  return editor.hasQuery('isVoid')
}

export const output = true
