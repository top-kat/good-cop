import { Definition, _ as _2 } from '../../src/DefinitionClass'
import { EnumVals, complexObjectDef } from './complexObjectDef'




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
    exampleModel: {
      Write: ExampleModelWrite
      Read: ExampleModel
    }
  },
}, 'bangk'>({
  bangk: {
    exampleModel: _2.mongoModel(['lastUpdateDate', 'lastUpdater'], complexObjectDef)
  },
}).init()