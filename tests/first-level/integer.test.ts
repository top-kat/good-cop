


import { _ } from '../../src/DefinitionClass'



describe('Integer', () => {

    const integerDef = _.integer()

    it('checks the return types of read or write as a string', () => {
        expect(integerDef.getTsTypeAsString()).toEqual({ 'read': 'number', 'write': 'number' })
    })

    it('accepts a valid integer', async () => {
        expect(await integerDef.formatAndValidate(42)).toEqual(42)
    })

    it('accepts a negative integer', async () => {
        expect(await integerDef.formatAndValidate(-42)).toEqual(-42)
    })

    it('accepts zero', async () => {
        expect(await integerDef.formatAndValidate(0)).toEqual(0)
    })

    it('converts a floating-point number to nearest integer', async () => {
        expect(await integerDef.formatAndValidate(42.4)).toEqual(42)
    })

    it('converts a string to an integer', async () => {
        expect(await integerDef.formatAndValidate('42.2')).toEqual(42)
    })

    it('returns NaN when passed a string', async () =>
        expect(await integerDef.formatAndValidate('hello')).toEqual(NaN)
    )

    it('returns NaN when passed an array', async () =>
        expect(await integerDef.formatAndValidate(['test', 1])).toEqual(NaN)
    )

    it('returns NaN when passed an object', async () =>
        expect(await integerDef.formatAndValidate({ number:6 })).toEqual(NaN)
    )
})