import Debug from 'debug';
import EVENT_HANDLERS from '../../constants/event-handlers';
import stringifyEvent from './stringify-event';

/**
 * Debug events function.
 * @type {Function}
 */
const debug = Debug('@jianghe/slate:events');

/**
 * A plugin that sends short easy to digest debug info about each event to
 * browser.
 * 该插件将EVENT_HANDLERS中的所有事件添加一个默认处理方法，
 * @return {Object}
 */
function DebugEventsPlugin() {
  /**
   * Plugin Object
   * @type {Object}
   */
  const plugin = {};

  // eslint-disable-next-line no-restricted-syntax
  for (const eventName of EVENT_HANDLERS) {
    plugin[eventName] = (event, editor, next) => {
      const s = stringifyEvent(event);
      debug(s);
      next();
    };
  }

  /**
   * Return the plugin.
   * @type {Object}
   */
  return plugin;
}

/**
 * Export.
 * @type {Function}
 */
export default DebugEventsPlugin;
