import React from 'react';
import { Editor, convertToRaw, RichUtils } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import Raw from 'draft-js-raw-content-state';
import createStyles from '../src';

const customStyleMap = {
  MARK: {
    backgroundColor: 'Yellow',
    fontStyle: 'italic',
  },
};

const { styles, customStyleFn, exporter } = createStyles(['color', 'font-size', 'text-transform'], 'CUSTOM_', customStyleMap);

class RichEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: new Raw().addBlock('Hello World', 'header-two').toEditorState(),
      readOnly: false,
    };
    this.updateEditorState = editorState => this.setState({ editorState });
  }

  toggleFontSize = fontSize => {
    const newEditorState = styles.fontSize.toggle(this.state.editorState, fontSize);

    return this.updateEditorState(newEditorState);
  };

  removeFontSize = () => {
    const newEditorState = styles.fontSize.remove(this.state.editorState);

    return this.updateEditorState(newEditorState);
  };

  addFontSize = val => () => {
    const newEditorState = styles.fontSize.add(this.state.editorState, val);

    return this.updateEditorState(newEditorState);
  };

  toggleColor = color => {
    const newEditorState = styles.color.toggle(this.state.editorState, color);

    return this.updateEditorState(newEditorState);
  };

  toggleTextTransform = color => {
    const newEditorState = styles.textTransform.toggle(this.state.editorState, color);

    return this.updateEditorState(newEditorState);
  };

  render() {
    const { editorState } = this.state;
    const inlineStyles = exporter(this.state.editorState);
    const html = stateToHTML(this.state.editorState.getCurrentContent(), { inlineStyles });
    const options = x => x.map(fontSize => {
      return <option key={fontSize} value={fontSize}>{fontSize}</option>;
    });
    return (
      <div style={{ display: 'flex', padding: '15px' }}>
        <div style={{ flex: '1 0 25%' }}>
          <button onClick={() => this.updateEditorState(
            RichUtils.toggleInlineStyle(this.state.editorState, 'ITALIC'))}>
            ITALIC
          </button>
          <button onClick={() => this.updateEditorState(
            RichUtils.toggleInlineStyle(this.state.editorState, 'ITALIC'))}>
            CustomStyleMap Styles
          </button>
          <button
            onClick={this.removeFontSize}
          >
            Remove FontSize
          </button>
          <button
            onClick={this.addFontSize('24px')}
          >
            Add FontSize
          </button>
          <button
            onClick={() => this.toggleFontSize('70px')}
          >
            toggle FontSize
          </button>
          <select onChange={e => this.toggleFontSize(e.target.value)}>
            {options(['12px', '24px', '36px', '50px', '72px'])}
          </select>
          <select onChange={e => this.toggleColor(e.target.value)}>
            {options(['green', 'blue', 'red', 'purple', 'orange'])}
          </select>
          <select onChange={e => this.toggleTextTransform(e.target.value)}>
            {options(['uppercase', 'capitalize'])}
          </select>
        </div>
        <div style={{ flex: '1 0 25%' }}>
          <h2>Draft-JS Editor</h2>
          <Editor
            customStyleFn={customStyleFn}
            customStyleMap={customStyleMap}
            editorState={editorState}
            onChange={this.updateEditorState}
            onTab={this.onTab}
            placeholder="Tell a story..."
            readOnly={this.state.readOnly}
            spellCheck
          />
        </div>
        <div style={{ flex: '1 0 25%' }}>
          <h2>Exported To HTML</h2>
          <div dangerouslySetInnerHTML={{ __html: html }}/>
        </div>
        <div style={{ flex: '1 0 25%' }}>
          <h2>ContentState</h2>
          <div>
            <pre>
              {JSON.stringify(convertToRaw(this.state.editorState.getCurrentContent()), null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }
}

export default RichEditor;
