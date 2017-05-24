import { EditorState, Modifier, convertToRaw, DefaultDraftInlineStyle } from 'draft-js';
import { Map } from 'immutable';
import camelCase from 'lodash.camelcase';
import snakeCase from 'lodash.snakecase';

const DEFAULT_PREFIX = 'CUSTOM_';

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
  return mapSelectedCharacters(filterDynamicStyle(prefix))(editorState);
};

const removeAndAdd = prefix => (editorState, style) => {
  return addStyle(prefix)(removeStyle(prefix)(editorState), style);
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

/**
 *  style is an OrderedSet type
 */
const styleFn = (prefix, cssProp) => style => {
  if (!style.size) {
    return {};
  }
  const value = style.filter(val => val.startsWith(prefix)).first();
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
      add: removeAndAdd(newPrefix),
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

export const createInlineStyleExportObject = (prefix, customStyleMap) => (acc, style) => {
  // default inline styles
  if (DefaultDraftInlineStyle[style]) {
    return Object.assign({}, acc, {
      [style]: {
        style: DefaultDraftInlineStyle[style],
      },
    });
  }

  // custom styleMap styles
  if (customStyleMap[style]) {
    return Object.assign({}, acc, {
      [style]: {
        style: customStyleMap[style],
      },
    });
  }

  const regex = new RegExp(`${prefix}(.+)_(.+)`);
  const match = style.match(regex);

  // no matches
  if (!match || !match[1] || !match[2]) {
    return acc;
  }

  // custom styles
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

export const inlineStyleExporter = (prefix, customStyleMap) => editorState => {
  const inlineStyles =
    convertToRaw(editorState.getCurrentContent()).blocks.reduce(getInlineStyles, []);
  if (!inlineStyles.length) return {};
  return inlineStyles.reduce(createInlineStyleExportObject(prefix, customStyleMap), {});
};

export const validatePrefix = prefix => {
  if (typeof prefix !== 'string' || !prefix.length) {
    return DEFAULT_PREFIX;
  }

  if (prefix.match(/.+_$/)) {
    return prefix;
  }

  return `${prefix}_`;
};

export default (conf, prefix = DEFAULT_PREFIX, customStyleMap = {}) => {
  if (!conf) {
    console.log('Expecting an array with css properties');
    return { styles: {} };
  }

  if (!Array.isArray(conf) || !conf.length) {
    console.log('createStyles expects first parameter to be an array with css properties');
    return { styles: {} };
  }

  const checkedPrefix = (validatePrefix(prefix));
  const styles = createCustomStyles(checkedPrefix, conf);
  const fnList = Object.keys(styles).map(style => styles[style].styleFn);
  const customStyleFn = customStyleFns(fnList);
  const exporter = inlineStyleExporter(checkedPrefix, customStyleMap);

  return {
    styles,
    customStyleFn,
    exporter,
  };
};
