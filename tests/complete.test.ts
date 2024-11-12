


import { _ } from '../src/DefinitionClass'



describe(`Complete definition`, () => {

    const complete = _.object({ name: _.string() }).mergeWith({ email: _.string().required() }).complete()

    it('completeDef', () => {
        expect(complete.getTsTypeAsString().read).toContain('Required<')
    })

    it('passes with a complete object', async () => {
        expect(await complete.formatAndValidate({ email: 'emailAddress', name: 'testman' })).toEqual({ email: 'emailAddress', name: 'testman' })
    })

    //it could be good here to have an error saying what value is required
    it('throws an error if the whole object is not received', async () => {
        expect(async () => await complete.formatAndValidate({ email: 'emailAddress' })).rejects.toThrow('Field name is required')
    })
})