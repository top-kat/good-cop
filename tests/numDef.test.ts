


import { _ } from '../src/DefinitionClass'



describe('Number definition', () => {

    const numberDef = _.n('myNumber').number()

    it('numberDef', () => {
        expect(numberDef.getTsTypeAsString()).toEqual({ 'read': 'number', 'write': 'number' })
    })

    it('should accept valid number', async () => {
        expect(await numberDef.formatAndValidate(42)).toEqual(42)
    })

    it('should have the correct TypeScript type', () => {
        expect(numberDef.getTsTypeAsString()).toEqual({ 'read': 'number', 'write': 'number' })
    })

    it('should accept a valid number', async () => {
        expect(await numberDef.formatAndValidate(42)).toEqual(42)
    })

    it('should accept a negative number', async () => {
        expect(await numberDef.formatAndValidate(-42)).toEqual(-42)
    })

    it('should accept a floating-point number', async () => {
        expect(await numberDef.formatAndValidate(42.5)).toEqual(42.5)
    })

    it('should accept zero', async () => {
        expect(await numberDef.formatAndValidate(0)).toEqual(0)
    })
})