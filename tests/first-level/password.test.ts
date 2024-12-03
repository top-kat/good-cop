


import { _ } from '../../src/DefinitionClass'



describe(`Password`, () => {

    const simpleEncrypt = (value: string): string => {
        // Example of a basic encryption (not recommended for production)
        return value.split('').reverse().join('')
    };

    const passwordDef = _.password({
        regexp: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
        minLength: 8,
        maxLength: 30,
        encrypt: simpleEncrypt
    });

    it('checks the return types of read or write as a string', () => {
        expect(passwordDef.getTsTypeAsString()).toEqual({ 'read': 'string', 'write': 'string' })
    })

    it('throws an error if password does not match regex', async () => {
        await expect(passwordDef.formatAndValidate('12345678@')).rejects.toThrowError(
            `Password doesn't match regexp /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$/`
        )
    })

    it('throws an error if password is less than 8 characters', async () => {
        await expect(passwordDef.formatAndValidate('<8Char')).rejects.toThrowError('Password is inferior than minLength of 8');
    })

    it('throws an error if password is greater than 30 characters', async () => {
        await expect(passwordDef.formatAndValidate('>30Char1234567891011121314151617181920')).rejects.toThrowError('Password is superior than maxLength of 30');
    })

    it('throws an error if password is greater than 30 characters', async () => {
        expect(await passwordDef.formatAndValidate('V@lidPa55')).toEqual('55aPdil@V')
    })
})