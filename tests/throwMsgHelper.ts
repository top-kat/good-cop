


export function throwMsgHelper(itMsg: string, fn: Promise<any>, expectedMsg: string) {
    it(itMsg, async () => {
        try {
            await fn
        } catch (err) {
            expect((err as any)?.message).toContain(expectedMsg)
        }
    })
}