

import { Definition } from '../DefinitionClass'
import { validateDefinitionPartials } from '../helpers/formatAndValidateForDefinition'
import { defaultTypeError } from '../helpers/definitionGenericHelpers'
import { DefCtx, DefinitionPartial, DefinitionObjChild, SwaggerSchema } from '../definitionTypes'
import { triggerOnObjectTypeAsync, triggerOnObjectType } from '../helpers/triggerOnObjectType'

import { isObject, C, forI, random } from 'topkat-utils'

//----------------------------------------
// VALIDATORS
//----------------------------------------
const arrDefPartials: DefinitionPartial = {
    name: 'array',
    mainType: 'array',
    errorMsg: defaultTypeError('array'),
    // validate: ctx => Array.isArray(ctx.value),
}

const objDefPartials: DefinitionPartial = {
    name: 'object',
    mainType: 'object',
    errorMsg: defaultTypeError('object'),
    // validate: ctx => isObject(ctx.value),
}

export function getArrObjDef(
    objOrArr,
    type: 'object' | 'array',
    config?: { deleteForeignKeys: boolean }
) {
    return {
        ...(type === 'object' ? objDefPartials : arrDefPartials),
        validate: async ctx => {
            const maincheck = type === 'object' ? isObject(ctx.value) : Array.isArray(ctx.value)
            return maincheck && await formatAndValidateRecursive(ctx, objOrArr, ctx.value, ctx.fieldAddr, config?.deleteForeignKeys, true)
        },
        format: async ctx => {
            const maincheck = type === 'object' ? isObject(ctx.value) : Array.isArray(ctx.value)
            return maincheck ? await formatAndValidateRecursive(ctx, objOrArr, ctx.value, ctx.fieldAddr, config?.deleteForeignKeys) : ctx.value
        },
        mongoType: () => mongoTypeRecursive(objOrArr),
        tsTypeStr: () => tsTypeRecursive('tsTypeStr', objOrArr),
        tsTypeStrForWrite: () => tsTypeRecursive('tsTypeStrForWrite', objOrArr),
        objectCache: objOrArr,
        isParent: true,
        swaggerType: () => swaggerTypeRecursive(objOrArr),
        exempleValue: () => exempleValueRecursive(objOrArr),
    } satisfies DefinitionPartial
}

async function formatAndValidateRecursive(
    ctx: DefCtx,
    obj: DefinitionObjChild,
    value: any,
    addr: string,
    deleteForeignKeys = false,
    isValidation = false,
) {
    return await triggerOnObjectTypeAsync(obj, {
        errorExtraInfos: { modelName: ctx.modelName, addressInParent: addr, deleteForeignKeys },
        //==============
        async onArray([def]) {
            const output = [] as any[]
            if (typeof value !== 'undefined' && value !== null) {
                await validateDefinitionPartials([arrDefPartials], ctx, value, addr)
                for (const [i2, arrItem] of Object.entries(value)) {
                    const result = await formatAndValidateRecursive(ctx, def, arrItem, ctx.fieldAddr + `[${i2}]`, deleteForeignKeys, isValidation)
                    if (!isValidation && typeof result !== 'undefined') output.push(result)
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
                    const formatted = await formatAndValidateRecursive(ctx, validator, v, fieldAddr, deleteForeignKeys, isValidation)
                    if (!isValidation && typeof formatted !== 'undefined') output[k] = formatted
                }
            } else {
                for (const [k, validator] of Object.entries(obj)) {
                    const fieldAddr = ctx.fieldAddr ? ctx.fieldAddr + `.${k}` : k
                    const formatted = await formatAndValidateRecursive(ctx, validator, value[k], fieldAddr, deleteForeignKeys, isValidation)
                    if (!isValidation && typeof formatted !== 'undefined') output[k] = formatted
                }

                for (const k in value) {
                    // FOREIGN FIELDS HANDLER
                    if (typeof output[k] === 'undefined' && typeof value[k] !== 'undefined') {
                        if (!k.startsWith('$')) { // { $push: ... } is actually allowed in mongo
                            C.warning(false, `FOREIGN KEY not defined in model => body.${ctx.fieldAddr + `${k}`} for model ${ctx.modelName}`)
                        }
                        if (!isValidation && !deleteForeignKeys) output[k] = value[k]
                    }
                }
            }

            return valueIsUndefined && Object.keys(output).length === 0 ? undefined : output
        },
        async onDefinition(definition) {
            const { method, dbName, dbId, fields, modelName, user, errorExtraInfos } = ctx
            // TODO CHECK validateDefinitionPartials to avoid spreading the object each time
            return await definition.formatAndValidate(value, { method, addressInParent: addr, dbName, dbId, parentObj: fields, errorExtraInfos, modelName, user, disableFormatting: isValidation })
        },
    })
}

//----------------------------------------
// MONGOTYPE
//----------------------------------------
function mongoTypeRecursive(obj: DefinitionObjChild) {
    return triggerOnObjectType(obj, {
        errorExtraInfos: { msg: 'mongoTypeNotDefinedForModel' },
        onDefinition: definition => definition._getMongoType(),
    })
}

//----------------------------------------
// TS TYPE STRING
//----------------------------------------
const indentationUnit = '    '

function tsTypeRecursive(fnName: 'tsTypeStr' | 'tsTypeStrForWrite', definitionChild: DefinitionObjChild) {
    return triggerOnObjectType(definitionChild, {
        errorExtraInfos: { msg: 'typescriptTypeNotDefinedForModel' }, // TODO add extra infos on field name
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
                        const alwaysDefinedInRead = v._definitions.some(d => (typeof d === 'function' ? d() : d).alwaysDefinedInRead)
                        const required = (alwaysDefinedInRead && fnName === 'tsTypeStr') || v.isRequired === true
                        if (!required) newKey = k + `?` // optional by default
                    } else if ((Array.isArray(v) || isObject(v))) {
                        newKey = k + `?` // default optional if arr or obj
                    }
                }
                const tsValStr = tsTypeRecursive(fnName, v)

                const optional = newKey.endsWith('?')
                const parsedKey = newKey.replace(/\?$/, '')
                newObjStr += `${indentationUnit}${parsedKey.includes('[') ? parsedKey : `'${parsedKey}'`}${optional ? '?' : ''}: ${tsValStr.replace(/\n/g, `\n${indentationUnit}`)}\n`
            }
            return newObjStr.length ? `{\n${newObjStr}}` : '{}'
        },
        onDefinition: (definition): string => {
            const { read, write } = definition.getTsTypeAsString()
            return fnName === 'tsTypeStr' ? read : write
        },
    })
}



//----------------------------------------
// SWAGGER TYPE
//----------------------------------------
function swaggerTypeRecursive(definitionChild: DefinitionObjChild) {
    return triggerOnObjectType(definitionChild, {
        errorExtraInfos: { msg: 'swaggerTypeNotDefinedForModel' },
        onArray(arr: Definition[]) {
            return { type: 'array', items: arr[0]?.getSwaggerType?.() || {} } satisfies SwaggerSchema
        },
        onObject(object: Record<string, Definition>) {
            const newObjStr = { type: 'object', properties: {} } satisfies SwaggerSchema
            for (const [k, v] of Object.entries(object)) {
                if ('getSwaggerType' in v) newObjStr.properties[k] = v?.getSwaggerType?.()
            }
            return newObjStr
        },
        onDefinition: definition => {
            return definition?.getSwaggerType?.()
        },
    })
}


//----------------------------------------
// EXAMPLE VALUE RECURSIVE
//----------------------------------------
function exempleValueRecursive(definitionChild: DefinitionObjChild) {
    return triggerOnObjectType(definitionChild, {
        errorExtraInfos: { msg: 'valueExampleNotDefinedForModel' },
        onArray(arr: Definition[]) {
            return forI(2, () => arr[0]?.getExampleValue?.())
        },
        onObject(object: Record<string, Definition>) {
            const newObj = {}
            for (const [k, v] of Object.entries(object)) {
                if ('getExampleValue' in v) newObj[k] = v?.getExampleValue?.()
            }
            return newObj
        },
        onDefinition: definition => {
            return definition?.getExampleValue?.()
        },
    })
}