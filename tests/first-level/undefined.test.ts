


import { _ } from '../../src/DefinitionClass'



describe(`Undefined`, () => {

    const undefinedDef = _.undefined()

    it('checks the return types of read or write as a string', () => {
        expect(undefinedDef.getTsTypeAsString()).toEqual({ 'read': 'undefined', 'write': 'undefined' })
    })

    it('accepts an undefined value', async () => {
        expect(await undefinedDef.formatAndValidate(undefined)).toEqual(undefined)
    })

    it('accepts a valid value', async () => {
        expect(await undefinedDef.formatAndValidate(2)).toEqual(undefined)
    })
})