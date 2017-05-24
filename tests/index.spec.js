import { expect } from 'chai';
import Raw from 'draft-js-raw-content-state';
import { convertToRaw, RichUtils } from 'draft-js';
import { OrderedSet } from 'immutable';
import dynamicStyles from '../src';

const blockInlineStyleRanges = (editorState, i = 0) => {
  return convertToRaw(editorState.getCurrentContent()).blocks[i].inlineStyleRanges;
};

describe('createStyles', () => {
  const config = ['color'];
  const { styles, customStyleFn, exporter } = dynamicStyles(config);

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
});

describe('add()', () => {
  const config = ['color'];
  const { styles } = dynamicStyles(config);
  it('should add a custom inline style', () => {
    const editorState = new Raw()
      .addBlock('block 1')
      .anchorKey(0)
      .focusKey(5)
      .toEditorState();
    const newEditorState = styles.color.add(editorState, 'red');
    const inlineStyleRanges = blockInlineStyleRanges(newEditorState, 0);
    expect(inlineStyleRanges).to.deep.equal([
      {
        style: 'CUSTOM_COLOR_red',
        length: 5,
        offset: 0,
      }]);
  });
  it('should add a remove the old inline styles and apply the new one', () => {
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
        style: 'CUSTOM_COLOR_green',
        length: 5,
        offset: 0,
      }]);
  });
});

describe('remove()', () => {
  it('should remove a custom inline style', () => {
    const config = ['color'];
    const { styles } = dynamicStyles(config);
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
  const config = ['color'];
  const { styles } = dynamicStyles(config);
  it('should add a custom inline style', () => {
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
        style: 'CUSTOM_COLOR_red',
        length: 5,
        offset: 0,
      }]);

    const newEditorStateNoStyle = styles.color.toggle(newEditorState, 'red');
    const inlineStyleRanges = blockInlineStyleRanges(newEditorStateNoStyle, 0);
    // Remove styles
    expect(inlineStyleRanges).to.deep.equal([]);
  });
});

describe('customStyleFn()', () => {
  const config = ['color'];
  const { customStyleFn } = dynamicStyles(config);
  it('should create a css object from a string', () => {
    const result = customStyleFn(OrderedSet(['CUSTOM_COLOR_red']));
    expect(result).to.deep.equal({ color: 'red' });
  });
});

describe('current()', () => {
  const config = ['color'];
  const { styles } = dynamicStyles(config);
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
  const config = ['color', 'background-color'];
  const { styles, exporter } = dynamicStyles(config);
  it('should export the custom inline styles', () => {
    const editorState = new Raw()
      .addBlock('block 1')
      .anchorKey(0)
      .focusKey(5)
      .toEditorState();
    const newEditorState = styles.color.add(editorState, 'red');
    const newEditorState2 = styles.backgroundColor.add(newEditorState, 'green');
    const inlineStyles = exporter(newEditorState2);
    expect(inlineStyles).to.deep.equal({
      CUSTOM_COLOR_red: {
        style: {
          color: 'red',
        },
      },
      CUSTOM_BACKGROUND_COLOR_green: {
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
      CUSTOM_COLOR_red: {
        style: {
          color: 'red',
        },
      },
      BOLD: {
        fontWeight: 'bold',
      },
      CUSTOM_BACKGROUND_COLOR_green: {
        style: {
          backgroundColor: 'green',
        },
      },
    });
  });
});

