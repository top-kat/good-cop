


import { _ } from '../../src/DefinitionClass'



describe('Floating-point definition', () => {

    const floatingPointDef = _.float()

    it('checks the return types of read or write as a string', () => {
        expect(floatingPointDef.getTsTypeAsString()).toEqual({ 'read': 'number', 'write': 'number' })
    })

    it('accepts a valid floating-point', async () => {
        expect(await floatingPointDef.formatAndValidate(42.2)).toEqual(42.2)
    })

    it('accepts a negative floating-point', async () => {
        expect(await floatingPointDef.formatAndValidate(-42.2)).toEqual(-42.2)
    })

    it('accepts zero', async () => {
        expect(await floatingPointDef.formatAndValidate(0)).toEqual(0)
    })

    it('converts a string to a floating-point', async () => {
        expect(await floatingPointDef.formatAndValidate('42.2')).toEqual(42.2)
    })

    it('returns NaN when passed a string', async () =>
        expect(await floatingPointDef.formatAndValidate('hello')).toEqual(NaN)
    )

    it('returns NaN when passed an array', async () =>
        expect(await floatingPointDef.formatAndValidate(['test', 1])).toEqual(NaN)
    )

    it('returns NaN when passed an object', async () =>
        expect(await floatingPointDef.formatAndValidate({ number:6 })).toEqual(NaN)
    )
})