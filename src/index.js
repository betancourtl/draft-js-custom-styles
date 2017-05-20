import { EditorState, Modifier, convertToRaw } from 'draft-js';
import { Map } from 'immutable';
import camelCase from 'lodash.camelcase';
import snakeCase from 'lodash.snakecase';

// This functionality has been taken from draft-js and modified for re-usability purposes.
// Maps over the selected characters, and applies a function to each character.
// Characters are of type CharacterMetadata.
export const mapSelectedCharacters = callback => editorState => {
  const contentState = editorState.getCurrentContent();
  const selectionState = editorState.getSelection();
  const blockMap = contentState.getBlockMap();
  const startKey = selectionState.getStartKey();
  const startOffset = selectionState.getStartOffset();
  const endKey = selectionState.getEndKey();
  const endOffset = selectionState.getEndOffset();

  const newBlocks = blockMap.skipUntil((_, k) => {
    return k === startKey;
  }).takeUntil((_, k) => {
    return k === endKey;
  }).concat(Map([[endKey, blockMap.get(endKey)]])).map((block, blockKey) => {
    let sliceStart;
    let sliceEnd;

    // sliceStart -> where the selection starts
    // endSlice -> Where the selection ends

    // Only 1 block selected
    if (startKey === endKey) {
      sliceStart = startOffset;
      sliceEnd = endOffset;
      // Gets the selected characters of the block when multiple blocks are selected.
    } else {
      sliceStart = blockKey === startKey ? startOffset : 0;
      sliceEnd = blockKey === endKey ? endOffset : block.getLength();
    }

    // Get the characters of the current block
    let chars = block.getCharacterList();
    let current;
    while (sliceStart < sliceEnd) {
      current = chars.get(sliceStart);
      const newChar = callback(current);
      chars = chars.set(sliceStart, newChar);
      sliceStart++;
    }

    return block.set('characterList', chars);
  });

  const newContentState = contentState.merge({
    blockMap: blockMap.merge(newBlocks),
    selectionBefore: selectionState,
    selectionAfter: selectionState,
  });

  return EditorState.push(editorState, newContentState, 'change-inline-style');
};

const filterDynamicStyle = prefix => char => {
  const charStyles = char.get('style');
  const filteredStyles = charStyles.filter(style => !style.startsWith(prefix));
  return char.set('style', filteredStyles);
};

const addStyle = prefix => (editorState, style) => {
  const newContentState = Modifier.applyInlineStyle(
    editorState.getCurrentContent(),
    editorState.getSelection(),
    prefix + style
  );
  return EditorState.push(editorState, newContentState, 'change-inline-style');
};

const removeStyle = prefix => editorState => {
  console.log('triggered');
  return mapSelectedCharacters(filterDynamicStyle(prefix))(editorState);
};

const toggleStyle = prefix => (editorState, value) => {
  const style = prefix + value;
  const editorStateWithoutColorStyles = removeStyle(prefix)(editorState);
  const currentInlineStyles = editorState.getCurrentInlineStyle();
  if (!currentInlineStyles.has(style)) {
    return addStyle(prefix)(editorStateWithoutColorStyles, value);
  }

  return EditorState.forceSelection(editorStateWithoutColorStyles, editorState.getSelection());
};

const styleFn = (prefix, cssProp) => currentStyles => {
  if (!currentStyles.size) {
    return {};
  }
  const value = currentStyles.filter(val => val.startsWith(prefix)).first();
  if (value) {
    const newVal = value.replace(prefix, '');
    return { [camelCase(cssProp)]: newVal };
  }
  return {};
};

const currentStyle = prefix => editorState => {
  const selectionStyles = editorState.getCurrentInlineStyle();
  if (!selectionStyles.size) {
    return '';
  }

  const result = selectionStyles.filter(style => style.startsWith(prefix)).first();

  return result ? result.replace(prefix, '') : result;
};

export const createCustomStyles = (prefix, conf) => {
  return conf.reduce((acc, prop) => {
    const camelCased = camelCase(prop);
    const newPrefix = `${prefix}${snakeCase(prop).toUpperCase()}_`;
    const copy = { ...acc };
    copy[camelCased] = {
      add: addStyle(newPrefix),
      remove: removeStyle(newPrefix),
      toggle: toggleStyle(newPrefix),
      current: currentStyle(newPrefix),
      styleFn: styleFn(newPrefix, prop),
    };

    return copy;
  }, {});
};

// customStyleFns
export const customStyleFns = fnList => prefixedStyle => {
  return fnList.reduce((css, fn) => {
    return { ...css, ...fn(prefixedStyle) };
  }, {});
};

// exporter
export const getInlineStyles = (acc, block) => {
  const styleRanges = block.inlineStyleRanges;
  if (styleRanges && styleRanges.length) {
    const result = styleRanges.map(style => style.style);

    return acc.concat(result);
  }
  return acc;
};

export const createInlineStyleExportObject = prefix => (acc, style) => {
  const regex = new RegExp(`${prefix}(.+)_(.+)`);
  const match = style.match(regex);
  const css = match[1].toLowerCase();
  const value = match[2].toLowerCase();
  const inlineStyle = {
    [style]: {
      style: {
        [camelCase(css)]: value,
      },
    },
  };

  return Object.assign({}, acc, inlineStyle);
};

export const inlineStyleExporter = prefix => editorState => {
  const inlineStyles =
    convertToRaw(editorState.getCurrentContent()).blocks.reduce(getInlineStyles, []);
  if (!inlineStyles.length) return {};
  return inlineStyles.reduce(createInlineStyleExportObject(prefix), {});
};

export default (conf, prefix = 'CUSTOM_') => {
  const styles = createCustomStyles(prefix, conf);
  const fnList = Object.keys(styles).map(style => styles[style].styleFn);
  const customStyleFn = customStyleFns(fnList);
  const exporter = inlineStyleExporter(prefix);

  return {
    styles,
    customStyleFn,
    exporter,
  };
};
