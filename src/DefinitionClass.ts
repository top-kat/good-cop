
import { MaybeArray, TranslationObj } from './core-types'
import { defaultTypeError } from './helpers/definitionGenericHelpers'
import { object, array, genericObject } from './definitions/arraysObjectsDefinitionHandlers'
import { formatAndValidateDefinitionPartials } from './helpers/formatAndValidateForDefinition'
import { DefinitionBase } from './DefinitionBaseClass'

import { float, round2, matchRegexp, format, max, min, errorExtraInfos, name, onValidate, between, undefinedType } from './definitions/sharedDefinitions'
import { DefCtx, InferTypeRead, InferTypeWrite, DefinitionObj, DefinitionPartial } from './definitionTypes'

import { isType, isDateIntOrStringValid, isset } from 'topkat-utils'


export class Definition<
    OverridedTypeRead = any,
    OverridedTypeWrite = any
> extends DefinitionBase {
    tsTypeRead = '' as OverridedTypeRead
    tsTypeWrite = '' as OverridedTypeWrite
    newDef<
        TypeTsRead = 'def',
        TypeTsWrite = TypeTsRead,
        NewDef extends MaybeArray<DefinitionPartial> = DefinitionPartial
    >(newDef?: NewDef) {
        return new Definition<
            TypeTsRead extends 'def' ? typeof this['tsTypeRead'] : TypeTsRead,
            TypeTsWrite extends 'def' ? typeof this['tsTypeWrite'] : TypeTsWrite
        >(newDef, this)
    }

    object = object
    array = array
    /** An object which keys can be anything but the value shall be typed. Eg: { [k: string]: number } */
    genericObject = genericObject
    float = float
    number = float
    percentage = round2
    round2 = round2
    regexp = matchRegexp
    match = matchRegexp
    /** Format value before validation */
    format = format
    /** Format value before validation */
    transform = format
    max = max
    min = min
    lte = max
    gte = min
    /** Number should be between min and max inclusive (min and max are allowed values) */
    between = between
    /** Number should be between min and max inclusive (min and max are allowed values) */
    minMax = between
    /** Append extra infos to any errors that may throw during format and validate */
    errorExtraInfos = errorExtraInfos
    /** Error Extra Infos => append extra infos to any errors that may throw during format and validate */
    eei = errorExtraInfos
    /** Alias to write paramName in extraInfos */
    name = name
    /** NAME => Alias to write paramName in extraInfos */
    n = name
    /** Make the callback return false to unvalidate this field and trigger an error. Note: validation happens after formating */
    onValidate = onValidate
    /** Make the callback return false to unvalidate this field and trigger an error. Note: validation happens after formating */
    validate = onValidate
    /** Should be used if the value is expected to be undefined */
    undefined = undefinedType
    /** Should be used if the value is expected to be undefined */
    void = undefinedType
    positive<This extends Definition>(this: This) {
        return this.newDef({
            errorMsg: ctx => `Value ${ctx.value} should be positive`,
            validate: ctx => ctx.value >= 0,
        })
    }
    getMongoType() {/**/ } // To be overrided
    string(acceptEmpty = false) {
        return this.newDef<string>({
            errorMsg: defaultTypeError('string'),
            format: ctx => (typeof ctx.value === 'number' ? ctx.value.toString() : ctx.value)?.trim(),
            validate: ctx => typeof ctx.value === 'string' && (acceptEmpty || ctx.value.length),
            mongoType: 'string',
            tsTypeStr: 'string',
        })
    }
    any() {
        return this.newDef<any>({
            validate: () => true,
            mongoType: 'mixed',
            tsTypeStr: 'any',
        })
    }
    /** Integer, not a float */
    int() {
        return this.newDef<number>({
            errorMsg: defaultTypeError('number'),
            format: ctx => Math.round(ctx.value),
            validate: ctx => typeof ctx.value === 'number',
            mongoType: 'number',
            tsTypeStr: 'number',
        })
    }
    boolean() {
        return this.newDef<boolean>({
            errorMsg: defaultTypeError('boolean'),
            // format: ctx => !!ctx.value, commented because we want "strict mode"
            validate: ctx => typeof ctx.value === 'boolean',
            mongoType: 'boolean',
            tsTypeStr: 'boolean',
        })
    }
    enum<
        T extends string[]
    >(possibleValues: [...T] | readonly [...T]) {
        return this.newDef<T[any]>({
            mongoType: 'string',
            errorMsg: ctx => `Value "${ctx.value}" do not match allowed values ${possibleValues.join(',')}`,
            validate: ctx => possibleValues.includes(ctx.value),
            tsTypeStr: possibleValues.length ? `'${possibleValues.join(`' | '`)}'` : 'never'
        })
    }
    date() {
        return this.newDef<Date>({
            errorMsg: defaultTypeError('date', false),
            // May be 01 Jan 1901 00:00:00 GMT || 2012-01-01T12:12:01.595Z
            format: ctx => typeof ctx.value === 'string' && (/\d{4}-\d{1,2}-\d{1,2}T\d+:\d+:\d+.*/.test(ctx.value) || /\d+ [A-Za-z]+ \d+/.test(ctx.value)) ? new Date(ctx.value) : ctx.value,
            validate: ctx => ctx.value instanceof Date,
            mongoType: 'date',
            tsTypeStr: 'Date',
        })
    }
    null() {
        return this.newDef<null>({
            validate: ctx => ctx.value === null,
            format: ctx => ctx.value === null ? ctx.value : null,
            tsTypeStr: `null`,
        })
    }
    date8() {
        return this.newDef<number>({
            errorMsg: defaultTypeError('date8', false),
            validate: ctx => isDateIntOrStringValid(ctx.value, false, 8),
            format: ctx => (typeof ctx.value === 'string' ? parseInt(ctx.value) : ctx.value)?.trim(),
            mongoType: 'number',
            tsTypeStr: 'number',
        })
    }
    date12() {
        return this.newDef<number>({
            errorMsg: defaultTypeError('date12', false),
            validate: ctx => isDateIntOrStringValid(ctx.value, false, 12),
            format: ctx => (typeof ctx.value === 'string' ? parseInt(ctx.value) : ctx.value)?.trim(),
            mongoType: 'number',
            tsTypeStr: 'number',
        })
    }
    year() {
        return this.newDef<number>({
            errorMsg: defaultTypeError('year', false),
            validate: ctx => isDateIntOrStringValid(ctx.value, false, 4),
            format: ctx => (typeof ctx.value === 'string' ? parseInt(ctx.value) : ctx.value)?.trim(),
            mongoType: 'number',
            tsTypeStr: 'number',
        })
    }
    email() {
        return this.newDef<string>({
            format: ctx => ctx.value?.toLowerCase().trim(),
            mongoType: 'string',
            tsTypeStr: 'string',
            errorMsg: defaultTypeError('email', false),
            validate: ctx => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ctx.value),
        })
    }
    url() {
        return this.newDef<string>({
            format: ctx => typeof ctx.value === 'number' ? ctx.value.toString() : ctx.value,
            mongoType: 'string',
            tsTypeStr: 'string',
            errorMsg: defaultTypeError('url', false),
            validate: ctx => /^https?:\/\/.+/.test(ctx.value)
        })
    }
    translation() {
        return this.newDef<TranslationObj>({
            errorMsg: defaultTypeError('{ [countryCodeIso]: translationString }', false),
            validate: ctx => isType(ctx.value, 'object') && Object.entries(ctx.value).every(([countryCode, translationStr]) => typeof translationStr === 'string' && /[a-z][a-z]/.test(countryCode)),
            mongoType: 'object',
            tsTypeStr: 'TranslationObj',
        })
    }
    promise() {
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
    default(defaultValue: ((ctx: DefCtx) => any) | (string | any[] | Record<string, any> | Date | boolean | number | null)) {
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
    lowerCase() {
        return this.newDef({
            errorMsg: defaultTypeError('string'),
            format: ctx => typeof ctx.value === 'string' ? ctx.value.toLowerCase() : ctx.value,
        })
    }
    trim() {
        return this.newDef({
            errorMsg: defaultTypeError('string'),
            mongoType: 'string',
            tsTypeStr: 'string',
            format: ctx => typeof ctx.value === 'string' ? ctx.value.trim() : ctx.value,
        })
    }
    gt(maxVal: number) {
        return this.newDef({
            errorMsg: ctx => `Value ${ctx.value} should be strictly above ${maxVal}`,
            validate: ctx => ctx.value > maxVal,
        })
    }
    lt(minVal: number) {
        return this.newDef({
            errorMsg: ctx => `Value ${ctx.value} should be strictly below ${minVal}`,
            validate: ctx => ctx.value < minVal,
        })
    }
    unique() {
        return this.newDef({
            errorMsg: ctx => `Item should be unique. Another item with value: "${ctx.value}" for field "${ctx.fieldAddr}" has been found`,
            // TODO ?? add validator
            mongoType: obj => obj.unique = true,
        })
    }
    length(length: number, comparisonOperator: '<' | '>' | '===' = '===') {
        return this.newDef({
            errorMsg: ctx => `Wrong length for value at ${ctx.fieldAddr}. Expected length (${comparisonOperator} ${length}) but got length ${ctx.value && ctx.value.length}`,
            validate: ctx => isset(ctx.value) ? comparisonOperator === '>' ? ctx.value?.length > length : comparisonOperator === '<' ? ctx.value?.length < length : ctx.value?.length === length : true,
        })
    }
    minLength(minLength: number) {
        return this.newDef({
            errorMsg: ctx => `Wrong length for value at ${ctx.fieldAddr}. Expected minLength (${minLength}) but got length ${ctx.value && ctx.value.length}`,
            validate: ctx => typeof ctx.value === 'undefined' ? true : ctx.value?.length >= minLength,
        })
    }
    maxLength(maxLength: number) {
        return this.newDef({
            errorMsg: ctx => `Wrong length for value at ${ctx.fieldAddr}. Expected minLength (${maxLength}) but got length ${ctx.value && ctx.value.length}`,
            validate: ctx => typeof ctx.value === 'undefined' ? true : ctx.value?.length <= maxLength,
        })
    }
    ts<TsTypeRead, TsTypeWrite>(tsString: string, tsTypeWrite: string = tsString) {
        return this.newDef<TsTypeRead, TsTypeWrite>({
            tsTypeStr: tsString,
            tsTypeStrForWrite: tsTypeWrite,
        })
    }
    required() {
        return this.newDef({
            priority: 5, // should be run after default
            errorMsg: ctx => `Field ${ctx.fieldAddr} is required`,
            validate: ctx => isset(ctx.value),
            required: true,
            methods: 'create',
            triggerOnUndefineds: true,
        })
    }
    optional() {
        return this.newDef({ required: false })
    }
    /** Formatting happens first, before every validations */
    onFormat(callback: (ctx: DefCtx) => any) {
        return this.newDef({
            format: async ctx => {
                await callback(ctx)
                return ctx.value
            }
        })
    }
    /** Only valid on objects, allow to merge two objects */
    mergeWith<T extends DefinitionObj>(object: T) {
        Object.assign(this.object, object)
        return this.newDef<InferTypeRead<T> & typeof this.tsTypeRead, InferTypeWrite<T> & typeof this.tsTypeWrite>()
    }
    /** useful for database types where some fields may be always defined in read (_id, creationDate...) but not required on creation */
    alwaysDefinedInRead() {
        return this.newDef({ alwaysDefinedInRead: true })
    }
    /** **Note:** formatting will not work for typesOr checks */
    typesOr<T extends Definition[]>(types: [...T]) {

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
    tuple<
        R extends (typeof this)[]
    >(
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
}

export const _ = new Definition()

// TYPE TESTS

// const str = _.string().required().tsTypeRead

// const or = _.typesOr([_.string(), _.number(), _.boolean()]).tsTypeRead

// const tuple2 = _.tuple([_.string(), _.number()]).tsTypeRead
// const myTuple = [] as typeof tuple2

// const val11 = myTuple[0]
// const val22 = myTuple[1]


// const obj1 = _.object({ name: _.string() }).mergeWith({ email: _.email() }).tsTypeRead

// const rtpoij = _.object({ name: _.string(), arr1: _.array(), arr2: _.array({ subArr: _.array({ name: _.string() }) }) })
// const rtpoZEZEij = _.array({ name: _.string(), arr1: _.array(), arr2: _.array({ subArr: _.array({ name: _.string() }) }) })

// const rtpoZEZEiEEj = _.array({ name: _.string() })
// const tyeee = rtpoZEZEiEEj.tsTypeRead
// const apoapo = _.string().tsTypeRead
// const type = rtpoij.tsTypeRead


// type AAAA = (typeof type)['arr2'][number]

// type azpodj = (typeof rtpoZEZEij.tsTypeRead)[number]['arr2'][number]['subArr'][number]['name']

