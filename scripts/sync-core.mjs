// Pure sync logic, shared by the GitHub Action (scripts/sync-to-framer.mjs) and by
// agents running the same upsert through the Framer CLI. No imports on purpose.

const DATE_LINE = /^\*Last material update: ([A-Z][a-z]+ \d{1,2}, \d{4})\*$/
const MAX_REMOVALS = 2
const MIN_DOCS_FOR_REMOVAL = 10

// "Online DPA.md" -> "online-dpa". Every published URL depends on this rule.
export function slugFor(filename) {
    return filename
        .replace(/\.md$/i, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
}

// A document must open with "# Title" followed by "*Last material update: Month D, YYYY*".
// The website's typography keys off that shape.
export function parseDoc(filename, text) {
    const lines = text.replace(/\r\n/g, "\n").split("\n")
    const first = lines.findIndex((line) => line.trim() !== "")
    const heading = lines[first]?.match(/^# (.+)$/)
    if (!heading) throw new Error(`${filename}: the first line must be the title, written as "# Title"`)
    const next = lines.slice(first + 1).find((line) => line.trim() !== "")
    const date = next?.trim().match(DATE_LINE)
    if (!date || Number.isNaN(Date.parse(date[1]))) {
        throw new Error(`${filename}: the line after the title must be "*Last material update: Month D, YYYY*"`)
    }
    return { file: filename, slug: slugFor(filename), title: heading[1].trim(), updated: date[1], body: text }
}

export function findDuplicateSlugs(docs) {
    const seen = new Map()
    const problems = []
    for (const doc of docs) {
        if (seen.has(doc.slug)) problems.push(`${doc.file}: same web address (/legal/${doc.slug}) as ${seen.get(doc.slug)}`)
        else seen.set(doc.slug, doc.file)
    }
    return problems
}

function plainText(html) {
    return String(html ?? "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
}

// Upserts every doc into the collection by slug, removes items whose file is gone,
// and reads the result back. Safe to re-run: the Framer API is not transactional.
export async function syncLegal(framer, docs, { collectionName = "Legal" } = {}) {
    const collection = (await framer.getCollections()).find((c) => c.name === collectionName)
    if (!collection) throw new Error(`Framer collection "${collectionName}" not found`)

    const fields = await collection.getFields()
    const fieldId = (name) => {
        const field = fields.find((f) => f.name === name)
        if (!field) throw new Error(`Framer collection "${collectionName}" has no "${name}" field`)
        return field.id
    }
    const titleId = fieldId("Title")
    const contentId = fieldId("Content")

    const before = await collection.getItems()
    const beforeBySlug = new Map(before.map((item) => [item.slug, item]))
    const wanted = new Set(docs.map((doc) => doc.slug))
    const stale = before.filter((item) => !wanted.has(item.slug))
    if (stale.length > MAX_REMOVALS || (stale.length > 0 && docs.length < MIN_DOCS_FOR_REMOVAL)) {
        throw new Error(
            `Refusing to remove ${stale.length} page(s) (${stale.map((i) => i.slug).join(", ")}) ` +
                `while syncing ${docs.length} document(s). Remove them in Framer by hand if this is intended.`
        )
    }

    await collection.addItems(
        docs.map((doc) => ({
            ...(beforeBySlug.has(doc.slug) ? { id: beforeBySlug.get(doc.slug).id } : {}),
            slug: doc.slug,
            draft: false,
            fieldData: {
                [titleId]: { type: "string", value: doc.title },
                [contentId]: { type: "formattedText", value: doc.body, contentType: "markdown" },
            },
        }))
    )
    if (stale.length > 0) await collection.removeItems(stale.map((item) => item.id))

    const after = new Map((await collection.getItems()).map((item) => [item.slug, item]))
    const problems = []
    const added = []
    const changed = []
    for (const doc of docs) {
        const item = after.get(doc.slug)
        const html = item?.fieldData?.[contentId]?.value
        if (!item) problems.push(`${doc.file}: missing from Framer after the sync`)
        else if (!plainText(html).includes(`Last material update: ${doc.updated}`)) {
            problems.push(`${doc.file}: Framer content does not show "Last material update: ${doc.updated}"`)
        }
        const old = beforeBySlug.get(doc.slug)
        if (!old) added.push(doc.slug)
        else if (
            plainText(old.fieldData?.[contentId]?.value) !== plainText(html) ||
            old.fieldData?.[titleId]?.value !== doc.title
        ) {
            changed.push(doc.slug)
        }
    }
    if (problems.length > 0) throw new Error(problems.join("\n"))

    return { total: docs.length, added, changed, removed: stale.map((item) => item.slug) }
}
