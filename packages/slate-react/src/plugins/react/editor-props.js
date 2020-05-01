import EVENT_HANDLERS from '../../constants/event-handlers';

/**
 * Props that can be defined by plugins.
 * Editor支持的所有props
 * @type {Array}
 */
const PROPS = [
  ...EVENT_HANDLERS,
  'commands',
  'decorateNode',
  'queries',
  'renderAnnotation',
  'renderBlock',
  'renderDecoration',
  'renderDocument',
  'renderEditor',
  'renderInline',
  'renderMark',
  'schema',
];

/**
 * The top-level editor props in a plugin.
 * 用来过滤掉多余/不合法的入参props
 * {
 *    onBeforeInput: () => {},
 *    onBlur: () => {},
 *    onClick: () => {},
 *    onContextMenu: () => {},
 *    // ...
 *    renderBlock: () => {},
 * }
 * @param {Object} options
 * @return {Object}
 */
function EditorPropsPlugin(options = {}) {
  const plugin = PROPS.reduce((memo, prop) => {
    if (prop in options) {
      // 如果prop在Editor的入参props中
      memo[prop] = options[prop];
    }
    return memo;
  }, {});
  return plugin;
}

/**
 * Export.
 * @type {Function}
 */
export default EditorPropsPlugin;
