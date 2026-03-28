const { cache, invalidate, invalidatePattern } = require('../../utils/cache.util');

describe('Cache Utils', () => {
  afterEach(() => {
    cache.flushAll();
  });

  it('should set and get values', () => {
    cache.set('test-key', { data: 'hello' });
    expect(cache.get('test-key')).toEqual({ data: 'hello' });
  });

  it('should return undefined for missing keys', () => {
    expect(cache.get('missing')).toBeUndefined();
  });

  it('should invalidate a specific key', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    invalidate('key1');
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBe('value2');
  });

  it('should invalidate by pattern prefix', () => {
    cache.set('dashboard:stats', { total: 100 });
    cache.set('dashboard:charts', { data: [] });
    cache.set('departments', ['HR']);

    invalidatePattern('dashboard:');
    expect(cache.get('dashboard:stats')).toBeUndefined();
    expect(cache.get('dashboard:charts')).toBeUndefined();
    expect(cache.get('departments')).toEqual(['HR']);
  });
});
