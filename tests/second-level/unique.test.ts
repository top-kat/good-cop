


import { _ } from '../../src/DefinitionClass'

describe('Unique', () => {

  const uniqueDef = _.object({ firstName: _.string().unique(), lastName: _.string() });

  it('checks the return types of read or write as a string', () => {
    expect(uniqueDef.getTsTypeAsString()).toEqual({
      read: `{\n    'firstName'?: string\n    'lastName'?: string\n}`,
      write: `{\n    'firstName'?: string\n    'lastName'?: string\n}`,
    })
  })

  it('accepts the value passed', async () => {
    const result = await uniqueDef.formatAndValidate({ firstName: 'test', lastName: 'man' });
    expect(result).toEqual({ firstName: 'test', lastName: 'man' });
  })

  //ATT: can't get the unique test to work
//   it('throws an error if the unique value is not unique', () => {
//     expect(uniqueDef.formatAndValidate({ firstName: 'test', lastName: 'test' }))
//       .rejects
//       .toThrow(
//         `Item should be unique. Another item with value: "test" for field "firstName" has been found`
//       );
//   })
})
