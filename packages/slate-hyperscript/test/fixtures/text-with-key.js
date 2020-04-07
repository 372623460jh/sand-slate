/** @jsx h */

import h from '@jianghe/slate-hyperscript'

export const input = <text key="a">word</text>

export const options = {
  preserveKeys: true,
}

export const output = {
  object: 'text',
  key: 'a',
  text: 'word',
  marks: [],
}
