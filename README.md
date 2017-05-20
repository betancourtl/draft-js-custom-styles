# draft-js-custom-styles
Create custom inline styles without having to define a customStyleMap

This package allows you to completely remove the customStyleMap functionality with a more dynamic one, using customStyleFn.

## How to use 

```javascript
import React from 'react';
import { Editor, EditorState } from 'draft-js';

// import the createStyles function
import { createStyles } from './features/customStyles';

// Define css properties you want to toggle, add, remove
const { styles, customStyleFn } = createStyles(['font-size', 'color']);

class RichEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: EditorState.createEmpty(),
      readOnly: false,
    };
    this.updateEditorState = editorState => this.setState({ editorState });
  }

// Define the toggle function for fontSize
  toggleFontSize = fontSize => {
    const newEditorState = styles.fontSize.toggle(this.state.editorState, fontSize);

    return this.updateEditorState(newEditorState);
  };

// Define the toggle function for color
  toggleColor = color => {
    const newEditorState = styles.color.toggle(this.state.editorState, color);

    return this.updateEditorState(newEditorState);
  };

  render() {
    const { editorState } = this.state;
    const options = x => x.map(fontSize => {
      return <option key={fontSize} value={fontSize}>{fontSize}</option>;
    });
    return (
      <div className="text-editor-component">
        
         {# Define here the font-sizes #}
        <select onChange={e => this.toggleFontSize(e.target.value)}>
          {options(['12px', '24px', '36px'])}
        </select>

        {# Define here the colors #}
        <select onChange={e => this.toggleColor(e.target.value)}>
          {options(['green', 'blue', 'red'])}
        </select>
        <div className="text-editor">
        {# Pass the customStyleFn here  #}
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
      </div>
    );
  }
}

export default RichEditor;

```
