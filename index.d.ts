declare module 'draft-js-custom-styles' {
  import { CSSProperties } from 'react';
  import { DraftStyleMap, EditorState, DraftInlineStyle, ContentBlock } from 'draft-js';

  export interface Styles {
    [key: string]: {
      add: (state: EditorState, value: CSSProperties) => EditorState;
      remove: (state: EditorState, value: CSSProperties) => EditorState;
      toggle: (state: EditorState, value: CSSProperties) => EditorState;
      current: (state: EditorState) => CSSProperties[keyof CSSProperties];
      styleFn: (state: EditorState, value: CSSProperties) => EditorState;
    };
  }

  interface CustomStylesResult {
    customStyleFn?: (style: DraftInlineStyle, block: ContentBlock) => DraftStyleMap;
    styles: Styles;
    exporter: (editorState: EditorState) => {
      [key: string]: {
        style: CSSProperties;
      };
    };
  }

  export default function(
    customStyles: string[],
    prefix: string,
  ): CustomStylesResult;
}
