import Debug from 'debug';

import { IS_ANDROID } from '@jianghe/slate-dev-environment';
import PlaceholderPlugin from '@jianghe/slate-react-placeholder';
import EditorPropsPlugin from './editor-props';
import RenderingPlugin from './rendering';
import CommandsPlugin from './commands';
import QueriesPlugin from './queries';
import DOMPlugin from '../dom';
import RestoreDOMPlugin from './restore-dom';
import DebugEventsPlugin from '../debug/debug-events';
import DebugBatchEventsPlugin from '../debug/debug-batch-events';
import DebugMutationsPlugin from '../debug/debug-mutations';

/**
 * A plugin that adds the React-specific rendering logic to the editor.
 * @param {Object} options
 * @return {Object}
 */
function ReactPlugin(options = {}) {
  const { placeholder = '' } = options;

  /**
   * 处理所有event调试插件输入结果如下
   * {
   *   'onBeforeInput': () => {// log},
   *   'onBlur': () => {// log},
   *   // ...
   *   'onPaste': () => {// log},
   *   'onSelect': () => {// log},
   * }
   */
  const debugEventsPlugin = Debug.enabled('@jianghe/slate:events')
    ? DebugEventsPlugin(options)
    : null;

  /**
   * 处理所有event调试插件输入结果如下
   * {
   *   'onBeforeInput': () => {// pushEvent},
   *   'onBlur': () => {// pushEvent},
   *   // ...
   *   'onPaste': () => {// pushEvent},
   *   'onSelect': () => {// pushEvent},
   * }
   */
  const debugBatchEventsPlugin = Debug.enabled('@jianghe/slate:batch-events')
    ? DebugBatchEventsPlugin(options)
    : null;

  const debugMutationsPlugin = Debug.enabled('@jianghe/slate:mutations')
    ? DebugMutationsPlugin(options)
    : null;

  /**
   * 返回默认的render plugins
   * 包括renderBlock，renderInline等
   * {
   *   renderBlock: ()=>{},
   *   renderInline: ()=>{},
   * }
   */
  const renderingPlugin = RenderingPlugin(options);

  /**
   * 返回默认指令插件
   * {
   *   commands: {
   *     reconcileNode,
   *     reconcileDOMNode,
   *   },
   * }
   */
  const commandsPlugin = CommandsPlugin(options);

  /**
   * 返回默认queries插件
   *  {
   *     queries: {
   *       findDOMNode,
   *       findDOMPoint,
   *       findDOMRange,
   *       findEventRange,
   *       findNode,
   *       findPath,
   *       findPoint,
   *       findRange,
   *       findSelection,
   *     },
   *   }
   */
  const queriesPlugin = QueriesPlugin(options);

  /**
   * 用来过滤掉多余/不合法的入参props
   * {
   *    onBeforeInput: () => {},
   *    onBlur: () => {},
   *    onClick: () => {},
   *    onContextMenu: () => {},
   *    // ...
   *    renderBlock: () => {},
   * }
   */
  const editorPropsPlugin = EditorPropsPlugin(options);

  /**
   * dom相关插件和plugin插件
   * [
   *    beforePlugin:{},
   *    ...plugin,
   *    afterPlugin:{},
   * ]
   */
  const domPlugin = DOMPlugin(options);

  /**
   * restoreDOM指令
   * {
   *    commands: {
   *        restoreDOM,
   *    },
   * }
   */
  const restoreDomPlugin = RestoreDOMPlugin();

  // Disable placeholder for Android because it messes with reconciliation
  // and doesn't disappear until composition is complete.
  // e.g. In empty, type "h" and autocomplete on Android 9 and deletes all text.
  const placeholderPlugin = IS_ANDROID
    ? null
    : PlaceholderPlugin({
      placeholder,
      when: (editor, node) => node.object === 'document'
          && node.text === ''
          && node.nodes.size === 1
          && Array.from(node.texts()).length === 1,
    });

  return [
    debugEventsPlugin,
    debugBatchEventsPlugin,
    debugMutationsPlugin,
    editorPropsPlugin,
    domPlugin,
    restoreDomPlugin,
    placeholderPlugin,
    renderingPlugin,
    commandsPlugin,
    queriesPlugin,
  ];
}

/**
 * Export.
 * @type {Function}
 */
export default ReactPlugin;
