import EVENT_HANDLERS from '../../constants/event-handlers';

/**
 * This plugin prevents events from going any further and is useful in dev.
 *
 * The purpose is to see how the editor events and mutations behave without
 * the noise of the editor also adding its own events and mutations.
 *
 * IMPORTANT:
 *
 * This plugin is detached (i.e. there is no way to turn it on in Slate).
 * You must hard code it into `plugins/react/index`.
 * @return {Object}
 */
function NoopPlugin() {
  /**
   * Plugin Object
   * @type {Object}
   */
  const plugin = {};

  // eslint-disable-next-line no-restricted-syntax
  for (const eventName of EVENT_HANDLERS) {
    // eslint-disable-next-line no-unused-vars
    plugin[eventName] = (event, editor, next) => {};
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
export default NoopPlugin;
