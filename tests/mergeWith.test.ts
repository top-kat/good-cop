


import { _ } from '../src/DefinitionClass'



describe(`Mergewith definition`, () => {

    const mergeWithDef = _.object({ name: _.string() }).mergeWith({ email: _.string().required() })

    it('mergeWithDef', () => {
        expect(mergeWithDef.getTsTypeAsString()).toEqual({
            read: `{\n    'name'?: string\n    'email': string\n}`,
            write: `{\n    'name'?: string\n    'email': string\n}`,
        })
    })

    it('merges and accepts the object', async () => {
        expect(await mergeWithDef.formatAndValidate({ name: 22, email: '3' })).toEqual({ name: '22', email: '3' })
    })

    it('accepets an entry that is not required', async () => {
        expect(await mergeWithDef.formatAndValidate({ email: 22 })).toEqual({ email: '22' })
    })

    it('throws error when missing required entry', async () => {
        expect(async () => await mergeWithDef.formatAndValidate({ name: 22 })).rejects.toThrow('Field email is required')
    })

    // it('throws error when another unknown entry is added', async () => {
    //     expect(async () => await mergeWithDef.formatAndValidate({ name: 22, email:'22', age:25 })).rejects.toThrow('unknown additional entry')
    // })
})