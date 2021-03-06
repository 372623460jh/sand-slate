/** @jsx h */

import h from '../../../helpers/h'
import { Set } from 'immutable'
import { Mark } from '@jianghe/slate'

export const input = (
  <value>
    <document>
      <paragraph>
        <i>
          C<cursor />
          at{' '}
        </i>
        is
        <b> Cute</b>
      </paragraph>
    </document>
  </value>
)

export default function({ document, selection }) {
  return document.getInsertMarksAtPoint(selection.start)
}

export const output = Set.of(Mark.create('italic'))
