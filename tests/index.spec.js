import { expect } from 'chai';
import dynamicStyles from '../src';

describe('createStyles', () => {
  const config = ['color'];
  const { styles, customStyleFn, exporter } = dynamicStyles(config);

  it('returns a toggle function', () => {
    expect(styles.color.toggle).to.exist;
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
