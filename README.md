              ,   
         _.-"` `'_  _________________________________________________________
     __ '._ __{}_/       __________  ____  ____     __________  ____        /\
    ||||  |'--.__\      / ____/ __ \/ __ \/ __ \   / ____/ __ \/ __ \      / /
    |  L.(   ^ \^      / / __/ / / / / / / / / /  / /   / / / / /_/ /     / /
    \ .-' |   _'|     / /_/ / /_/ / /_/ / /_/ /  / /___/ /_/ / ____/     / /
    | |   )\___/      \____/\____/\____/_____/   \____/\____/_/         / /
    |  \-'`:._] _______________________________________________________/ /
    \__/;      '-. ____________________________________________________\/


> This library is a personal work, actually used in production apps feel free to contact me via github to collaborate or for feature request

# VALIDATION LIBRARY (zod like syntax)

* Infer typescript types
* **Generate type as string** for file generation
* **Generate mongo schemas** from types
* format and validation
* Can return a different type (ts and validation) depending of a method (create, update, delete...). 
  * Eg: When using `.required()`, you usually want to throw an error on `create` but not on `update`
  * Also, when required, the typescript prop type in an object will be required (`myProp: val` instead of `myProp: val`) so you wont have to check for undefined before accessing the value
  * Eg2: in a mongo model, you usually want _id field to be mandatory in an object type on read but not on write

# Examples

``` typescript

import { _, InferType } from 'good-cop/frontend'

const strDef = _.string().optional()

const objDef = _.object({ 
  string: _.string().required(), 
  enum: _.enum(
    _.number().min(0).max(100).round2(),
    _.boolean()
  ),
  arr: [_.email()],
  otherArr: _.array(_.url()).maxLength(3).required(),
  subObj: {
    subField: _.genericObject('fieldName', { date: _.date() }), // tsType: { [fieldName: string]: { date: Date } }
    regexp: _.string().regexp(/my\sregexp/),
  }
})

type Obj = InferType<typeof objDef>
/*
{
  string: string
  enum?: [ number, boolean ]
  arr?: string[]
  otherArr: string[]
  subObj?: {
    subField?: { [fieldName: string]: { date: Date } }
    regexp?: string
  }
}
*/

```

# Mongo models


``` typescript
import { _, InferTypeRead, InferTypeWrite } from 'good-cop/frontend'

const _ = new Definition<{
  default: { // instead of default you can also have multiple databases
    [modelName: 'user' | 'organization']: any 
  }
}>({ 
  default: {
    user,
    organization
  } 
}).init() // the .init is necessary for the types suggestions to work best

const user = _.mongoModel(
  ['creationDate'], // those fields will be autoCreated and will appear as always defined on read method but not required in write
  {
    firstName: _.string(),
    org: _.ref('organization')
  }
)

type userWrite = InferTypeWrite<typeof user> // this is the type that may be used in a create or an update function

type userRead = InferTypeRead<typeof user> // this is the default and may be used for data outputted by the database

const organization = _.mongoModel([], { name: _.string() }})


```


# TODOS

* make a way for types to work with population or provide a helper