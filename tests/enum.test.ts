


import { _ } from '../src/DefinitionClass'



describe('Enum Validation', () => {
    const enumDef = _.enum(['string1', 'string2']);

    it('checks the return types of read or write as a string', () => {
        expect(enumDef.getTsTypeAsString()).toEqual({
            read: "'string1' | 'string2'",  // eslint-disable-line
            write: "'string1' | 'string2'"  // eslint-disable-line
        });
    })

    it('accepts individual strings and validates them', async () => {
        const validValue: Array<typeof enumDef.tsTypeRead> = ['string1', 'string2']

        for (const value of validValue) {
            const result = await enumDef.formatAndValidate(value)
            expect(result).toEqual(value)
        }
    })

    it('throws an error if elements do not match', async () => {
        const inValidValues = [1, 2];
    
        for (const value of inValidValues) {
            await expect(enumDef.formatAndValidate(value)).rejects.toThrow(`Value "${value}" does not match allowed values string1,string2`);
        }
    });
})
