/* eslint-disable react/require-default-props */
import Debug from 'debug';
import React from 'react';
import PropTypes from 'prop-types';
import getWindow from 'get-window';
import warning from 'tiny-warning';
import throttle from 'lodash/throttle';
import omit from 'lodash/omit';
import { List } from 'immutable';
import {
  IS_ANDROID,
  IS_FIREFOX,
  HAS_INPUT_EVENTS_LEVEL_2,
  IS_CHROME,
} from '@jianghe/slate-dev-environment';
import Hotkeys from '@jianghe/slate-hotkeys';
import EVENT_HANDLERS from '../constants/event-handlers';
import DATA_ATTRS from '../constants/data-attributes';
import SELECTORS from '../constants/selectors';
import Node from './node';
import scrollToSelection from '../utils/scroll-to-selection';
import removeAllRanges from '../utils/remove-all-ranges';

const FIREFOX_NODE_TYPE_ACCESS_ERROR = /Permission denied to access property "nodeType"/;

/**
 * Debug.
 * @type {Function}
 */
const debug = Debug('@jianghe/slate:content');

/**
 * Separate debug to easily see when the DOM has updated either by render or
 * changing selection.
 * @type {Function}
 */
debug.update = Debug('@jianghe/slate:update');

/**
 * Content.
 * @type {Component}
 */
class Content extends React.Component {
  /**
   * Property types.
   * @type {Object}
   */
  static propTypes = {
    autoCorrect: PropTypes.bool.isRequired,
    className: PropTypes.string,
    // this.props.contentKey好像没有用到
    contentKey: PropTypes.number.isRequired,
    editor: PropTypes.object.isRequired,
    id: PropTypes.string,
    onEvent: PropTypes.func.isRequired,
    readOnly: PropTypes.bool.isRequired,
    role: PropTypes.string,
    spellCheck: PropTypes.bool.isRequired,
    style: PropTypes.object,
    tabIndex: PropTypes.number,
    tagName: PropTypes.string,
  }

  /**
   * Default properties.
   * @type {Object}
   */
  static defaultProps = {
    style: {},
    tagName: 'div',
    className: '',
    id: '',
  }

  /**
   * An error boundary. If there is a render error, we increment `errorKey`
   * which is part of the container `key` which forces a re-render from
   * scratch.
   * @param {Error} error
   * @param {String} info
   */
  componentDidCatch(error, info) {
    debug('componentDidCatch', { error, info });
    // The call to `setState` is required despite not setting a value.
    // Without this call, React will not try to recreate the component tree.
    this.setState({});
  }

  /**
   * Temporary values.
   * @type {Object}
   */
  tmp = {
    // 是否在中文输入onComposition中
    isComposing: false,
    // 是否正在更新选区
    isUpdatingSelection: false,
    // node组件的真实dom
    nodeRef: React.createRef(),
    nodeRefs: {},
    contentKey: 0,
    // 原生Selection对象
    nativeSelection: {}, // Native selection object stored to check if `onNativeSelectionChange` has triggered yet
  }

  /**
   * A ref for the contenteditable DOM node.
   * contenteditable的真实dom
   * @type {Object}
   */
  ref = React.createRef()

  /**
   * Set both `this.ref` and `editor.el`
   * 将真实dom绑定到<Editor>实例上
   * @type {DOMElement}
   */
  setRef = (el) => {
    // <Editor>实例
    const { editor } = this.props;
    this.ref.current = el;
    // 将真实dom绑定到<Editor>实例上
    editor.el = el;
  }

  /**
   * Create a set of bound event handlers.
   * 将所有插件的执行方法生成对象并传入到组件中
   * {
   *    onDragEnter: (event) => this.onEvent(handler, event),
   *    // ...
   * }
   * @type {Object}
   */
  handlers = EVENT_HANDLERS.reduce((obj, handler) => {
    obj[handler] = (event) => this.onEvent(handler, event);
    return obj;
  }, {})

  /**
   * When the editor first mounts in the DOM we need to:
   * 当editor第一次mount时需要添加选区改变事件监听和 更新选区
   *   - Add native DOM event listeners.
   *   - Update the selection, in case it starts focused.
   */
  componentDidMount() {
    const { onEvent } = this.props;
    const window = getWindow(this.ref.current);
    // 添加选区改变事件监听
    window.document.addEventListener(
      'selectionchange',
      this.onNativeSelectionChange,
    );
    // COMPAT: Restrict scope of `beforeinput` to clients that support the
    // Input Events Level 2 spec, since they are preventable events.
    if (HAS_INPUT_EVENTS_LEVEL_2) {
      this.ref.current.addEventListener(
        'beforeinput',
        this.handlers.onBeforeInput,
      );
    }
    // 更新Selection
    this.updateSelection();
    // 通过onEvent触发onComponentDidMount插件
    onEvent('onComponentDidMount');
  }

  /**
   * When unmounting, remove DOM event listeners.
   * 卸载时移除监听
   */
  componentWillUnmount() {
    const { onEvent } = this.props;
    const window = getWindow(this.ref.current);
    if (window) {
      window.document.removeEventListener(
        'selectionchange',
        this.onNativeSelectionChange,
      );
    }
    if (HAS_INPUT_EVENTS_LEVEL_2) {
      this.ref.current.removeEventListener(
        'beforeinput',
        this.handlers.onBeforeInput,
      );
    }
    onEvent('onComponentWillUnmount');
  }

  /**
   * On update, update the selection.
   * 组件更新时更新选区
   */
  componentDidUpdate() {
    const { onEvent } = this.props;
    debug.update('componentDidUpdate');
    // 更新选区
    this.updateSelection();
    onEvent('onComponentDidUpdate');
  }

  /**
   * Update the native DOM selection to reflect the internal model.
   * 更新native selection
   */
  updateSelection = () => {
    // <Editor>
    const { editor } = this.props;
    // editor.value
    const { value } = editor;
    // 取出selecion模型实例
    const { selection } = value;
    const { isBackward } = selection;
    const window = getWindow(this.ref.current);
    const native = window.getSelection();
    const { activeElement } = window.document;

    if (debug.update.enabled) {
      debug.update('updateSelection', { selection: selection.toJSON() });
    }

    // COMPAT: In Firefox, there's a but where `getSelection` can return `null`.
    // https://bugzilla.mozilla.org/show_bug.cgi?id=827585 (2018/11/07)
    if (!native) {
      return;
    }

    // rangeCount选区数量
    // 开始节点
    const { rangeCount, anchorNode } = native;
    let updated = false;

    // If the Slate selection is blurred, but the DOM's active element is still
    // the editor, we need to blur it.
    if (selection.isBlurred && activeElement === this.ref.current) {
      this.ref.current.blur();
      updated = true;
    }

    // If the Slate selection is unset, but the DOM selection has a range
    // selected in the editor, we need to remove the range.
    // However we should _not_ remove the range if the selection as
    // reported by `getSelection` is not equal to `this.tmp.nativeSelection`
    // as this suggests `onNativeSelectionChange` has not triggered yet (which can occur in Firefox)
    // See: https://github.com/ianstormtaylor/slate/pull/2995

    const propsToCompare = [
      'anchorNode',
      'anchorOffset',
      'focusNode',
      'focusOffset',
      'isCollapsed',
      'rangeCount',
      'type',
    ];

    let selectionsEqual = true;

    for (const prop of propsToCompare) {
      if (this.tmp.nativeSelection[prop] !== native[prop]) {
        selectionsEqual = false;
      }
    }

    if (
      selection.isUnset
      && rangeCount
      && this.isInEditor(anchorNode)
      && selectionsEqual
    ) {
      removeAllRanges(native);
      updated = true;
    }

    // If the Slate selection is focused, but the DOM's active element is not
    // the editor, we need to focus it. We prevent scrolling because we handle
    // scrolling to the correct selection.
    if (selection.isFocused && activeElement !== this.ref.current) {
      this.ref.current.focus({ preventScroll: true });
      updated = true;
    }

    // Otherwise, figure out which DOM nodes should be selected...
    if (selection.isFocused && selection.isSet) {
      const current = !!native.rangeCount && native.getRangeAt(0);
      const range = editor.findDOMRange(selection);

      if (!range) {
        warning(
          false,
          'Unable to find a native DOM range from the current selection.',
        );

        return;
      }

      const {
        startContainer, startOffset, endContainer, endOffset,
      } = range;

      // If the new range matches the current selection, there is nothing to fix.
      // COMPAT: The native `Range` object always has it's "start" first and "end"
      // last in the DOM. It has no concept of "backwards/forwards", so we have
      // to check both orientations here. (2017/10/31)
      if (current) {
        if (
          (startContainer === current.startContainer
            && startOffset === current.startOffset
            && endContainer === current.endContainer
            && endOffset === current.endOffset)
          || (startContainer === current.endContainer
            && startOffset === current.endOffset
            && endContainer === current.startContainer
            && endOffset === current.startOffset)
        ) {
          return;
        }
      }

      // Otherwise, set the `isUpdatingSelection` flag and update the selection.
      updated = true;
      this.tmp.isUpdatingSelection = true;
      removeAllRanges(native);

      // COMPAT: IE 11 does not support `setBaseAndExtent`. (2018/11/07)
      if (native.setBaseAndExtent) {
        // COMPAT: Since the DOM range has no concept of backwards/forwards
        // we need to check and do the right thing here.
        if (isBackward) {
          native.setBaseAndExtent(
            range.endContainer,
            range.endOffset,
            range.startContainer,
            range.startOffset,
          );
        } else {
          native.setBaseAndExtent(
            range.startContainer,
            range.startOffset,
            range.endContainer,
            range.endOffset,
          );
        }
      } else {
        native.addRange(range);
      }

      // Scroll to the selection, in case it's out of view.
      scrollToSelection(native);

      // Then unset the `isUpdatingSelection` flag after a delay, to ensure that
      // it is still set when selection-related events from updating it fire.
      setTimeout(() => {
        // COMPAT: In Firefox, it's not enough to create a range, you also need
        // to focus the contenteditable element too. (2016/11/16)
        if (IS_FIREFOX && this.ref.current) {
          this.ref.current.focus();
        }

        this.tmp.isUpdatingSelection = false;

        debug.update('updateSelection:setTimeout', {
          anchorOffset: window.getSelection().anchorOffset,
        });
      });
    }

    if (updated && (debug.enabled || debug.update.enabled)) {
      debug('updateSelection', { selection, native, activeElement });

      debug.update('updateSelection:applied', {
        selection: selection.toJSON(),
        native: {
          anchorOffset: native.anchorOffset,
          focusOffset: native.focusOffset,
        },
      });
    }
  }

  /**
   * Check if an event `target` is fired from within the contenteditable
   * element. This should be false for edits happening in non-contenteditable
   * children, such as void nodes and other nested Slate editors.
   * 用来校验target是不是在contenteditable的元素中，如果是发生在不是contenteditable的元素中
   * 则返回false
   * @param {Element} target
   * @return {Boolean}
   */
  isInEditor = (target) => {
    let el;

    try {
      // COMPAT: In Firefox, sometimes the node can be comment which doesn't
      // have .closest and it crashes.
      if (target.nodeType === 8) {
        return false;
      }

      // COMPAT: Text nodes don't have `isContentEditable` property. So, when
      // `target` is a text node use its parent node for check.
      el = target.nodeType === 3 ? target.parentNode : target;
    } catch (err) {
      // COMPAT: In Firefox, `target.nodeType` will throw an error if target is
      // originating from an internal "restricted" element (e.g. a stepper
      // arrow on a number input)
      // see github.com/ianstormtaylor/slate/issues/1819
      if (IS_FIREFOX && FIREFOX_NODE_TYPE_ACCESS_ERROR.test(err.message)) {
        return false;
      }

      throw err;
    }

    return (
      el.isContentEditable
      && (el === this.ref.current
        || el.closest(SELECTORS.EDITOR) === this.ref.current)
    );
  }

  /**
   * On `event` with `handler`.
   * 保证执行slate插件的方法，传入Node的插件属性都会经过该方法的包装
   * @param {String} handler
   * @param {Event} event
   */
  onEvent(handler, event) {
    const { onEvent } = this.props;

    debug('onEvent', handler);

    /**
     * 此处控制中文输入法
     */
    if (handler === 'onCompositionStart') {
      this.tmp.isComposing = true;
    }
    if (handler === 'onCompositionEnd') {
      window.requestAnimationFrame(() => { this.tmp.isComposing = false; });
    }
    if (handler === 'onBeforeInput') {
      // 输入结束后计算光标位置,解决光标错位问题
      if (!IS_CHROME) {
        this.updateSelection();
      }
    }

    const nativeEvent = event.nativeEvent || event;
    const isUndoRedo = event.type === 'keydown'
      && (Hotkeys.isUndo(nativeEvent) || Hotkeys.isRedo(nativeEvent));

    // Ignore `onBlur`, `onFocus` and `onSelect` events generated
    // programmatically while updating selection.
    // 忽略updateSelection/redo/undo导致的触发onSelect/onBlur/onFocus插件执行
    if (
      (this.tmp.isUpdatingSelection || isUndoRedo)
      && (handler === 'onSelect' || handler === 'onBlur' || handler === 'onFocus')
    ) {
      return;
    }

    // COMPAT: There are situations where a select event will fire with a new
    // native selection that resolves to the same internal position. In those
    // cases we don't need to trigger any changes, since our internal model is
    // already up to date, but we do want to update the native selection again
    // to make sure it is in sync. (2017/10/16)
    //
    // ANDROID: The updateSelection causes issues in Android when you are
    // at the end of a block. The selection ends up to the left of the inserted
    // character instead of to the right. This behavior continues even if
    // you enter more than one character. (2019/01/03)
    if (!IS_ANDROID && handler === 'onSelect') {
      const { editor } = this.props;
      const { value } = editor;
      const { selection } = value;
      const window = getWindow(event.target);
      const domSelection = window.getSelection();
      const range = editor.findRange(domSelection);

      if (range && range.equals(selection.toRange()) && !this.tmp.isComposing) {
        this.updateSelection();
        return;
      }
    }

    // Don't handle drag and drop events coming from embedded editors.
    if (
      handler === 'onDragEnd'
      || handler === 'onDragEnter'
      || handler === 'onDragExit'
      || handler === 'onDragLeave'
      || handler === 'onDragOver'
      || handler === 'onDragStart'
      || handler === 'onDrop'
    ) {
      const closest = event.target.closest(SELECTORS.EDITOR);

      if (closest !== this.ref.current) {
        return;
      }
    }

    // Some events require being in editable in the editor, so if the event
    // target isn't, ignore them.
    if (
      handler === 'onBeforeInput'
      || handler === 'onBlur'
      || handler === 'onCompositionEnd'
      || handler === 'onCompositionStart'
      || handler === 'onCopy'
      || handler === 'onCut'
      || handler === 'onFocus'
      || handler === 'onInput'
      || handler === 'onKeyDown'
      || handler === 'onKeyUp'
      || handler === 'onPaste'
      || handler === 'onSelect'
    ) {
      if (!this.isInEditor(event.target)) {
        return;
      }
    }

    onEvent(handler, event);
  }

  /**
   * On native `selectionchange` event, trigger the `onSelect` handler. This is
   * needed to account for React's `onSelect` being non-standard and not firing
   * until after a selection has been released. This causes issues in situations
   * where another change happens while a selection is being made.
   * 原生的选区改变事件回调，节流处理
   * @param {Event} event
   */
  onNativeSelectionChange = throttle((event) => {
    const { readOnly, onEvent } = this.props;
    if (readOnly) return;

    // 获取当前节点对应的window对象
    const window = getWindow(event.target);

    // 活动的节点
    const { activeElement } = window.document;

    // 获取当前原生的Selection情况
    const native = window.getSelection();

    debug.update('onNativeSelectionChange', {
      anchorOffset: native.anchorOffset,
    });

    // 活动的节点不是当前节点
    if (activeElement !== this.ref.current) return;

    // nativeSelection用于保存原生Selection对象
    this.tmp.nativeSelection = {
      anchorNode: native.anchorNode, // 选区起点所在的节点
      anchorOffset: native.anchorOffset, // 选区起点所在的节点的偏移量
      focusNode: native.focusNode, // 选区终点所在的节点
      focusOffset: native.focusOffset, // 选区终点所在节点的偏移量
      isCollapsed: native.isCollapsed, // 起始点和终点是否在同一个位置
      rangeCount: native.rangeCount, // 连续选区的个数
      type: native.type,
    };

    // 通过onEvent方法来触发onSelect插件的执行
    onEvent('onSelect', event);
  }, 100)

  /**
   * Render the editor content.
   * 渲染Node组件
   * @return {Element}
   */
  render() {
    const { props, handlers } = this;
    const {
      id,
      className,
      readOnly,
      editor,
      tabIndex,
      role,
      tagName,
      spellCheck,
      onEvent,
      autoCorrect,
    } = props;
    const { value } = editor;
    const Container = tagName;
    const { document, selection } = value;

    const style = {
      // Prevent the default outline styles.
      outline: 'none',
      // Preserve adjacent whitespace and new lines.
      whiteSpace: 'pre-wrap',
      // Allow words to break if they are too long.
      wordWrap: 'break-word',
      // COMPAT: In iOS, a formatting menu with bold, italic and underline
      // buttons is shown which causes our internal value to get out of sync in
      // weird ways. This hides that. (2016/06/21)
      ...(readOnly ? {} : { WebkitUserModify: 'read-write-plaintext-only' }),
      // Allow for passed-in styles to override anything.
      ...props.style,
    };

    // console.log('rerender content', this.tmp.contentKey, document.text)

    debug('render', { props });
    debug.update('render', this.tmp.contentKey, document.text);

    // 执行onRender插件
    onEvent('onRender');

    const data = {
      [DATA_ATTRS.EDITOR]: true,
      // key应该是在svj -> svi时加上的
      [DATA_ATTRS.KEY]: document.key,
    };

    // eslint-disable-next-line react/forbid-foreign-prop-types
    const domProps = omit(this.props, Object.keys(Content.propTypes));

    // Container 自定制的节点
    return (
      <Container
        {...domProps}
        key={this.tmp.contentKey}
        {...handlers}
        {...data}
        ref={this.setRef}
        contentEditable={readOnly ? null : true}
        suppressContentEditableWarning
        id={id}
        className={className}
        autoCorrect={autoCorrect ? 'on' : 'off'}
        spellCheck={spellCheck}
        style={style}
        role={readOnly ? null : role || 'textbox'}
        tabIndex={tabIndex}
        // COMPAT: The Grammarly Chrome extension works by changing the DOM out
        // from under `contenteditable` elements, which leads to weird behaviors
        // so we have to disable it like this. (2017/04/24)
        // just the existence of the flag is disabling the extension irrespective of its value
        data-gramm={domProps['data-gramm'] ? undefined : false}
      >
        <Node
          annotations={value.annotations}
          block={null}
          decorations={List()}
          editor={editor}
          node={document}
          parent={null}
          readOnly={readOnly}
          selection={selection}
          ref={this.tmp.nodeRef}
        />
      </Container>
    );
  }
}

/**
 * Export.
 * @type {Component}
 */
export default Content;
