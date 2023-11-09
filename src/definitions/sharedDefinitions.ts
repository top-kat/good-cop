import { Definition } from '../DefinitionClass'
import { defaultTypeError } from '../helpers/definitionGenericHelpers'
import { TranslationObj } from '../core-types'
import { formatAndValidateDefinitionPartials } from '../helpers/formatAndValidateForDefinition'

import { DefCtx, InferTypeRead, InferTypeWrite, DefinitionObj } from '../definitionTypes'
import { isType, isDateIntOrStringValid, isset, ErrorOptions, parseRegexp } from 'topkat-utils'


export function matchRegexp<This extends Definition>(
    this: This,
    regexpOrStr: string | RegExp,
    regexpOptions?: Parameters<typeof parseRegexp>[1]
) {
    const regexp = typeof regexpOrStr === 'string' ? new RegExp(parseRegexp(regexpOrStr, regexpOptions)) : regexpOrStr
    return this.newDef({
        errorMsg: ctx => `Entry ${ctx.value} do not match ${regexp}`,
        validate: ctx => regexp.test(ctx.value),
    })
}
export function max<This extends Definition>(this: This, maxVal: number) {
    return this.newDef({
        errorMsg: ctx => `Value ${ctx.value} exceed the maximum allowed of ${maxVal}`,
        validate: ctx => ctx.value <= maxVal,
    })
}
export function min<This extends Definition>(this: This, minVal: number) {
    return this.newDef({
        errorMsg: ctx => `Value ${ctx.value} is below the allowed threshold of ${minVal}`,
        validate: ctx => ctx.value >= minVal,
    })
}
export function round2<This extends Definition>(this: This) {
    return this.newDef({
        errorMsg: defaultTypeError('number'),
        validate: ctx => typeof ctx.value === 'number',
        mongoType: 'number',
        tsTypeStr: 'number',
        format: ctx => Math.round(ctx.value * 100) / 100,
    })
}
export function float<This extends Definition>(this: This) {
    return this.newDef<number>({
        errorMsg: defaultTypeError('number'),
        validate: ctx => typeof ctx.value === 'number',
        mongoType: 'number',
        tsTypeStr: 'number',
        format: ctx => parseFloat(ctx.value),
    })
}
export function format<This extends Definition>(this: This, format: (ctx: DefCtx) => any) {
    return this.newDef({ format })
}

export function errorExtraInfos<This extends Definition>(this: This, errorExtraInfos: ErrorOptions) {
    return this.newDef({ errorExtraInfos })
}

export function name<This extends Definition>(this: This, name: string, paramNumber?: number) {
    return this.newDef({
        errorExtraInfos: { paramName: name, paramNumber },
        paramName: name
    })
}

export function onValidate<This extends Definition>(this: This, callback: (ctx: DefCtx) => any) {
    return this.newDef({
        validate: async ctx => {
            if (await callback(ctx) === false) return false
            else return true
        }
    })
}

export function between<This extends Definition>(this: This, min: number, max: number) {
    return this.newDef({
        errorMsg: ctx => `Value ${ctx.value} should be between ${min} and ${max} (inclusive)`,
        validate: ctx => ctx.value >= min && ctx.value <= max,
    })
}


export function undefinedType<This extends Definition>(this: This) {
    return this.newDef<undefined>({
        validate: () => true,
        format: ctx => typeof ctx.value === 'undefined' ? ctx.value : undefined,
        tsTypeStr: `undefined`,
    })
}




export function positive<This extends Definition>(this: This) {
    return this.newDef({
        errorMsg: ctx => `Value ${ctx.value} should be positive`,
        validate: ctx => ctx.value >= 0,
    })
}

export function string<This extends Definition>(this: This, acceptEmpty = false) {
    return this.newDef<string>({
        errorMsg: defaultTypeError('string'),
        format: ctx => (typeof ctx.value === 'number' ? ctx.value.toString() : ctx.value)?.trim(),
        validate: ctx => typeof ctx.value === 'string' && (acceptEmpty || ctx.value.length),
        mongoType: 'string',
        tsTypeStr: 'string',
    })
}
export function any<This extends Definition>(this: This,) {
    return this.newDef<any>({
        validate: () => true,
        mongoType: 'mixed',
        tsTypeStr: 'any',
    })
}
/** Integer, not a float */
export function int<This extends Definition>(this: This) {
    return this.newDef<number>({
        errorMsg: defaultTypeError('number'),
        format: ctx => Math.round(ctx.value),
        validate: ctx => typeof ctx.value === 'number',
        mongoType: 'number',
        tsTypeStr: 'number',
    })
}
export function boolean<This extends Definition>(this: This,) {
    return this.newDef<boolean>({
        errorMsg: defaultTypeError('boolean'),
        // format: ctx => !!ctx.value, commented because we want "strict mode"
        validate: ctx => typeof ctx.value === 'boolean',
        mongoType: 'boolean',
        tsTypeStr: 'boolean',
    })
}

export function typeEnum<
    This extends Definition,
    T extends string[]
>(this: This, possibleValues: [...T] | readonly [...T]) {
    return this.newDef<T[any]>({
        mongoType: 'string',
        errorMsg: ctx => `Value "${ctx.value}" do not match allowed values ${possibleValues.join(',')}`,
        validate: ctx => possibleValues.includes(ctx.value),
        tsTypeStr: possibleValues.length ? `'${possibleValues.join(`' | '`)}'` : 'never'
    })
}

export function date<This extends Definition>(this: This) {
    return this.newDef<Date>({
        errorMsg: defaultTypeError('date', false),
        // May be 01 Jan 1901 00:00:00 GMT || 2012-01-01T12:12:01.595Z
        format: ctx => typeof ctx.value === 'string' && (/\d{4}-\d{1,2}-\d{1,2}T\d+:\d+:\d+.*/.test(ctx.value) || /\d+ [A-Za-z]+ \d+/.test(ctx.value)) ? new Date(ctx.value) : ctx.value,
        validate: ctx => ctx.value instanceof Date,
        mongoType: 'date',
        tsTypeStr: 'Date',
    })
}
export function typeNull<This extends Definition>(this: This) {
    return this.newDef<null>({
        validate: ctx => ctx.value === null,
        format: ctx => ctx.value === null ? ctx.value : null,
        tsTypeStr: `null`,
    })
}
export function date8<This extends Definition>(this: This) {
    return this.newDef<number>({
        errorMsg: defaultTypeError('date8', false),
        validate: ctx => isDateIntOrStringValid(ctx.value, false, 8),
        format: ctx => (typeof ctx.value === 'string' ? parseInt(ctx.value) : ctx.value)?.trim(),
        mongoType: 'number',
        tsTypeStr: 'number',
    })
}
export function date12<This extends Definition>(this: This) {
    return this.newDef<number>({
        errorMsg: defaultTypeError('date12', false),
        validate: ctx => isDateIntOrStringValid(ctx.value, false, 12),
        format: ctx => (typeof ctx.value === 'string' ? parseInt(ctx.value) : ctx.value)?.trim(),
        mongoType: 'number',
        tsTypeStr: 'number',
    })
}
export function year<This extends Definition>(this: This) {
    return this.newDef<number>({
        errorMsg: defaultTypeError('year', false),
        validate: ctx => isDateIntOrStringValid(ctx.value, false, 4),
        format: ctx => (typeof ctx.value === 'string' ? parseInt(ctx.value) : ctx.value)?.trim(),
        mongoType: 'number',
        tsTypeStr: 'number',
    })
}
export function email<This extends Definition>(this: This) {
    return this.newDef<string>({
        format: ctx => ctx.value?.toLowerCase().trim(),
        mongoType: 'string',
        tsTypeStr: 'string',
        errorMsg: defaultTypeError('email', false),
        validate: ctx => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ctx.value),
    })
}
export function url<This extends Definition>(this: This) {
    return this.newDef<string>({
        format: ctx => typeof ctx.value === 'number' ? ctx.value.toString() : ctx.value,
        mongoType: 'string',
        tsTypeStr: 'string',
        errorMsg: defaultTypeError('url', false),
        validate: ctx => /^https?:\/\/.+/.test(ctx.value)
    })
}
export function translation<This extends Definition>(this: This) {
    return this.newDef<TranslationObj>({
        errorMsg: defaultTypeError('{ [countryCodeIso]: translationString }', false),
        validate: ctx => isType(ctx.value, 'object') && Object.entries(ctx.value).every(([countryCode, translationStr]) => typeof translationStr === 'string' && /[a-z][a-z]/.test(countryCode)),
        mongoType: 'object',
        tsTypeStr: 'TranslationObj',
    })
}
export function promise<This extends Definition>(this: This) {
    return this.newDef({
        priority: 99, // should pass after Array or any types
        errorMsg: ctx => `Expected: typeof Promise but got ${typeof ctx.value}`,
        validate: ctx => typeof ctx.value?.then === 'function', // /!\ promise type should not concern in app validation so this should never apply
        tsTypeStr: () => {
            const typeStr = this.getTsTypeAsString().read
            return typeStr.startsWith('Promise') ? typeStr : `Promise<${typeStr}>`
        },
        tsTypeStrForWrite: () => {
            const typeStr = this.getTsTypeAsString().write
            return typeStr.startsWith('Promise') ? typeStr : `Promise<${typeStr}>`
        },
    })
}
export function defaultValue<This extends Definition>(this: This, defaultValue: ((ctx: DefCtx) => any) | (string | any[] | Record<string, any> | Date | boolean | number | null)) {
    return this.newDef({
        priority: 1,
        format: ctx => {
            if (typeof ctx.value === 'undefined') {
                if (typeof defaultValue === 'function') return defaultValue(ctx)
                else return defaultValue
            } else return ctx.value
        },
        triggerOnUndefineds: true,
        alwaysDefinedInRead: true,
        methods: 'create'
    })
}
export function lowerCase<This extends Definition>(this: This) {
    return this.newDef({
        errorMsg: defaultTypeError('string'),
        format: ctx => typeof ctx.value === 'string' ? ctx.value.toLowerCase() : ctx.value,
    })
}
export function trim<This extends Definition>(this: This) {
    return this.newDef({
        errorMsg: defaultTypeError('string'),
        mongoType: 'string',
        tsTypeStr: 'string',
        format: ctx => typeof ctx.value === 'string' ? ctx.value.trim() : ctx.value,
    })
}
export function gt<This extends Definition>(this: This, maxVal: number) {
    return this.newDef({
        errorMsg: ctx => `Value ${ctx.value} should be strictly above ${maxVal}`,
        validate: ctx => ctx.value > maxVal,
    })
}
export function lt<This extends Definition>(this: This, minVal: number) {
    return this.newDef({
        errorMsg: ctx => `Value ${ctx.value} should be strictly below ${minVal}`,
        validate: ctx => ctx.value < minVal,
    })
}
export function unique<This extends Definition>(this: This) {
    return this.newDef({
        errorMsg: ctx => `Item should be unique. Another item with value: "${ctx.value}" for field "${ctx.fieldAddr}" has been found`,
        // TODO ?? add validator
        mongoType: obj => obj.unique = true,
    })
}
export function length<This extends Definition>(this: This, length: number, comparisonOperator: '<' | '>' | '===' = '===') {
    return this.newDef({
        errorMsg: ctx => `Wrong length for value at ${ctx.fieldAddr}. Expected length (${comparisonOperator} ${length}) but got length ${ctx.value && ctx.value.length}`,
        validate: ctx => isset(ctx.value) ? comparisonOperator === '>' ? ctx.value?.length > length : comparisonOperator === '<' ? ctx.value?.length < length : ctx.value?.length === length : true,
    })
}
export function minLength<This extends Definition>(this: This, minLength: number) {
    return this.newDef({
        errorMsg: ctx => `Wrong length for value at ${ctx.fieldAddr}. Expected minLength (${minLength}) but got length ${ctx.value && ctx.value.length}`,
        validate: ctx => typeof ctx.value === 'undefined' ? true : ctx.value?.length >= minLength,
    })
}
export function maxLength<This extends Definition>(this: This, maxLength: number) {
    return this.newDef({
        errorMsg: ctx => `Wrong length for value at ${ctx.fieldAddr}. Expected minLength (${maxLength}) but got length ${ctx.value && ctx.value.length}`,
        validate: ctx => typeof ctx.value === 'undefined' ? true : ctx.value?.length <= maxLength,
    })
}
export function ts<
    This extends Definition,
    TsTypeRead,
    TsTypeWrite
>(this: This, tsString: string, tsTypeWrite: string = tsString) {
    return this.newDef<TsTypeRead, TsTypeWrite>({
        tsTypeStr: tsString,
        tsTypeStrForWrite: tsTypeWrite,
    })
}
export function required<This extends Definition>(this: This) {
    return this.newDef({
        priority: 5, // should be run after default
        errorMsg: ctx => `Field ${ctx.fieldAddr} is required`,
        validate: ctx => isset(ctx.value),
        required: true,
        methods: 'create',
        triggerOnUndefineds: true,
    })
}
export function optional<This extends Definition>(this: This) {
    return this.newDef({ required: false })
}
/** Formatting happens first, before every validations */
export function onFormat<This extends Definition>(this: This, callback: (ctx: DefCtx) => any) {
    return this.newDef({
        format: async ctx => {
            await callback(ctx)
            return ctx.value
        }
    })
}
/** Only valid on objects, allow to merge two objects */
export function mergeWith<This extends Definition, T extends DefinitionObj>(this: This, object: T) {
    Object.assign(this.object, object)
    return this.newDef<InferTypeRead<T> & typeof this.tsTypeRead, InferTypeWrite<T> & typeof this.tsTypeWrite>()
}
/** useful for database types where some fields may be always defined in read (_id, creationDate...) but not required on creation */
export function alwaysDefinedInRead<This extends Definition>(this: This) {
    return this.newDef({ alwaysDefinedInRead: true })
}
/** **Note:** formatting will not work for typesOr checks */
export function typesOr<This extends Definition, T extends Definition[]>(this: This, types: [...T]) {

    type InferTypesOrRead<T> = T extends [infer A, ...infer R] ? A extends Definition ? [A['tsTypeRead'], ...InferTypesOrRead<R>] : [] : []
    type InferTypesOrWrite<T> = T extends [infer A, ...infer R] ? A extends Definition ? [A['tsTypeWrite'], ...InferTypesOrRead<R>] : [] : []

    return this.newDef<InferTypesOrRead<T>[number], InferTypesOrWrite<T>[number]>({
        errorMsg: ctx => `Value ${ctx.value} should be one of the following types: ${types.join(', ')}`,
        mongoType: 'mixed',
        async validate(ctx) {
            const errors = [] as any[]
            for (const def of types) {
                try {
                    await formatAndValidateDefinitionPartials(def._definitions, ctx, false, true, ctx.value, ctx.fieldAddr)
                } catch (err: any) {
                    err.hasBeenLogged = true
                    errors.push(err)
                }
            }
            return errors.length < types.length
        },
        tsTypeStr: () => types.map(t => t.getTsTypeAsString().read).join(' | '),
        tsTypeStrForWrite: () => types.map(t => t.getTsTypeAsString().write).join(' | '),
    })
}
export function tuple<
    This extends Definition,
    R extends This[]
>(
    this: This,
    array: [...R]
) {
    return this.newDef<InferTypeRead<typeof array>, InferTypeWrite<typeof array>>({
        name: 'tuple',
        validate: async (ctx) => {
            if (!Array.isArray(ctx.value)) return false
            for (const [i, def] of Object.entries(array)) {
                await formatAndValidateDefinitionPartials(def._definitions, ctx, false, true, ctx.value?.[i], ctx.fieldAddr + `[${i}]`)
            }
            return true
        },
        format: async (ctx) => {
            const output = [] as any[]
            for (const [i, def] of Object.entries(array)) {
                output.push(await formatAndValidateDefinitionPartials(
                    def._definitions,
                    ctx,
                    true,
                    false,
                    ctx.value[i],
                    ctx.fieldAddr + `[${i}]`
                ))
            }
            return output
        },
        tsTypeStr: () => `[${array.map(def => def.getTsTypeAsString().read).join(', ')}]`,
        tsTypeStrForWrite: () => `[${array.map(def => def.getTsTypeAsString().write).join(', ')}]`,
        objectCache: array,
        isParent: true,
    })
}