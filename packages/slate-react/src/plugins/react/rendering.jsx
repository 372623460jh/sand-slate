/* eslint-disable react/prop-types */
import React from 'react';

/**
 * The default rendering behavior for the React plugin.
 * 默认的render插件
 * @return {Object}
 */
function Rendering() {
  return {
    decorateNode() {
      return [];
    },

    renderAnnotation({ attributes, children }) {
      return <span {...attributes}>{children}</span>;
    },

    renderBlock({ attributes, children }) {
      return (
        <div {...attributes} style={{ position: 'relative' }}>
          {children}
        </div>
      );
    },

    renderDecoration({ attributes, children }) {
      return <span {...attributes}>{children}</span>;
    },

    renderDocument({ children }) {
      return children;
    },

    /**
     * 用于返回编辑器组件的插件，改插件可对children进行自定制包装
     * @param {*} param0
     */
    renderEditor({ children }) {
      return children;
    },

    renderInline({ attributes, children }) {
      return (
        <span {...attributes} style={{ position: 'relative' }}>
          {children}
        </span>
      );
    },

    renderMark({ attributes, children }) {
      return <span {...attributes}>{children}</span>;
    },
  };
}

/**
 * Export.
 * @type {Function}
 */
export default Rendering;
