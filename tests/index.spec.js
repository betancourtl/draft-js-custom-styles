import { expect } from 'chai';
import Raw from 'draft-js-raw-content-state';
import { convertToRaw, RichUtils, EditorState } from 'draft-js';
import { OrderedSet } from 'immutable';
import createStyles, { validatePrefix } from '../src';

const blockInlineStyleRanges = (editorState, i = 0) => {
  return convertToRaw(editorState.getCurrentContent()).blocks[i].inlineStyleRanges;
};

describe('createStyles', () => {
  const config = ['color'];
  const { styles, customStyleFn, exporter } = createStyles(config);

  it('returns a toggle function', () => {
    expect(styles.color.toggle).to.exist;
  });
  it('returns a remove function', () => {
    expect(styles.color.remove).to.exist;
  });
  it('returns a add function', () => {
    expect(styles.color.add).to.exist;
  });
  it('returns a color function', () => {
    expect(styles.color.current).to.exist;
  });
  it('returns a styleFn function', () => {
    expect(styles.color.styleFn).to.exist;
  });
  it('should have a function named customStyleFn', () => {
    expect(customStyleFn).to.exist;
  });
  it('should have a function named exporter', () => {
    expect(exporter).to.exist;
  });
  it('should return an empty object if no styles are passed', () => {
    const { styles: createdStyles } = createStyles();
    expect(createdStyles).to.deep.equal({});
  });
});

describe('add()', () => {
  const config = ['color', 'font-size'];
  const { styles } = createStyles(config);
  it('should add a custom inline style on a non-collapsed selection', () => {
    const editorState = new Raw()
      .addBlock('block 1')
      .anchorKey(0)
      .focusKey(5)
      .toEditorState();
    const newEditorState = styles.color.add(editorState, 'red');
    const inlineStyleRanges = blockInlineStyleRanges(newEditorState, 0);
    expect(inlineStyleRanges).to.deep.equal([
      {
        style: 'CUSTOM_color_red',
        length: 5,
        offset: 0,
      }]);
  });
  it('should add 2 different colors', () => {
    const editorState = new Raw()
      .addBlock('block 1')
      .anchorKey(0)
      .focusKey(5)
      .toEditorState();
    const newEditorState = styles.color.add(editorState, 'red');
    const newEditorState2 = styles.color.add(newEditorState, 'green');
    const inlineStyleRanges = blockInlineStyleRanges(newEditorState2, 0);
    expect(inlineStyleRanges).to.deep.equal([
      {
        style: 'CUSTOM_color_green',
        length: 5,
        offset: 0,
      }]);
  });
  it('should add a customStyleOverride when adding style to a collapsed selection', () => {
    const editorState = new Raw()
      .addBlock('block 1')
      .collapse(3)
      .toEditorState();
    const newEditorState = styles.color.add(editorState, 'red');
    const override = newEditorState.getInlineStyleOverride();
    expect(override.toJS()).to.deep.equal(OrderedSet(['CUSTOM_color_red']).toJS());
  });
  it('should add a 2 of the same prefixed styles to the same collapsed selection and show only the latest style', () => {
    const editorState = new Raw()
      .addBlock('block 1')
      .collapse(3)
      .toEditorState();
    const newEditorState = styles.color.add(editorState, 'red');
    const newEditorState2 = styles.color.add(newEditorState, 'blue');
    const override = newEditorState2.getInlineStyleOverride();
    expect(override.toJS()).to.deep.equal(OrderedSet(['CUSTOM_color_blue']).toJS());
  });
  it('should add 2 of the different prefixed styles to the same collapsed selection and show both', () => {
    const editorState = new Raw()
      .addBlock('block 1')
      .collapse(3)
      .toEditorState();
    const newEditorState = styles.color.add(editorState, 'red');
    const newEditorState2 = styles.fontSize.add(newEditorState, '12px');
    const override = newEditorState2.getInlineStyleOverride();
    expect(override.toJS()).to.deep.equal(OrderedSet(['CUSTOM_color_red', 'CUSTOM_fontSize_12px']).toJS());
  });
  it('should add 2 different colors and undo redo them one by one', () => {
    const editorState = new Raw()
      .addBlock('block 1')
      .anchorKey(0)
      .focusKey(5)
      .toEditorState();
    const newEditorState = styles.color.add(editorState, 'red');
    const newEditorState2 = styles.color.add(newEditorState, 'green');
    const inlineStyleRanges = blockInlineStyleRanges(newEditorState2, 0);
    expect(inlineStyleRanges).to.deep.equal([
      {
        style: 'CUSTOM_color_green',
        length: 5,
        offset: 0,
      }]);

    const newEditorState3 = EditorState.undo(newEditorState2);
    expect(blockInlineStyleRanges(newEditorState3, 0)).to.deep.equal([
      {
        style: 'CUSTOM_color_red',
        length: 5,
        offset: 0,
      }]);

    const newEditorState4 = EditorState.redo(newEditorState3);
    expect(blockInlineStyleRanges(newEditorState4, 0)).to.deep.equal([
      {
        style: 'CUSTOM_color_green',
        length: 5,
        offset: 0,
      }]);
  });
});

describe('remove()', () => {
  it('should remove a custom inline style', () => {
    const config = ['color'];
    const { styles } = createStyles(config);
    it('should add a custom inline style', () => {
      const editorState = new Raw()
        .addBlock('block 1')
        .anchorKey(0)
        .focusKey(5)
        .toEditorState();
      const newEditorState = styles.color.add(editorState, 'red');
      const editorStateNoStyles = styles.color.remove(newEditorState, 'red');
      const inlineStyleRanges = blockInlineStyleRanges(editorStateNoStyles, 0);
      expect(inlineStyleRanges).to.deep.equal([]);
    });
  });
});

describe('toggle()', () => {
  const config = ['color', 'font-size'];
  const { styles } = createStyles(config);
  it('should add a custom inline style to a non-collapsed selection', () => {
    const editorState = new Raw()
      .addBlock('block 1')
      .anchorKey(0)
      .focusKey(5)
      .toEditorState();
    const newEditorState = styles.color.toggle(editorState, 'red');
    const addedInlineStyleRanges = blockInlineStyleRanges(newEditorState, 0);
    // Add styles
    expect(addedInlineStyleRanges).to.deep.equal([
      {
        style: 'CUSTOM_color_red',
        length: 5,
        offset: 0,
      }]);

    const newEditorStateNoStyle = styles.color.toggle(newEditorState, 'red');
    const inlineStyleRanges = blockInlineStyleRanges(newEditorStateNoStyle, 0);
    // Remove styles
    expect(inlineStyleRanges).to.deep.equal([]);
  });
  it('should add inlineStyleOverride to collapsed selection', () => {
    const editorState = new Raw()
      .addBlock('block 1')
      .anchorKey(2)
      .focusKey(2)
      .toEditorState();
    const newEditorState = styles.color.toggle(editorState, 'red');
    const inlineStyleRanges = blockInlineStyleRanges(newEditorState, 0);
    const inlineStyleOverride = newEditorState.getInlineStyleOverride();
    expect(inlineStyleRanges).to.deep.equal([]);
    expect(inlineStyleOverride.toJS()).to.deep.equal(['CUSTOM_color_red']);
  });
  it('should add and remove inlineStyleOverride to collapsed selection', () => {
    const editorState = new Raw()
      .addBlock('block 1')
      .anchorKey(2)
      .focusKey(2)
      .toEditorState();
    const newEditorState = styles.color.toggle(editorState, 'red');
    const newEditorState2 = styles.color.toggle(newEditorState, 'red');
    const inlineStyleRanges = blockInlineStyleRanges(newEditorState2, 0);
    const inlineStyleOverride = newEditorState2.getInlineStyleOverride();
    expect(inlineStyleRanges).to.deep.equal([]);
    expect(inlineStyleOverride.toJS()).to.deep.equal([]);
  });
  it('should add 2 color styles, only blue should be set as inlineStyleOverride', () => {
    const editorState = new Raw()
      .addBlock('block 1')
      .anchorKey(2)
      .focusKey(2)
      .toEditorState();
    const newEditorState = styles.color.toggle(editorState, 'red');
    const newEditorState2 = styles.color.toggle(newEditorState, 'blue');
    const inlineStyleRanges = blockInlineStyleRanges(newEditorState2, 0);
    const inlineStyleOverride = newEditorState2.getInlineStyleOverride();
    expect(inlineStyleRanges).to.deep.equal([]);
    expect(inlineStyleOverride.toJS()).to.deep.equal(['CUSTOM_color_blue']);
  });
  it('should add 3 color styles, only blue should be set as inlineStyleOverride', () => {
    const editorState = new Raw()
      .addBlock('block 1')
      .anchorKey(2)
      .focusKey(2)
      .toEditorState();
    const newEditorState = styles.color.toggle(editorState, 'red');
    const newEditorState2 = styles.color.toggle(newEditorState, 'green');
    const newEditorState3 = styles.color.toggle(newEditorState2, 'blue');
    const inlineStyleRanges = blockInlineStyleRanges(newEditorState3, 0);
    const inlineStyleOverride = newEditorState3.getInlineStyleOverride();
    expect(inlineStyleRanges).to.deep.equal([]);
    expect(inlineStyleOverride.toJS()).to.deep.equal(['CUSTOM_color_blue']);
  });
  it('should add 2 different styles, only color blue and font-size 12px should be set as inlineStyleOverride', () => {
    const editorState = new Raw()
      .addBlock('block 1')
      .anchorKey(2)
      .focusKey(2)
      .toEditorState();
    const newEditorState = styles.color.toggle(editorState, 'red');
    const newEditorState2 = styles.fontSize.toggle(newEditorState, '12px');
    const newEditorState3 = styles.color.toggle(newEditorState2, 'blue');
    const newEditorState4 = styles.color.toggle(newEditorState3, 'green');
    const inlineStyleRanges = blockInlineStyleRanges(newEditorState4, 0);
    const inlineStyleOverride = newEditorState4.getInlineStyleOverride();
    expect(inlineStyleRanges).to.deep.equal([]);
    expect(inlineStyleOverride.toJS()).to.deep.equal(['CUSTOM_fontSize_12px', 'CUSTOM_color_green']);
  });
  it('should add 2 different colors and undo redo them one by one', () => {
    const editorState = new Raw()
      .addBlock('block 1')
      .anchorKey(0)
      .focusKey(5)
      .toEditorState();
    const newEditorState = styles.color.toggle(editorState, 'red');
    const newEditorState2 = styles.color.toggle(newEditorState, 'green');
    const inlineStyleRanges = blockInlineStyleRanges(newEditorState2, 0);
    expect(inlineStyleRanges).to.deep.equal([
      {
        style: 'CUSTOM_color_green',
        length: 5,
        offset: 0,
      }]);

    const newEditorState3 = EditorState.undo(newEditorState2);
    expect(blockInlineStyleRanges(newEditorState3, 0)).to.deep.equal([
      {
        style: 'CUSTOM_color_red',
        length: 5,
        offset: 0,
      }]);

    const newEditorState4 = EditorState.redo(newEditorState3);
    expect(blockInlineStyleRanges(newEditorState4, 0)).to.deep.equal([
      {
        style: 'CUSTOM_color_green',
        length: 5,
        offset: 0,
      }]);
  });
});

describe('customStyleFn()', () => {
  const config = ['color'];
  const { customStyleFn } = createStyles(config);
  it('should create a css object from a string', () => {
    const result = customStyleFn(OrderedSet(['CUSTOM_color_red']));
    expect(result).to.deep.equal({ color: 'red' });
  });
});

describe('current()', () => {
  const config = ['color'];
  const { styles } = createStyles(config);
  it('should add a custom inline style', () => {
    const editorState = new Raw()
      .addBlock('block 1')
      .anchorKey(0)
      .focusKey(5)
      .toEditorState();
    const newEditorState = styles.color.add(editorState, 'red');
    expect(styles.color.current(newEditorState)).to.equal('red');
  });
});

describe('exporter()', () => {
  const config = ['color', 'background-color', 'font-family'];
  const customStyleMap = {
    MARK: {
      backgroundColor: 'Yellow',
      fontStyle: 'italic',
    },
  };
  const { styles, exporter } = createStyles(config, 'CUSTOM_', customStyleMap);
  it('should export the custom inline styles', () => {
    const editorState = new Raw()
      .addBlock('block 1')
      .anchorKey(0)
      .focusKey(5)
      .toEditorState();
    const newEditorState = styles.color.add(editorState, '#FF0000');
    const newEditorState2 = styles.backgroundColor.add(newEditorState, 'green');
    const inlineStyles = exporter(newEditorState2);
    expect(inlineStyles).to.deep.equal({
      'CUSTOM_color_#FF0000': {
        style: {
          color: '#FF0000',
        },
      },
      CUSTOM_backgroundColor_green: {
        style: {
          backgroundColor: 'green',
        },
      },
    });
  });
  it('should export the custom inline styles and ignore non-custom styles', () => {
    const editorState = new Raw()
      .addBlock('block 1')
      .anchorKey(0)
      .focusKey(5)
      .toEditorState();
    const newEditorState1 = RichUtils.toggleInlineStyle(editorState, 'BOLD');
    const newEditorState2 = styles.color.add(newEditorState1, 'red');
    const newEditorState3 = styles.backgroundColor.add(newEditorState2, 'green');
    const inlineStyles = exporter(newEditorState3);
    expect(inlineStyles).to.deep.equal({
      CUSTOM_color_red: {
        style: {
          color: 'red',
        },
      },
      BOLD: {
        style: {
          fontWeight: 'bold',
        },
      },
      CUSTOM_backgroundColor_green: {
        style: {
          backgroundColor: 'green',
        },
      },
    });
  });
  it('should not export non-custom or default styles', () => {
    const editorState = new Raw()
      .addBlock('block 1')
      .anchorKey(0)
      .focusKey(5)
      .toEditorState();
    const newEditorState1 = RichUtils.toggleInlineStyle(editorState, 'BOLD');
    const newEditorState2 = RichUtils.toggleInlineStyle(newEditorState1, 'NON_CUSTOM');
    const newEditorState3 = styles.color.add(newEditorState2, 'red');
    const newEditorState4 = styles.backgroundColor.add(newEditorState3, 'green');
    const inlineStyles = exporter(newEditorState4);
    expect(inlineStyles).to.deep.equal({
      CUSTOM_color_red: {
        style: {
          color: 'red',
        },
      },
      BOLD: {
        style: {
          fontWeight: 'bold',
        },
      },
      CUSTOM_backgroundColor_green: {
        style: {
          backgroundColor: 'green',
        },
      },
    });
  });
  it('should export customStyleMap styles', () => {
    const editorState = new Raw()
      .addBlock('block 1')
      .anchorKey(0)
      .focusKey(5)
      .toEditorState();
    const newEditorStat1 = RichUtils.toggleInlineStyle(editorState, 'MARK');
    const newEditorState2 = styles.color.add(newEditorStat1, 'red');
    const newEditorState3 = styles.backgroundColor.add(newEditorState2, 'green');
    const inlineStyles = exporter(newEditorState3);
    expect(inlineStyles).to.deep.equal({
      CUSTOM_color_red: {
        style: {
          color: 'red',
        },
      },
      MARK: {
        style: {
          backgroundColor: 'Yellow',
          fontStyle: 'italic',
        },
      },
      CUSTOM_backgroundColor_green: {
        style: {
          backgroundColor: 'green',
        },
      },
    });
  });
  it('should export custom + default + customStyleMap styles', () => {
    const editorState = new Raw()
      .addBlock('block 1')
      .anchorKey(0)
      .focusKey(5)
      .toEditorState();
    const newEditorStat1 = RichUtils.toggleInlineStyle(editorState, 'BOLD');
    const newEditorStat2 = RichUtils.toggleInlineStyle(newEditorStat1, 'MARK');
    const newEditorState3 = styles.color.add(newEditorStat2, 'red');
    const newEditorState4 = styles.backgroundColor.add(newEditorState3, 'green');
    const inlineStyles = exporter(newEditorState4);
    expect(inlineStyles).to.deep.equal({
      CUSTOM_color_red: {
        style: {
          color: 'red',
        },
      },
      BOLD: {
        style: {
          fontWeight: 'bold',
        },
      },
      MARK: {
        style: {
          backgroundColor: 'Yellow',
          fontStyle: 'italic',
        },
      },
      CUSTOM_backgroundColor_green: {
        style: {
          backgroundColor: 'green',
        },
      },
    });
  });
  it('should not return duplicate inline styles', () => {
    const editorState = new Raw()
      .addBlock('block 1')
      .anchorKey(0)
      .focusKey(5)
      .toEditorState();
    const toggleInlineStyle = (
      _editorState,
      style
    ) => RichUtils.toggleInlineStyle(_editorState, style);
    const newEditorState1 = toggleInlineStyle(editorState, 'BOLD');
    const newEditorState3 = styles.color.add(newEditorState1, 'green');
    const newEditorState4 = styles.color.add(newEditorState3, 'green');
    const newEditorState5 = toggleInlineStyle(newEditorState4, 'MARK');
    const inlineStyles = exporter(newEditorState5);
    expect(inlineStyles).to.deep.equal({
      MARK: {
        style: {
          backgroundColor: 'Yellow',
          fontStyle: 'italic',
        },
      },
      BOLD: {
        style: {
          fontWeight: 'bold',
        },
      },
      CUSTOM_color_green: {
        style: {
          color: 'green',
        },
      },
    });
  });
  it('should properly process inline styles with underscore in value', () => {
    const editorState = new Raw()
        .addBlock('block 1')
        .anchorKey(0)
        .focusKey(5)
        .toEditorState();
    const toggleInlineStyle = (
        _editorState,
        style
    ) => RichUtils.toggleInlineStyle(_editorState, style);
    const newEditorState1 = styles.fontFamily.add(editorState, 'KaiTi_GB2312');
    const inlineStyles = exporter(newEditorState1);
    expect(inlineStyles).to.deep.equal({
      CUSTOM_fontFamily_KaiTi_GB2312: {
        style: {
          fontFamily: 'KaiTi_GB2312',
        },
      },
    });
  });
});

describe('validatePrefix()', () => {
  it('should add an underscore if none is supplied', () => {
    const prefix = validatePrefix('TEST');
    expect(prefix).to.equal('TEST_');
  });
  it('should not add an underscore if it already has one', () => {
    const prefix = validatePrefix('TEST2_');
    expect(prefix).to.equal('TEST2_');
  });
  it('should return the default prefix on an empty string', () => {
    const prefix = validatePrefix('');
    expect(prefix).to.equal('CUSTOM_');
  });
  it('should return the default prefix when nothing is passed', () => {
    const prefix = validatePrefix();
    expect(prefix).to.equal('CUSTOM_');
  });
});
