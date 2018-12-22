import React from 'react';
import { stateToHTML } from 'draft-js-export-html';
import { stateFromHTML } from 'draft-js-import-html';
import { Editor, convertToRaw, EditorState } from 'draft-js';
import createStyles from '../src';

const customStyleMap = {
  MARK: {
    backgroundColor: 'Yellow',
    fontStyle: 'italic',
  },
};

const { styles, customStyleFn, exporter, customInlineFn } = createStyles(['color', 'font-size'], 'CUSTOM_', customStyleMap);

const html = `
<span style="color: blue; font-size: 46px;border-bottom: 10px solid red;">
  Hello <span style="color:red;font-size:12px;">Hello</span>
</span>
`;

const Button = props => <button onMouseDown={e => e.preventDefault()} {...props} />;

class RichEditor extends React.Component {  
  constructor(props) {
    super(props);
    ``
    this.state = {
      html: html,
      editorState: EditorState.createWithContent(stateFromHTML(html, {
        customInlineFn: customInlineFn(),
      })),
      readOnly: false,
    };
    this.updateEditorState = (editorState, cb) => this.setState({ editorState }, cb);
    this.setEditorRef = ref => this.editorRef = ref;    
  }

  focusEditor = () => {
    setTimeout(this.editorRef.focus, 5);
  };

  toggleFontSize = fontSize => {
    const newEditorState = styles.fontSize.toggle(this.state.editorState, fontSize);

    return this.updateEditorState(newEditorState);
  };

  removeFontSize = () => {
    const newEditorState = styles.fontSize.remove(this.state.editorState);

    return this.updateEditorState(newEditorState);
  };

  toggleColor = color => {
    const newEditorState = styles.color.toggle(this.state.editorState, color);

    return this.updateEditorState(newEditorState, this.focusEditor);
  };

  addColor = color => {
    const newEditorState = styles.color.add(this.state.editorState, color);

    return this.updateEditorState(newEditorState, this.focusEditor);
  };

  render() {

    const { editorState } = this.state;
    const inlineStyles = exporter(this.state.editorState);
    const html = stateToHTML(this.state.editorState.getCurrentContent(), { inlineStyles });

    return (
      <div>
      <div>
        <textarea 
          style={{width: '100%'}}
          cols={10}
          rows={10}
          onChange={(e) => this.setState({html: e.target.value})}
          value={this.state.html}
        >
        </textarea>
        <button onClick={() => {
          const html = this.state.html;
          try {
            const editorState = EditorState.createWithContent(stateFromHTML(html, {customInlineFn: customInlineFn()}));
            this.setState({ editorState });
          } catch (err) {
            console.log('Error setting  EditorState');
        }}}>
          Import HTML
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', padding: '15px' }}>
        <div style={{ flex: '0 0 25%' }}>
          <div>
            <h2>Toggle Colors</h2>
            <Button
              style={{ background: styles.color.current(this.state.editorState) === 'red' ? 'red' : null }}
              onClick={() => this.toggleColor('red')}
            >
              red
            </Button>
            <Button
              style={{ background: styles.color.current(this.state.editorState) === 'blue' ? 'blue' : null }}
              onClick={() => this.toggleColor('blue')}
            >
              blue
            </Button>
          </div>
          <div>
            <h2>Add Colors</h2>
            <Button
              style={{ background: styles.color.current(this.state.editorState) === 'red' ? 'red' : null }}
              onClick={() => this.addColor('red')}
            >
              red
            </Button>
            <Button
              style={{ background: styles.color.current(this.state.editorState) === 'blue' ? 'blue' : null }}
              onClick={() => this.addColor('blue')}
            >
              blue
            </Button>
          </div>
          <div>
            <h2>Toggle font Size</h2>
            <Button
              onClick={this.removeFontSize}
            >
              Remove FontSize
            </Button>
            <Button
              onClick={() => this.toggleFontSize('70px')}
            >
              toggle FontSize
            </Button>
          </div>
        </div>
        <div style={{ flex: '0 0 25%' }} onClick={this.focusEditor}>
          <h2>Draft-JS Editor</h2>
          <Editor
            ref={this.setEditorRef}
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
        <div style={{ flex: '0 0 25%' }}>
          <h2>Exported To HTML</h2>
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
        <div style={{ flex: '0 0 25%' }}>
          <h2>ContentState</h2>
          <div>
            <pre>
              {JSON.stringify(convertToRaw(this.state.editorState.getCurrentContent()), null, 2)}
            </pre>
          </div>
        </div>
      </div>
      </div>
    );
  }
}

export default RichEditor;
