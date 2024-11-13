


import { _ } from '../src/DefinitionClass'



describe(`Year definition`, () => {

    const currentYear = new Date().getFullYear()
    const yearDef = _.n('myYear').year()

    it('checks the return types of read or write as any', () => {
        expect(yearDef.getTsTypeAsString()).toEqual({ 'read': 'number', 'write': 'number' })
    })

    it('validates and formats a valid 4-digit year', async () => {
        await expect(yearDef.formatAndValidate(currentYear)).resolves.toEqual(currentYear);
    })
})