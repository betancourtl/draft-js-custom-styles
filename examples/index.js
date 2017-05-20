import React from 'react';
import { Editor, EditorState, convertToRaw } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import createStyles from '../src';

const { styles, customStyleFn, exporter } = createStyles(['font-size', 'color', 'text-transform']);

class RichEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: EditorState.createEmpty(),
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
    console.log(JSON.stringify(convertToRaw(this.state.editorState.getCurrentContent()), null, 2));
    const inlineStyles = exporter(this.state.editorState);
    const html = stateToHTML(this.state.editorState.getCurrentContent(), { inlineStyles });
    const options = x => x.map(fontSize => {
      return <option key={fontSize} value={fontSize}>{fontSize}</option>;
    });
    return (
      <div style={{ display: 'flex', padding: '15px' }}>
        <div style={{ flex: 1 }}>
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
          <select onChange={e => this.toggleFontSize(e.target.value)}>
            {options(['12px', '24px', '36px', '50px'])}
          </select>
          <select onChange={e => this.toggleColor(e.target.value)}>
            {options(['green', 'blue', 'red', 'purple'])}
          </select>
          <select onChange={e => this.toggleTextTransform(e.target.value)}>
            {options(['uppercase', 'capitalize'])}
          </select>
        </div>
        <div style={{ flex: '2 1 0' }}>
          <h2>Draft-JS Editor</h2>
          <Editor
            customStyleFn={customStyleFn}
            editorState={editorState}
            onChange={this.updateEditorState}
            onTab={this.onTab}
            placeholder="Tell a story..."
            readOnly={this.state.readOnly}
            spellCheck
          />
        </div>
        <div style={{ flex: '2 1 0' }}>
          <h2>Exported To HTML</h2>
          <div dangerouslySetInnerHTML={{ __html: html }}/>
        </div>
      </div>
    );
  }
}

export default RichEditor;
