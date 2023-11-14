import { defaultTypeError } from '../helpers/definitionGenericHelpers'
import { DefinitionPartial } from '../definitionTypes'

import { isset } from 'topkat-utils'


export const sharedDefinitions = {
    string: (acceptEmpty = false) => ({
        mainType: 'string',
        errorMsg: defaultTypeError('string'),
        format: ctx => (typeof ctx.value === 'number' ? ctx.value.toString() : ctx.value)?.trim(),
        validate: ctx => typeof ctx.value === 'string' && (acceptEmpty || ctx.value.length),
        mongoType: 'string',
        tsTypeStr: 'string',
    }),
    required: {
        name: 'required',
        priority: 5, // should be run after default
        errorMsg: ctx => `Field ${ctx.fieldAddr} is required`,
        validate: ctx => isset(ctx.value),
        required: true,
        methods: 'create',
        triggerOnUndefineds: true,
    },
    number: {
        mainType: 'number',
        errorMsg: defaultTypeError('number'),
        validate: ctx => typeof ctx.value === 'number',
        mongoType: 'number',
        tsTypeStr: 'number',
        format: ctx => parseFloat(ctx.value),
    },
    round2: {
        errorMsg: defaultTypeError('number'),
        validate: ctx => typeof ctx.value === 'number',
        mongoType: 'number',
        tsTypeStr: 'number',
        format: ctx => Math.round(ctx.value * 100) / 100,
    },
    lt: (maxVal: number) => ({
        errorMsg: ctx => `Value ${ctx.value} should be strictly below ${maxVal}`,
        validate: ctx => ctx.value < maxVal,
    }),
    gt: (minVal: number) => ({
        errorMsg: ctx => `Value ${ctx.value} should be strictly above ${minVal}`,
        validate: ctx => ctx.value > minVal,
    }),
    lte: (maxVal: number) => ({
        errorMsg: ctx => `Value ${ctx.value} exceed the maximum allowed of ${maxVal}`,
        validate: ctx => ctx.value <= maxVal,
    }),
    gte: (minVal: number) => ({
        errorMsg: ctx => `Value ${ctx.value} is below the allowed threshold of ${minVal}`,
        validate: ctx => ctx.value >= minVal,
    }),
    undefType: {
        mainType: 'undefined',
        validate: () => true,
        format: ctx => typeof ctx.value === 'undefined' ? ctx.value : undefined,
        tsTypeStr: `undefined`,
    },
    wrapperTypeStr: (def, wrapperName) => ({
        tsTypeStr: () => {
            const typeStr = def.getTsTypeAsString().read
            return typeStr.startsWith(wrapperName) ? typeStr : `${wrapperName}<${typeStr}>`
        },
        tsTypeStrForWrite: () => {
            const typeStr = def.getTsTypeAsString().write
            return typeStr.startsWith(wrapperName) ? typeStr : `${wrapperName}<${typeStr}>`
        },
    }),
} satisfies Record<string, DefinitionPartial | (() => DefinitionPartial)>