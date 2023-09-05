
import { User } from '../core-types'
import { DefinitionPartial, DefCtxWithoutValueAndAddr, DefCtx, DaoGenericMethods } from '../definitionTypes'
import { DefinitionBase } from '../DefinitionBaseClass'

import { DescriptiveError } from 'topkat-utils'

export async function formatAndValidate<This extends DefinitionBase<any, any>>(
    this: This,
    value: any,
    options: {
        method?: DaoGenericMethods
        /** addr is specfied if value is a child of an object */
        addressInParent?: string
        parentObj?: Record<string, any>
        dbId?: string
        dbName?: string
        modelName?: string
        errorExtraInfos?: Record<string, any>
        disableValidation?: boolean
        /** may provide a little perf boost for validation on read operation (that where already formatted on write) */
        disableFormatting?: boolean
        user?: User
    } = {}
) {
    const definitions = this._definitions.map(d => typeof d === 'function' ? d() : d)
    const {
        dbId,
        dbName,
        method,
        parentObj,
        modelName,
        addressInParent = '',
        errorExtraInfos = {},
        disableValidation,
        disableFormatting,
        user,
    } = options

    errorExtraInfos.userId = user?._id
    errorExtraInfos.userRole = user?.role

    const defCtx = { dbName, modelName, dbId, method, fields: parentObj || value, user } as DefCtxWithoutValueAndAddr

    defCtx.errorExtraInfos = errorExtraInfos

    definitions.forEach(def => def.errorExtraInfos && Object.assign(errorExtraInfos, def.errorExtraInfos))

    return await formatAndValidateDefinitionPartials(definitions, defCtx, disableValidation, disableFormatting, value, addressInParent)
}

export async function formatAndValidateDefinitionPartials(
    definitions: DefinitionPartial[],
    defCtxRaw: DefCtxWithoutValueAndAddr,
    disableValidation = false,
    disableFormatting = false,
    value: any,
    fieldAddr: string
) {

    const { method = 'create' } = defCtxRaw
    const defCtx = { ...defCtxRaw, value, fieldAddr } as DefCtx

    if (typeof defCtxRaw.errorExtraInfos === 'undefined') defCtxRaw.errorExtraInfos = {}

    for (const def of definitions) {

        const { errorMsg, methods = ['create', 'update'], triggerOnUndefineds } = def

        defCtx.definition = def
        if (def.name) defCtx.errorExtraInfos.definition = def.name

        if ((value !== undefined || triggerOnUndefineds) && methods.includes(method)) {
            if (disableFormatting !== true && def.format) {
                const formattedValue = await def.format(defCtx)
                if (typeof formattedValue !== 'undefined') defCtx.value = formattedValue
            }
            if (disableValidation !== true && def.validate) {
                if (!await def.validate(defCtx)) {
                    const errMsg = typeof errorMsg === 'string' ? errorMsg : typeof errorMsg === 'function' ? await errorMsg(defCtx) : 'fieldValidationError'
                    const { dbName, modelName, dbId, method, fields } = defCtx
                    throw new DescriptiveError(errMsg, { code: 422, ...defCtx.errorExtraInfos, dbName, modelName, dbId, method, value, fieldAddr, fields }) // TODO for unit tests we should put models.mongo[dbName][modelName] to fix
                }
            }
        }
    }

    return defCtx.value
}

/* alias */
export async function validateDefinitionPartials(
    definitions: DefinitionPartial[],
    defCtx: DefCtxWithoutValueAndAddr, // for perf
    value: any,
    fieldAddr: string
) {
    return await formatAndValidateDefinitionPartials(definitions, defCtx, false, true, value, fieldAddr)
}