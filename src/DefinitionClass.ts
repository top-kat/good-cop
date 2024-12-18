/**------------------------------------------
 *                                          *
 *               GOOD - COP                 *
 *                                          *
---------------------------------------------

Here are some technical choices that have been taken and may not be intuitive:
* Everything is in this file, since it's impossible to keep the exact `this` type
when putting methods in another file (tryed a lot)
* types and functional code are "separated" with returning `as NextAutocompletionChoices`
this seems like the best way to choose what to display in the autocomplete suggestion
while avoiding a class extension nighmare like in zod although is not as strict as zod
Eg: when typing `_.object().`, `partial` and `complete` are suggested but `greaterThan`
is not

/!\ TO CREATE A NEW METHOD /!\:
=> FirstLevelTypes: the types displayed on first autocomplete suggestion
=> UniversalMethods: the types displayed everywhere else
=> Then you may select additional methods to suggest via `NextAutocompletionChoices` in the definition

 */

import mongoose from 'mongoose' // only used for typings, may not be compatible if used in frontend
import { CountryCodeIso, TranslationObj, countryIsoCodes, MaybeArray } from './core-types'
import { DefinitionBase } from './DefinitionBaseClass'
import { sharedDefinitions } from './definitions/sharedDefinitions'
import { defaultTypeError } from './helpers/definitionGenericHelpers'
import { getFieldValueForDefinitions } from './helpers/findInDefinitions'
import { getArrObjDef } from './definitions/arraysObjectsDefinitionHandlers'
import { formatAndValidateDefinitionPartials } from './helpers/formatAndValidateForDefinition'
import {
    isAnonymousUser,
    MongoTypeObj,
    MongoFieldsRead,
    MongoFieldsWrite,
    mongoTypeMapping,
    systemUserId,
} from './helpers/backendDefinitionsHelpers'

import {
    AutoWritedFieldNames,
    DateMethods,
    DefCtx,
    DefinitionObj,
    DefinitionPartial,
    DefinitionClassReceivedModelType,
    FirstLevelTypes,
    GenericDef,
    InferTypeRead,
    InferTypeWrite,
    InferTypeArrRead,
    InferTypeArrWrite,
    LengthMethods,
    NextAutocompletionChoices,
    NumberMethods,
    StringMethods,
    TypedExclude,
    SwaggerSchema,
} from './definitionTypes'

import {
    capitalize1st,
    DescriptiveError,
    dateArray,
    ErrorOptions,
    getDateAsInt12,
    getId,
    isType,
    isset,
    isObject,
    isDateIntOrStringValid,
    parseRegexp,
    recursiveGenericFunctionSync,
    getDateAs,
    generateToken,
    round2 as round,
    randomItemInArray,
    random,
} from 'topkat-utils'




const { required, number, round2, lt, gt, gte, lte, undefType, string, wrapperTypeStr, boolean } = sharedDefinitions



export class Definition<
    ModelsType extends DefinitionClassReceivedModelType = any,
    DefaultDbId extends keyof ModelsType = any,
    OverridedTypeRead = 'def',
    OverridedTypeWrite = 'def',
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
    /** Meant to be used only the first time you init the definition. Eg: new Definition(...).init() to provide correct autocomplete. This is because I couldn't return the good type from constructor. TODO */
    init() {
        // this is to expose only first level methods
        return this as Pick<typeof this, FirstLevelTypes>
    }
    /** This is to create a new definition from configuration and a given type */
    private _newDef<
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

    /** This is not a definition. This will output the mongo schema final type for definition. Eg: _.mongoModel([], { field1: _.string(), ... }})._getMongoType() === { field1: { type: String } ... } */
    _getMongoType() {
        const definitions = this._definitions

        let mongoTypeOutput = {} as MongoTypeObj | Record<string, any>
        for (const def of definitions) {
            const { mongoType } = typeof def === 'function' ? def() : def
            if (typeof mongoType === 'function') {
                const result = mongoType(mongoTypeOutput, definitions)
                if (isObject(result) || Array.isArray(result)) mongoTypeOutput = result
            } else if (typeof mongoType === 'string') mongoTypeOutput.type = mongoTypeMapping[mongoType] // mongo type string
            else if (isObject(mongoType)) mongoTypeOutput = mongoType as Record<string, any> // Model
        }

        return mongoTypeOutput
    }



    //--------------------------------------------------------------------
    //--------------------------------------------------------------------
    //----------------------------FIRST LEVEL-----------------------------
    //--------------------------------------------------------------------
    //--------------------------------------------------------------------



    array<R extends GenericDef | DefinitionObj>(
        array?: R,
    ) {
        return this._newDef(getArrObjDef(array ? [array] : [], 'array')) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    InferTypeArrRead<Array<R>>,
                    InferTypeArrWrite<Array<R>>
                >>,
                LengthMethods
            >
    }

    any() {
        return this._newDef({
            mainType: 'any',
            validate: () => true,
            mongoType: 'mixed',
            tsTypeStr: 'any',
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef< any, any >>
            >
    }

    boolean() {
        return this._newDef(boolean) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef< boolean, boolean >>,
                'mergeWith'
            >
    }

    date() {
        return this._newDef({
            name: 'date',
            mainType: 'date',
            errorMsg: defaultTypeError('date', false),
            // May be 01 Jan 1901 00:00:00 GMT || 2012-01-01T12:12:01.595Z
            format: ctx => typeof ctx.value === 'string' && (/\d{4}-\d{1,2}-\d{1,2}T\d+:\d+:\d+.*/.test(ctx.value) || /\d+ [A-Za-z]+ \d+/.test(ctx.value)) ? new Date(ctx.value) : ctx.value,
            validate: ctx => ctx.value instanceof Date,
            mongoType: 'date',
            tsTypeStr: 'Date',
            swaggerType: { type: 'string', format: 'date' },
            exempleValue: () => (new Date()).toString()
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    Date
                >>,
                DateMethods
            >
    }

    date8() {
        return this._newDef({
            ...number,
            name: 'date8',
            errorMsg: defaultTypeError('date8', false),
            validate: ctx => isDateIntOrStringValid(ctx.value, false, 8),
            format: ctx => (typeof ctx.value === 'string' ? parseInt(ctx.value) : ctx.value),
            swaggerType: { type: 'integer' },
            exempleValue: () => getDateAs(new Date(), 'dateInt8')
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef< number >>,
                DateMethods
            >
    }

    date12() {
        return this._newDef({
            ...number,
            name: 'date12',
            errorMsg: defaultTypeError('date12', false),
            validate: ctx => isDateIntOrStringValid(ctx.value, false, 12),
            format: ctx => (typeof ctx.value === 'string' ? parseInt(ctx.value) : ctx.value),
            swaggerType: { type: 'integer' },
            exempleValue: () => getDateAs(new Date(), 'dateInt12'),
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef< number >>,
                DateMethods
            >
    }
    /** simple emial validation: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ */
    email() {
        return this._newDef({
            ...string(),
            name: 'email',
            format: ctx => ctx.value?.toLowerCase().trim(),
            errorMsg: defaultTypeError('email', false),
            validate: ctx => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ctx.value),
            swaggerType: { type: 'string', format: 'email' },
            exempleValue: () => randomItemInArray(['bourreMaKik', 'groZeub', 'boGoss06', 'pineDuitre', 'bibonLePersifleur', 'groubino', 'uretre']) + '@gmail.com',
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef< string >>,
                StringMethods
            >
    }
    /** Predefined list of values. Eg: status: _.enum(['success', 'error', 'pending']) OR _.enum([1, 2, 3]) */
    enum<T extends string[] | number[]>(possibleValues: [...T] | readonly [...T]) {
        type TypeOfReturn = typeof this._newDef<T[number]> // doesn't work when set below ??
        const isNumber = typeof possibleValues[0] === 'number'
        return this._newDef({
            ...(isNumber ? number : string()),
            name: 'enum',
            tsTypeStr: possibleValues.length ? isNumber ? `${possibleValues.join(` | `)}` : `'${possibleValues.join(`' | '`)}'` : 'never',
            errorMsg: ctx => `Value "${ctx.value}" does not match allowed values ${possibleValues.join(',')}`,
            validate: ctx => possibleValues.includes(ctx.value),
            swaggerType: { type: 'string', enum: possibleValues.map(e => e.toString()) },
            exempleValue: () => randomItemInArray(possibleValues),
        }) as any as
            NextAutocompletionChoices<
                ReturnType<TypeOfReturn>,
                TypedExclude<StringMethods, 'match'>
            >
    }

    float() {
        return this._newDef({
            ...number,
            name: 'float',
            format: ctx => parseFloat(ctx.value),
            swaggerType: { type: 'number', format: 'float' },
            exempleValue: () => round(Math.random() * 10),

        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    number
                >>,
                NumberMethods
            >
    }

    false() {
        return this._newDef({
            ...boolean,
            errorMsg: defaultTypeError('false'),
            name: 'false',
            validate: ctx => ctx.value === false,
            tsTypeStr: 'false',
            swaggerType: { type: 'boolean' },
            exempleValue: false,
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef< boolean, boolean >>,
                'mergeWith'
            >
    }

    true() {
        return this._newDef({
            ...boolean,
            errorMsg: defaultTypeError('true'),
            name: 'true',
            validate: ctx => ctx.value === true,
            tsTypeStr: 'true',
            swaggerType: { type: 'boolean' },
            exempleValue: true,
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef< boolean, boolean >>,
                'mergeWith'
            >
    }

    /** This is to get the type of an already defined database model. Eg: model('myDb', 'user') to get the user type from a particular db that you registered at initialization */
    model<A extends keyof ModelsType, B extends keyof ModelsType[A], C extends keyof ModelsType[A][B] = 'Read'>(
        dbId: A, modelName: B, modelType: C = 'Read' as C
    ) {
        return this._newDef([{
            mainType: 'object',
            tsTypeStr: `modelTypes.${capitalize1st(modelName.toString())}Models['${modelType.toString()}']`,
            dbName: dbId as string,
            model: modelName as string,
        }, () => {
            const model = this._models?.[dbId as any]?.[modelName as any]
            if (!model) throw new DescriptiveError(`Model not found. Please make you provided a model with the name "${modelName.toString()}" when initiating good-cop. Make sure you BUILDED the app correctly`, { dbId, modelName, modelNames: Object.keys(this._models || {}) })
            return { ...model._definitions[0], tsTypeStr: undefined }
        }]) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    ModelsType[A][B][C]
                >>,
                'partial' | 'complete'
            >
    }

    /** With this, you can create mongo models, handling _id field type automatically and creator, lastUpdater... fields */
    mongoModel<T extends DefinitionObj, U extends readonly AutoWritedFieldNames[]>(
        autoWriteFields: U,
        model: T
    ) {
        const _ = new Definition()
        const untyped = model as Record<string, any>
        untyped._id = _.objectId().alwaysDefinedInRead()

        // AUTO WRITE FIELDS
        if (autoWriteFields.includes('creationDate')) {
            untyped.creationDate = _.date().default(() => new Date())
        }
        if (autoWriteFields.includes('creator')) {
            untyped.creator = _.ref('user').default(ctx => getId(ctx.user))
        }
        if (autoWriteFields.includes('lastUpdateDate')) {
            untyped.lastUpdateDate = _.date().onFormat(() => new Date())
        }
        if (autoWriteFields.includes('lastUpdater')) {
            untyped.lastUpdater = _.ref('user').default(ctx => getId(ctx.user)).onFormat(ctx => isAnonymousUser(ctx.user._id) ? undefined : getId(ctx.user))
        }

        // ACCEPT NULL FOR ALL SUBOBJECTS that are not required as null is a valid mongo value
        recursiveGenericFunctionSync(model, (item: { _definitions: DefinitionPartial[] }) => {
            if (
                item?._definitions
                && item._definitions.length
                && !item._definitions.some(d => d.required)
            ) {
                for (const definition of (item._definitions as DefinitionPartial[])) {
                    if (typeof definition.acceptNull !== 'boolean') definition.acceptNull = true
                }
            }
        }, {
            isObjectTestFunction: item => {
                return isObject(item) || item instanceof Definition
            }
        })

        return this._newDef(getArrObjDef(model || {}, 'object', {
            deleteForeignKeys: false // actually tried that but led to a bug where $push and all mongo instruction where deleted
        })) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    InferTypeRead<T> & MongoFieldsRead<U[number]>,
                    InferTypeWrite<T> & MongoFieldsWrite
                >>
            >
    }
    /** force this field to be the userId instead of any id */
    forceUserId() {
        return this._newDef({
            name: 'forceUserId',
            format: ctx => {
                const { method, fields, fieldAddr, user } = ctx
                const isSystem = getId(user) === systemUserId
                if (method === 'update') delete fields[fieldAddr] // only on CREATE
                else if (!(isSystem && isset(ctx.fields[fieldAddr]))) ctx.fields[fieldAddr] = getId(user) // ALLOW system to update this field if set
                return fields[fieldAddr]
            },
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>
            >
    }

    /** An object which keys can be anything but where the value shall be typed. Eg: { [k: string]: number } */
    genericObject<FieldName extends string | [string, string] | [string, string, string], ValueType extends DefinitionObj | GenericDef>(
        /** field name can be a string or an array, will be typed as { [string1]: { [string2]: myType } } */
        keyName: FieldName = 'key' as FieldName,
        valueType: ValueType = this.any() as any as ValueType
    ) {
        type Read = FieldName extends string
            ? { [k: string]: InferTypeRead<ValueType> }
            : FieldName extends [string, string]
            ? { [k: string]: { [k: string]: InferTypeRead<ValueType> } }
            : { [k: string]: { [k: string]: { [k: string]: InferTypeRead<ValueType> } } }

        type Write = FieldName extends string
            ? { [k: string]: InferTypeRead<ValueType> }
            : FieldName extends [string, string]
            ? { [k: string]: { [k: string]: InferTypeRead<ValueType> } }
            : { [k: string]: { [k: string]: { [k: string]: InferTypeWrite<ValueType> } } }

        type TypeOfReturn = typeof this._newDef<Read, Write> // doesn't work when set below ??

        const realObj = typeof keyName === 'string'
            ? { [`__${keyName}`]: valueType }
            : keyName.length === 2
                ? { [`__${keyName[0]}`]: { [`__${keyName[1]}`]: valueType } }
                : { [`__${keyName[0]}`]: { [`__${keyName[1]}`]: { [`__${keyName[2]}`]: valueType } } }


        return this._newDef({
            ...getArrObjDef(realObj || {}, 'object'),
            mongoType: () => mongoose.Schema.Types.Mixed,
            nbNestedGenericObjects: typeof keyName === 'string' ? 1 : keyName.length,
            swaggerType: { type: 'object' },
            exempleValue: { randomKey: true, nb: 4, info: 'this is untyped' },
        }) as any as
            NextAutocompletionChoices<
                ReturnType<TypeOfReturn>,
                'partial' | 'complete'
            >
    }

    /** Only valid on objects, allow to merge two objects */
    mergeWith<T extends DefinitionObj>(
        object: T
    ) {
        type TypeOfReturn = typeof this._newDef<
            InferTypeRead<T> & typeof this.tsTypeRead,
            InferTypeWrite<T> & typeof this.tsTypeWrite
        >
        const objDef = this._definitions.find(d => d.name === 'object')
        if (objDef) {
            const realObjDef = typeof objDef === 'function' ? objDef() : objDef
            Object.assign(realObjDef.objectCache as Record<string, any>, object)
        }

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        // Object.assign(this.object, object)
        return this._newDef() as any as
            NextAutocompletionChoices<
                ReturnType<TypeOfReturn>,
                'partial' | 'complete'
            >
    }

    /** Array of predefined size and value: Eg: { signature: _.tuple([_.date(), _.string()]) } */
    tuple<R extends GenericDef[]>(
        array: [...R]
    ) {
        // sorry don't know why exactly this works but anything else wont
        type InferTupleRead<T> = T extends [infer A, ...infer R] ? A extends GenericDef ? [A['tsTypeRead'], ...InferTupleRead<R>] : [] : []
        type InferTupleWrit<T> = T extends [infer A, ...infer R] ? A extends GenericDef ? [A['tsTypeWrite'], ...InferTupleRead<R>] : [] : []

        return this._newDef({
            name: 'tuple',
            mainType: 'array',
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
            swaggerType: { type: 'array', items: array.map(d => d.getSwaggerType()) },
            exempleValue: () => array.map(d => d.getExampleValue()),
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    InferTupleRead<R>,
                    InferTupleWrit<R>
                >>
            >
    }

    object<T extends DefinitionObj>(
        object: T = {} as T,
        {
            /** Whenever to delete fields that are not included in the original model */
            deleteForeignKeys = false
        } = {}
    ) {
        return this._newDef({
            ...getArrObjDef(object || {}, 'object', { deleteForeignKeys }),
            mongoType: () => mongoose.Schema.Types.Mixed,
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    InferTypeRead<T>,
                    InferTypeWrite<T>
                >>,
                'complete' | 'partial' | 'mergeWith'
            >
    }

    /** For all props of an object type to be OPTIONAL */
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
        return this._newDef(wrapperTypeStr(this, 'Partial')) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    Partial<typeof this.tsTypeRead>,
                    Partial<typeof this.tsTypeWrite>
                >>,
                'mergeWith'
            >
    }

    integer() {
        return this._newDef({
            ...number,
            name: 'number',
            format: ctx => parseInt(ctx.value),
            swaggerType: { type: 'integer' },
            exempleValue: () => Math.round(Math.random() * 100),
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    number
                >>,
                TypedExclude<NumberMethods, 'round2'>
            >
    }

    /** String alias for readability. 24 char mongoDb id */
    objectId() {
        return this._newDef({
            ...string(),
            errorMsg: defaultTypeError('objectId'),
            name: 'objectId',
            format: ctx => ctx.value.toString(),
            validate: ctx => ctx.value?.length === 24,
            swaggerType: { type: 'string', format: 'uuid' },
            exempleValue: () => generateToken(24, false, 'hexadecimal'),
        }) as NextAutocompletionChoices<ReturnType<typeof this._newDef<string>>, StringMethods>
    }

    match(...params: [Parameters<typeof this['regexp']>[0], Parameters<typeof this['regexp']>[1]]) {
        return this.regexp(...params) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<StringMethods, 'match'>
            >
    }

    number() {
        return this._newDef(number) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    number
                >>,
                NumberMethods
            >
    }

    password({
        regexp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, // at least one upperCase, one lowerCase and a digit
        minLength = 8,
        maxLength = 30,
        encrypt
    }: {
        regexp?: RegExp
        minLength?: number
        maxLength?: number
        encrypt(value: string): string | Promise<string>
    }) {
        return this._newDef({
            ...string(),
            name: 'password',
            errorMsg: ctx => ctx.value.length < minLength
                ? `Password is inferior than minLength of ${minLength}`
                : ctx.value.length > maxLength
                    ? `Password is superior than maxLength of ${maxLength}`
                    : `Password doesn't match regexp ${regexp.toString()}`,
            validateBeforeFormatting: ctx =>
                regexp.test(ctx.value)
                && ctx.value.length >= minLength
                && ctx.value.length <= maxLength,
            format: async ctx => await encrypt(ctx.value),
            swaggerType: { type: 'string', format: 'password' },
            exempleValue: () => generateToken(random(8, 15), false, 'alphanumeric'),
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef< string >>,
                StringMethods
            >
    }

    percentage() {
        return this._newDef(round2) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    number
                >>,
                NumberMethods
            >
    }

    ref<AlwaysPopulated extends boolean>(modelName: keyof ModelsType[DefaultDbId], alwaysPopulated?: AlwaysPopulated) {
        return this._newDef({
            mainType: 'string',
            errorMsg: `Only ObjectIds are accepted on referenced fields`,
            format: ctx => getId(ctx.value),
            validate: ctx => isType(ctx.value, 'objectId'),
            mongoType: typeObj => {
                typeObj.type = mongoose.Schema.Types.ObjectId
                typeObj.ref = modelName
            },
            tsTypeStr: (alwaysPopulated ? '' : `string | modelTypes.`) + `${capitalize1st(modelName as string)}`,
            tsTypeStrForWrite: `string`,
            ref: modelName as string,
            swaggerType: () => {
                let nbOccurence = 0
                let swaggerType: SwaggerSchema = { type: {} }
                for (const k in (this._models || {})) {
                    if (this._models?.[k]?.[modelName as any]) {
                        nbOccurence++
                        swaggerType = this._models[k][modelName as any].getSwaggerType()
                    }
                }

                if (nbOccurence === 1) {
                    if (alwaysPopulated) return swaggerType
                    else return { oneOf: [{ type: 'string' }, swaggerType] }
                } else {
                    if (alwaysPopulated) return { type: 'object' }
                    else return { oneOf: [{ type: 'string' }, { type: 'object' }] }
                }

            },
            exempleValue: () => generateToken(random(10, 30), false, 'alphanumeric'),

        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    AlwaysPopulated extends true
                    ? ModelsType[DefaultDbId][typeof modelName]
                    : ModelsType[DefaultDbId][typeof modelName] | string,
                    string
                >>
            >
    }

    regexp(
        regexpOrStr: string | RegExp,
        regexpOptions?: Parameters<typeof parseRegexp>[1]
    ) {
        const regexp = typeof regexpOrStr === 'string' ? new RegExp(parseRegexp(regexpOrStr, regexpOptions)) : regexpOrStr
        return this._newDef({
            name: 'regexp',
            errorMsg: ctx => `Entry ${ctx.value} does not match ${regexp.source}`,
            validate: ctx => regexp.test(ctx.value),
            priority: 55, // may be applied after string() for example
            swaggerType: { type: 'string' },
            exempleValue: () => generateToken(random(8, 30), false, 'alphanumeric'),
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    string
                >>,
                TypedExclude<StringMethods, 'match'>
            >
    }

    string({ acceptEmpty = false } = {}) {
        return this._newDef(string({ acceptEmpty })) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<string>>,
                StringMethods
            >
    }

    stringConstant<T extends string>(hardCodedValue: T) {
        return this._newDef(string({ hardCodedValue })) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<T>>,
                StringMethods
            >
    }

    /** an object who's keys are locale and values are translation string. Eg: `{ fr: 'Salut', en: 'Hi' }` */
    translation() {
        return this._newDef({
            name: 'translation',
            mainType: 'object',
            errorMsg: defaultTypeError('{ [countryCodeIso]: translationString }', false),
            validate: ctx => {
                if (!isType(ctx.value, 'object')) return false
                return Object.entries(ctx.value).every(([countryCode, translationStr]) =>
                    typeof translationStr === 'string' &&
                    /^[A-Za-z]{2}$/.test(countryCode) &&
                    countryIsoCodes.includes(countryCode as CountryCodeIso)
                )
            },
            mongoType: 'object',
            tsTypeStr: 'TranslationObj',
            swaggerType: { type: 'object' },
            exempleValue: { fr: 'Bonjour', en: 'Hello' },
        }) as any as NextAutocompletionChoices<
            ReturnType<typeof this._newDef<TranslationObj>>
        >
    }

    /** Simple url validation: /^https?:\/\/.+/ */
    url() {
        return this._newDef({
            ...string(),
            name: 'url',
            format: ctx => typeof ctx.value === 'number' ? ctx.value.toString() : ctx.value,
            errorMsg: defaultTypeError('url', false),
            validate: ctx => /^https?:\/\/.+/.test(ctx.value),
            swaggerType: { type: 'string', format: 'url' },
            exempleValue: `https://${generateToken(random(5, 15), false)}.${randomItemInArray(['org', 'com', 'fr', 'co.uk', 'io', 'eu', 'app'])}`,
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef< string >>,
                StringMethods
            >
    }


    year() {
        return this._newDef({
            ...number,
            name: 'year',
            errorMsg: defaultTypeError('year', false),
            validate: ctx => isDateIntOrStringValid(ctx.value, false, 4),
            format: ctx => (typeof ctx.value === 'string' ? parseInt(ctx.value) : ctx.value),
            swaggerType: { type: 'string' },
            exempleValue: () => (new Date()).getFullYear(),
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef< number >>,
                DateMethods
            >
    }

    /** Should be used if the value is expected to be undefined */
    void() {
        return this._newDef({ ...undefType, tsTypeStr: 'void' }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef< void >>
            >
    }

    /** Should be used if the value is expected to be undefined */
    undefined() {
        return this._newDef(undefType) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef< undefined >>
            >
    }

    null() {
        return this._newDef({
            name: 'null',
            validate: ctx => ctx.value === null,
            format: ctx => ctx.value === null ? ctx.value : null,
            tsTypeStr: 'null',
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef< null >>
            >
    }


    /** **Note:** formatting will not work for typesOr checks */
    typesOr<T extends GenericDef[]>(
        types: [...T]
    ) {
        // sorry don't know why exactly this works but anything else wont
        type InferTypesOrRead<T> = T extends [infer A, ...infer R] ? A extends GenericDef ? [A['tsTypeRead'], ...InferTypesOrRead<R>] : [] : []
        type InferTypesOrWrite<T> = T extends [infer A, ...infer R] ? A extends GenericDef ? [A['tsTypeWrite'], ...InferTypesOrRead<R>] : [] : []

        return this._newDef({
            name: 'typesOr',
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
            swaggerType: () => ({ oneOf: types.map(t => t.getSwaggerType()) }),
            exempleValue: () => randomItemInArray(types).getExampleValue(),
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    InferTypesOrRead<T>[number],
                    InferTypesOrWrite<T>[number]
                >>,
                (typeof this)['tsTypeRead'] extends string ? StringMethods : (typeof this)['tsTypeRead'] extends number ? NumberMethods : never
            >
    }

    //--------------------------------------------------------------------
    //--------------------------------------------------------------------
    //----------------------------SECOND LEVEL----------------------------
    //--------------------------------------------------------------------
    //--------------------------------------------------------------------



    /** useful for database types where some fields may be always defined in read (_id, creationDate...) but not required on creation */
    alwaysDefinedInRead() {
        return this._newDef({
            name: 'alwaysDefinedInRead',
            alwaysDefinedInRead: true
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                (typeof this)['tsTypeRead'] extends string ? StringMethods : (typeof this)['tsTypeRead'] extends number ? NumberMethods : never
            >
    }

    between(min: number, max: number) {
        return this._newDef({
            name: 'between',
            errorMsg: ctx => `Value ${ctx.value} should be between ${min} and ${max} (inclusive)`,
            validate: ctx => ctx.value >= min && ctx.value <= max,
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<NumberMethods, 'min' | 'gt' | 'gte' | 'greaterThan' | 'max' | 'lt' | 'lte' | 'lessThan'>
            >
    }

    /** For all props of an object type to be REQUIRED */
    complete() {
        const objDef = this._definitions.find(definition => definition.name === 'object')
        if (objDef) {
            const realObjDef = typeof objDef === 'function' ? objDef() : objDef
            const obj = realObjDef.objectCache as Record<string, Definition | Definition[]>
            for (const [name, def] of Object.entries(obj)) {
                if (Array.isArray(def)) {
                    // put it as a definition array, but only in js, we don't
                    // care about ts since it's already typed
                    obj[name] = _.array(def[0]).required() as any
                } else {
                    const requiredDefFound = def._definitions.find(d => d.name === 'required')
                    if (!requiredDefFound) {
                        def._pushNewDef(required)
                    }
                }
            }
        }
        return this._newDef(wrapperTypeStr(this, 'Required')) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    Required<typeof this.tsTypeRead>,
                    Required<typeof this.tsTypeWrite>
                >>,
                'mergeWith'
            >
    }

    gte(minVal: number) {
        return this._newDef(gte(minVal)) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<NumberMethods, 'min' | 'gt' | 'gte' | 'greaterThan'>
            >
    }

    greaterThan(minVal: number) {
        return this._newDef(gt(minVal)) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<NumberMethods, 'min' | 'gt' | 'gte' | 'greaterThan'>
            >
    }

    gt(minVal: number) {
        return this._newDef(gt(minVal)) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<NumberMethods, 'min' | 'gt' | 'gte' | 'greaterThan'>
            >
    }

    isFuture() {
        return this._newDef({
            name: 'isFutureDate',
            errorMsg: ctx => `Date should be in the future. Actual date: ${dateArray(ctx.value)?.join('/')}`,
            validate: ctx => getDateAsInt12(ctx.value) > getDateAsInt12(),
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef< number >>,
                DateMethods
            >
    }

    length(length: number, comparisonOperator: '<' | '>' | '===' = '===') {
        return this._newDef({
            name: 'length',
            errorMsg: ctx => `Wrong length for value '${ctx.value}'. Expected length (${comparisonOperator} ${length}) but got length (${comparisonOperator} ${ctx.value && ctx.value.length})`,
            validate: ctx => isset(ctx.value) ? comparisonOperator === '>' ? ctx.value?.length > length : comparisonOperator === '<' ? ctx.value?.length < length : ctx.value?.length === length : true,
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                (typeof this)['tsTypeRead'] extends any[] ? never : StringMethods
            >
    }

    lessThan(maxVal: number) {
        return this._newDef(lt(maxVal)) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<NumberMethods, 'max' | 'lt' | 'lte' | 'lessThan'>
            >
    }

    lowerCase() {
        return this._newDef({
            name: 'lowerCase',
            errorMsg: defaultTypeError('string'),
            format: ctx => typeof ctx.value === 'string' ? ctx.value.toLowerCase() : ctx.value,
            priority: 10, // may be applied before email() for example
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<StringMethods, 'upperCase' | 'lowerCase'>
            >
    }

    upperCase() {
        return this._newDef({
            name: 'upperCase',
            errorMsg: defaultTypeError('string'),
            format: ctx => typeof ctx.value === 'string' ? ctx.value.toUpperCase() : ctx.value,
            priority: 10, // may be applied before email() for example
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<StringMethods, 'upperCase' | 'lowerCase'>
            >
    }

    max(maxVal: number) {
        return this._newDef(lte(maxVal)) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<NumberMethods, 'max' | 'lt' | 'lte' | 'lessThan'>
            >
    }

    lte(maxVal: number) {
        return this._newDef(lte(maxVal)) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<NumberMethods, 'max' | 'lt' | 'lte' | 'lessThan'>
            >
    }

    lt(maxVal: number) {
        return this._newDef(lt(maxVal)) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<NumberMethods, 'max' | 'lt' | 'lte' | 'lessThan'>
            >
    }

    min(minVal: number) {
        return this._newDef(gte(minVal)) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<NumberMethods, 'min' | 'gt' | 'gte' | 'greaterThan'>
            >
    }

    round2() {
        return this._newDef({
            name: 'round2',
            format: ctx => Math.round(ctx.value * 100) / 100,
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<NumberMethods, 'round2'>
            >
    }

    positive() {
        return this._newDef({
            name: 'positiveNumber',
            errorMsg: ctx => `Value ${ctx.value} should be positive`,
            validate: ctx => ctx.value >= 0,
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<NumberMethods, 'positive'>
            >
    }

    trim() {
        return this._newDef({
            name: 'trim',
            errorMsg: defaultTypeError('string'),
            format: ctx => typeof ctx.value === 'string' ? ctx.value.trim() : ctx.value,
            priority: 10, // may be applied before email() for example
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                TypedExclude<StringMethods, 'trim'>
            >
    }

    minLength(minLength: number) {
        return this._newDef({
            name: 'minLength',
            errorMsg: ctx => `Wrong length for value at '${ctx.value}'. Expected minLength (${minLength}) but got length (${ctx.value && ctx.value.length})`,
            validate: ctx => typeof ctx.value === 'undefined' ? true : ctx.value?.length >= minLength,
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                (typeof this)['tsTypeRead'] extends any[] ? never : StringMethods
            >
    }

    maxLength(maxLength: number) {
        return this._newDef({
            name: 'maxLength',
            errorMsg: ctx => `Wrong length for value at '${ctx.value}'. Expected maxLength (${maxLength}) but got length (${ctx.value && ctx.value.length})`,
            validate: ctx => typeof ctx.value === 'undefined' ? true : ctx.value?.length <= maxLength,
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                (typeof this)['tsTypeRead'] extends any[] ? never : StringMethods
            >
    }

    /** Formatting happens first, before every validations */
    onFormat(callback: ((ctx: DefCtx) => any) | ((ctx: DefCtx) => Promise<any>)) {
        return this._newDef({
            name: 'onFormat',
            format: async ctx => {
                await callback(ctx)
                return ctx.value
            }
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                (typeof this)['tsTypeRead'] extends string ? StringMethods : (typeof this)['tsTypeRead'] extends number ? NumberMethods : never
            >
    }

    default(defaultValue: ((ctx: DefCtx) => any) | (string | any[] | Record<string, any> | Date | boolean | number | null)) {
        return this._newDef({
            name: 'default',
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
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                (typeof this)['tsTypeRead'] extends string ? StringMethods : (typeof this)['tsTypeRead'] extends number ? NumberMethods : never
            >
    }

    optional() {
        return this._newDef({
            name: 'optional',
            required: false,
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite,
                    false
                >>,
                (typeof this)['tsTypeRead'] extends string ? StringMethods : (typeof this)['tsTypeRead'] extends number ? NumberMethods : never
            >
    }

    required() {
        return this._newDef(required) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite,
                    true
                >>,
                (typeof this)['tsTypeRead'] extends string ? StringMethods : (typeof this)['tsTypeRead'] extends number ? NumberMethods : never
            >
    }



    //----------------------------------------
    // MISC
    //----------------------------------------
    /** Append extra infos to any errors that may throw during format and validate */
    errorExtraInfos(errorExtraInfos: ErrorOptions) {
        return this._newDef({ errorExtraInfos }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                (typeof this)['tsTypeRead'] extends string ? StringMethods : (typeof this)['tsTypeRead'] extends number ? NumberMethods : never
            >
    }

    /** Alias to write paramName in extraInfos */
    name(name: string, paramNumber?: number) {
        return this._newDef({
            errorExtraInfos: { paramName: name, paramNumber },
            paramName: name
        }) as any as Pick<typeof this, FirstLevelTypes>
    }

    /** NAME => Alias to write paramName in extraInfos */
    n(name: string, paramNumber?: number) {
        // /!\ DUPLICATE OF NAME
        return this._newDef({
            errorExtraInfos: { paramName: name, paramNumber },
            paramName: name
        }) as any as Pick<typeof this, FirstLevelTypes>
    }

    /** Make the callback return false to unvalidate this field and trigger an error. Note: validation happens after formating */
    onValidate(callback: (ctx: DefCtx) => any) {
        return this._newDef({
            name: 'onValidate',
            validate: async ctx => {
                if (await callback(ctx) === false) return false
                else return true
            }
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                (typeof this)['tsTypeRead'] extends string ? StringMethods : (typeof this)['tsTypeRead'] extends number ? NumberMethods : never
            >
    }

    promise() {
        return this._newDef({
            name: 'promise',
            priority: 99, // should pass after Array or any types
            errorMsg: ctx => `Expected: typeof Promise but got ${typeof ctx.value}`,
            validate: ctx => typeof ctx.value?.then === 'function', // /!\ promise type should not concern in app validation so this should never apply
            ...wrapperTypeStr(this, 'Promise')
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                (typeof this)['tsTypeRead'] extends string ? StringMethods : (typeof this)['tsTypeRead'] extends number ? NumberMethods : never
            >
    }

    unique() {
        return this._newDef({
            name: 'unique',
            errorMsg: ctx => `Item should be unique. Another item with value: "${ctx.value}" for field "${ctx.fieldAddr}" has been found`,
            // TODO ?? add validator
            mongoType: (obj, definitions) => {
                const required = getFieldValueForDefinitions(definitions, 'required')
                // ref: https://masteringjs.io/tutorials/mongoose/unique
                // ref: https://codehunter.cc/a/mongodb/mongodb-mongoose-unique-if-not-null
                if (required) obj.unique = true
                else obj.index = { unique: true, sparse: true }
            },
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    typeof this.tsTypeRead,
                    typeof this.tsTypeWrite
                >>,
                (typeof this)['tsTypeRead'] extends string ? StringMethods : (typeof this)['tsTypeRead'] extends number ? NumberMethods : never
            >
    }

    ts<TsTypeRead, TsTypeWrite>(
        tsString: string,
        tsTypeWrite: string = tsString
    ) {
        return this._newDef({
            tsTypeStr: tsString,
            tsTypeStrForWrite: tsTypeWrite,
        }) as any as
            NextAutocompletionChoices<
                ReturnType<typeof this._newDef<
                    TsTypeRead,
                    TsTypeWrite
                >>,
                (typeof this)['tsTypeRead'] extends string ? StringMethods : (typeof this)['tsTypeRead'] extends number ? NumberMethods : never
            >
    }
}

export const _ = new Definition().init()





//  ══╦══ ╦   ╦ ╔══╗ ╔══╗   ══╦══ ╔══╗ ╔═══ ══╦══ ═╦═ ╦╗ ╔ ╔══╗
//    ║   ╚═╦═╝ ╠══╝ ╠═       ║   ╠═   ╚══╗   ║    ║  ║╚╗║ ║ ═╦
//    ╩     ╩   ╩    ╚══╝     ╩   ╚══╝ ═══╝   ╩   ═╩═ ╩ ╚╩ ╚══╝

// / !\ DONT DELETE /!\

// type Modelssss = {
//     aa: {
//         bb: { Read: { a: number }, Write: { a: number } }
//     }
// }

// const __ = new Definition<Modelssss, 'aa'>().init()

// const hardCodedString = __.stringConstant('tt').tsTypeRead
// const normalstring = __.string().tsTypeRead
// const hardCodedString2 = __.stringConstant('coucou').tsTypeRead

// const populated = __.ref('bb', true).tsTypeRead
// const notPop = __.ref('bb').tsTypeRead


// /* BASE TYPES */
// const isRequired = __.string().required().lowerCase().isRequiredType
// const isRequiredFalse = __.string().lowerCase().isRequiredType
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



// const hardcoreArray = __.array({ name: __.string(), subObj: { bool: __.boolean().required() }, arr2: __.array({ subArr: __.array({ name: __.string() }) }) })
// type HardcoreArray = typeof hardcoreArray.tsTypeRead

// const simpleArray = __.array({ name: __.string() })
// type SimpleArray = typeof simpleArray.tsTypeRead

// const hardcoreObject = __.object({ name: __.string(), arr1: __.email(), arr2: __.array({ subArr: __.array({ name: __.string() }) }) })
// type HardcoreObject = typeof hardcoreObject.tsTypeRead



// const aa = __.n('userFields').object({
//     screenSize: __.string().required(),
//     deviceId: __.string().required(),
//     phonePrefix: __.regexp(/^\+\d+$/).required(),
//     phoneNumber: __.string().minLength(7).maxLength(17).required(),
//     lang: __.enum(['en', 'fr']).required(),
//     currency: __.enum(['eur', 'usd']).required(),
// }).required()

// type ObjectType = typeof aa.tsTypeRead
