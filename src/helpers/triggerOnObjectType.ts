
import { Definition } from '../DefinitionClass'

import { C, DescriptiveError } from 'topkat-utils'

const maxDepth = 9

type TriggerOnObjectTypeOptions<T> = {
    required?: boolean
    errorExtraInfos?: Record<string, any>
    returnValueIfUndefined?: any
    onDefinition(definition: Definition): any
} & ({
    onArrayItem?(arr: T, i: string | number): any
    onObjectItem?(value: T, key: string): any
} | {
    onArray?(arr: any[]): any
    onObject?(object: Record<string, any>): any
})
// TODO cleanup and refactorise
type TriggerOnObjectTypeOptionsAsync<T> = {
    required?: boolean
    errorExtraInfos?: Record<string, any>
    returnValueIfUndefined?: any
    onDefinition(definition: Definition): any | Promise<any>
} & ({
    onArrayItem?(arr: T, i: string | number): any | Promise<any>
    onObjectItem?(value: T, key: string): any | Promise<any>
} | {
    onArray?(arr: any[]): any | Promise<any>
    onObject?(object: Record<string, any>): any | Promise<any>
})

export async function triggerOnObjectTypeAsync<T>(
    obj: T,
    optionBase: TriggerOnObjectTypeOptionsAsync<T>,
    depth: number,
) {
    const {
        onDefinition,
        required = true,
        errorExtraInfos = {},
        returnValueIfUndefined,
        ...options
    } = optionBase

    if (depth >= maxDepth) {
        C.error(false, 'Too much recursion for format and validate. Cycle has been stopped')
        return returnValueIfUndefined
    }

    if (obj && typeof obj === 'object' && '_definitions' in obj) return await onDefinition(obj as any)
    else if (typeof obj === 'undefined') {
        if (required) {
            throw new DescriptiveError('One field is undefined in definition', { code: 500, ...errorExtraInfos })
        } else return returnValueIfUndefined
    } else if (Array.isArray(obj)) {
        if ('onArray' in options) {
            return await options.onArray?.(obj)
        } else {
            const fn = 'onArrayItem' in options && options.onArrayItem ? options.onArrayItem : async item => await triggerOnObjectTypeAsync(item, optionBase, depth)
            const output = [] as any[]
            for (const [i, subItem] of Object.entries(obj)) output.push(await fn(subItem, i))
            return output
        }
    } else if (typeof obj === 'object' && obj) {
        if ('onObject' in options && options.onObject) {
            return await options.onObject(obj)
        } else {
            const fn = 'onObjectItem' in options && options.onObjectItem ? options.onObjectItem : async item => await triggerOnObjectTypeAsync(item, optionBase, depth)
            const newObj = {}
            for (const [k, v] of Object.entries(obj)) {
                // do not write undefined values
                const newVal = await fn(v, k)
                if (typeof newVal !== 'undefined') newObj[k] = newVal
            }
            return newObj
        }
    }
}

export function triggerOnObjectType<T>(
    obj: T,
    optionBase: TriggerOnObjectTypeOptions<T>,
    depth: number,
) {
    const {
        onDefinition,
        required = true,
        errorExtraInfos = {},
        returnValueIfUndefined,
        ...options
    } = optionBase

    if (depth >= maxDepth) {
        C.error(false, 'Too much recursion for format and validate. Cycle has been stopped')
        return returnValueIfUndefined
    }

    if (obj && typeof obj === 'object' && '_definitions' in obj) return onDefinition(obj as any)
    else if (typeof obj === 'undefined') {
        if (required) {
            throw new DescriptiveError('One field is undefined in definition', { code: 500, ...errorExtraInfos })
        } else return returnValueIfUndefined
    } else if (Array.isArray(obj)) {
        if ('onArray' in options && options.onArray) {
            return options.onArray(obj)
        } else {
            const fn = 'onArrayItem' in options && options.onArrayItem ? options.onArrayItem : item => triggerOnObjectType(item, optionBase, depth)
            return obj.map((subItem, i) => fn(subItem, i))
        }
    } else if (typeof obj === 'object' && obj) {
        if ('onObject' in options && options.onObject) {
            return options.onObject(obj)
        } else {
            const fn = 'onObjectItem' in options && options.onObjectItem ? options.onObjectItem : item => triggerOnObjectType(item, optionBase, depth)
            const newObj = {}
            for (const [k, v] of Object.entries(obj)) {
                // do not write undefined values
                const newVal = fn(v, k)
                if (typeof newVal !== 'undefined') newObj[k] = newVal
            }
            return newObj
        }
    }
}