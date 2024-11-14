


import { _ } from '../../src/DefinitionClass'


//ATT: no difference in tests between this and Max
describe(`Lte`, () => {

    const lteDef = _.number().lte(2)

        it('checks the return types of read or write as a string', () => {
            expect(lteDef.getTsTypeAsString()).toEqual({ 'read': 'number', 'write': 'number' })
        })

        it('accepts a number lower', async ()=>{
            expect(await lteDef.formatAndValidate(1)).toEqual(1)
        })

        it('throws an error if a higher number is passed', ()=>{
            expect(lteDef.formatAndValidate(3)).rejects.toThrow(`Value 3 exceeds the maximum allowed value of 2`)
        })
})