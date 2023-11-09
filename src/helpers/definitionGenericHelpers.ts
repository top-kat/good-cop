
import { DefCtx } from '../definitionTypes'

export const defaultTypeError = (type, displayCompareWithTypeofValue = true) => ({ value, errorExtraInfos }: DefCtx) => {
    errorExtraInfos.expectedType = type
    errorExtraInfos.gotType = typeof value
    return `Expected type '${type}' but got ${displayCompareWithTypeofValue ? `type ${Array.isArray(value) ? 'array' : typeof value} for value ` : ''}${JSON.stringify(value, null, 2)}`
}