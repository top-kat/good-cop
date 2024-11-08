

import { _ } from '../src/DefinitionClass'



describe('Definition', () => {

    describe(`MERGE WITH`, () => {

        const objDef = _.object({ name: _.string() }).mergeWith({ email: _.string().required() })

        it('merge1', () => {
            expect(objDef.getTsTypeAsString()).toEqual({
                read: `{\n    'name'?: string\n    'email': string\n}`,
                write: `{\n    'name'?: string\n    'email': string\n}`,
            })
        })

        it('merge2', async () => {
            expect(await objDef.formatAndValidate({ name: 22, email: '3' })).toEqual({ name: '22', email: '3' })
        })

        it('merge3 throw email missing', async () => {
            expect(async () => await objDef.formatAndValidate({ name: 22 })).rejects.toThrow('Field email is required')
        })
        it('merge4 name missing = OK', async () => {
            expect(await objDef.formatAndValidate({ email: 22 })).toEqual({ email: '22' })
        })
    })

    describe(`PARTIAL / COMPLETE`, () => {

        const partial = _.object({ name: _.string() }).mergeWith({ email: _.string().required() }).partial()

        it('partial1', () => {
            expect(partial.getTsTypeAsString().read).toContain('Partial<')
        })

        it('partial2', async () => {
            expect(await partial.formatAndValidate({})).toEqual({})
        })

        const complete = _.object({ name: _.string() }).mergeWith({ email: _.string().required() }).complete()

        it('complete1', () => {
            expect(complete.getTsTypeAsString().read).toContain('Required<')
        })

        it('complete2 name should be required now', async () => {
            expect(async () => await complete.formatAndValidate({ email: 'coucou' })).rejects.toThrow('Field name is required')
        })
        it('complete3', async () => {
            expect(await complete.formatAndValidate({ email: 'coucou', name: 'rtr' })).toEqual({ email: 'coucou', name: 'rtr' })
        })

    })

    describe(`MONGO MODEL`, () => {

        const mongoModel = _.mongoModel(['creationDate', 'creator', 'lastUpdateDate', 'lastUpdater'], {
            coucou: _.string(),
            subObj: {
                jesus: _.boolean().required()
            },
            arr: [{
                laReineDéNèje: _.array(_.object({ libéréDélivray: _.number() }))
            }]
        })

        it('MongoModel autoUpdate fields', () => {
            expect(mongoModel.getTsTypeAsString().read).toMatch(/'creationDate': Date\s+'creator': string \| User\s+'lastUpdateDate'?: Date\s+'lastUpdater': string | User/)
        })

        it(`All optional values are null and it's OK 😎`, async () => {
            expect(async () => await mongoModel.formatAndValidate({
                coucou: null,
                subObj: {
                    jesus: `il fo kroire en lui`
                },
                arr: [{
                    laReineDéNèje: [{
                        libéréDélivray: null
                    }, {
                        libéréDélivray: null
                    }]
                }]
            }))
        })

        it(`One required value is null and that's not OK 🛂`, async () => {
            expect(async () => await mongoModel.formatAndValidate({
                coucou: null,
                subObj: {
                    jesus: null
                },
            })).rejects.toThrow('Field jesus is required')
        })


    })
})