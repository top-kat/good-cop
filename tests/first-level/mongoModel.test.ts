


import { _ } from '../../src/DefinitionClass'



describe('Mongo Model', () => {

    const mongoModel = _.mongoModel(['creationDate', 'creator', 'lastUpdateDate', 'lastUpdater'], {
        modelStringValue: _.string(),
        modelSubObject: {
            myBooleanValue: _.boolean().required()
        },
        modelArray: [{
            myArrayValue: _.array(_.object({ myNumberValue: _.number() }))
        }]
    })

    it('mongoModel autoUpdate fields', () => {
        expect(mongoModel.getTsTypeAsString().read).toMatch(/'creationDate': Date\+'creator': string \| modelTypes.User\s+'lastUpdateDate'?: Date\s+'lastUpdater':string | modelTypes.User/)
    })

    it('optional values can be null', async () => {
        expect(await mongoModel.formatAndValidate({
            modelStringValue: null,
            modelSubObject: { myBooleanValue: true },
            modelArray: [{
                myArrayValue: [{
                    myNumberValue: null
                }]
            }]
        })).toMatchObject({
            creationDate: expect.any(Date),
            modelArray: [
                {
                    myArrayValue: [
                        { myNumberValue: null }
                    ]
                }
            ],
            modelStringValue: null,
            modelSubObject: { myBooleanValue: true }
        })
    })

    it('optional values can be null', async () => {
        await expect(mongoModel.formatAndValidate({
            modelSubObject: { myBooleanValue: 'boolean value is present but wrong type' },
        })).rejects.toThrow('Expected type boolean but got type string for value "boolean value is present but wrong type"')
    })

    it('required value cannot be null', async () => {
        await expect(mongoModel.formatAndValidate({
            modelStringValue: 'string value is present',
            modelSubObject: { myBooleanValue: null },
            modelArray: [{
                myArrayValue: [{ myNumberValue: null }]
            }]
        })).rejects.toThrow('Field myBooleanValue is required')
    })
})