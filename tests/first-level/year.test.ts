


import { _ } from '../../src/DefinitionClass'



describe(`Year`, async () => {

    const currentYear = new Date().getFullYear()
    const yearDef = _.year()

    it('checks the return types of read or write as any', () => {
        expect(yearDef.getTsTypeAsString()).toEqual({ 'read': 'number', 'write': 'number' })
    })

    it('validates and formats a valid 4-digit year', async () => {
        await expect(yearDef.formatAndValidate(currentYear)).resolves.toEqual(currentYear)
    })

    await expect(yearDef.formatAndValidate('22'))
        .rejects.toThrow(`wrongLengthForDateInt`)

    await expect(yearDef.formatAndValidate('11223344'))
        .rejects.toThrow(`wrongLengthForDateInt`)
})