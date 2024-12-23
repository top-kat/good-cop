


import { _ } from '../../src/DefinitionClass'



describe('Number', () => {

    const numberDef = _.number()

    it('checks the return types of read or write as a string', () => {
        expect(numberDef.getTsTypeAsString()).toEqual({ 'read': 'number', 'write': 'number' })
    })

    it('accepts valid number', async () => {
        expect(await numberDef.formatAndValidate(42)).toEqual(42)
    })

    it('accepts a negative number', async () => {
        expect(await numberDef.formatAndValidate(-42)).toEqual(-42)
    })

    it('accepts a floating-point number', async () => {
        expect(await numberDef.formatAndValidate(42.5)).toEqual(42.5)
    })

    it('accepts zero', async () => {
        expect(await numberDef.formatAndValidate(0)).toEqual(0)
    })

    it('converts a string to a number', async () => {
        expect(await numberDef.formatAndValidate('42')).toEqual(42)
    })

    it('returns NaN when passed a string', async () =>
        await expect(numberDef.formatAndValidate('hello'))
            .rejects.toThrow(`Expected type number but got type NaN for value null`)
    )

    it('returns NaN when passed an array', async () =>
        await expect(numberDef.formatAndValidate(['test', 1]))
            .rejects.toThrow(`Expected type number but got type NaN for value null`)
    )

    it('returns NaN when passed an object', async () =>
        await expect(numberDef.formatAndValidate({ number: 6 }))
            .rejects.toThrow(`Expected type number but got type NaN for value null`)
    )
})