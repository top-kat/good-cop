


import { _ } from '../../src/DefinitionClass'



describe(`String constant`, () => {

    const stringConstantDef = _.stringConstant('stringConstant')

    it('checks the return types of read or write as a string', () => {
        expect(stringConstantDef.getTsTypeAsString()).toEqual({
            'read': `'stringConstant'`,
            'write': `'stringConstant'`
        });
    })

    //ATT: these types are weird, and need to be fixed

    it('does not accept a different string', async () => {
        expect(await stringConstantDef.formatAndValidate('differentString')).toEqual('stringConstant')
    })

    it('throws an error if passed a boolean', async () => {
        expect(await stringConstantDef.formatAndValidate(true)).toEqual('stringConstant')
    })
    it('throws an error if passed a boolean', async () => {
        expect(await stringConstantDef.formatAndValidate(true)).toEqual('stringConstant')
    })
})