'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validatePrefix = exports.inlineStyleExporter = exports.createInlineStyleExportObject = exports.getInlineStyles = exports.customStyleFns = exports.createCustomStyles = exports.mapSelectedCharacters = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _draftJs = require('draft-js');

var _immutable = require('immutable');

var _lodash = require('lodash.camelcase');

var _lodash2 = _interopRequireDefault(_lodash);

var _lodash3 = require('lodash.snakecase');

var _lodash4 = _interopRequireDefault(_lodash3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var DEFAULT_PREFIX = 'CUSTOM_';

// This functionality has been taken from draft-js and modified for re-usability purposes.
// Maps over the selected characters, and applies a function to each character.
// Characters are of type CharacterMetadata.
var mapSelectedCharacters = exports.mapSelectedCharacters = function mapSelectedCharacters(callback) {
  return function (editorState) {
    var contentState = editorState.getCurrentContent();
    var selectionState = editorState.getSelection();
    var blockMap = contentState.getBlockMap();
    var startKey = selectionState.getStartKey();
    var startOffset = selectionState.getStartOffset();
    var endKey = selectionState.getEndKey();
    var endOffset = selectionState.getEndOffset();

    var newBlocks = blockMap.skipUntil(function (_, k) {
      return k === startKey;
    }).takeUntil(function (_, k) {
      return k === endKey;
    }).concat((0, _immutable.Map)([[endKey, blockMap.get(endKey)]])).map(function (block, blockKey) {
      var sliceStart = void 0;
      var sliceEnd = void 0;

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
      var chars = block.getCharacterList();
      var current = void 0;
      while (sliceStart < sliceEnd) {
        current = chars.get(sliceStart);
        var newChar = callback(current);
        chars = chars.set(sliceStart, newChar);
        sliceStart++;
      }

      return block.set('characterList', chars);
    });

    return contentState.merge({
      blockMap: blockMap.merge(newBlocks),
      selectionBefore: selectionState,
      selectionAfter: selectionState
    });
  };
};

var getContentStateWithoutStyle = function getContentStateWithoutStyle(prefix, editorState) {
  return mapSelectedCharacters(filterDynamicStyle(prefix))(editorState);
};

var filterDynamicStyle = function filterDynamicStyle(prefix) {
  return function (char) {
    var charStyles = char.get('style');
    var filteredStyles = charStyles.filter(function (style) {
      return !style.startsWith(prefix);
    });
    return char.set('style', filteredStyles);
  };
};

var addStyle = function addStyle(prefix) {
  return function (editorState, value) {
    var style = prefix + value;
    var newContentState = _draftJs.Modifier.applyInlineStyle(getContentStateWithoutStyle(prefix, editorState), editorState.getSelection(), style);

    var isCollapsed = editorState.getSelection().isCollapsed();
    if (isCollapsed) {
      return addInlineStyleOverride(prefix, style, editorState);
    }

    return _draftJs.EditorState.push(editorState, newContentState, 'change-inline-style');
  };
};

var removeStyle = function removeStyle(prefix) {
  return function (editorState) {
    return _draftJs.EditorState.push(editorState, getContentStateWithoutStyle(prefix, editorState), 'change-inline-style');
  };
};

var filterOverrideStyles = function filterOverrideStyles(prefix, styles) {
  return styles.filter(function (style) {
    return !style.startsWith(prefix);
  });
};

var addInlineStyleOverride = function addInlineStyleOverride(prefix, style, editorState) {
  var currentStyle = editorState.getCurrentInlineStyle();

  // We remove styles with the prefix from the OrderedSet to avoid having
  // variants of the same prefix.
  var newStyles = filterOverrideStyles(prefix, currentStyle);

  return _draftJs.EditorState.setInlineStyleOverride(editorState, newStyles.add(style));
};

var toggleInlineStyleOverride = function toggleInlineStyleOverride(prefix, style, editorState) {
  var currentStyle = editorState.getCurrentInlineStyle();

  // We remove styles with the prefix from the OrderedSet to avoid having
  // variants of the same prefix.
  var newStyles = filterOverrideStyles(prefix, currentStyle);

  var styleOverride = currentStyle.has(style) ? newStyles.remove(style) : newStyles.add(style);

  return _draftJs.EditorState.setInlineStyleOverride(editorState, styleOverride);
};

var toggleStyle = function toggleStyle(prefix) {
  return function (editorState, value) {
    var style = prefix + value;
    var currentStyle = editorState.getCurrentInlineStyle();
    var isCollapsed = editorState.getSelection().isCollapsed();

    if (isCollapsed) {
      return toggleInlineStyleOverride(prefix, style, editorState);
    }

    if (!currentStyle.has(style)) {
      return addStyle(prefix)(editorState, value);
    }

    var editorStateWithoutCustomStyles = _draftJs.EditorState.push(editorState, getContentStateWithoutStyle(prefix, editorState), 'change-inline-style');
    return _draftJs.EditorState.forceSelection(editorStateWithoutCustomStyles, editorState.getSelection());
  };
};

/**
 *  style is an OrderedSet type
 */
var styleFn = function styleFn(prefix, cssProp) {
  return function (style) {
    if (!style.size) {
      return {};
    }
    var value = style.filter(function (val) {
      return val.startsWith(prefix);
    }).first();
    if (value) {
      var newVal = value.replace(prefix, '');
      return _defineProperty({}, (0, _lodash2.default)(cssProp), newVal);
    }
    return {};
  };
};

var currentStyle = function currentStyle(prefix) {
  return function (editorState) {
    var selectionStyles = editorState.getCurrentInlineStyle();
    if (!selectionStyles.size) {
      return '';
    }

    var result = selectionStyles.filter(function (style) {
      return style.startsWith(prefix);
    }).first();

    return result ? result.replace(prefix, '') : result;
  };
};

var createCustomStyles = exports.createCustomStyles = function createCustomStyles(prefix, conf) {
  return conf.reduce(function (acc, prop) {
    var camelCased = (0, _lodash2.default)(prop);
    var newPrefix = '' + prefix + (0, _lodash4.default)(prop).toUpperCase() + '_';
    var copy = _extends({}, acc);
    copy[camelCased] = {
      add: addStyle(newPrefix),
      remove: removeStyle(newPrefix),
      toggle: toggleStyle(newPrefix),
      current: currentStyle(newPrefix),
      styleFn: styleFn(newPrefix, prop)
    };

    return copy;
  }, {});
};

// customStyleFns
var customStyleFns = exports.customStyleFns = function customStyleFns(fnList) {
  return function (prefixedStyle) {
    return fnList.reduce(function (css, fn) {
      return _extends({}, css, fn(prefixedStyle));
    }, {});
  };
};

// exporter
var getInlineStyles = exports.getInlineStyles = function getInlineStyles(acc, block) {
  var styleRanges = block.inlineStyleRanges;
  if (styleRanges && styleRanges.length) {
    var result = styleRanges.map(function (style) {
      return style.style;
    });

    return acc.concat(result);
  }
  return acc;
};

var createInlineStyleExportObject = exports.createInlineStyleExportObject = function createInlineStyleExportObject(prefix, customStyleMap) {
  return function (acc, style) {
    // default inline styles
    if (_draftJs.DefaultDraftInlineStyle[style]) {
      return Object.assign({}, acc, _defineProperty({}, style, {
        style: _draftJs.DefaultDraftInlineStyle[style]
      }));
    }

    // custom styleMap styles
    if (customStyleMap[style]) {
      return Object.assign({}, acc, _defineProperty({}, style, {
        style: customStyleMap[style]
      }));
    }

    var regex = new RegExp(prefix + '(.+)_(.+)');
    var match = style.match(regex);

    // no matches
    if (!match || !match[1] || !match[2]) {
      return acc;
    }

    // custom styles
    var css = match[1].toLowerCase();
    var value = match[2];
    var inlineStyle = _defineProperty({}, style, {
      style: _defineProperty({}, (0, _lodash2.default)(css), value)
    });

    return Object.assign({}, acc, inlineStyle);
  };
};

var inlineStyleExporter = exports.inlineStyleExporter = function inlineStyleExporter(prefix, customStyleMap) {
  return function (editorState) {
    var inlineStyles = (0, _draftJs.convertToRaw)(editorState.getCurrentContent()).blocks.reduce(getInlineStyles, []);
    if (!inlineStyles.length) return {};
    return inlineStyles.reduce(createInlineStyleExportObject(prefix, customStyleMap), {});
  };
};

var validatePrefix = exports.validatePrefix = function validatePrefix(prefix) {
  if (typeof prefix !== 'string' || !prefix.length) {
    return DEFAULT_PREFIX;
  }

  if (prefix.match(/.+_$/)) {
    return prefix;
  }

  return prefix + '_';
};

exports.default = function (conf) {
  var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DEFAULT_PREFIX;
  var customStyleMap = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  if (!conf) {
    console.log('Expecting an array with css properties');
    return { styles: {} };
  }

  if (!Array.isArray(conf) || !conf.length) {
    console.log('createStyles expects first parameter to be an array with css properties');
    return { styles: {} };
  }

  var checkedPrefix = validatePrefix(prefix);
  var styles = createCustomStyles(checkedPrefix, conf);
  var fnList = Object.keys(styles).map(function (style) {
    return styles[style].styleFn;
  });
  var customStyleFn = customStyleFns(fnList);
  var exporter = inlineStyleExporter(checkedPrefix, customStyleMap);

  return {
    styles: styles,
    customStyleFn: customStyleFn,
    exporter: exporter
  };
};