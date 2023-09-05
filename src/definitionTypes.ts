import { User, NoExtraProperties, MaybePromise, ObjectWithNoFn } from './core-types'
import { Definition } from './DefinitionClass'

import { ErrorOptions } from 'topkat-utils'

export type DaoGenericMethods = 'create' | 'update' | 'delete' | 'getOne' | 'getAll' // duplicated in core types

export type MongoTypesString = 'date' | 'number' | 'boolean' | 'object' | 'string' | 'mixed'| 'objectId'

export type DefinitionPartialFn = () => DefinitionPartial & { priority: number } // usually possible in real js

export type DefinitionPartial = NoExtraProperties<{
    name?: string
    /** The lower, the more precedence it will take */
    priority?: number
    doc?: string
    /** Error message displayed when the validate function return falsey value */
    errorMsg?: string | ((ctx: DefCtx) => MaybePromise<string>)
    /** Shall represent the ts type, the value should never be evaluated in code, only the inferred type, so we can type as `{ tsType: '' as any as anyTypeYouWant }` */
    tsType?: ((previousType: string) => string) | any
    tsTypeStr?: ((previousType: string) => string) | string
    tsTypeStrForWrite?: (() => string) | string
    /** Use function to modify mongoType object directly, use object to pass a full or a string to define which type to use for mongo for that field */
    mongoType?: ((mongoTypeObj: Record<string, any>) => any) | MongoTypesString | Record<string, any>
    /** should return a truthy value if valid and falsey if not */
    validate?: (ctx: DefCtx) => (any | Promise<any>)
    format?: (ctx: DefCtx) => (any | Promise<any>)
    inheritFrom?: Definition
    /** field is always defined when reading, for example if it has a default value */
    alwaysDefinedInRead?: true
    /** shall the function be triggered on undefined fields */
    triggerOnUndefineds?: boolean
    /** triggered only when method is the one selected */
    methods?: DaoGenericMethods | DaoGenericMethods[]
    required?: boolean
    ref?: string
    // isArray?: boolean
    dbName?: string
    model?: string
    errorExtraInfos?: ErrorOptions
    /** define param name when for example in an array (paramsValidator...) */
    paramName?: string
    /** */
    objectCache?: DefinitionObjChild
    /** does the field is an array or object that contains other definitions */
    isParent?: boolean
    /** used to determine the number of nested generic objects, when generic type is used */
    nbNestedGenericObjects?: 1 | 2 | 3
}>


export interface DefCtx {
    modelName: string
    addressInParent: string
    errorExtraInfos: ObjectWithNoFn
    definition: DefinitionPartial
    dbId?: string
    dbName?: string
    method: DaoGenericMethods
    value: any
    fields: ObjectWithNoFn
    fieldAddr: string
    map?: ObjectWithNoFn
    user: User
}

export type DefCtxWithoutValueAndAddr = Omit<DefCtx, 'value' | 'fieldAddr'>

export type InferType<T extends DefinitionObjChild> = InferTypeRead<T> // alias

/** Infer type for definition or object / array of definitions and all read methods (some requirement may vary between read/write types) */
export type InferTypeRead<T extends DefinitionObjChild> =
    T extends Definition ? T['tsTypeRead'] : {
        [K in keyof T]?: T[K] extends Definition ? T[K]['tsTypeRead'] : // definition
            T[K] extends any[] ? InferTypeArrRead<T[K]> : // array
                T[K] extends Record<any, any> ? InferTypeRead<T[K]> : // object
                    never // unknown
    }


export type InferTypeArrRead<T extends readonly DefinitionObjChild[]> =
    T extends [] ? [] :
        T[number] extends (infer U) ?
            U extends Definition ? U['tsTypeRead'][] : // 1st item is definition
                U extends Record<any, any> ? InferTypeRead<U>[] : // 1st item is Model
                    never : // 1st item is unknown
            never // not an array


/** Infer type for definition or object / array of definitions and all write methods (some requirement may vary between read/write types) */
export type InferTypeWrite<T extends DefinitionObjChild> =
T extends Definition ? T['tsTypeWrite'] : {
    [K in keyof T]?: T[K] extends Definition ? T[K]['tsTypeWrite'] : // definition
        T[K] extends any[] ? InferTypeArrWrite<T[K]> : // array
            T[K] extends Record<any, any> ? InferTypeWrite<T[K]> : // object
                never // unknown
}

export type InferTypeArrWrite<T extends readonly DefinitionObjChild[]> =
    T extends [] ? [] :
        T[number] extends (infer U) ?
            U extends Definition ? U['tsTypeWrite'][] : // 1st item is definition
                U extends Record<any, any> ? InferTypeWrite<U>[] : // 1st item is Model
                    never : // 1st item is unknown
            never // not an array

export type DefinitionObjChild = Definition | DefinitionObj | Definition[] | DefinitionObj[]

export type DefinitionObj = { [field: string]: DefinitionObjChild }

export type AutoWritedFieldNames = 'lastUpdateDate' | 'creationDate' | 'lastUpdater' | 'creator'

export type DefinitionClassReceivedModelType = {
    [databaseName: string]: {
        [modelName: string]: ModelReadWrite
    }
}

export type ModelReadWrite = { // duplicated in core, but may aboid lot of dependencies imported at build
    Write: Record<string, any>
    Read: Record<string, any>
    // WithoutGenerics?: Record<string, any>
    // WithoutGenericsWrite?: Record<string, any>
}