


import { _ } from '../src/DefinitionClass'



describe('Number definition', () => {

    const numberDef = _.n('myNumber').number()

    it('numberDef', () => {
        expect(numberDef.getTsTypeAsString()).toEqual({ 'read': 'number', 'write': 'number' })
    })

    it('should confirm the value is a number', () => {
        const validValue = 42
        const result = numberDef.greaterThan(0)
        // Check that the value is a number using typeof
        expect(typeof validValue).toBe('number')
        expect(result).toBe(true)
    })

    it('should accept valid number', () => {
        const validNumber = numberDef.formatAndValidate(42)
        expect(validNumber).toEqual(42)
})
    

    // it('should accept valid number', () => {
    //     const validNumber = numberDef.isType('number')
    //     expect(validNumber).toBeTruthy()
    // }

    // it('should accept a number greater than the specified limit', () => {
    //     const validValue = 15
    //     const result = numberDef.greaterThan(10).check(validValue)
    //     expect(result).toBe(true)
    // })

    // it('should reject invalid number', () => {
    //     expect(() => numberDef.set('invalid')).toThrowError('Invalid number')
    // })
})