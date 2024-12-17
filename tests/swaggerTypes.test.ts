


import { _ } from './0_helpers/definitionWithModels'



describe(`Swagger types validation`, () => {

  const alwaysDefinedInReadDef = _.object().alwaysDefinedInRead()

  it('checks the return types of read or write as a string', () => {
    expect(alwaysDefinedInReadDef.getTsTypeAsString()).toEqual({ 'read': 'string', 'write': 'string' })
  })

  it('accepts the length value', async () => {

  })
})