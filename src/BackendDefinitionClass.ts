import mongoose from 'mongoose'
import { MaybeArray } from './core-types'
import { Definition as BaseDefClass } from './DefinitionClass'
import { getArrObjDef, objDefPartials } from './definitions/arraysObjectsDefinitionHandlers'

import { InferTypeRead, InferTypeWrite, DefinitionObj, MongoTypesString, DefinitionPartial, AutoWritedFieldNames, DefinitionClassReceivedModelType } from './definitionTypes'

import { isType, isset, getId, capitalize1st, isObject, DescriptiveError } from 'topkat-utils'


export class Definition<
    ModelsType extends DefinitionClassReceivedModelType = {},
    DefaultDbId extends keyof ModelsType = 'default',
    OverridedTypeRead = any,
    OverridedTypeWrite = any
> extends BaseDefClass<
    OverridedTypeRead,
    OverridedTypeWrite
    > {
    constructor(
        models?: any, // any is for removing type reference and avoid circular type definition
        definition?: MaybeArray<DefinitionPartial>,
        previousThis?: any
    ) {
        super(definition, previousThis)
        this._models = models
    }
    // override newDef so that it can return a backend definition
    newDef<
        TypeTsRead = 'def',
        TypeTsWrite = TypeTsRead,
        NewDef extends MaybeArray<DefinitionPartial> = DefinitionPartial,
        This extends Definition = Definition
    >(newDef?: NewDef) {
        return new Definition<
        ModelsType,
        DefaultDbId,
        TypeTsRead extends 'def' ? This['tsTypeRead'] : TypeTsRead,
        TypeTsWrite extends 'def' ? This['tsTypeWrite'] : TypeTsWrite
        >(this._models, newDef, this) as Omit<(typeof this), 'tsTypeRead' | 'tsTypeWrite'> & {
            tsTypeRead: TypeTsRead,
            tsTypeWrite: TypeTsWrite
        }
    }
    //----------------------------------------
    // MODEL
    //----------------------------------------
    model<A extends keyof ModelsType, B extends keyof ModelsType[A], C extends keyof ModelsType[A][B] = 'Read'>(
        dbId: A, modelName: B, modelType: C = 'Read' as C
    ) {
        return this.newDef<ModelsType[A][B]>([{
            tsTypeStr: `t.${capitalize1st(dbId.toString())}Models.${capitalize1st(modelName.toString())}Models['${modelType.toString()}']`,
            dbName: dbId as string,
            model: modelName as string,
        }, () => {
            const model = this._models?.[dbId as any]?.[modelName as any]
            if (!model) throw new DescriptiveError('Model not set in model validation', { dbId, modelName, modelNames: Object.keys(this._models || {}) })
            return { ...model._definitions[0], tsTypeStr: undefined }
        }])
    }
    //----------------------------------------
    // REF
    //----------------------------------------
    ref(modelName: keyof ModelsType[DefaultDbId]) {
        return this.newDef<ModelsType[DefaultDbId][typeof modelName] | string, string>({
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
        })
    }
    //----------------------------------------
    // MONGO MODEL
    //----------------------------------------
    mongoModel<
        This extends Definition,
        T extends DefinitionObj,
        U extends readonly AutoWritedFieldNames[]
    >(
        this: This, autoWriteFields: U, object: T
    ) {
        const _ = new Definition()
        const untyped = object as Record<string, any>
        untyped._id = _.string().alwaysDefinedInRead()
        if (autoWriteFields.includes('creationDate')) untyped.creationDate = _.date().default(() => new Date())
        if (autoWriteFields.includes('creator')) untyped.creator = _.ref('user').default(ctx => getId(ctx.user))
        if (autoWriteFields.includes('lastUpdateDate')) untyped.lastUpdateDate = _.date().transform(() => new Date())
        if (autoWriteFields.includes('lastUpdater')) untyped.lastUpdater = _.ref('user').default(ctx => getId(ctx.user)).transform(ctx => isAnonymousUser(ctx.user._id) ? undefined : getId(ctx.user))

        return this.newDef<InferTypeRead<T> & MongoFieldsRead<U[number]>, InferTypeWrite<T> & MongoFieldsWrite>(getArrObjDef(object || {}, objDefPartials))
    }
    //----------------------------------------
    // FORCE USER ID
    //----------------------------------------
    forceUserId() {
        return this.newDef({
            format: ctx => {
                const { method, fields, fieldAddr, user } = ctx
                const isSystem = getId(user) === systemUserId
                if (method === 'update') delete fields[fieldAddr] // only on CREATE
                else if (!(isSystem && isset(ctx.fields[fieldAddr]))) ctx.fields[fieldAddr] = getId(user) // ALLOW system to update this field if set
                return fields[fieldAddr]
            },
        })
    }
    //----------------------------------------
    // GET MONGO TYPES
    //----------------------------------------
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
}

export const _ = new Definition()

//----------------------------------------
// HELPERS
//----------------------------------------

const mongoTypeMapping: {[k in MongoTypesString]: MongoTypes} = {
    boolean: Boolean,
    number: Number,
    string: String,
    date: Date,
    object: Object,
    objectId: mongoose.Schema.Types.ObjectId,
    mixed: mongoose.Schema.Types.Mixed,
}

type MongoFieldsRead<T extends string> = { _id: string } & { [K in T]: string }

type MongoFieldsWrite = { _id?: string}

type MongoTypes = Date | Number | Boolean | String | Object | typeof mongoose.Schema.Types.Mixed
type MongoTypeObj = { type?: MongoTypes, ref?: string, unique?: boolean }


// TODO remove this functional code
const systemUserId = '777fffffffffffffffffffff' // same are used in good-cop config
const publicUserId = '000fffffffffffffffffffff'
const isAnonymousUser = id => [systemUserId, publicUserId].includes(id)