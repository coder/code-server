async function main () {
    for await (const _ of (async function* () {})()) {
        require(_)
    }
}
