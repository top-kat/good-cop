import { defaultTypeError } from '../../src/helpers/definitionGenericHelpers';
import { DefCtx } from '../../src/definitionTypes';

describe('defaultTypeError', () => {
  const ctx: DefCtx = {
    modelName: 'TestModel',
    addressInParent: 'parentAddress',
    errorExtraInfos: {},
    definition: {},
    method: 'create',
    value: 'test',
    fields: {},
    fieldAddr: 'fieldAddress',
    user: { id: 'userId', name: 'User Name', _id:'userId', role:'isAdmin' },
  };

  it('returns the expected error message when value type does not match', () => {
    const type = 'number';
    const errorFunc = defaultTypeError(type);

    const errorMessage = errorFunc(ctx);

    expect(ctx.errorExtraInfos.expectedType).toBe(type);
    expect(ctx.errorExtraInfos.gotType).toBe('string');
    expect(errorMessage).toBe(
      `Expected type 'number' but got type string for value "test"`
    );
  });

  it('returns the expected error message with formatted JSON if displayCompareWithTypeofValue is true', () => {
    const type = 'number';
    const errorFunc = defaultTypeError(type, true);

    const errorMessage = errorFunc(ctx);

    expect(ctx.errorExtraInfos.expectedType).toBe(type);
    expect(ctx.errorExtraInfos.gotType).toBe('string');
    expect(errorMessage).toBe(
      `Expected type 'number' but got type string for value "test"`
    );
  });

  it('returns the expected error message without type info when displayCompareWithTypeofValue is false', () => {
    const type = 'number';
    const errorFunc = defaultTypeError(type, false);

    const errorMessage = errorFunc(ctx);

    expect(ctx.errorExtraInfos.expectedType).toBe(type);
    expect(ctx.errorExtraInfos.gotType).toBe('string');
    expect(errorMessage).toBe(
      `Expected type 'number' but got "test"`
    );
  });

  it('handles array values correctly when displayCompareWithTypeofValue is true', () => {
    const type = 'string';
    const ctxWithArray: DefCtx = {
      modelName: 'TestModel',
      addressInParent: 'parentAddress',
      errorExtraInfos: {},
      definition: {},
      method: 'create',
      value: [1, 2, 3],
      fields: {},
      fieldAddr: 'fieldAddress',
      user: { id: 'userId', name: 'User Name', _id:'userId', role:'isAdmin' },
    };
    const errorFunc = defaultTypeError(type, true);

    const errorMessage = errorFunc(ctxWithArray);

    expect(ctxWithArray.errorExtraInfos.expectedType).toBe(type);
    expect(ctxWithArray.errorExtraInfos.gotType).toBe('object');
    expect(errorMessage).toBe(
      `Expected type 'string' but got type array for value [\n  1,\n  2,\n  3\n]`
    );
  });
});
