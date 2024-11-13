


import { _ } from '../src/DefinitionClass'



//SIMPLE OBJECT
describe(`Simple Object`, () => {

    const objectDef = _.object({ name: _.string(), number: _.number(), bool: _.boolean() })

    it('checks the return types of read or write as a string', () => {
        expect(objectDef.getTsTypeAsString()).toEqual({
            read: `{\n    'name'?: string\n    'number'?: number\n    'bool'?: boolean\n}`,
            write: `{\n    'name'?: string\n    'number'?: number\n    'bool'?: boolean\n}`,
        })
    })

    it('allows for additional properties', async () => {
        expect(
            await objectDef
        .formatAndValidate({ name: 22, number: '3', additionalProperty1: 23, addProperty2: 'myString' })
        )
        .toEqual({ name: '22', number: 3, additionalProperty1: 23, addProperty2: 'myString' })
    })

    it('throws an error if a string is passed', async () => {
        await expect(objectDef.formatAndValidate('myString'))
            .rejects.toThrow(/Expected type 'object' but got type string for value "myString"/);
    });

    it('throws an error if a number is passed', async () => {
        await expect(objectDef.formatAndValidate(22))
            .rejects.toThrow(/Expected type 'object' but got type number for value 22/);
    });

    it('throws an error if a boolean is passed', async () => {
        expect(
            async () => await objectDef.formatAndValidate({ name: true })
        ).rejects.toThrow(`Expected type 'string' but got type boolean for value true`)
    })
})



//OBJECT THAT DOES NOT ALLOW ADDITIONAL PROPERTIES
describe(`Object with additional properties not allowed`, () => {

    const objectDef = _.object({ name: _.string(), number: _.number() }, { deleteForeignKeys: true })

    it('checks the return types of read or write as a string', () => {
        expect(objectDef.getTsTypeAsString()).toEqual({
            read: `{\n    'name'?: string\n    'number'?: number\n}`,
            write: `{\n    'name'?: string\n    'number'?: number\n}`,
        });
    });

    it('removes additional properties from the defined object', async () => {
        expect(
            await objectDef.formatAndValidate({ name: 22, number: '3', additionalField: 'myString' })
        ).toEqual({ name: '22', number: 3 })
    })
})



//COMPLEX OBJECT
describe(`Complex Object`, () => {

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

    it('checks the return types of read or write as a string', () => {
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