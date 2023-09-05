
import { _ } from './DefinitionClass'


// TODO  TODO  TODO  TODO  TODO
// SORRY too late and no time, TODO refactor and improve readability on this
// TODO  TODO  TODO  TODO  TODO

describe('Definition', () => {

    describe(`String def single`, () => {

        const stringDef = _.string()

        it('stringDef', () => {
            expect(stringDef.getTsTypeAsString()).toEqual({ 'read': 'string', 'write': 'string' })
        })

        it('stringDef2', async () => {
            expect(await stringDef.formatAndValidate('rere')).toEqual('rere')
        })

        it('stringDef3', async () => {
            expect(await stringDef.formatAndValidate(1)).toEqual('1')
        })

        it('stringDef4 throw', async () => {
            expect(async () => await stringDef.formatAndValidate(['r', true])).rejects.toThrow()
        })

    })

    describe(`ARRAY single`, () => {

        const arrDef = _.array(_.string())

        it('stringDef', () => {
            expect(arrDef.getTsTypeAsString()).toEqual({ 'read': 'Array<string>', 'write': 'Array<string>' })
        })

        it('stringDef2', async () => {
            expect(await arrDef.formatAndValidate(['coucou', 1])).toEqual(['coucou', '1'])
        })

        it('stringDef4 throw', async () => {
            expect(async () => await arrDef.formatAndValidate(null)).rejects.toThrow()
        })


        it('stringDef5 throw', async () => {
            expect(async () => await arrDef.formatAndValidate(['e', true])).rejects.toThrow()
        })

    })



    describe(`OBJECTS single`, () => {

        const objDef = _.object({ name: _.string(), number: _.number(), bool: _.boolean() })

        it('objDef', () => {
            expect(objDef.getTsTypeAsString()).toEqual({
                read: '{\n    name?: string\n    number?: number\n    bool?: boolean\n}',
                write: '{\n    name?: string\n    number?: number\n    bool?: boolean\n}',
            })
        })

        it('objDef2', async () => {
            expect(await objDef.formatAndValidate({ name: 22, number: '3' })).toEqual({ name: '22', number: 3 })
        })

        it('objDef3 throw', async () => {
            expect(async () => await objDef.formatAndValidate( 22)).rejects.toThrow()
        })


        it('stringDef5 throw', async () => {
            expect(async () => await objDef.formatAndValidate({ name: true })).rejects.toThrow()
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
                read: '{\n    arr?: Array<string>\n    arr2?: Array<string>\n    subObj?: {\n        name?: \'a\' | \'b\'\n        tuple?: [string, Date]\n        typeOr?: number | boolean\n        subArr?: Array<string>\n    }\n}',
                write: '{\n    arr?: Array<string>\n    arr2?: Array<string>\n    subObj?: {\n        name?: \'a\' | \'b\'\n        tuple?: [string, Date]\n        typeOr?: number | boolean\n        subArr?: Array<string>\n    }\n}',
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
            expect(async () => await objDef.formatAndValidate(wrongArr)).rejects.toThrow()
        })

        const wrongArrTyple = { ...rightBody, subObj: { ...rightSubobj, tuple: ['a', false] } }

        it('wrongArrTyple', async () => {
            expect(async () => await objDef.formatAndValidate(wrongArrTyple)).rejects.toThrow()
        })

        const typesOrSecondType = { ...rightBody, subObj: { ...rightSubobj, typeOr: 9 } }

        it('typesOr second type OK', async () => {
            const formatted = await objDef.formatAndValidate(typesOrSecondType)
            expect(formatted).toEqual(typesOrSecondType)
        })

        const typesOrWrongType = { ...rightBody, subObj: { ...rightSubobj, typeOr: [null, 2] } }

        it('typesOrWrongType', async () => {
            expect(async () => await objDef.formatAndValidate(typesOrWrongType)).rejects.toThrow()
        })

    })
})