[![Build Status](https://travis-ci.org/webdeveloperpr/draft-js-custom-styles.svg?branch=master)](https://travis-ci.org/webdeveloperpr/draft-js-custom-styles)
# draft-js-custom-styles

This package allows you to use custom inline styles and also export them so they can be
rendered to using `draft-js-export-html` package

It will export:
 - default inline styles (BOLD, ITALIC, UNDERLINE, etc)
 - customStyleMap (Your customStyleMap styles that you will pass to the editor)
 - customStyles (Your custom styles)
 
## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
- [Example](#example)
- [Support](#support)
- [Contributing](#contributing)

## Installation

```sh
npm i --save draft-js-custom-styles
```

## Usage

 Pass an array of css properties to the createStyles function. 
 prefix and the customStyleMaps are optional
 ```javascript
 import createStyles from 'draft-js-custom-styles';
 const { styles, customStyleFn, exporter } = createStyles(['font-size', 'color'], 'PREFIX', customStyleMap);
 ```
 You will have access to new functions to add, remove, toggle the new styles.
 
 ```javascript
 
 // color
 const toggleColor = styles.color.toggle;
 const addColor = styles.color.add;
 const removeColor = styles.color.remove;
 const currentColor = styles.color.current;

 // fontSize
 const toggleFontSize = styles.fontSize.toggle;
 const addFontSize = styles.fontSize.add;
 const removeFontSize = styles.fontSize.remove;
 const currentFontSize = styles.fontSize.current
```

## API

```javascript
 const { styles, customStyleFn, exporter } = createStyles(['font-size', 'color', 'text-transform'], 'PREFIX_', customStyleMap);
```
**styles**

 - .add(editorState, cssPropertyVal)
 Adds a new customStyle
 
 - .remove(editorState)
 Removes a customStyle
 
 - .toggle(editorState, cssPropVal)
 Toggles a customStyle

 - .current(editorState)
 Returns the current value of the custom style

 **How to use the exporter?**
 
 If you are using `draft-js-export-html`. you can export the inline styles with by passing
 the exporter your editorState.

```javascript
     const inlineStyles = exporter(this.state.editorState);
     const html = stateToHTML(this.state.editorState.getCurrentContent(), { inlineStyles });
 ```
 
## Example
 
 ```javascript
 import React from 'react';
 import { Editor, convertToRaw } from 'draft-js';
 import { stateToHTML } from 'draft-js-export-html';
 import Raw from 'draft-js-raw-content-state';
 import createStyles from 'draft-js-custom-styles';
 
const customStyleMap = {
  MARK: {
    backgroundColor: 'Yellow',
    fontStyle: 'italic',
  },
};
 
// Passing the customStyleMap is optional
 const { styles, customStyleFn, exporter } = createStyles(['font-size', 'color', 'text-transform'], 'CUSTOM_', customStyleMap);
 
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
           r
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
 ```

## Support

Please [open an issue](https://github.com/webdeveloperpr/draft-js-custom-styles/issues) for support.

## Contributing

Please contribute using [Github Flow](https://guides.github.com/introduction/flow/). Create a branch, add commits, and [open a pull request](https://github.com/webdeveloperpr/draft-js-custom-styles/pulls).

