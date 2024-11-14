


import { _ } from '../../src/DefinitionClass'



describe(`Void`, () => {

    const voidDef = _.void()

    it('checks the return types of read or write as a string', () => {
        expect(voidDef.getTsTypeAsString()).toEqual({ 'read': 'void', 'write': 'void' })
    })

    it('accepts an undefined value', async ()=>{
        expect(await voidDef.formatAndValidate(undefined)).toEqual(undefined)
    })

    //ATT: should it accept a valid value?
    it('accepts a valid value', async ()=>{
        expect(await voidDef.formatAndValidate(2)).toEqual(2)
    })
})