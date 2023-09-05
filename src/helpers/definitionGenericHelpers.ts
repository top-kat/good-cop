
import { DefinitionPartial, DefCtx } from '../definitionTypes'
import { Definition } from '../DefinitionClass'

export const defaultTypeError = (type, displayCompareWithTypeofValue = true) => ({ value, errorExtraInfos }: DefCtx) => {
    errorExtraInfos.expectedType = type
    errorExtraInfos.gotType = typeof value
    return `Expected type '${type}' but got ${displayCompareWithTypeofValue ? `type ${Array.isArray(value) ? 'array' : typeof value} for value ` : ''}${JSON.stringify(value, null, 2)}`
}

export function mergeDefinitionInherits(def: DefinitionPartial, inheritFrom: Definition) {
    const defFromInherit = inheritFrom._definitions[0]
    if ('inheritFrom' in defFromInherit) mergeDefinitionInherits(defFromInherit, defFromInherit.inheritFrom as Definition)
    for (const [k, v] of Object.entries(defFromInherit)) {
        if (typeof def[k] === 'undefined') {
            def[k] = v
        }
    }
    delete def.inheritFrom
}