

import { _ } from '../src/DefinitionClass'



describe('Definition', () => {

    describe(`Number def`, () => {

        const numberDef = _.n('myNumber').number() // check inherit working correctly

        it('numberDef', () => {
            expect(numberDef.getTsTypeAsString()).toEqual({ 'read': 'number', 'write': 'number' })
        })
    })

    describe(`ARRAY single`, () => {

        const arrDef = _.array(_.string())

        it('stringDef', () => {
            expect(arrDef.getTsTypeAsString())
                .toEqual({ 'read': 'Array<string>', 'write': 'Array<string>' })
        })

        it('stringDef2', async () => {
            expect(await arrDef.formatAndValidate(['coucou', 1]))
                .toEqual(['coucou', '1'])
        })

        it('stringDef4 throw', async () => {
            expect(async () => await arrDef.formatAndValidate(null))
                .rejects.toThrow(`Expected type 'array' but got type object for value null`)
        })


        it('stringDef5 throw', async () => {
            expect(async () => await arrDef.formatAndValidate(['e', true]))
                .rejects.toThrow(`Expected type 'string' but got type boolean for value true`)
        })

    })



    describe(`OBJECTS single`, () => {

        const objDef = _.object({ name: _.string(), number: _.number(), bool: _.boolean() })

        it('objDef', () => {
            expect(objDef.getTsTypeAsString()).toEqual({
                read: `{\n    'name'?: string\n    'number'?: number\n    'bool'?: boolean\n}`,
                write: `{\n    'name'?: string\n    'number'?: number\n    'bool'?: boolean\n}`,
            })
        })

        it('objDef2 with foreign fields allowed', async () => {
            expect(
                await objDef.formatAndValidate({ name: 22, number: '3', foreignField: 'koukou' })
            ).toEqual({ name: '22', number: 3, foreignField: 'koukou' })
        })

        it('objDef3 throw', async () => {
            expect(
                async () => await objDef.formatAndValidate(22)
            ).rejects.toThrow(`Expected type 'object' but got type number for value 22`)
        })


        it('stringDef5 throw', async () => {
            expect(
                async () => await objDef.formatAndValidate({ name: true })
            ).rejects.toThrow(`Expected type 'string' but got type boolean for value true`)
        })

    })


    describe(`OBJECT with foreign fields not allowed`, () => {

        const objDef = _.object({ name: _.string(), number: _.number() }, { deleteForeignKeys: true })
        it('objDef2 with foreign fields NOT allowed', async () => {
            expect(
                await objDef.formatAndValidate({ name: 22, number: '3', foreignField: 'koukou' })
            ).toEqual({ name: '22', number: 3 })
        })
    })


    describe(`COMPLEX OBJECT`, () => {

        const objDef = _.object({
            arr: [_.string()],
            arr2: _.array(_.string()),
            subObj: {
                name: _.enum(['a', 'b']),
                tuple: _.tuple([_.string(), _.date()]),
                typeOr: _.typesOr([_.number(), _.boolean()]),
                subArr: [_.email()]
            }
        })

        it('objDef', () => {
            expect(objDef.getTsTypeAsString()).toEqual({
                read: `{\n    'arr'?: Array<string>\n    'arr2'?: Array<string>\n    'subObj'?: {\n        'name'?: 'a' | 'b'\n        'tuple'?: [string, Date]\n        'typeOr'?: number | boolean\n        'subArr'?: Array<string>\n    }\n}`,
                write: `{\n    'arr'?: Array<string>\n    'arr2'?: Array<string>\n    'subObj'?: {\n        'name'?: 'a' | 'b'\n        'tuple'?: [string, Date]\n        'typeOr'?: number | boolean\n        'subArr'?: Array<string>\n    }\n}`,
            })
        })

        const rightSubobj = {
            name: 'a',
            tuple: ['a', new Date()],
            typeOr: true, // or bool
            subArr: ['aa@aa.aa', 'bb@bb.bb']
        }
        const rightBody = {
            arr: ['a', 'b', 'c', 'd'],
            arr2: ['a', 'b', 'c', 'd'],
            subObj: rightSubobj
        }

        it('obj OK', async () => {
            expect(await objDef.formatAndValidate(rightBody)).toEqual(rightBody)
        })

        const wrongArr = { ...rightBody, arr: [null, 'r', true] }

        it('wrongArr in obj', async () => {
            // TODO check error return
            expect(async () => await objDef.formatAndValidate(wrongArr)).rejects.toThrow(`Expected type 'string' but got type object for value null`)
        })

        const wrongArrTyple = { ...rightBody, subObj: { ...rightSubobj, tuple: ['a', false] } }

        it('wrongArrTyple', async () => {
            expect(async () => await objDef.formatAndValidate(wrongArrTyple)).rejects.toThrow(`Expected type 'date' but got false`)
        })

        const typesOrSecondType = { ...rightBody, subObj: { ...rightSubobj, typeOr: 9 } }

        it('typesOr second type OK', async () => {
            const formatted = await objDef.formatAndValidate(typesOrSecondType)
            expect(formatted).toEqual(typesOrSecondType)
        })

        const typesOrWrongType = { ...rightBody, subObj: { ...rightSubobj, typeOr: [null, 2] } }

        it('typesOrWrongType', async () => {
            expect(async () => await objDef.formatAndValidate(typesOrWrongType)).rejects.toThrow(`Value ,2 should be one of the following types: [object Object], [object Object]`)
        })

    })



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