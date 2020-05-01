/* eslint-disable react/require-default-props */
import Debug from 'debug';
import React from 'react';
import PropTypes from 'prop-types';
// 报错的通用方法
import invariant from 'tiny-invariant';
// 警告的通用方法
import warning from 'tiny-warning';
// 记忆函数
import memoizeOne from 'memoize-one';
import omit from 'lodash/omit';
import { Editor as Controller, SlateTypes } from '@jianghe/slate';

import EVENT_HANDLERS from '../constants/event-handlers';
import OTHER_HANDLERS from '../constants/other-handlers';
import Content from './content';
import ReactPlugin from '../plugins/react';

/**
 * Debug.
 * @type {Function}
 */
const debug = Debug('@jianghe/slate:editor');

/**
 * Editor.
 * @type {Component}
 */
class Editor extends React.Component {
  /**
   * Property types.
   * @type {Object}
   */
  static propTypes = {
    autoCorrect: PropTypes.bool,
    autoFocus: PropTypes.bool,
    className: PropTypes.string,
    defaultValue: SlateTypes.value,
    id: PropTypes.string,
    onChange: PropTypes.func,
    options: PropTypes.object,
    placeholder: PropTypes.any,
    plugins: PropTypes.array,
    readOnly: PropTypes.bool,
    role: PropTypes.string,
    schema: PropTypes.object,
    spellCheck: PropTypes.bool,
    style: PropTypes.object,
    tabIndex: PropTypes.number,
    value: SlateTypes.value.isRequired,
    // 所有事件
    ...EVENT_HANDLERS.reduce((obj, handler) => {
      obj[handler] = PropTypes.func;
      return obj;
    }, {}),
    ...OTHER_HANDLERS.reduce((obj, handler) => {
      obj[handler] = PropTypes.func;
      return obj;
    }, {}),
  }

  /**
   * Default properties.
   * @type {Object}
   */
  static defaultProps = {
    autoFocus: false,
    autoCorrect: true,
    onChange: () => {},
    options: {},
    placeholder: '',
    plugins: [],
    readOnly: false,
    schema: {},
    spellCheck: true,
    className: '',
  }

  /**
   * Initial state.
   * @type {Object}
   */
  state = {
    // eslint-disable-next-line react/destructuring-assignment
    value: this.props.defaultValue,
    contentKey: 0,
  }

  /**
   * Temporary values.
   * 挂载在Editor React实例上 用来记录临时状态
   * @type {Object}
   */
  tmp = {
    // 组件是否准备好
    mounted: false,
    change: null,
    // 决定次数
    resolves: 0,
    // 更新次数
    updates: 0,
    // 编辑器content的真实dom
    contentRef: React.createRef(),
  }

  /**
   * When the component first mounts, flush a queued change if one exists.
   */
  componentDidMount() {
    const { autoFocus } = this.props;
    this.tmp.mounted = true;
    // 每次render完updates+1
    this.tmp.updates++;
    if (autoFocus) {
      // 每次render完自动Focus
      this.focus();
    }
    if (this.tmp.change) {
      this.handleChange(this.tmp.change);
      this.tmp.change = null;
    }
  }

  /**
   * When the component updates, flush a queued change if one exists.
   */
  componentDidUpdate() {
    this.tmp.updates++;
    if (this.tmp.change) {
      this.handleChange(this.tmp.change);
      this.tmp.change = null;
    }
  }

  /**
   * When the component unmounts, make sure async commands don't trigger react updates.
   */
  componentWillUnmount() {
    this.tmp.mounted = false;
  }


  /**
   * Render the editor.
   * @return {Element}
   */
  render() {
    debug('render', this);

    // Re-resolve the controller if needed based on memoized props.
    const {
      commands, placeholder, plugins, queries, schema,
    } = this.props;

    /**
     * 处理插件
     * 注册插件
     * 实例化对象
     * 执行onConstruct
     */
    this.resolveController(
      plugins,
      schema,
      commands,
      queries,
      placeholder,
      ReactPlugin,
    );

    // Set the current props on the controller.
    const { options, readOnly, value: valueFromProps } = this.props;
    const { value: valueFromState } = this.state;
    const value = valueFromProps || valueFromState;
    const { contentKey } = this.state;
    this.controller.setReadOnly(readOnly);
    // 将value绑定到editor.value下
    this.controller.setValue(value, options);

    const {
      autoCorrect,
      className,
      id,
      role,
      spellCheck,
      tabIndex,
      style,
      tagName,
    } = this.props;

    /**
     * 取出this.props中非Editor.propTypes的属性生成新对象，
     * 非Editor.propTypes属性就是dom属性
     */
    // eslint-disable-next-line react/forbid-foreign-prop-types
    const domProps = omit(this.props, Object.keys(Editor.propTypes));

    // 真正的内容组件
    const children = (
      <Content
        {...domProps}
        ref={this.tmp.contentRef}
        autoCorrect={autoCorrect}
        className={className}
        contentKey={contentKey}
        editor={this}
        id={id}
        onEvent={(handler, event) => this.run(handler, event)}
        readOnly={readOnly}
        role={role}
        spellCheck={spellCheck}
        style={style}
        tabIndex={tabIndex}
        tagName={tagName}
      />
    );

    // Render the editor's children with the controller.
    // 执行renderEditor拆件渲染出编辑器组件，目前的renderEditor的逻辑就是返回children
    const element = this.controller.run('renderEditor', {
      ...this.props,
      editor: this,
      children,
    });

    return element;
  }

  /**
   * Mimic the API of the `Editor` controller, so that this component instance
   * can be passed in its place to plugins.
   */
  get operations() {
    return this.controller.operations;
  }

  get readOnly() {
    return this.controller.readOnly;
  }

  /**
   * 读取value返回editor.value
   */
  get value() {
    return this.controller.value;
  }

  /**
   * Deprecated.
   */
  get editor() {
    return this.controller.editor;
  }

  // eslint-disable-next-line
  get schema() {
    // 0.42之后不支持读取schema
    invariant(
      false,
      'As of Slate 0.42, the `editor.schema` property no longer exists, and its functionality has been folded into the editor itself. Use the `editor` instead.',
    );
  }

  // eslint-disable-next-line
  get stack() {
    // 0.42之后不支持读取stack
    invariant(
      false,
      'As of Slate 0.42, the `editor.stack` property no longer exists, and its functionality has been folded into the editor itself. Use the `editor` instead.',
    );
  }

  // eslint-disable-next-line
  hasCommand(...args) {
    return this.controller.hasCommand(...args);
  }

  /**
   * Resolve an editor controller from the passed-in props. This method takes
   * all of the props as individual arguments to be able to properly memoize
   * against anything that could change and invalidate the old editor.
   * 处理插件
   * 注册插件
   * 实例化对象
   * 执行onConstruct
   * @param {Array} plugins
   * @param {Object} schema
   * @param {Object} commands
   * @param {Object} queries
   * @param {String} placeholder
   * @return {Editor}
   */
  resolveController = memoizeOne(
    // eslint-disable-next-line no-unused-vars
    (plugins = [], schema, commands, queries, placeholder, TheReactPlugin) => {
      // If we've resolved a few times already, and it's exactly in line with
      // the updates, then warn the user that they may be doing something wrong.
      warning(
        this.tmp.resolves < 5 || this.tmp.resolves !== this.tmp.updates,
        'A Slate <Editor> component is re-resolving the `plugins`, `schema`, `commands`, `queries` or `placeholder` prop on each update, which leads to poor performance. This is often due to passing in a new references for these props with each render by declaring them inline in your render function. Do not do this! Declare them outside your render function, or memoize them instead.',
      );

      // 决定次数++
      this.tmp.resolves++;
      // 处理插件
      const react = TheReactPlugin({
        ...this.props,
        editor: this,
        // eslint-disable-next-line react/destructuring-assignment
        value: this.props.value || this.state.value,
      });

      /**
       * onChange方法
       * @param {*} change 改变的对象
       */
      const onChange = (change) => {
        if (this.tmp.mounted) {
          // 已经准备好
          this.handleChange(change);
        } else {
          // 临时记录数据
          this.tmp.change = change;
        }
      };

      /**
       * 实例化editor实例,将插件, onchange方法, Editor React实例传给构造方法
       */
      this.controller = new Controller(
        {
          plugins: [react],
          onChange,
        },
        {
          controller: this,
          construct: false,
        },
      );

      // 执行onConstruct插件
      // 每一个Commands插件和Queries插件都有一个onConstruct方法
      this.controller.run('onConstruct');
    },
  )

  getFlag(...args) {
    return this.controller.getFlag(...args);
  }

  setOperationFlag(...args) {
    return this.controller.setOperationFlag(...args);
  }

  hasQuery(...args) {
    return this.controller.hasQuery(...args);
  }

  normalize(...args) {
    return this.controller.normalize(...args);
  }

  query(...args) {
    return this.controller.query(...args);
  }

  /**
   * 注册command的静态方法
   * @param  {...any} args 指令名
   */
  registerCommand(...args) {
    // 调用editor模型实例的registerCommand方法
    return this.controller.registerCommand(...args);
  }

  /**
   * 注册quire的静态方法
   * @param  {...any} args
   */
  registerQuery(...args) {
    // 调用editor模型实例的registerQuery
    return this.controller.registerQuery(...args);
  }

  /**
   * 执行插件
   * @param  {...any} args
   */
  run(...args) {
    return this.controller.run(...args);
  }

  withoutNormalizing(...args) {
    return this.controller.withoutNormalizing(...args);
  }


  call(...args) {
    return this.controller.call(...args);
  }

  change(...args) {
    return this.controller.change(...args);
  }

  onChange(...args) {
    return this.controller.onChange(...args);
  }

  applyOperations(...args) {
    return this.controller.applyOperations(...args);
  }


  command(...args) {
    return this.controller.command(...args);
  }

  applyOperation(...args) {
    return this.controller.applyOperation(...args);
  }

  /**
   * value 改变时
   * @param {*} change
   */
  handleChange(change) {
    const { onChange } = this.props;
    const { value } = this.state;
    if (value) {
      // Syncing value inside this component since parent does not want control of it (defaultValue was used)
      this.setState({ value: change.value });
    }
    onChange(change);
  }

  unsetOperationFlag(...args) {
    return this.controller.unsetOperationFlag(...args);
  }

  withoutNormalization(...args) {
    return this.controller.withoutNormalization(...args);
  }
}

/**
 * Export.
 *
 * @type {Component}
 */

export default Editor;
