import assert from 'assert'
import { Value } from '@jianghe/slate'
import { fixtures } from '@jianghe/slate-dev-test-utils'

describe('@jianghe/slate-hyperscript', () => {
  fixtures(__dirname, 'fixtures', ({ module }) => {
    const { input, output, options } = module
    const actual = input.toJSON(options)
    const expected = Value.isValue(output) ? output.toJSON() : output
    assert.deepEqual(actual, expected)
  })
})
