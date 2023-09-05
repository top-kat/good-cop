type ObjectId = string

type Env = 'test' | 'development' | 'production' | 'preprod'

export type MaybeArray<T> = T | T[]
export type MaybePromise<T> = T | Promise<T>

export type CtxUser = {
    _id: string
    role: string[] // main role on requested company
    companyId?: string // requested company id on connection (backend unique)
    shopId?: string // requested shopId passed on the header of the request
    [k: string]: any
}

type CtxMinimal = {
    isPublic: boolean
    isSystem: boolean
    isDevEnv: boolean // are we in test or development environnement ?
    env: string
    user: CtxUser,
}

type ObjectGeneric = { [k: string]: any }

export type ObjectWithNoFn = { [name: string]: NotFunction<any> }

// eslint-disable-next-line @typescript-eslint/ban-types
type NotFunction<T> = T extends Function ? never : T

type AsType<T, Type> = T extends Type ? T : Type

type AsString<T> = AsType<T, string>

type Complete<T> = {
    [P in keyof Required<T>]: T[P]
}

// type SystemCtx = Override<Ctx, {
//     isSystem: true
//     isPublic: false
// }>

// type PublicCtx = Override<Ctx, {
//     isSystem: false
//     isPublic: true
// }>

type CountryCodeIso = `${Letters}${Letters}`
export type TranslationObj = { [countryIsoCode in CountryCodeIso]?: string }

// type Ctx = CtxMinimal & {
//     system(): SystemCtx
//     // usePerm(perm_s: string | string[], role?: Roles, createAnewCtxInstance?: Boolean): Ctx // role optional, createAnewCtxInstance will create a new CTX and return it instead of modifying the existing instance
//     useRole(role: Roles, createAnewCtxInstance?: boolean): Ctx
//     // hasPerm: (...perm: string[]) => Boolean // check if loggedUser has ONE of that perm (can be role:myRole)
//     // hasPermAnd: (...perm: string[]) => Boolean //   * *      * *     * ALL of that perms
//     hasRole(role: Roles, systemAlwaysReturnTrue?: boolean) // ctx.hasRole('admin', true) // if system it will return true
//     isAnonymousUser: () => boolean
//     outputType?: ('xml' | 'file' | 'download' | 'raw' | 'docx' | 'bufferObject' | 'excel') | ((...params: any[]) => any)
//     env: Env
//     //  [k: string]: any, // custom fields may be passed
//     api: {
//         params: ObjectGeneric
//         body: ObjectGeneric
//         originalUrl: string
//         query: ObjectGeneric
//     },
//     req: import('express').Request
//     res: import('express').Response
// }

type Override<T1, T2> = Omit<T1, keyof T2> & T2

type RecursivePartial<T> = {
    [P in keyof T]?:
    T[P] extends (infer U)[] ? RecursivePartial<U>[] :
        T[P] extends object ? RecursivePartial<T[P]> :
            T[P]
}

type Letters = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z'

type SimpleNumbers = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

type ArrayOneOrMore<T> = { 0: T } & Array<T>

type RecursiveObjValueType<T, Type> = {
    [K in keyof T]?: T[K] extends object
        ? Type | RecursiveObjValueType<T[K], Type>
        : Type
}

type TypeObjectValues<Obj extends Record<string, any>, Type> = {
    [K in keyof Obj]: Type
}

// https://stackoverflow.com/questions/49580725/is-it-possible-to-restrict-typescript-object-to-contain-only-properties-defined
export type NoExtraProperties<T, U extends T = T> = U & MakeObjKeysAsNever<Exclude<keyof U, keyof T>>
type MakeObjKeysAsNever<K extends keyof any> = { [P in K]: never}


type RemoveTypeFromTuple<T, TypeToRemove> = T extends [] ? [] : T extends TypeToRemove ? [] : T extends [infer A, ...infer R] ? [...RemoveTypeFromTuple<A, TypeToRemove>, ...RemoveTypeFromTuple<R, TypeToRemove>] : [T];
