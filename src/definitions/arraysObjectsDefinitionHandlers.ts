import { Definition } from '../DefinitionClass'
import { validateDefinitionPartials } from '../helpers/formatAndValidateForDefinition'
import { defaultTypeError } from '../helpers/definitionGenericHelpers'
import { InferTypeRead, InferTypeWrite, InferTypeArrRead, InferTypeArrWrite, DefCtx, DefinitionPartial, DefinitionObjChild, DefinitionObj } from '../definitionTypes'
import { triggerOnObjectTypeAsync, triggerOnObjectType } from '../helpers/triggerOnObjectType'

import { isObject, C } from 'topkat-utils'

//----------------------------------------
// OBJECT
//----------------------------------------
export function object<
    This extends Definition,
    T extends DefinitionObj
>(
    this: This, object?: T
) {
    return this.newDef<InferTypeRead<T>, InferTypeWrite<T>>(getArrObjDef(object || {}, objDefPartials))
}

//----------------------------------------
// GENERIC OBJECT
//----------------------------------------
/** this allow to set type as { [k: string]: InferredType } thus allowing any key to be present in the object */
export function genericObject<
    This extends Definition,
    T extends DefinitionObj | Definition,
    FieldName extends string | [string, string] | [string, string, string]
>(
    this: This, fieldName: FieldName, objectOrDef?: T
) {
    type Read = FieldName extends string ? {[k: string]: InferTypeRead<T>} :
        FieldName extends [string, string] ? {[k: string]: {[k: string]: InferTypeRead<T>}} :
            {[k: string]: {[k: string]: {[k: string]: InferTypeRead<T>}}}

    type Write = FieldName extends string ? {[k: string]: InferTypeRead<T>} :
        FieldName extends [string, string] ? {[k: string]: {[k: string]: InferTypeRead<T>}} :
            {[k: string]: {[k: string]: {[k: string]: InferTypeWrite<T>}}}

    const realObj = typeof fieldName === 'string' ? { [`__${fieldName}`]: objectOrDef } :
        fieldName.length === 2 ? { [`__${fieldName[0]}`]: { [`__${fieldName[1]}`]: objectOrDef } } :
            { [`__${fieldName[0]}`]: { [`__${fieldName[1]}`]: { [`__${fieldName[2]}`]: objectOrDef } } }

    return this.newDef<Read, Write>({
        ...getArrObjDef(realObj || {}, objDefPartials),
        nbNestedGenericObjects: typeof fieldName === 'string' ? 1 : fieldName.length
    })
}


//----------------------------------------
// ARRAY
//----------------------------------------
export function array<
    This extends Definition,
    R extends Definition | DefinitionObj,
>(
    this: This,
    array?: R,
) {
    return this.newDef<InferTypeArrRead<Array<R>>, InferTypeArrWrite<Array<R>>>(getArrObjDef([array] || [], arrDefPartials))
}


//----------------------------------------
// VALIDATORS
//----------------------------------------
export const arrDefPartials: DefinitionPartial = {
    name: 'array',
    errorMsg: defaultTypeError('array'),
    validate: ctx => Array.isArray(ctx.value),
}

export const objDefPartials: DefinitionPartial = {
    name: 'object',
    errorMsg: defaultTypeError('object'),
    validate: ctx => isObject(ctx.value),
}

export const getArrObjDef = (objOrArr, defPartial: DefinitionPartial) => ({
    ...defPartial,
    format: async ctx => await formatAndValidateRecursive(ctx, objOrArr, ctx.value, ctx.fieldAddr),
    mongoType: () => mongoTypeRecursive(objOrArr),
    tsTypeStr: () => tsTypeRecursive('tsTypeStr', objOrArr),
    tsTypeStrForWrite: () => tsTypeRecursive('tsTypeStrForWrite', objOrArr),
    objectCache: objOrArr,
    isParent: true,
})

async function formatAndValidateRecursive(ctx: DefCtx, obj: DefinitionObjChild, value: any, addr: string) {
    return await triggerOnObjectTypeAsync(obj, {
        errorExtraInfos: { modelName: ctx.modelName, addressInParent: addr },
        //==============
        async onArray([def]) {
            const output = [] as any[]
            if (typeof value !== 'undefined') {
                await validateDefinitionPartials([arrDefPartials], ctx, value, addr)
                for (const [i2, arrItem] of Object.entries(value)) {
                    const result = await formatAndValidateRecursive(ctx, def, arrItem, ctx.fieldAddr + `[${i2}]`)
                    if (typeof result !== 'undefined') output.push(result)
                }
                return output
            }
        },
        async onObject(obj) {
            const valueIsUndefined = typeof value === 'undefined'
            if (valueIsUndefined) value = {}
            else await validateDefinitionPartials([objDefPartials], ctx, value, addr)

            const output = {} as Record<string, any>
            const firstKey = Object.keys(obj)[0]
            const isDynamicKey = firstKey?.startsWith('__')

            if (isDynamicKey) {
                // match all fields
                const validator = obj[firstKey]

                for (const [k, v] of Object.entries(value)) {
                    const fieldAddr = ctx.fieldAddr ? ctx.fieldAddr + `.${k}` : k
                    const formatted = await formatAndValidateRecursive(ctx, validator, v, fieldAddr)
                    if (typeof formatted !== 'undefined') output[k] = formatted
                }
            } else {
                for (const [k, validator] of Object.entries(obj)) {
                    const fieldAddr = ctx.fieldAddr ? ctx.fieldAddr + `.${k}` : k
                    const formatted = await formatAndValidateRecursive(ctx, validator, value[k], fieldAddr)
                    if (typeof formatted !== 'undefined') output[k] = formatted
                }

                for (const k in value) {
                    // FOREIGN FIELDS HANDLER
                    if (typeof output[k] === 'undefined' && typeof value[k] !== 'undefined') {
                        C.warning(false, `FOREIGN KEY not defined in model => body.${ctx.fieldAddr + `.${k}`} for model ${ctx.modelName}`)
                        output[k] = value[k]
                    }
                }
            }

            return valueIsUndefined && Object.keys(output).length === 0 ? undefined : output
        },
        async onDefinition(definition) {
            const { method, dbName, dbId, fields, modelName, user, errorExtraInfos } = ctx
            // TODO CHECK validateDefinitionPartials to avoid spreading the object each time
            return await definition.formatAndValidate(value, { method, addressInParent: addr, dbName, dbId, parentObj: fields, errorExtraInfos, modelName, user })
        },
    })
}

//----------------------------------------
// MONGOTYPE
//----------------------------------------
function mongoTypeRecursive(obj: DefinitionObjChild) {
    return triggerOnObjectType(obj, {
        errorExtraInfos: { msg: 'mongoTypeNotDefinedForModel' },
        onDefinition: definition => definition.getMongoType(),
    })
}

//----------------------------------------
// TS TYPE STRING
//----------------------------------------
const indentationUnit = '    '

function tsTypeRecursive(fnName: 'tsTypeStr' | 'tsTypeStrForWrite', definitionChild: DefinitionObjChild) {
    return triggerOnObjectType(definitionChild, {
        errorExtraInfos: { msg: 'mongoTypeNotDefinedForModel' },
        onArray(arr): string {
            return `Array<${arr.map(item => tsTypeRecursive(fnName, item)).join(', ')}>`
        },
        onObject(object: Record<string, Definition>): string {
            let newObjStr = ``
            for (const [k, v] of Object.entries(object)) {
                const isDynamicKey = k.startsWith('__')
                let newKey = isDynamicKey ? k.replace(/__([^.]+)/g, '[$1: string]') : k // map dynamic props firebase syntax '__userIds' to dynamic prop ts '[userIds: string]'

                if (!isDynamicKey) {
                    // OPTIONAL OR REQUIRED BEHAVIOR
                    if (v && typeof v === 'object' && '_definitions' in v) { // TODO fix find why instanceof Definition doesn't work in certain cases
                        const alwaysDefinedInRead = v._definitions.some(d =>(typeof d === 'function' ? d() : d).alwaysDefinedInRead)
                        const required = (alwaysDefinedInRead && fnName === 'tsTypeStr') || v.isRequired === true
                        if (!required) newKey = k + `?` // optional by default
                    } else if ((Array.isArray(v) || isObject(v))) {
                        newKey = k + `?` // default optional if arr or obj
                    }
                }
                const tsValStr = tsTypeRecursive(fnName, v)

                newObjStr += `${indentationUnit}${newKey}: ${tsValStr.replace(/\n/g, `\n${indentationUnit}`)}\n`
            }
            return newObjStr.length ? `{\n${newObjStr}}` : '{}'
        },
        onDefinition: (definition): string => {
            const { read, write } = definition.getTsTypeAsString()
            return fnName === 'tsTypeStr' ? read : write
        },
    })
}