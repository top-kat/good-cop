


import { _ } from '../src/DefinitionClass'



describe(`Lowercase`, () => {

    const lowerCaseDef = _.string().lowerCase()

        it('checks the return types of read or write as a string', () => {
            expect(lowerCaseDef.getTsTypeAsString()).toEqual({ 'read': 'string', 'write': 'string' })
        })

        it('accepts a string of lowercase characters', async ()=>{
            expect(await lowerCaseDef.formatAndValidate('lowercase')).toEqual('lowercase')
        })

        it('converts a string to lowercase', async ()=>{
            expect(await lowerCaseDef.formatAndValidate('camelCase')).toEqual('camelcase')
        })
})

describe(`Uppercase`, () => {

    const upperCaseDef = _.string().upperCase()

        it('checks the return types of read or write as a string', () => {
            expect(upperCaseDef.getTsTypeAsString()).toEqual({ 'read': 'string', 'write': 'string' })
        })

        it('accepts a string of uppercase characters', async ()=>{
            expect(await upperCaseDef.formatAndValidate('UPPERCASE')).toEqual('UPPERCASE')
        })

        it('converts a string to uppercase', async ()=>{
            expect(await upperCaseDef.formatAndValidate('camelCase')).toEqual('CAMELCASE')
        })
})