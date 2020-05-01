/**
 * slate 模型类型校验方法
 */
import Block from '../models/block';
import Change from '../models/change';
import Data from '../models/data';
import Document from '../models/document';
import Inline from '../models/inline';
import Leaf from '../models/leaf';
import Mark from '../models/mark';
import Node from '../models/node';
import Range from '../models/range';
import Selection from '../models/selection';
import Text from '../models/text';
import Value from '../models/value';

/**
 * Create a prop type checker for Slate objects with `name` and `validate`.
 * @param {String} name
 * @param {Function} validate
 * @return {Function}
 */
function create(name, validate) {
  /**
   * 校验方法
   * @param {*} isRequired 是否必填
   * @param {*} props
   * @param {*} propName 属性名
   * @param {*} componentName
   * @param {*} location
   */
  function check(isRequired, props, propName, componentName, location) {
    // props中对应属性值
    const value = props[propName];

    if (value == null && !isRequired) {
      // 值为空但非必填
      return null;
    }

    if (value == null && isRequired) {
      // 必填但是值为空
      return new Error(
        `The ${location} \`${propName}\` is marked as required in \`${componentName}\`, but it was not supplied.（${componentName}中${propName}必填但目前值为空）`,
      );
    }

    if (validate(value)) {
      // 校验通过
      return null;
    }

    // 校验不通过
    return new Error(
      `Invalid ${location} \`${propName}\` supplied to \`${componentName}\`, expected a Slate \`${name}\` but received: ${value}（${componentName}中${propName}类型校验不通过）`,
    );
  }

  function propType(...args) {
    return check(false, ...args);
  }

  // 处理isRequired情况
  propType.isRequired = (...args) => check(true, ...args);

  return propType;
}

/**
 * Prop type checkers.
 * @type {Object}
 */
const Types = {
  block: create('Block', (v) => Block.isBlock(v)),
  blocks: create('List<Block>', (v) => Block.isBlockList(v)),
  change: create('Change', (v) => Change.isChange(v)),
  data: create('Data', (v) => Data.isData(v)),
  document: create('Document', (v) => Document.isDocument(v)),
  inline: create('Inline', (v) => Inline.isInline(v)),
  inlines: create('Inline', (v) => Inline.isInlineList(v)),
  leaf: create('Leaf', (v) => Leaf.isLeaf(v)),
  leaves: create('List<Leaf>', (v) => Leaf.isLeafList(v)),
  mark: create('Mark', (v) => Mark.isMark(v)),
  marks: create('Set<Mark>', (v) => Mark.isMarkSet(v)),
  node: create('Node', (v) => Node.isNode(v)),
  nodes: create('List<Node>', (v) => Node.isNodeList(v)),
  range: create('Range', (v) => Range.isRange(v)),
  ranges: create('List<Range>', (v) => Range.isRangeList(v)),
  selection: create('Selection', (v) => Selection.isSelection(v)),
  value: create('Value', (v) => Value.isValue(v)),
  text: create('Text', (v) => Text.isText(v)),
  texts: create('List<Text>', (v) => Text.isTextList(v)),
};

export default Types;
