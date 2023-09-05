

export type MaybeArray<T> = T | T[]
export type MaybePromise<T> = T | Promise<T>

export type User = {
    _id: string
    role: string // main role on requested company
    [k: string]: any
}

export type ObjectWithNoFn = { [name: string]: NotFunction<any> }

type NotFunction<T> = T extends Function ? never : T

type CountryCodeIso = `${Letters}${Letters}`
export type TranslationObj = { [countryIsoCode in CountryCodeIso]?: string }

type Letters = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z'

// https://stackoverflow.com/questions/49580725/is-it-possible-to-restrict-typescript-object-to-contain-only-properties-defined
export type NoExtraProperties<T, U extends T = T> = U & MakeObjKeysAsNever<Exclude<keyof U, keyof T>>
type MakeObjKeysAsNever<K extends keyof any> = { [P in K]: never}