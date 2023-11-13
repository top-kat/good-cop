/**------------------------------------------
 *
 *               GOOD - COP
 *
 * ------------------------------------------
 *
 * Here are some technical choices that have been taken and may not be intuitive:
 * * Everything is in this file, since it's impossible to keep the exact `this` type
 * when putting methods in another file (tryed a lot)
 * * types and functional code are "separated" with returning `as PickSecondLevelMethods`
 * this seems like the best way to choose what to display in the autocomplete suggestion,
 * Eg: when typing `_.object().`, `partial` and `complete` are suggested but `greaterThan`
 * is not
 * For this to work, any new function added may be added to:
 *   => FirstLevelTypes: the types displayed on first autocomplete suggestion
 *   => UniversalMethods: the types displayed everywhere else
 *   => Then you may select additional methods to suggest via `PickSecondLevelMethods`
 * * There is a lot of code duplication, for example in types, but written like this,
 * this improved how type was rendered
 * * I could not always use default values so we need to always pass every important type when
 * returning a new `newDef()`
 */

import mongoose from 'mongoose' // only used for typings, may not be compatible if used in frontend
import { MaybeArray } from './core-types'
import { DefinitionBase } from './DefinitionBaseClass'
import { sharedDefinitions } from './definitions/sharedDefinitions'
import { getArrObjDef } from './definitions/arraysObjectsDefinitionHandlers'
import { defaultTypeError } from './helpers/definitionGenericHelpers'
import { TranslationObj } from './core-types'
import { formatAndValidateDefinitionPartials } from './helpers/formatAndValidateForDefinition'
import { MongoFieldsRead, MongoFieldsWrite, MongoTypeObj, isAnonymousUser, mongoTypeMapping, systemUserId } from './helpers/backendDefinitionsHelpers'

import { DefCtx, InferTypeRead, InferTypeWrite, DefinitionObj, DefinitionPartial, AutoWritedFieldNames, DefinitionClassReceivedModelType, InferTypeArrRead, InferTypeArrWrite, FirstLevelTypes, TypedExclude, NumberMethods, StringMethods, GenericDef, PickSecondLevelMethods, LengthMethods } from './definitionTypes'

import { isType, isset, getId, capitalize1st, isObject, DescriptiveError, isDateIntOrStringValid, parseRegexp, ErrorOptions } from 'topkat-utils'


const { required, number, round2, lt, gt, gte, lte, undefType, string, wrapperTypeStr } = sharedDefinitions



export class Definition<
    ModelsType extends DefinitionClassReceivedModelType = any,
    DefaultDbId extends keyof ModelsType = any,
    OverridedTypeRead = never,
    OverridedTypeWrite = never,
    IsRequiredType extends boolean = false
> extends DefinitionBase {
    tsTypeRead = '' as OverridedTypeRead
    tsTypeWrite = '' as OverridedTypeWrite
    isRequiredType = false as IsRequiredType
    modelTypes = '' as any as ModelsType
    modelTypes2 = '' as any as DefaultDbId
    constructor(
        models?: any, // any is for removing type reference and avoid circular type definition
        definition?: MaybeArray<DefinitionPartial>,
        previousThis?: any
    ) {
        super(definition, previousThis)
        this._models = models
    }
    init() {
        // this is to expose only first level methods
        return this as Pick<typeof this, FirstLevelTypes>
    }
    newDef<
        TypeTsRead = OverridedTypeRead,
        TypeTsWrite = TypeTsRead,
        IsRequired extends boolean = IsRequiredType,
        NewDef extends MaybeArray<DefinitionPartial> = DefinitionPartial
    >(newDef?: NewDef) {
        return new Definition<
            typeof this['modelTypes'],
            typeof this['modelTypes2'],
            TypeTsRead extends 'def' ? typeof this['tsTypeRead'] : TypeTsRead,
            TypeTsWrite extends 'def' ? typeof this['tsTypeWrite'] : TypeTsWrite,
            IsRequired
        >(this._models, newDef, this)
    }
    //----------------------------------------
    // BACKEND TYPES
    //----------------------------------------
    model<A extends keyof ModelsType, B extends keyof ModelsType[A], C extends keyof ModelsType[A][B] = 'Read'>(
        dbId: A, modelName: B, modelType: C = 'Read' as C
    ) {
        return this.newDef([{
            tsTypeStr: `t.${capitalize1st(dbId.toString())}Models.${capitalize1st(modelName.toString())}Models['${modelType.toString()}']`,
            dbName: dbId as string,
            model: modelName as string,
        }, () => {
            const model = this._models?.[dbId as any]?.[modelName as any]
            if (!model) throw new DescriptiveError('Model not set in model validation', { dbId, modelName, modelNames: Object.keys(this._models || {}) })
            return { ...model._definitions[0], tsTypeStr: undefined }
        }]) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    ModelsType[A][B]
                >>,
                'partial' | 'complete'
            >
    }
    ref(modelName: keyof ModelsType[DefaultDbId]) {
        return this.newDef({
            errorMsg: `Only ObjectIds are accepted on referenced fields`,
            format: ctx => getId(ctx.value),
            validate: ctx => isType(ctx.value, 'objectId'),
            mongoType: typeObj => {
                typeObj.type = mongoose.Schema.Types.ObjectId
                typeObj.ref = modelName
            },
            tsTypeStr: `string | ${capitalize1st(modelName as string)}`,
            tsTypeStrForWrite: `string`,
            ref: modelName as string,
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    ModelsType[DefaultDbId][typeof modelName] | string,
                    string
                >>
            >
    }
    mongoModel<
        T extends DefinitionObj,
        U extends readonly AutoWritedFieldNames[]
    >(
        autoWriteFields: U, object: T
    ) {
        const _ = new Definition()
        const untyped = object as Record<string, any>
        untyped._id = _.string().alwaysDefinedInRead()
        if (autoWriteFields.includes('creationDate')) untyped.creationDate = _.date().default(() => new Date())
        if (autoWriteFields.includes('creator')) untyped.creator = _.ref('user').default(ctx => getId(ctx.user))
        if (autoWriteFields.includes('lastUpdateDate')) untyped.lastUpdateDate = _.date().onFormat(() => new Date())
        if (autoWriteFields.includes('lastUpdater')) untyped.lastUpdater = _.ref('user').default(ctx => getId(ctx.user)).onFormat(ctx => isAnonymousUser(ctx.user._id) ? undefined : getId(ctx.user))

        return this.newDef(getArrObjDef(object || {}, 'object')) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    InferTypeRead<T> & MongoFieldsRead<U[number]>,
                    InferTypeWrite<T> & MongoFieldsWrite
                >>
            >
    }
    forceUserId() {
        return this.newDef({
            format: ctx => {
                const { method, fields, fieldAddr, user } = ctx
                const isSystem = getId(user) === systemUserId
                if (method === 'update') delete fields[fieldAddr] // only on CREATE
                else if (!(isSystem && isset(ctx.fields[fieldAddr]))) ctx.fields[fieldAddr] = getId(user) // ALLOW system to update this field if set
                return fields[fieldAddr]
            },
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>
            >
    }
    getMongoType() {
        const definitions = this._definitions

        let mongoTypeOutput = {} as MongoTypeObj | Record<string, any>
        for (const def of definitions) {
            const { mongoType } = typeof def === 'function' ? def() : def
            if (typeof mongoType === 'function') {
                const result = mongoType(mongoTypeOutput)
                if (isObject(result)) mongoTypeOutput = result
            } else if (typeof mongoType === 'string') mongoTypeOutput.type = mongoTypeMapping[mongoType] // mongo type string
            else if (isObject(mongoType)) mongoTypeOutput = mongoType as Record<string, any> // Model
        }

        return mongoTypeOutput
    }

    //----------------------------------------
    // ARRAY OBJECT
    //----------------------------------------
    array<
        R extends GenericDef | DefinitionObj,
    >(
        array?: R,
    ) {
        return this.newDef(getArrObjDef([array] || [], 'array')) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    InferTypeArrRead<Array<R>>,
                    InferTypeArrWrite<Array<R>>
                >>,
                LengthMethods
            >
    }
    /** An object which keys can be anything but where the value shall be typed. Eg: { [k: string]: number } */
    genericObject<
        T extends DefinitionObj | GenericDef,
        FieldName extends string | [string, string] | [string, string, string]
    >(
        fieldName: FieldName, objectOrDef?: T
    ) {
        type Read = FieldName extends string ? { [k: string]: InferTypeRead<T> } :
            FieldName extends [string, string] ? { [k: string]: { [k: string]: InferTypeRead<T> } } :
            { [k: string]: { [k: string]: { [k: string]: InferTypeRead<T> } } }
        type Write = FieldName extends string ? { [k: string]: InferTypeRead<T> } :
            FieldName extends [string, string] ? { [k: string]: { [k: string]: InferTypeRead<T> } } :
            { [k: string]: { [k: string]: { [k: string]: InferTypeWrite<T> } } }

        const realObj = typeof fieldName === 'string' ? { [`__${fieldName}`]: objectOrDef } :
            fieldName.length === 2 ? { [`__${fieldName[0]}`]: { [`__${fieldName[1]}`]: objectOrDef } } :
                { [`__${fieldName[0]}`]: { [`__${fieldName[1]}`]: { [`__${fieldName[2]}`]: objectOrDef } } }

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const That = this // dunno why I need this sheet on those lines buit linter happy

        return this.newDef({
            ...getArrObjDef(realObj || {}, 'object'),
            nbNestedGenericObjects: typeof fieldName === 'string' ? 1 : fieldName.length
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof That.newDef<
                    Read,
                    Write
                >>,
                'partial' | 'complete'
            >
    }
    translation() {
        return this.newDef({
            errorMsg: defaultTypeError('{ [countryCodeIso]: translationString }', false),
            validate: ctx => isType(ctx.value, 'object') && Object.entries(ctx.value).every(([countryCode, translationStr]) => typeof translationStr === 'string' && /[a-z][a-z]/.test(countryCode)),
            mongoType: 'object',
            tsTypeStr: 'TranslationObj',
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    TranslationObj
                >>
            >
    }
    /** Only valid on objects, allow to merge two objects */
    mergeWith<T extends DefinitionObj>(
        object: T
    ) {
        const objDef = this._definitions.find(d => d.name === 'object')
        if (objDef) {
            const realObjDef = typeof objDef === 'function' ? objDef() : objDef
            Object.assign(realObjDef.objectCache as Record<string, any>, object)
        }

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const That = this // dunno why I need this sheet on those lines buit linter happy
        // Object.assign(this.object, object)
        return this.newDef() as any as
            PickSecondLevelMethods<
                ReturnType<typeof That.newDef<
                    InferTypeRead<T> & typeof That.tsTypeRead,
                    InferTypeWrite<T> & typeof That.tsTypeWrite
                >>,
                'partial' | 'complete'
            >
    }
    tuple<
        R extends GenericDef[]
    >(
        array: [...R]
    ) {
        // sorry don't know why exactly this works but anything else wont
        type InferTupleRead<T> = T extends [infer A, ...infer R] ? A extends GenericDef ? [A['tsTypeRead'], ...InferTupleRead<R>] : [] : []
        type InferTupleWrit<T> = T extends [infer A, ...infer R] ? A extends GenericDef ? [A['tsTypeWrite'], ...InferTupleRead<R>] : [] : []

        return this.newDef({
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
            objectCache: array as any,
            isParent: true,
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    InferTupleRead<R>,
                    InferTupleWrit<R>
                >>
            >
    }
    object<
        T extends DefinitionObj
    >(
        object: T = {} as T
    ) {
        return this.newDef(getArrObjDef(object || {}, 'object')) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    InferTypeRead<T>,
                    InferTypeWrite<T>
                >>,
                'complete' | 'partial' | 'mergeWith'
            >
    }
    partial() {
        const objDef = this._definitions.find(d => d.name === 'object')
        if (objDef) {
            const realObjDef = typeof objDef === 'function' ? objDef() : objDef
            const obj = realObjDef.objectCache as any as Record<string, Definition>
            for (const def of Object.values(obj)) {
                // remove eventually required defs
                def._definitions = def._definitions.filter(d => d.name !== 'required')
            }
        }
        return this.newDef(wrapperTypeStr(this, 'Partial')) as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    Partial<typeof this.tsTypeRead>,
                    Partial<typeof this.tsTypeWrite>
                >>,
                'mergeWith'
            >
    }
    complete() {
        const objDef = this._definitions.find(d => d.name === 'object')
        if (objDef) {
            const realObjDef = typeof objDef === 'function' ? objDef() : objDef
            const obj = realObjDef.objectCache as any as Record<string, Definition>
            for (const def of Object.values(obj)) {
                const requiredDefFound = def._definitions.find(d => d.name === 'required')
                if (!requiredDefFound) {
                    def._pushNewDef(required)
                }
            }
        }
        return this.newDef(wrapperTypeStr(this, 'Required')) as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    Required<typeof this.tsTypeRead>,
                    Required<typeof this.tsTypeWrite>
                >>,
                'mergeWith'
            >
    }
    //----------------------------------------
    // COMMON TYPES
    //----------------------------------------
    any() {
        return this.newDef({
            validate: () => true,
            mongoType: 'mixed',
            tsTypeStr: 'any',
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    any,
                    any
                >>
            >
    }
    boolean() {
        return this.newDef({
            errorMsg: defaultTypeError('boolean'),
            // format: ctx => !!ctx.value, commented because we want "strict mode"
            validate: ctx => typeof ctx.value === 'boolean',
            mongoType: 'boolean',
            tsTypeStr: 'boolean',
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    boolean,
                    boolean
                >>,
                'mergeWith'
            >
    }
    //----------------------------------------
    // STRING
    //----------------------------------------
    string(acceptEmpty = false) {
        return this.newDef(string(acceptEmpty)) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    string
                >>,
                StringMethods
            >
    }
    email() {
        return this.newDef({
            ...string(),
            format: ctx => ctx.value?.toLowerCase().trim(),
            errorMsg: defaultTypeError('email', false),
            validate: ctx => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ctx.value),
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    string
                >>,
                StringMethods
            >
    }
    url() {
        return this.newDef({
            ...string(),
            format: ctx => typeof ctx.value === 'number' ? ctx.value.toString() : ctx.value,
            errorMsg: defaultTypeError('url', false),
            validate: ctx => /^https?:\/\/.+/.test(ctx.value)
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    string
                >>,
                StringMethods
            >
    }
    enum<T extends string[]>(possibleValues: [...T] | readonly [...T]) {
        return this.newDef({
            mongoType: 'string',
            tsTypeStr: possibleValues.length ? `'${possibleValues.join(`' | '`)}'` : 'never',
            errorMsg: ctx => `Value "${ctx.value}" do not match allowed values ${possibleValues.join(',')}`,
            validate: ctx => possibleValues.includes(ctx.value),
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    T[number]
                >>,
                TypedExclude<StringMethods, 'match'>
            >
    }
    //SECOND LEVEL----------------------------
    lowerCase() {
        return this.newDef({
            errorMsg: defaultTypeError('string'),
            format: ctx => typeof ctx.value === 'string' ? ctx.value.toLowerCase() : ctx.value,
            priority: 10, // may be applied before email() for example
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<StringMethods, 'upperCase' | 'lowerCase'>
            >
    }
    upperCase() {
        return this.newDef({
            errorMsg: defaultTypeError('string'),
            format: ctx => typeof ctx.value === 'string' ? ctx.value.toUpperCase() : ctx.value,
            priority: 10, // may be applied before email() for example
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<StringMethods, 'upperCase' | 'lowerCase'>
            >
    }
    trim() {
        return this.newDef({
            errorMsg: defaultTypeError('string'),
            format: ctx => typeof ctx.value === 'string' ? ctx.value.trim() : ctx.value,
            priority: 10, // may be applied before email() for example
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<StringMethods, 'trim'>
            >
    }
    regexp(
        regexpOrStr: string | RegExp,
        regexpOptions?: Parameters<typeof parseRegexp>[1]
    ) {
        const regexp = typeof regexpOrStr === 'string' ? new RegExp(parseRegexp(regexpOrStr, regexpOptions)) : regexpOrStr
        return this.newDef({
            errorMsg: ctx => `Entry ${ctx.value} do not match ${regexp}`,
            validate: ctx => regexp.test(ctx.value),
            priority: 55, // may be applied after string() for example
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    string
                >>,
                TypedExclude<StringMethods, 'match'>
            >
    }
    match(...params: [Parameters<typeof this['regexp']>[0], Parameters<typeof this['regexp']>[1]]) {
        return this.regexp(...params) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<StringMethods, 'match'>
            >
    }
    //----------------------------------------
    // NUMBER
    //----------------------------------------
    number() {
        return this.newDef(number) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    number
                >>,
                NumberMethods
            >
    }
    integer() {
        return this.newDef({
            ...number,
            format: ctx => parseInt(ctx.value)
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    number
                >>,
                TypedExclude<NumberMethods, 'round2'>
            >
    }
    float() {
        return this.newDef({
            ...number,
            format: ctx => parseFloat(ctx.value),
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    number
                >>,
                NumberMethods
            >
    }
    percentage() {
        return this.newDef(round2) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    number
                >>,
                NumberMethods
            >
    }
    //SECOND LEVEL----------------------------
    max(maxVal: number) {
        return this.newDef(lte(maxVal)) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<NumberMethods, 'max' | 'lt' | 'lte' | 'lessThan'>
            >
    }
    lte(maxVal: number) {
        return this.newDef(lte(maxVal)) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<NumberMethods, 'max' | 'lt' | 'lte' | 'lessThan'>
            >
    }
    /** less than */
    lt(maxVal: number) {
        return this.newDef(lt(maxVal)) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<NumberMethods, 'max' | 'lt' | 'lte' | 'lessThan'>
            >
    }
    lessThan(maxVal: number) {
        return this.newDef(lt(maxVal)) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<NumberMethods, 'max' | 'lt' | 'lte' | 'lessThan'>
            >
    }
    min(minVal: number) {
        return this.newDef(gte(minVal)) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<NumberMethods, 'min' | 'gt' | 'gte' | 'greaterThan'>
            >
    }
    gte(minVal: number) {
        return this.newDef(gte(minVal)) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<NumberMethods, 'min' | 'gt' | 'gte' | 'greaterThan'>
            >
    }
    greaterThan(minVal: number) {
        return this.newDef(gt(minVal)) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<NumberMethods, 'min' | 'gt' | 'gte' | 'greaterThan'>
            >
    }
    /** greaterThan */
    gt(minVal: number) {
        return this.newDef(gt(minVal)) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<NumberMethods, 'min' | 'gt' | 'gte' | 'greaterThan'>
            >
    }
    /** Number should be between min and max inclusive (min and max are allowed values) */
    between(min: number, max: number) {
        return this.newDef({
            errorMsg: ctx => `Value ${ctx.value} should be between ${min} and ${max} (inclusive)`,
            validate: ctx => ctx.value >= min && ctx.value <= max,
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<NumberMethods, 'min' | 'gt' | 'gte' | 'greaterThan' | 'max' | 'lt' | 'lte' | 'lessThan'>
            >
    }
    round2() {
        return this.newDef({
            format: ctx => Math.round(ctx.value * 100) / 100,
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<NumberMethods, 'round2'>
            >
    }
    positive() {
        return this.newDef({
            errorMsg: ctx => `Value ${ctx.value} should be positive`,
            validate: ctx => ctx.value >= 0,
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<NumberMethods, 'positive'>
            >
    }
    //----------------------------------------
    // DATES
    //----------------------------------------
    date() {
        return this.newDef({
            errorMsg: defaultTypeError('date', false),
            // May be 01 Jan 1901 00:00:00 GMT || 2012-01-01T12:12:01.595Z
            format: ctx => typeof ctx.value === 'string' && (/\d{4}-\d{1,2}-\d{1,2}T\d+:\d+:\d+.*/.test(ctx.value) || /\d+ [A-Za-z]+ \d+/.test(ctx.value)) ? new Date(ctx.value) : ctx.value,
            validate: ctx => ctx.value instanceof Date,
            mongoType: 'date',
            tsTypeStr: 'Date',
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    Date
                >>
            >
    }
    date8() {
        return this.newDef({
            ...number,
            errorMsg: defaultTypeError('date8', false),
            validate: ctx => isDateIntOrStringValid(ctx.value, false, 8),
            format: ctx => (typeof ctx.value === 'string' ? parseInt(ctx.value) : ctx.value)?.trim(),
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    number
                >>
            >
    }
    date12() {
        return this.newDef({
            ...number,
            errorMsg: defaultTypeError('date12', false),
            validate: ctx => isDateIntOrStringValid(ctx.value, false, 12),
            format: ctx => (typeof ctx.value === 'string' ? parseInt(ctx.value) : ctx.value)?.trim(),
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    number
                >>
            >
    }
    year() {
        return this.newDef({
            ...number,
            errorMsg: defaultTypeError('year', false),
            validate: ctx => isDateIntOrStringValid(ctx.value, false, 4),
            format: ctx => (typeof ctx.value === 'string' ? parseInt(ctx.value) : ctx.value)?.trim(),
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    number
                >>
            >
    }
    //----------------------------------------
    // UNDEFINED / EMPTY
    //----------------------------------------
    /** Should be used if the value is expected to be undefined */
    undefined() {
        return this.newDef(undefType) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    undefined
                >>
            >
    }
    /** Should be used if the value is expected to be undefined */
    void() {
        return this.newDef(undefType) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    undefined
                >>
            >
    }
    null() {
        return this.newDef({
            validate: ctx => ctx.value === null,
            format: ctx => ctx.value === null ? ctx.value : null,
            tsTypeStr: `null`,
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    null
                >>
            >
    }
    //----------------------------------------
    // LENGTH
    //----------------------------------------
    length(length: number, comparisonOperator: '<' | '>' | '===' = '===') {
        return this.newDef({
            errorMsg: ctx => `Wrong length for value at ${ctx.fieldAddr}. Expected length (${comparisonOperator} ${length}) but got length ${ctx.value && ctx.value.length}`,
            validate: ctx => isset(ctx.value) ? comparisonOperator === '>' ? ctx.value?.length > length : comparisonOperator === '<' ? ctx.value?.length < length : ctx.value?.length === length : true,
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                (typeof this)['tsTypeRead'] extends any[] ? never : StringMethods
            >
    }
    minLength(minLength: number) {
        return this.newDef({
            errorMsg: ctx => `Wrong length for value at ${ctx.fieldAddr}. Expected minLength (${minLength}) but got length ${ctx.value && ctx.value.length}`,
            validate: ctx => typeof ctx.value === 'undefined' ? true : ctx.value?.length >= minLength,
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                (typeof this)['tsTypeRead'] extends any[] ? never : StringMethods
            >
    }
    maxLength(maxLength: number) {
        return this.newDef({
            errorMsg: ctx => `Wrong length for value at ${ctx.fieldAddr}. Expected minLength (${maxLength}) but got length ${ctx.value && ctx.value.length}`,
            validate: ctx => typeof ctx.value === 'undefined' ? true : ctx.value?.length <= maxLength,
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                (typeof this)['tsTypeRead'] extends any[] ? never : StringMethods
            >
    }
    //----------------------------------------
    // TRANSFORM
    //----------------------------------------
    /** Formatting happens first, before every validations */
    onFormat(callback: (ctx: DefCtx) => any) {
        return this.newDef({
            format: async ctx => {
                await callback(ctx)
                return ctx.value
            }
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                (typeof this)['tsTypeRead'] extends string ? StringMethods : (typeof this)['tsTypeRead'] extends number ? NumberMethods : never
            >
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
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                (typeof this)['tsTypeRead'] extends string ? StringMethods : (typeof this)['tsTypeRead'] extends number ? NumberMethods : never
            >
    }
    //----------------------------------------
    // OPTIONAL / REQUIRED
    //----------------------------------------
    optional() {
        return this.newDef({ required: false }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite,
                    false
                >>,
                (typeof this)['tsTypeRead'] extends string ? StringMethods : (typeof this)['tsTypeRead'] extends number ? NumberMethods : never
            >
    }
    required() {
        return this.newDef(required) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite,
                    true
                >>,
                (typeof this)['tsTypeRead'] extends string ? StringMethods : (typeof this)['tsTypeRead'] extends number ? NumberMethods : never
            >
    }
    /** useful for database types where some fields may be always defined in read (_id, creationDate...) but not required on creation */
    alwaysDefinedInRead() {
        return this.newDef({ alwaysDefinedInRead: true }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                (typeof this)['tsTypeRead'] extends string ? StringMethods : (typeof this)['tsTypeRead'] extends number ? NumberMethods : never
            >
    }
    //----------------------------------------
    // MISC
    //----------------------------------------
    /** Append extra infos to any errors that may throw during format and validate */
    errorExtraInfos(errorExtraInfos: ErrorOptions) {
        return this.newDef({ errorExtraInfos }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                (typeof this)['tsTypeRead'] extends string ? StringMethods : (typeof this)['tsTypeRead'] extends number ? NumberMethods : never
            >
    }
    /** Alias to write paramName in extraInfos */
    name(name: string, paramNumber?: number) {
        return this.newDef({
            errorExtraInfos: { paramName: name, paramNumber },
            paramName: name
        }) as Pick<typeof this, FirstLevelTypes>
    }
    /** NAME => Alias to write paramName in extraInfos */
    n(name: string, paramNumber?: number) {
        // /!\ DUPLICATE OF NAME
        return this.newDef({
            errorExtraInfos: { paramName: name, paramNumber },
            paramName: name
        }) as Pick<typeof this, FirstLevelTypes>
    }
    /** Make the callback return false to unvalidate this field and trigger an error. Note: validation happens after formating */
    onValidate(callback: (ctx: DefCtx) => any) {
        return this.newDef({
            validate: async ctx => {
                if (await callback(ctx) === false) return false
                else return true
            }
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                (typeof this)['tsTypeRead'] extends string ? StringMethods : (typeof this)['tsTypeRead'] extends number ? NumberMethods : never
            >
    }
    promise() {
        return this.newDef({
            priority: 99, // should pass after Array or any types
            errorMsg: ctx => `Expected: typeof Promise but got ${typeof ctx.value}`,
            validate: ctx => typeof ctx.value?.then === 'function', // /!\ promise type should not concern in app validation so this should never apply
            ...wrapperTypeStr(this, 'Promise')
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                (typeof this)['tsTypeRead'] extends string ? StringMethods : (typeof this)['tsTypeRead'] extends number ? NumberMethods : never
            >
    }
    /** **Note:** formatting will not work for typesOr checks */
    typesOr<T extends GenericDef[]>(
        types: [...T]
    ) {
        // sorry don't know why exactly this works but anything else wont
        type InferTypesOrRead<T> = T extends [infer A, ...infer R] ? A extends GenericDef ? [A['tsTypeRead'], ...InferTypesOrRead<R>] : [] : []
        type InferTypesOrWrite<T> = T extends [infer A, ...infer R] ? A extends GenericDef ? [A['tsTypeWrite'], ...InferTypesOrRead<R>] : [] : []

        return this.newDef({
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
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    InferTypesOrRead<T>[number],
                    InferTypesOrWrite<T>[number]
                >>,
                (typeof this)['tsTypeRead'] extends string ? StringMethods : (typeof this)['tsTypeRead'] extends number ? NumberMethods : never
            >
    }
    unique() {
        return this.newDef({
            errorMsg: ctx => `Item should be unique. Another item with value: "${ctx.value}" for field "${ctx.fieldAddr}" has been found`,
            // TODO ?? add validator
            mongoType: obj => obj.unique = true,
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                (typeof this)['tsTypeRead'] extends string ? StringMethods : (typeof this)['tsTypeRead'] extends number ? NumberMethods : never
            >
    }
    ts<
        TsTypeRead,
        TsTypeWrite
    >(tsString: string, tsTypeWrite: string = tsString) {
        return this.newDef({
            tsTypeStr: tsString,
            tsTypeStrForWrite: tsTypeWrite,
        }) as any as
            PickSecondLevelMethods<
                ReturnType<typeof this.newDef<
                    TsTypeRead,
                    TsTypeWrite
                >>,
                (typeof this)['tsTypeRead'] extends string ? StringMethods : (typeof this)['tsTypeRead'] extends number ? NumberMethods : never
            >
    }
}

export const _ = new Definition().init()



// TYPE TESTS

// type Modelssss = {
//     aa: {
//         bb: { Read: any, Write: any }
//     }
// }

// const __ = new Definition<Modelssss, 'aa'>().init()


// // BASE TYPES
// const str = __.string().required().lowerCase().isRequiredType
// const strAZ = __.string().lowerCase().isRequiredType
// const strWZ = __.string().lowerCase().tsTypeWrite
// const str2 = __.string().tsTypeRead
// const lengthTest0 = __.string().maxLength(3).tsTypeRead
// const lengthTest = __.string().maxLength(3).lowerCase().minLength(4).tsTypeRead
// const arrLength = __.array(_.string()).minLength(3).tsTypeRead

// // OBJECTS
// const obj0 = __.object({ name: __.string().required() }).tsTypeRead
// const obj01 = __.object({ name: __.string() }).tsTypeRead
// const obj1 = __.object({ name: __.string() }).mergeWith({ email: __.email().required() }).tsTypeRead
// const obj2 = __.object({ name: __.string() }).mergeWith({ email: __.email().required() }).partial()
// const obj3 = __.object({ name: __.string() }).mergeWith({ email: __.email().required() }).complete()
// const complexOne = __.object({
//     arr: [__.string()],
//     arr2: __.array(__.string()),
//     subObj: {
//         name: __.enum(['a', 'b']),
//         tuple: __.tuple([__.string(), __.date()]),
//         typeOr: __.typesOr([__.number(), __.boolean()]),
//         subArr: [__.email()]
//     }
// }).tsTypeRead

// const or = __.typesOr([__.string(), __.number(), __.boolean()]).tsTypeRead

// const tuple2 = __.tuple([__.string(), __.number()]).tsTypeRead
// const myTuple = ['re', 4] as typeof tuple2



// const rtpoij = __.object({ name: __.string(), arr1: __.email(), arr2: __.array({ subArr: __.array({ name: __.string() }) }) })
// const rtpoZEZEij = __.array({ name: __.string(), subObj: { bool: __.boolean() }, arr2: __.array({ subArr: __.array({ name: __.string() }) }) })

// const rtpoZEZEiEEj = __.array({ name: __.string() })
// const tyeee = rtpoZEZEiEEj.tsTypeRead
// const apoapo = __.string().tsTypeRead
// const type = rtpoij.tsTypeRead

// const aa = __.genericObject('objName', __.null()).partial()


// const aa = __.n('userFields').object({
//     screenSize: __.string().required(),
//     deviceId: __.string().required(),
//     phonePrefix: __.regexp(/^\+\d+$/).required(),
//     phoneNumber: __.string().minLength(7).maxLength(17).required(),
//     lang: __.enum(['en', 'fr']).required(),
//     currency: __.enum(['eur', 'usd']).required(),
// }).required()

// type BPo = typeof aa.tsTypeRead