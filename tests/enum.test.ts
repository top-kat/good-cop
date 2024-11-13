


import { _ } from '../src/DefinitionClass'



describe('Enum Validation', () => {
    const enumDef = _.enum(['string1', 'string2']);

    it('checks the return types of read or write as a string', () => {
        expect(enumDef.getTsTypeAsString()).toEqual({
            read: "'string1' | 'string2'",  // eslint-disable-line
            write: "'string1' | 'string2'"  // eslint-disable-line
        });
    });

    //ATT: maybe not the best way to test this
    it('accepts individual strings and validates them', async () => {
        const validValues = ['string1', 'string2'];

        for (const value of validValues) {
            const result = await enumDef.formatAndValidate([value])
            expect(result).toEqual([value])
        }
    });
});
