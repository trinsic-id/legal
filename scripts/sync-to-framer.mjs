#!/usr/bin/env node
// Publishes docs/*.md to the Framer CMS collection behind trinsic.id/legal/<slug>.
//
//   node scripts/sync-to-framer.mjs --check   validate the documents (offline, no secrets)
//   node scripts/sync-to-framer.mjs           validate, then write to Framer
//
// Writing needs FRAMER_PROJECT_URL and FRAMER_API_KEY. Changes reach the live site
// with the next website publish; this script never publishes.

import { appendFile, readdir, readFile } from "node:fs/promises"
import { findDuplicateSlugs, parseDoc, syncLegal } from "./sync-core.mjs"

const docsDir = new URL("../docs/", import.meta.url)
const checkOnly = process.argv.includes("--check")

function fail(messages) {
    for (const message of messages) console.error(`::error::${message.replaceAll("\n", "%0A")}`)
    process.exit(1)
}

async function loadDocs() {
    const names = (await readdir(docsDir)).filter((name) => name.toLowerCase().endsWith(".md")).sort()
    const docs = []
    const problems = []
    for (const name of names) {
        try {
            docs.push(parseDoc(name, await readFile(new URL(name, docsDir), "utf8")))
        } catch (error) {
            problems.push(error.message)
        }
    }
    problems.push(...findDuplicateSlugs(docs))
    if (names.length === 0) problems.push("No documents found in docs/")
    if (problems.length > 0) fail(problems)
    return docs
}

async function summarize(lines) {
    console.log(lines.join("\n"))
    if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `${lines.join("\n")}\n`)
}

const docs = await loadDocs()
console.log(`${docs.length} documents are valid.`)
if (checkOnly) process.exit(0)

const { FRAMER_PROJECT_URL, FRAMER_API_KEY } = process.env
if (!FRAMER_PROJECT_URL || !FRAMER_API_KEY) fail(["FRAMER_PROJECT_URL and FRAMER_API_KEY must be set to sync."])

const { withConnection } = await import("framer-api")
try {
    const result = await withConnection(FRAMER_PROJECT_URL, (framer) => syncLegal(framer, docs), FRAMER_API_KEY)
    const list = (slugs) => (slugs.length ? slugs.map((s) => `\`/legal/${s}\``).join(", ") : "none")
    await summarize([
        "### Website CMS updated",
        `- Documents synced: ${result.total}`,
        `- New pages: ${list(result.added)}`,
        `- Changed pages: ${list(result.changed)}`,
        `- Removed pages: ${list(result.removed)}`,
        "",
        "These changes go live on trinsic.id with the next website publish.",
    ])
} catch (error) {
    fail([`Framer sync failed: ${error.message}`])
}
