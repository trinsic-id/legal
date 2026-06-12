# Legal Document Style Guide

This guide captures formatting conventions for the Markdown files in this repository. These conventions are intended to keep the published legal documents consistent without forcing unnecessary changes to provider-supplied or jurisdiction-specific text.

## Baseline Structure

Every published legal document should begin with:

```md
# Document Title

*Last material update: Month D, YYYY*
```

Do not add a new introductory section or renumber a document solely for formatting consistency. Preserve existing section numbering unless a substantive legal edit requires a broader restructuring.

## Document Types

Use the document type to decide how closely the document should follow the standard agreement structure.

### Agreements

Agreements govern the legal relationship between Trinsic and another party. Examples include the Terms of Service, Online Data Processing Agreement, and Google Wallet Relying Party Terms.

Agreement documents should generally use numbered third-level headings for primary sections:

```md
### 1. Section Name
```

Subsections should generally be inline bold labels at the start of the paragraph:

```md
**1.1 Subsection Name.** Subsection text.
```

Agreement openings may include an applicability notice when there is important scope, precedence, incorporation, or warning language that should be visible before the numbered sections begin.

### Policies

Policies explain Trinsic practices to users, customers, or other data subjects. Examples include the Privacy Policy and Cookie Policy.

Policies may use numbered third-level headings and tables where they make the document easier to scan. Do not force agreement-style recitals, definitions, or subsections into a policy unless the substance requires them.

### Reference and Disclosure Documents

Reference and disclosure documents publish supporting information rather than creating a full standalone agreement. Examples include Technical and Organizational Measures, the List of Sub-Processors, and the Modern Slavery Statement.

These documents may use unnumbered headings, tables, and bold paragraph labels. Do not add numbering just to match agreement documents.

### Provider, Jurisdiction-Specific, and Localized Notices

Some documents contain provider-supplied, jurisdiction-specific, translated, or bilingual text. Examples include Online Dukcapil Match Terms and the Simple ID documents.

For these documents, preserve the required source text, translation structure, and language headings unless legal review approves a substantive rewrite. Apply repository-level conventions only around the wrapper where appropriate, such as the document title and last material update line.

## Applicability and Notice Formatting

When a document needs a high-visibility applicability, precedence, incorporation, or legal-warning notice, use the DPA-style code-formatted notice block.

Place the notice immediately after the `Last material update` line and before the document body. Format it as a standalone paragraph wrapped in single backticks:

```md
`THIS DOCUMENT SHALL NOT APPLY TO THE EXTENT THAT...`
```

Use this format for:

- Exceptions to default applicability.
- Statements that another agreement controls or is incorporated.
- Cross-document applicability language, such as DPA applicability.
- Critical legal warnings that would otherwise appear as standalone all-caps paragraphs.

Do not use blockquotes, bold-only paragraphs, tables, or headings for these notices. Do not add a notice block just to summarize a document. When moving language into a notice block, remove or simplify duplicative text in the opening paragraphs while preserving substantive obligations in the numbered sections.

## Markdown Conventions

- Use ATX headings (`#`, `##`, `###`).
- Use double asterisks for defined terms inside quotation marks, such as `"**Services**"`.
- Use Markdown tables for structured lists of rights, cookies, subprocessors, or processing details.
- Use hyphen bullets for unordered lists.
- Keep provider-required language, translated text, and regulator-required clauses intact unless legal review approves a change.
