

import { MaybeArray } from './core-types'
import { object, array, genericObject } from './definitions/arraysObjectsDefinitionHandlers'
import { DefinitionBase } from './DefinitionBaseClass'
import { matchRegexp, max, min, round2, float, format, errorExtraInfos, name, onValidate, between, undefinedType, positive, string, any, int, boolean, typeEnum, date, typeNull, date8, date12, year, email, url, translation, promise, defaultValue, lowerCase, trim, gt, lt, unique, length, minLength, maxLength, ts, required, optional, onFormat, mergeWith, alwaysDefinedInRead, typesOr, tuple } from './definitions/sharedDefinitions'

import { DefinitionPartial } from './definitionTypes'


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

    getMongoType() { /* to be filled */ }

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
    null = typeNull
    enum = typeEnum
    default = defaultValue

    matchRegexp = matchRegexp
    positive = positive
    string = string
    any = any
    /** Integer, not a float */
    int = int
    boolean = boolean
    date = date
    date8 = date8
    date12 = date12
    year = year
    email = email
    url = url
    translation = translation
    promise = promise
    lowerCase = lowerCase
    trim = trim
    greaterThan = gt
    lessThan = lt
    /** greaterThan */
    gt = gt
    /** less than */
    lt = lt
    unique = unique
    length = length
    minLength = minLength
    maxLength = maxLength
    ts = ts
    required = required
    optional = optional
    /** Formatting happens first, before every validations */
    onFormat = onFormat
    /** Only valid on objects, allow to merge two objects */
    mergeWith = mergeWith
    /** useful for database types where some fields may be always defined in read (_id, creationDate...) but not required on creation */
    alwaysDefinedInRead = alwaysDefinedInRead
    /** **Note:** formatting will not work for typesOr checks */
    typesOr = typesOr
    tuple = tuple
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

