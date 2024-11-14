


import { _ } from '../../src/DefinitionClass'



describe(`Undefined`, () => {

    const undefinedDef = _.undefined()

    it('checks the return types of read or write as a string', () => {
        expect(undefinedDef.getTsTypeAsString()).toEqual({ 'read': 'undefined', 'write': 'undefined' })
    })

    it('accepts an undefined value', async ()=>{
        expect(await undefinedDef.formatAndValidate(undefined)).toEqual(undefined)
    })

    //ATT: should it accept a valid value?
    it('accepts a valid value', async ()=>{
        expect(await undefinedDef.formatAndValidate(2)).toEqual(2)
    })
})