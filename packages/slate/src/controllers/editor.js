/* eslint-disable no-underscore-dangle */
/* eslint-disable getter-return */
import Debug from 'debug';
import invariant from 'tiny-invariant';
import isPlainObject from 'is-plain-object';
import warning from 'tiny-warning';
import { List } from 'immutable';

import CommandsPlugin from '../plugins/commands';
import CorePlugin from '../plugins/core';
import Operation from '../models/operation';
import PathUtils from '../utils/path-utils';
import QueriesPlugin from '../plugins/queries';
import SchemaPlugin from '../plugins/schema';
import Value from '../models/value';

/**
 * Debug.
 * @type {Function}
 */
const debug = Debug('@jianghe/slate:editor');

/**
 * Editor.
 * 编辑器模型类。 slate下有两个Editor一个是模型类 一个是react组件
 * svi: slate value immutable
 * svj: slate value json
 * @type {Editor}
 */
class Editor {
  /**
   * Create a new `Editor` with `attrs`.
   * @param {Object} attrs
   * @param {Object} options
   */
  constructor(attrs = {}, options = {}) {
    const {
      controller = this,
      construct = true,
    } = options;
    const {
      onChange = () => {},
      plugins = [], // 插件列表
      readOnly = false,
      value = Value.create(), // 初始化Value空的svi
    } = attrs;

    this.controller = controller; // Editor React组件实例
    this.middleware = {};
    this.onChange = onChange; // 改变时回调方法
    this.operations = List();
    this.readOnly = null;
    this.value = null;

    /**
     * 临时数据
     */
    this.tmp = {
      dirty: [],
      flushing: false,
      merge: null,
      normalize: true,
      save: true,
    };

    // 丰富化插件
    const core = CorePlugin({ plugins });

    // 注册插件到this.middleware
    registerPlugin(this, core);

    if (construct) {
      this.run('onConstruct');
      this.setReadOnly(readOnly);
      this.setValue(value, options);
    }
  }

  /**
   * Apply an `operation` to the editor, updating its value.
   * @param {Operation|Object} operation
   * @return {Editor}
   */
  applyOperation(operation) {
    const { operations, controller } = this;
    let { value } = this;

    // Add in the current `value` in case the operation was serialized.
    if (isPlainObject(operation)) {
      operation = { ...operation, value };
    }

    operation = Operation.create(operation);

    // Save the operation into the history. Since `save` is a command, we need
    // to do it without normalizing, since it would have side effects.
    this.withoutNormalizing(() => {
      controller.save(operation);
      value = this.value;
    });

    // Apply the operation to the value.
    debug('apply', { operation });
    this.value = operation.apply(value);
    this.operations = operations.push(operation);

    // Get the paths of the affected nodes, and mark them as dirty.
    const newDirtyPaths = getDirtyPaths(operation);

    const dirty = this.tmp.dirty.map((path) => {
      path = PathUtils.create(path);
      const transformed = PathUtils.transform(path, operation);
      return transformed.toArray();
    });

    const pathIndex = {};
    const dirtyPaths = Array.prototype.concat.apply(newDirtyPaths, dirty);
    this.tmp.dirty = [];

    // PERF: De-dupe the paths so we don't do extra normalization.
    dirtyPaths.forEach((dirtyPath) => {
      const key = dirtyPath.join(',');

      if (!pathIndex[key]) {
        this.tmp.dirty.push(dirtyPath);
      }

      pathIndex[key] = true;
    });

    // If we're not already, queue the flushing process on the next tick.
    if (!this.tmp.flushing) {
      this.tmp.flushing = true;
      Promise.resolve().then(() => this.flush());
    }

    return controller;
  }

  /**
   * Flush the editor's current change.
   * @return {Editor}
   */
  flush() {
    this.run('onChange');
    const { value, operations, controller } = this;
    const change = { value, operations };
    this.operations = List();
    this.tmp.flushing = false;
    this.onChange(change);
    return controller;
  }

  /**
   * Checks if a command by `type` has been registered.
   * @param {String} type
   * @return {Boolean}
   */
  hasCommand(type) {
    const { controller } = this;
    const has = type in controller && controller[type].__command;
    return has;
  }

  /**
   * Checks if a query by `type` has been registered.
   * @param {String} type
   * @return {Boolean}
   */
  hasQuery(type) {
    const { controller } = this;
    const has = type in controller && controller[type].__query;
    return has;
  }

  /**
   * Normalize all of the nodes in the document from scratch.
   * 规范化value
   * @return {Editor}
   */
  normalize() {
    const { value, controller } = this;
    let { document } = value;
    const table = document.getKeysToPathsTable();
    const paths = Object.values(table).map(PathUtils.create);
    this.tmp.dirty = this.tmp.dirty.concat(paths);
    normalizeDirtyPaths(this);
    const { selection } = value;
    document = value.document;
    if (selection.isUnset && document.nodes.size) {
      controller.moveToStartOfDocument();
    }
    return controller;
  }

  /**
   * Trigger a command by `type` with `...args`.
   * 指令的执行方法,实际上执行的onCommand指令
   * @param {String|Function} type 指令名
   * @param {Any} ...args
   * @return {Editor}
   */
  command(type, ...args) {
    const { controller } = this;
    if (typeof type === 'function') {
      type(controller, ...args);
      normalizeDirtyPaths(this);
      return controller;
    }
    debug('command', { type, args });
    // 拼装执行参数
    const obj = { type, args };
    // 执行onCommand插件
    this.run('onCommand', obj);
    //
    normalizeDirtyPaths(this);
    return controller;
  }

  /**
   * Register a command `type` with the editor.
   * 注册指令
   * @param {String} type 指令名
   * @return {Editor}
   */
  registerCommand(type) {
    const { controller } = this;
    // Editor React实例上有没有对应指令有的话直接返回
    if (type in controller && controller[type].__command) {
      return controller;
    }
    // Editor React实例上有对应指令,但是没有__command标记
    invariant(
      !(type in controller),
      `You cannot register a \`${type}\` command because it would overwrite an existing property of the \`Editor\`.`,
    );
    // 将执行onCommand的命令方法包装后挂载到<Editor>上
    const method = (...args) => this.command(type, ...args);
    controller[type] = method;
    method.__command = true;
    return controller;
  }

  /**
   * Ask a query by `type` with `...args`.
   * 调用quiry，相当于调用onQuery插件
   * @param {String|Function} type
   * @param {Any} ...args
   * @return {Any}
   */
  query(type, ...args) {
    const { controller } = this;
    if (typeof type === 'function') {
      return type(controller, ...args);
    }
    debug('query', { type, args });
    const obj = { type, args };
    // 调用onQuery插件
    return this.run('onQuery', obj);
  }

  /**
   * Register a query `type` with the editor.
   * 包装并注册quiry到editor实例上
   * @param {String} type query名
   * @return {Editor}
   */
  registerQuery(type) {
    const { controller } = this;
    if (type in controller && controller[type].__query) {
      // 已经存在
      return controller;
    }
    invariant(
      !(type in controller),
      `You cannot register a \`${type}\` query because it would overwrite an existing property of the \`Editor\`.`,
    );
    // 将执行onQuery的命令方法包装后挂载到<Editor>上
    const method = (...args) => this.query(type, ...args);
    controller[type] = method;
    method.__query = true;
    return controller;
  }

  /**
   * Run through the middleware stack by `key` with `args`.
   * 返回具体某个插件的执行方法，执行插件的入参是Editor React实例和next方法
   * @param {String} key
   * @param {Any} ...args
   * @return {Any}
   */
  run(key, ...args) {
    const {
      controller, // Editor React实例
      middleware,
    } = this;
    // 取出对应中间件
    const fns = middleware[key] || [];
    let i = 0;

    /**
     * 执行下一个插件的方法
     */
    function next(...overrides) {
      const fn = fns[i++];
      if (!fn) return;

      if (overrides.length) {
        // 如果有入参，覆盖调用插件的参数
        args = overrides;
      }

      // eslint-disable-next-line consistent-return
      return fn(...args, controller, next);
    }

    // 一些版本兼容的处理
    Object.defineProperty(next, 'change', {
      get() {
        invariant(
          false,
          'As of Slate 0.42, the `editor` is no longer passed as the third argument to event handlers. You can access it via `change.editor` instead.',
        );
      },
    });

    Object.defineProperty(next, 'onChange', {
      get() {
        invariant(
          false,
          'As of Slate 0.42, the `editor` is no longer passed as the third argument to event handlers. You can access it via `change.editor` instead.',
        );
      },
    });

    Object.defineProperty(next, 'props', {
      get() {
        invariant(
          false,
          'As of Slate 0.42, the `editor` is no longer passed as the third argument to event handlers. You can access it via `change.editor` instead.',
        );
      },
    });

    Object.defineProperty(next, 'schema', {
      get() {
        invariant(
          false,
          'As of Slate 0.42, the `editor` is no longer passed as the third argument to event handlers. You can access it via `change.editor` instead.',
        );
      },
    });

    Object.defineProperty(next, 'stack', {
      get() {
        invariant(
          false,
          'As of Slate 0.42, the `editor` is no longer passed as the third argument to event handlers. You can access it via `change.editor` instead.',
        );
      },
    });

    return next();
  }

  /**
   * Set the `readOnly` flag.
   * 设置readOnly标记
   * @param {Boolean} readOnly
   * @return {Editor}
   */
  setReadOnly(readOnly) {
    this.readOnly = readOnly;
    return this;
  }

  /**
   * Set the editor's `value`.
   * 这是value
   * @param {Value} value
   * @param {Options} options
   * @return {Editor}
   */
  setValue(value, options = {}) {
    // normalize是否需要规范化，如果不传看传入value和this.value是否相等,
    // 不相等则需要规范化
    const { normalize = value !== this.value } = options;
    this.value = value;
    if (normalize) {
      // 如果传入的value不等于this.value
      this.normalize();
    }
    return this;
  }

  /**
   * Apply a series of changes inside a synchronous `fn`, deferring
   * normalization until after the function has finished executing.
   * @param {Function} fn
   * @return {Editor} <Editor> 实例
   */
  withoutNormalizing(fn) {
    const { controller } = this;
    const value = this.tmp.normalize;
    this.tmp.normalize = false;
    fn(controller);
    this.tmp.normalize = value;
    normalizeDirtyPaths(this);
    return controller;
  }

  /**
   * Deprecated.
   */
  get editor() {
    warning(
      false,
      "As of Slate 0.43 the `change` object has been replaced with `editor`, so you don't need to access `change.editor`.",
    );
    return this.controller;
  }

  change(fn, ...args) {
    warning(
      false,
      'As of Slate 0.43 the `change` object has been replaced with `editor`, so the `editor.change()` method is deprecated.`',
    );

    fn(this.controller, ...args);
  }

  call(fn, ...args) {
    warning(
      false,
      'As of Slate 0.43 the `editor.call(fn)` method has been deprecated, please use `editor.command(fn)` instead.',
    );

    fn(this.controller, ...args);
    return this.controller;
  }

  applyOperations(operations) {
    warning(
      false,
      'As of Slate 0.43 the `applyOperations` method is deprecated, please apply each operation in a loop instead.',
    );
    operations.forEach((op) => this.applyOperation(op));
    return this.controller;
  }

  setOperationFlag(key, value) {
    warning(
      false,
      'As of slate@0.41 the `change.setOperationFlag` method has been deprecated.',
    );

    this.tmp[key] = value;
    return this;
  }

  getFlag(key, options = {}) {
    warning(
      false,
      'As of slate@0.41 the `change.getFlag` method has been deprecated.',
    );

    return options[key] !== undefined ? options[key] : this.tmp[key];
  }

  unsetOperationFlag(key) {
    warning(
      false,
      'As of slate@0.41 the `change.unsetOperationFlag` method has been deprecated.',
    );

    delete this.tmp[key];
    return this;
  }

  withoutNormalization(fn) {
    warning(
      false,
      'As of slate@0.41 the `change.withoutNormalization` helper has been renamed to `change.withoutNormalizing`.',
    );

    return this.withoutNormalizing(fn);
  }
}

/**
 * Get the "dirty" paths for a given `operation`.
 * @param {Operation} operation
 * @return {Array}
 */
function getDirtyPaths(operation) {
  const {
    type, node, path, newPath,
  } = operation;

  switch (type) {
    case 'add_mark':
    case 'insert_text':
    case 'remove_mark':
    case 'remove_text':
    case 'set_mark':
    case 'set_node': {
      const ancestors = PathUtils.getAncestors(path).toArray();
      return [...ancestors, path];
    }

    case 'insert_node': {
      const table = node.getKeysToPathsTable();
      const paths = Object.values(table).map((p) => path.concat(p));
      const ancestors = PathUtils.getAncestors(path).toArray();
      return [...ancestors, path, ...paths];
    }

    case 'split_node': {
      const ancestors = PathUtils.getAncestors(path).toArray();
      const nextPath = PathUtils.increment(path);
      return [...ancestors, path, nextPath];
    }

    case 'merge_node': {
      const ancestors = PathUtils.getAncestors(path).toArray();
      const previousPath = PathUtils.decrement(path);
      return [...ancestors, previousPath];
    }

    case 'move_node': {
      if (PathUtils.isEqual(path, newPath)) {
        return [];
      }

      const oldAncestors = PathUtils.getAncestors(path).reduce((arr, p) => {
        arr.push(...PathUtils.transform(p, operation).toArray());
        return arr;
      }, []);

      const newAncestors = PathUtils.getAncestors(newPath).reduce((arr, p) => {
        arr.push(...PathUtils.transform(p, operation).toArray());
        return arr;
      }, []);

      return [...oldAncestors, ...newAncestors];
    }

    case 'remove_node': {
      const ancestors = PathUtils.getAncestors(path).toArray();
      return [...ancestors];
    }

    default: {
      return [];
    }
  }
}

/**
 * Normalize any new "dirty" paths that have been added to the change.
 * @param {Editor} editor实例
 */
function normalizeDirtyPaths(editor) {
  // 标准化
  if (!editor.tmp.normalize) {
    return;
  }

  if (!editor.tmp.dirty.length) {
    return;
  }

  editor.withoutNormalizing(() => {
    while (editor.tmp.dirty.length) {
      const path = editor.tmp.dirty.pop();
      normalizeNodeByPath(editor, path);
    }
  });
}

/**
 * Normalize the node at a specific `path`.
 * @param {Editor} editor editor实例
 * @param {Array} path
 */
function normalizeNodeByPath(editor, path) {
  const { controller } = editor;
  let { value } = editor;
  let { document } = value;
  let node = document.assertNode(path);
  let iterations = 0;
  const max = 100 + (node.object === 'text' ? 1 : node.nodes.size);

  while (node) {
    const fn = node.normalize(controller);

    if (!fn) {
      break;
    }

    // Run the normalize `fn` to fix the node.
    fn(controller);

    // Attempt to re-find the node by path, or by key if it has changed
    // locations in the tree continue iterating.
    value = editor.value;
    document = value.document;
    const { key } = node;
    let found = document.getDescendant(path);

    if (found && found.key === key) {
      node = found;
    } else {
      found = document.getDescendant(key);

      if (found) {
        node = found;
        path = document.getPath(key);
      } else {
        // If it no longer exists by key, it was removed, so we're done.
        break;
      }
    }

    // Increment the iterations counter, and check to make sure that we haven't
    // exceeded the max. Without this check, it's easy for the `normalize`
    // function of a schema rule to be written incorrectly and for an infinite
    // invalid loop to occur.
    iterations++;

    if (iterations > max) {
      throw new Error(
        'A schema rule could not be normalized after sufficient iterations. This is usually due to a `rule.normalize` or `plugin.normalizeNode` function of a schema being incorrectly written, causing an infinite loop.',
      );
    }
  }
}

/**
 * Register a `plugin` with the editor.
 * 注册所有的插件到editor.middleware中，每一个插件就是一个对象，如果是数组会遍历数组。
 * 插件的最小单元key: fn1
 * 插件注册之后是这样的 this.middleware[key] = [fn1, fn2];
 * {
 *    onCommand:[],
 *    onQuerie:[],
 *    // ...
 * }
 * @param {Editor} editor
 * @param {Object|Array|Null} plugin
 */
function registerPlugin(editor, plugin) {
  if (Array.isArray(plugin)) {
    // 循环遍历递归调用自己
    plugin.forEach((p) => registerPlugin(editor, p));
    return;
  }

  if (plugin == null) {
    return;
  }

  const {
    commands, queries, schema, ...rest
  } = plugin;

  if (commands) {
    // 指令插件
    const commandsPlugin = CommandsPlugin(commands);
    registerPlugin(editor, commandsPlugin);
  }

  if (queries) {
    // 查询插件
    const queriesPlugin = QueriesPlugin(queries);
    registerPlugin(editor, queriesPlugin);
  }

  if (schema) {
    // schema插件
    const schemaPlugin = SchemaPlugin(schema);
    registerPlugin(editor, schemaPlugin);
  }

  // 其余插件
  for (const key in rest) {
    // 合并多个插件对应的方法，比如：
    // A插件集合中有一个 onBeforeInput: ()=>{}
    // B插件集合中也有一个 onBeforeInput: ()=>{}
    // 最后会被合并为
    // this.middleware.onBeforeInput = [()=>{}, ()=>{}];
    const fn = rest[key];
    editor.middleware[key] = editor.middleware[key] || [];
    const middleware = editor.middleware[key];
    middleware.push(fn);
  }
}

/**
 * Export.
 * @type {Editor}
 */
export default Editor;
