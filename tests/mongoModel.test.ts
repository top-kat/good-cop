


import { _ } from '../src/DefinitionClass'



describe('Mongo Model', () => {

    const mongoModel = _.mongoModel(['creationDate', 'creator', 'lastUpdateDate', 'lastUpdater'], {
        modelStringValue: _.string(),
        modelSubObject
        : {
            myBooleanValue: _.boolean().required()
        },
        modelArray: [{
            myArrayValue: _.array(_.object({ myNumberValue: _.number() }))
        }]
    })

    it('mongoModel autoUpdate fields', () => {
        expect(mongoModel.getTsTypeAsString().read).toMatch(/'creationDate': Date\+'creator': string \| User\s+'lastUpdateDate'?: Date\s+'lastUpdater':string | User/)
    })

    it('optional values can be null', async () => {
        expect(async () => await mongoModel.formatAndValidate({
            modelStringValue: null,
            modelSubObject: { myBooleanValue: 'boolean value is present' },
            modelArray: [{
                myArrayValue: [{
                myNumberValue: null
            }]
            }]
        }))
    })

    it('required value cannot be null', async () => {
        await expect(mongoModel.formatAndValidate({
            modelStringValue: 'string value is present',
            modelSubObject: { myBooleanValue: null },
            modelArray: [{
                myArrayValue:
                [{ myNumberValue: null }]
            }]
        })).rejects.toThrow('Field myBooleanValue is required');
    })
})