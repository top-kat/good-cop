import { formatAndValidate } from './helpers/formatAndValidateForDefinition'
import { triggerOnObjectType } from './helpers/triggerOnObjectType'
import { Definition } from './DefinitionClass'

import { DefinitionPartial, DefinitionObjChild, DefinitionPartialFn, ProvidedModels } from './definitionTypes'

import { asArray } from 'topkat-utils'

export class DefinitionBase {
    isRequired?: boolean | undefined
    _refValue?: string | undefined
    /** used to store models for model() and ref() definitions */
    _definitions = [] as (DefinitionPartial | DefinitionPartialFn)[] // may be used somewhere outside the class
    protected _models? = {} as ProvidedModels
    // protected _flatObjectCacheWithoutArraySyntax: Record<string, Definition> | undefined
    constructor(definitions?: DefinitionPartial | DefinitionPartial[], previousThis?: DefinitionBase) {
        if (previousThis) {
            // this._arrOrObjCache = previousThis._arrOrObjCache
            this._refValue = previousThis._refValue as any
            this._definitions = [...previousThis._definitions]
        }
        if (definitions) {
            for (const definition of asArray(definitions)) {
                this._pushNewDef(definition, false)
            }
            this._definitions.sort((a, b) => (a as any).priority - (b as any).priority)
        }
    }
    _pushNewDef(definition: DefinitionPartial, doSort = true) {
        // default values
        if (typeof definition.priority !== 'number') definition.priority = 50

        this._definitions.push(definition)

        if (definition.ref) this._refValue = definition.ref as any
        if (typeof definition.required === 'boolean') this.isRequired = definition.required

        if (doSort) this._definitions.sort((a, b) => (a as any).priority - (b as any).priority)
    }
    /** @returns formatted result */
    formatAndValidate = formatAndValidate
    _getObjectCache(): DefinitionObjChild | undefined {
        const definitions = this._definitions

        for (const def of definitions) {
            const { objectCache } = typeof def === 'function' ? def() : def
            if (objectCache) return objectCache
        }
    }

    /** for all definitions of the object (eg [string, required]) it will find a defined value and return when the value is met the first time. Eg: for a value of 'isRequired', it will check all definitions for the first containing that field and return it's value */
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
    _getDefinitionObjFlat(
        removeArrayBracketsNotation = false,
        onDefinition: (def: Definition) => any = (def: Definition) => def,
        addr = '',
        objFlat = {}
    ) {
        const obj = this._getObjectCache()
        return obj ? _getDefinitionObjFlat(removeArrayBracketsNotation, onDefinition, obj, addr, objFlat) : {}
    }
}

function _getDefinitionObjFlat(
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
            _getDefinitionObjFlat(removeArrayBracketsNotation, onDefinition, item, addr + (removeArrayBracketsNotation ? '' : `[${i}]`), flatObj)
        },
        onObjectItem(value, key) {
            _getDefinitionObjFlat(removeArrayBracketsNotation, onDefinition, value, addr ? addr + `.${key}` : key, flatObj)
        },
        onDefinition(definition) {
            const returnValue = onDefinition(definition)
            if (returnValue) flatObj[addr] = returnValue
            definition._getDefinitionObjFlat(removeArrayBracketsNotation, onDefinition, addr, flatObj)
        },
    })
    return flatObj
}