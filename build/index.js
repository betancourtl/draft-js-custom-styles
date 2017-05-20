'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createCustomStyles = exports.mapSelectedCharacters = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _draftJs = require('draft-js');

var _immutable = require('immutable');

var _lodash = require('lodash.camelcase');

var _lodash2 = _interopRequireDefault(_lodash);

var _lodash3 = require('lodash.snakecase');

var _lodash4 = _interopRequireDefault(_lodash3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// This functionality has been taken from draft-js and modified for re-usability purposes.
// Maps over the selected characters, and applies a function to each character.
// Characters are of type CharacterMetadata. Look up the draftJS API to see what
// operations can be performed on characters.
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

    var newContentState = contentState.merge({
      blockMap: blockMap.merge(newBlocks),
      selectionBefore: selectionState,
      selectionAfter: selectionState
    });

    return _draftJs.EditorState.push(editorState, newContentState, 'change-inline-style');
  };
};

var makeDynamicStyles = function makeDynamicStyles() {
  var prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'DEFAULT_PROP';
  var cssProp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'cssProperty';

  var filterDynamicStyle = function filterDynamicStyle(char) {
    var charStyles = char.get('style');
    var filteredStyles = charStyles.filter(function (style) {
      return !style.startsWith(prefix);
    });
    return char.set('style', filteredStyles);
  };
  var addStyle = function addStyle(editorState, style) {
    var newContentState = _draftJs.Modifier.applyInlineStyle(editorState.getCurrentContent(), editorState.getSelection(), style);
    return _draftJs.EditorState.push(editorState, newContentState, 'change-inline-style');
  };
  var removeStyle = function removeStyle(editorState) {
    return mapSelectedCharacters(filterDynamicStyle)(editorState);
  };

  var toggleStyle = function toggleStyle(editorState, value) {
    var style = prefix + value;
    var editorStateWithoutColorStyles = removeStyle(editorState);
    var currentInlineStyles = editorState.getCurrentInlineStyle();
    if (!currentInlineStyles.has(style)) {
      return addStyle(editorStateWithoutColorStyles, style);
    }

    return _draftJs.EditorState.forceSelection(editorStateWithoutColorStyles, editorState.getSelection());
  };

  var styleFn = function styleFn(currentStyles) {
    if (!currentStyles.size) {
      return {};
    }
    var value = currentStyles.filter(function (val) {
      return val.startsWith(prefix);
    }).first();
    if (value) {
      var newVal = value.replace(prefix, '');
      return _defineProperty({}, (0, _lodash2.default)(cssProp), newVal);
    }
    return {};
  };
  var currentStyle = function currentStyle(editorState) {
    var selectionStyles = editorState.getCurrentInlineStyle();
    if (!selectionStyles.size) {
      return '';
    }

    var result = selectionStyles.filter(function (style) {
      return style.startsWith(prefix);
    }).first();

    return result ? result.replace(prefix, '') : result;
  };

  return {
    toggleStyle: toggleStyle,
    currentStyle: currentStyle,
    styleFn: styleFn
  };
};

var createCustomStyles = exports.createCustomStyles = function createCustomStyles(prefix, conf) {
  return conf.reduce(function (acc, prop) {
    var camelCased = (0, _lodash2.default)(prop);
    var snakeCased = '' + prefix + (0, _lodash4.default)(prop).toUpperCase() + '_';
    var copy = _extends({}, acc);
    var style = makeDynamicStyles(snakeCased, prop);
    copy[camelCased] = {
      add: style.addStyle,
      remove: style.removeStyle,
      toggle: style.toggleStyle,
      current: style.currentStyle,
      styleFn: style.styleFn
    };

    return copy;
  }, {});
};

// customStyleFns
var customStyleFns = function customStyleFns(fnList) {
  return function (prefixedStyle) {
    return fnList.reduce(function (css, fn) {
      return _extends({}, css, fn(prefixedStyle));
    }, {});
  };
};

// exporter
var getInlineStyles = function getInlineStyles(acc, block) {
  var styleRanges = block.inlineStyleRanges;
  if (styleRanges && styleRanges.length) {
    var result = styleRanges.map(function (style) {
      return style.style;
    });

    return acc.concat(result);
  }
  return acc;
};

var createInlineStyleExportObject = function createInlineStyleExportObject(prefix) {
  return function (acc, style) {
    var regex = new RegExp(prefix + '(.+)_(.+)');
    var match = style.match(regex);
    var css = match[1].toLowerCase();
    var value = match[2].toLowerCase();
    var inlineStyle = _defineProperty({}, style, {
      style: _defineProperty({}, (0, _lodash2.default)(css), value)
    });

    return Object.assign({}, acc, inlineStyle);
  };
};

var inlineStyleExporter = function inlineStyleExporter(prefix) {
  return function (editorState) {
    var inlineStyles = (0, _draftJs.convertToRaw)(editorState.getCurrentContent()).blocks.reduce(getInlineStyles, []);
    if (!inlineStyles.length) return {};
    return inlineStyles.reduce(createInlineStyleExportObject(prefix), {});
  };
};

exports.default = function (conf) {
  var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'CUSTOM_';

  var styles = createCustomStyles(prefix, conf);
  var fnList = Object.keys(styles).map(function (style) {
    return styles[style].styleFn;
  });
  var customStyleFn = customStyleFns(fnList); // (prefixed Style goes here) this is curried;
  var exporter = inlineStyleExporter(prefix); // curried accepts EditorState

  return {
    styles: styles,
    customStyleFn: customStyleFn,
    exporter: exporter
  };
};