


import { _ } from '../../src/DefinitionClass'



describe(`Tuple`, () => {

    const tupleDef = _.tuple([_.string(), _.number()])



    it('checks the return types of read or write as a string', () => {
        expect(tupleDef.getTsTypeAsString())
            .toEqual({ 'read': '[string, number]', 'write': '[string, number]' })
    })

    it('accepts an array of string and number', async () => {
        expect(await tupleDef.formatAndValidate(['myString1', 1]))
            .toEqual(['myString1', 1])
    })

    //ATT: is it better to reformat or throw an error here?
    it('reformats in the format defined', async () => {
        await expect(tupleDef.formatAndValidate([1, 'shit']))
            .rejects.toThrow(`Expected type number but got type NaN for value null`)
    })
})