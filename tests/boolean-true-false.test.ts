


import { _ } from '../src/DefinitionClass'


//TRUE BOOLEAN
describe(`True boolean definition`, () => {

    const trueBooleanDef = _.n('myTrueBoolean').true()

    it('true boolean definition', () => {
        expect(trueBooleanDef.getTsTypeAsString()).toEqual({ 'read': 'true', 'write': 'true' })
    })

    it('correctly formats and validates true booleans', async () => {
        expect(await trueBooleanDef.formatAndValidate(true)).toEqual(true)
    })

    //ATTENTION: boolean is not enough, error needs to say boolean FALSE
    it('throws an error for false boolean', async () => {
        await expect(trueBooleanDef.formatAndValidate(false)).rejects.toThrow(`Expected type 'boolean' but got type boolean for value false`);
    })

    it('throws an error if the type is not a boolean', async () => {
        await expect(trueBooleanDef.formatAndValidate('testman')).rejects.toThrow(`Expected type 'boolean' but got type string for value "testman"`);
    })
})

//FALSE BOOLEAN
describe(`False boolean definition`, () => {

    const falseBooleanDef = _.n('myTrueBoolean').false()

    it('true boolean definition', () => {
        expect(falseBooleanDef.getTsTypeAsString()).toEqual({ 'read': 'false', 'write': 'false' })
    })

    it('correctly formats and validates false booleans', async () => {
        expect(await falseBooleanDef.formatAndValidate(false)).toEqual(false)
    })

    //ATTENTION: boolean is not enough, error needs to say boolean TRUE
    it('throws an error for false boolean', async () => {
        await expect(falseBooleanDef.formatAndValidate(true)).rejects.toThrow(`Expected type 'boolean' but got type boolean for value true`);
    })

    it('throws an error if the type is not a boolean', async () => {
        await expect(falseBooleanDef.formatAndValidate('testman')).rejects.toThrow(`Expected type 'boolean' but got type string for value "testman"`);
    })
})