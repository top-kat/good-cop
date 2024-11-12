


import { _ } from '../src/DefinitionClass'



describe(`Mongo Model defenition`, () => {

    const mongoModel = _.mongoModel(['creationDate', 'creator', 'lastUpdateDate', 'lastUpdater'], {
        coucou: _.string(),
        subObj: {
            myBoolean: _.boolean().required()
        },
        arr: [{
            myArray: _.array(_.object({ myNumber: _.number() }))
        }]
    })

    it('MongoModel autoUpdate fields', () => {
        expect(mongoModel.getTsTypeAsString().read).toMatch(/'creationDate': Date\+'creator': string \| User\s+'lastUpdateDate'?: Date\s+'lastUpdater':string | User/)
    })

    it(`All optional values are null and it's OK 😎`, async () => {
        expect(async () => await mongoModel.formatAndValidate({
            coucou: null,
            subObj: {
                myBoolean: `il fo kroire en lui`
            },
            arr: [{
                myArray: [{
                myNumber: null
            },
            {
                myNumber: null
            }]
            }]
        }))
    })

    it(`One required value is null and that's not OK 🛂`, async () => {
        expect(async () => await mongoModel.formatAndValidate({
            coucou: null,
            subObj: {
                myBoolean: null
            },
        })).rejects.toThrow('Field myBoolean is required')
    })
})