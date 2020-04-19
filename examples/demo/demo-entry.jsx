import React from 'react';
import ReactDOM from 'react-dom';
import { Value } from '@jianghe/slate';
import { Editor } from '@jianghe/slate-react';
import { Button, Icon } from 'antd';
import styles from './index.module.less';

import initialValue from './value.json';

class History extends React.Component {
  state = {
    value: Value.fromJSON(initialValue),
  }

  ref = (editor) => {
    this.editor = editor;
  }

  onChange = (change) => {
    this.setState({ value: change.value });
  }

  onClickRedo = (event) => {
    event.preventDefault();
    this.editor.redo().focus();
  }

  onClickUndo = (event) => {
    event.preventDefault();
    this.editor.undo().focus();
  }

  render() {
    const { value } = this.state;
    const { data } = value;
    const undos = data.get('undos');
    const redos = data.get('redos');
    return (
      <div className={styles.mainBox}>
        <div className={styles.toolbar}>
          <Button onClick={this.onClickUndo}>
            <Icon type="undo" />
          </Button>
          <Button onClick={this.onClickRedo}>
            <Icon type="redo" />
          </Button>
          <span>
            {` Undos: ${undos ? undos.size : 0}`}
          </span>
          <span>
            {` Redos: ${redos ? redos.size : 0}`}
          </span>
        </div>
        <Editor
          placeholder="Enter some text..."
          ref={this.ref}
          value={value}
          className={styles.editorBox}
          onChange={this.onChange}
        />
      </div>
    );
  }
}

ReactDOM.render(<History />, document.getElementById('root'));
