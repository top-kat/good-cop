


import { _ } from '../src/DefinitionClass'



describe(`String constant definition`, () => {

    const stringConstantDef = _.n('stringConstant').stringConstant('stringConstant')

    //ATT: need to check return type here
        it('checks the return types of read or write as a string', () => {
            expect(stringConstantDef.getTsTypeAsString()).toEqual({
                'read': "'stringConstant'", // eslint-disable-line
                'write': "'stringConstant'" // eslint-disable-line
            });
        })

    //ATT: these types are weird, and need to be fixed

        // it('does not accept a different string', async () => {
        //     expect(await stringConstantDef.formatAndValidate('differentString')).rejects.toThrowError('Expected type \'myStringConstant\' but got type string for value differentString')
        // })

        // it('throws an error if passed a boolean', async () => {
        //     await expect(stringConstantDef.formatAndValidate(true)).rejects.toThrow('Expected type \'stringConstant\' but got type boolean for value')
        // })
})