/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from 'jest'

const config: Config = {
    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageProvider: 'v8',
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
        '^.+\\.js$': '<rootDir>/node_modules/babel-jest',
    },
    testRegex: ['.*\\.test\\.[jt]sx?$'],
}

export default config
