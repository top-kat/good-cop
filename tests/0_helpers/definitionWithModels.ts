import { Definition, _ as _2 } from '../../src/DefinitionClass'



const enumVals = ['a', 'b', 'c'] as const
type EnumVals = typeof enumVals[number]

type ExampleModel = {
  enumArray: Array<EnumVals>
}

type ExampleModelWrite = {
  'featuredCryptos'?: any
  '_id'?: string
  'lastUpdateDate'?: Date
  'lastUpdater'?: string
}





export const _ = new Definition<{
  bangk: {
    appConfig: {
      Write: ExampleModelWrite
      Read: ExampleModel
    }
  },
}, 'bangk'>({
  bangk: {
    appConfig: _2.mongoModel(['lastUpdateDate', 'lastUpdater'], {
      coucou: _2.string(),
      featuredCryptos: _2.array(_2.enum(enumVals)).default([]),
    })
  },
}).init()