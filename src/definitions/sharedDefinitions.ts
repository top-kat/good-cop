import { DefCtx } from '../definitionTypes'
import { Definition } from '../DefinitionClass'
import { defaultTypeError } from '../helpers/definitionGenericHelpers'

import { ErrorOptions, parseRegexp } from 'topkat-utils'

//----------------------------------------
// SHARED/ALIASED DEFINITIONS
//----------------------------------------
export function matchRegexp<This extends Definition>(
    this: This,
    regexpOrStr: string | RegExp,
    regexpOptions?: Parameters<typeof parseRegexp>[1]
) {
    const regexp = typeof regexpOrStr === 'string' ? new RegExp(parseRegexp(regexpOrStr, regexpOptions)) : regexpOrStr
    return this.newDef({
        errorMsg: ctx => `Entry ${ctx.value} do not match ${regexp}`,
        validate: ctx => regexp.test(ctx.value),
    })
}
export function max<This extends Definition>(this: This, maxVal: number) {
    return this.newDef({
        errorMsg: ctx => `Value ${ctx.value} exceed the maximum allowed of ${maxVal}`,
        validate: ctx => ctx.value <= maxVal,
    })
}
export function min<This extends Definition>(this: This, minVal: number) {
    return this.newDef({
        errorMsg: ctx => `Value ${ctx.value} is below the allowed threshold of ${minVal}`,
        validate: ctx => ctx.value >= minVal,
    })
}
export function round2<This extends Definition>(this: This) {
    return this.newDef({
        errorMsg: defaultTypeError('number'),
        validate: ctx => typeof ctx.value === 'number',
        mongoType: 'number',
        format: ctx => Math.round(ctx.value * 100) / 100,
    })
}
export function float<This extends Definition>(this: This) {
    return this.newDef<number>({
        errorMsg: defaultTypeError('number'),
        validate: ctx => typeof ctx.value === 'number',
        mongoType: 'number',
        format: ctx => parseFloat(ctx.value),
    })
}
export function format<This extends Definition>(this: This, format: (ctx: DefCtx) => any) {
    return this.newDef({ format })
}

export function errorExtraInfos<This extends Definition>(this: This, errorExtraInfos: ErrorOptions) {
    return this.newDef({ errorExtraInfos })
}

export function name<This extends Definition>(this: This, name: string, paramNumber?: number) {
    return this.newDef({
        errorExtraInfos: { paramName: name, paramNumber },
        paramName: name
    })
}

export function onValidate<This extends Definition>(this: This, callback: (ctx: DefCtx) => any) {
    return this.newDef({
        validate: async ctx => {
            if (await callback(ctx) === false) return false
            else return true
        }
    })
}

export function between<This extends Definition>(this: This, min: number, max: number) {
    return this.newDef({
        errorMsg: ctx => `Value ${ctx.value} should be between ${min} and ${max} (inclusive)`,
        validate: ctx => ctx.value >= min && ctx.value <= max,
    })
}


export function undefinedType<This extends Definition>(this: This) {
    return this.newDef<undefined>({
        validate: () => true,
        format: ctx => typeof ctx.value === 'undefined' ? ctx.value : undefined,
        tsTypeStr: `undefined`,
    })
}