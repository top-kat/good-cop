import { mergeDefinitionInherits } from './helpers/definitionGenericHelpers'
import { formatAndValidate } from './helpers/formatAndValidateForDefinition'
import { triggerOnObjectType } from './helpers/triggerOnObjectType'
import { Definition } from './DefinitionClass'

import { DefinitionPartial, DefinitionObjChild, DefinitionPartialFn, ProvidedModels } from './definitionTypes'

import { asArray } from 'topkat-utils'

export class DefinitionBase<
    OverridedTypeRead = unknown,
    OverridedTypeWrite = unknown
> {
    tsTypeRead = '' as OverridedTypeRead
    tsTypeWrite = '' as OverridedTypeWrite
    isRequired?: boolean | undefined
    refValue?: string | undefined
    /** used to store models for model() and ref() definitions */
    _definitions = [] as (DefinitionPartial | DefinitionPartialFn)[] // may be used somewhere outside the class
    protected _models? = {} as ProvidedModels
    // protected _flatObjectCacheWithoutArraySyntax: Record<string, Definition> | undefined
    constructor(definitions?: DefinitionPartial | DefinitionPartial[], previousThis?: DefinitionBase<any, any>) {
        if (previousThis) {
            // this._arrOrObjCache = previousThis._arrOrObjCache
            this.refValue = previousThis.refValue as any
            this._definitions = [...previousThis._definitions]
        }
        if (definitions) {
            for (const definition of asArray(definitions)) {
                // default values
                if (typeof definition.priority !== 'number') definition.priority = 50

                this._definitions.push(definition)

                if (definition.inheritFrom) mergeDefinitionInherits(definition, definition.inheritFrom)
                if (definition.ref) this.refValue = definition.ref as any
                if (typeof definition.required === 'boolean') this.isRequired = definition.required
            }
            this._definitions.sort((a, b) => (a as any).priority - (b as any).priority)
        }
    }
    /** @returns formatted result */
    formatAndValidate = formatAndValidate
    getObjectCache(): DefinitionObjChild | undefined {
        const definitions = this._definitions

        for (const def of definitions) {
            const { objectCache } = typeof def === 'function' ? def() : def
            if (objectCache) return objectCache
        }
    }

    /** for all definitions of the object (eg [string, required]) it will find a value */
    getDefinitionValue<K extends keyof DefinitionPartial>(name: K): (DefinitionPartial[K] | void) {
        for (const defRaw of this._definitions) {
            const def = typeof defRaw === 'function' ? defRaw() : defRaw
            if (typeof def?.[name] !== 'undefined') return def?.[name]
        }
    }
    getName() {
        for (const def of this._definitions) {
            const { paramName } = typeof def === 'function' ? def() : def
            if (paramName) return paramName
        }
    }
    getTsTypeAsString() {
        const definitions = this._definitions

        const output = { read: 'any' } as { read: string, write: string }

        for (const defRaw of definitions) {
            const def = typeof defRaw === 'function' ? defRaw() : defRaw
            for (const readOrWriteType of ['tsTypeStr', 'tsTypeStrForWrite'] as const) {
                const isRead = readOrWriteType === 'tsTypeStr'
                const typeInDef = def[readOrWriteType]
                const readOrWrite = isRead ? 'read' : 'write'
                if (typeInDef) {
                    output[readOrWrite] = typeof typeInDef === 'function' ? typeInDef(isRead ? output.read : output.write || output.read) : typeInDef
                }
            }
        }

        if (typeof output.write === 'undefined') output.write = output.read

        return output
    }
    flatten(
        removeArrayBracketsNotation = false,
        onDefinition: (def: Definition) => any = (def: Definition) => def,
        addr = '',
        objFlat = {}
    ) {
        const obj = this.getObjectCache()
        return obj ? flatten(removeArrayBracketsNotation, onDefinition, obj, addr, objFlat) : {}
    }
}

function flatten(
    this: Definition | any,
    removeArrayBracketsNotation = false,
    /** Returning falsey value will write nothing in flat model */
    onDefinition: (def: Definition) => any = (def: Definition) => def,
    parentValue,
    addr = '',
    flatObj: Record<string, Definition> = {}
): Record<string, Definition> {
    // TODO avoid making a recursive function at each reads
    // if (!removeArrayBracketsNotation && this?._flatObjectCache) return this?._flatObjectCache
    // if (removeArrayBracketsNotation && this?._flatObjectCacheWithoutArraySyntax) return this?._flatObjectCacheWithoutArraySyntax
    triggerOnObjectType(parentValue, {
        onArrayItem(item, i) {
            flatten(removeArrayBracketsNotation, onDefinition, item, addr + (removeArrayBracketsNotation ? '' : `[${i}]`), flatObj)
        },
        onObjectItem(value, key) {
            flatten(removeArrayBracketsNotation, onDefinition, value, addr ? addr + `.${key}` : key, flatObj)
        },
        onDefinition(definition) {
            const returnValue = onDefinition(definition)
            if (returnValue) flatObj[addr] = returnValue
            definition.flatten(removeArrayBracketsNotation, onDefinition, addr, flatObj)
        },
    })
    return flatObj
}