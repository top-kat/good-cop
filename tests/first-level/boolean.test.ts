


import { _ } from '../../src/DefinitionClass'



describe(`Boolean`, () => {

    const booleanDef = _.boolean()

    it('boolean definition', () => {
        expect(booleanDef.getTsTypeAsString()).toEqual({ 'read': 'boolean', 'write': 'boolean' })
    })

    it('correctly formats and validates true booleans', async () => {
        expect(await booleanDef.formatAndValidate(true)).toEqual(true)
    })

    it('correctly formats and validates false booleans', async () => {
        expect(await booleanDef.formatAndValidate(false)).toEqual(false)
    })

    it('throws an error if the type is not a boolean', async () => {
        await expect(booleanDef.formatAndValidate('testman')).rejects.toThrow(`Expected type 'boolean' but got type string for value "testman"`);
    })
})