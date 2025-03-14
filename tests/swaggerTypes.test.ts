


import { _ } from './0_helpers/definitionWithModels'
import { complexObjectDef } from './0_helpers/complexObjectDef'



describe(`Swagger simple types validation`, () => {

  const stringType = _.string()

  it('checks Swager doc is generated correctly', async () => {
    expect(await stringType.getSwaggerType()).toEqual({
      example: expect.any(String),
      type: 'string',
    })
  })
})

describe(`Swagger simple object validation`, () => {

  const objectType = _.object({ str: _.string(), bool: _.boolean() })

  it('checks Swager doc is generated correctly', async () => {
    expect(await objectType.getSwaggerType()).toEqual({
      'example': {
        'bool': expect.any(Boolean),
        'str': expect.any(String),
      },
      'properties': {
        'bool': {
          'example': expect.any(Boolean),
          'type': 'boolean',
        },
        'str': {
          'example': expect.any(String),
          'type': 'string',
        },
      },
      'type': 'object',
    })
  })
})


describe(`Swagger simple array validation`, () => {

  const arrayType = _.array(_.string())

  it('checks Swager doc is generated correctly', async () => {
    expect(await arrayType.getSwaggerType()).toEqual({
      'example': expect.arrayContaining([expect.any(String)]),
      'items': {
        'example': expect.any(String),
        'type': 'string',
      },
      'type': 'array',
    })
  })
})



describe(`Swagger typesOr validation`, () => {

  const orType = _.typesOr([_.string(), _.boolean()])

  it('checks Swager doc is generated correctly', async () => {
    expect(await orType.getSwaggerType()).toEqual({
      'example': expect.anything(),
      'oneOf': [
        {
          'example': expect.any(String),
          'type': 'string',
        },
        {
          'example': expect.any(Boolean),
          'type': 'boolean',
        },
      ],
    })
  })
})



describe(`Swagger COMPLEX types validation`, () => {

  const complexObject = _.object(complexObjectDef)

  it('checks Swager doc is generated correctly for COMPLEX OBJECT', async () => {
    expect(await complexObject.getSwaggerType()).toEqual({
      'example': {
        'any': undefined,
        'arr': expect.arrayContaining([expect.any(Number)]),
        'enum': expect.any(String),
        'false': false,
        'featuredCryptos': expect.arrayContaining([expect.any(String)]),
        'float': expect.any(Number),
        'genericObj': {
          'info': 'this is untyped',
          'nb': 4,
          'randomKey': true,
        },
        'integer': expect.any(Number),
        'str': expect.any(String),
      },
      'properties': {
        'any': {
          'type': {},
        },
        'arr': {
          'example': expect.arrayContaining([expect.any(Number)]),
          'items': {
            'example': expect.any(Number),
            'format': 'float',
            'type': 'number',
          },
          'type': 'array',
        },
        'enum': {
          'enum': ['a', 'z'],
          'example': expect.any(String),
          'type': 'string',
        },
        'false': {
          'example': false,
          'type': 'boolean',
        },
        'featuredCryptos': {
          'example': expect.arrayContaining([expect.any(String)]),
          'items': {
            'enum': [
              'a',
              'b',
              'c',
            ],
            'example': expect.any(String),
            'type': 'string',
          },
          'type': 'array',
        },
        'float': {
          'example': expect.any(Number),
          'format': 'float',
          'type': 'number',
        },
        'genericObj': {
          'example': {
            'info': 'this is untyped',
            'nb': 4,
            'randomKey': true,
          },
          'type': 'object',
        },
        'integer': {
          'example': expect.any(Number),
          'type': 'integer',
        },
        'str': {
          'example': expect.any(String),
          'type': 'string',
        },
      },
      'type': 'object',
    })
  })

})



describe(`Swagger COMPLEX types validation MONGO MODEL`, () => {

  const mongoModel = _.model('bangk', 'exampleModel', 'Read')

  it('checks Swager doc is generated correctly for MONGO MODEL', async () => {
    expect(await mongoModel.getSwaggerType()).toEqual({

      'example': {
        '_id': expect.any(String),
        'any': undefined,
        'arr': expect.arrayContaining([expect.any(Number)]),
        'enum': expect.any(String),
        'false': false,
        'featuredCryptos': expect.arrayContaining([expect.any(String)]),
        'float': expect.any(Number),
        'genericObj': {
          'info': 'this is untyped',
          'nb': 4,
          'randomKey': true,
        },
        'integer': expect.any(Number),
        'lastUpdateDate': expect.any(String),
        'lastUpdater': expect.any(String),
        'str': expect.any(String),
      },
      'properties': {
        '_id': {
          'example': expect.any(String),
          'format': 'uuid',
          'type': 'string',
        },
        'any': {
          'type': {},
        },
        'arr': {
          'example': expect.arrayContaining([expect.any(Number)]),
          'items': {
            'example': expect.any(Number),
            'format': 'float',
            'type': 'number',
          },
          'type': 'array',
        },
        'enum': {
          'enum': ['a', 'z'],
          'example': expect.any(String),
          'type': 'string',
        },
        'false': {
          'example': false,
          'type': 'boolean',
        },
        'featuredCryptos': {
          'example': expect.arrayContaining([expect.any(String)]),
          'items': {
            'enum': [
              'a',
              'b',
              'c',
            ],
            'example': expect.any(String),
            'type': 'string',
          },
          'type': 'array',
        },
        'float': {
          'example': expect.any(Number),
          'format': 'float',
          'type': 'number',
        },
        'genericObj': {
          'example': {
            'info': 'this is untyped',
            'nb': 4,
            'randomKey': true,
          },
          'type': 'object',
        },
        'integer': {
          'example': expect.any(Number),
          'type': 'integer',
        },
        'lastUpdateDate': {
          'example': expect.any(String),
          'format': 'date',
          'type': 'string',
        },
        'lastUpdater': {
          'example': expect.any(String),
          'oneOf': [
            {
              'type': 'string',
            },
            {
              'type': 'object',
            },
          ],
        },
        'str': {
          'example': expect.any(String),
          'type': 'string',
        },
      },
      'type': 'object',
    })
  })

})