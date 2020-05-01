import './interfaces/object';
import './interfaces/model';
import './interfaces/node';
import './interfaces/element';
import './interfaces/range';

import Annotation from './models/annotation';
import Block from './models/block';
import Change from './models/change';
import Data from './models/data';
import Decoration from './models/decoration';
import Document from './models/document';
import Inline from './models/inline';
import Leaf from './models/leaf';
import Mark from './models/mark';
import Node from './models/node';
import Operation from './models/operation';
import PathUtils from './utils/path-utils';
import Point from './models/point';
import Range from './models/range';
import Selection from './models/selection';
import Text from './models/text';
import TextUtils from './utils/text-utils';
import Value from './models/value';
import Editor from './controllers/editor';
import KeyUtils from './utils/key-utils';
// slate model 类型校验
import SlateTypes from './utils/slate-prop-types';
import { resetMemoization, useMemoization } from './utils/memoize';

/**
 * Export.
 *
 * @type {Object}
 */

export {
  Annotation,
  Block,
  Change,
  Data,
  Decoration,
  Document,
  Editor,
  Inline,
  KeyUtils,
  Leaf,
  Mark,
  Node,
  Operation,
  PathUtils,
  Point,
  Range,
  resetMemoization,
  Selection,
  Text,
  TextUtils,
  useMemoization,
  Value,
  SlateTypes,
};

export default {
  Annotation,
  Block,
  Change,
  Data,
  Decoration,
  Document,
  Editor,
  Inline,
  KeyUtils,
  Leaf,
  Mark,
  Node,
  Operation,
  PathUtils,
  Point,
  Range,
  resetMemoization,
  Selection,
  Text,
  TextUtils,
  useMemoization,
  Value,
  SlateTypes,
};
