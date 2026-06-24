# Documentation Quality Standards

Standards for all documentation under `/docs` (Feature 13.10).

---

## File naming

| Rule | Example |
|------|---------|
| Lowercase kebab-case | `event-driven.md`, `restore-backup.md` |
| Descriptive, not abbreviated | `seller-verification.md` not `sel-ver.md` |
| `README.md` for section indexes | `docs/api/README.md` |
| No spaces or special characters | — |

## Folder structure

- One **topic per file** when content exceeds ~300 lines
- Section `README.md` links to all child docs
- Cross-link related docs in a **Related** section at the bottom
- Keep `docs/db/` for schema; `docs/api/` for endpoints; `docs/features/` for functional specs

## Markdown formatting

1. **Title** — single H1 per file matching the filename topic
2. **Metadata** — optional blockquote after title: status, version, base path
3. **Headings** — H2 for major sections, H3 for subsections (no skipped levels)
4. **Tables** — prefer tables for endpoint lists, field mappings, permissions
5. **Code fences** — always specify language (`bash`, `json`, `http`, `typescript`)
6. **Links** — use relative paths: `[Auth API](../api/auth.md)`

## Code examples

- Examples must be **copy-pasteable** and reflect real routes/schemas
- Request/response JSON uses camelCase (API convention)
- Include auth header when endpoint requires Bearer token
- Mark placeholders: `YOUR_TOKEN`, `uuid-here`

## Diagrams

- Use **Mermaid** for architecture, sequence, and flow diagrams
- Prefer `flowchart TB/LR` and `sequenceDiagram`
- Add alt text description before complex diagrams
- Store diagram source in the same `.md` file (not external images unless screenshots)

## API schema consistency

Every API doc must include:

| Section | Required |
|---------|----------|
| Base path | ✅ |
| Endpoint table (method, path, auth, description) | ✅ |
| Request/response schemas | ✅ |
| Validation rules (link to `packages/validation`) | ✅ |
| RBAC / permissions | ✅ when gated |
| Error codes | ✅ |
| Example payloads | ✅ |

Response wrapper: `{ "data": T }` for success; errors via global exception filter.

## RBAC awareness

- Document required **permission codes** (e.g. `view_users`) not just roles
- Note `SUPER_ADMIN` bypass explicitly
- Distinguish `/admin/*` vs `/super-admin/*` namespaces

## Versioning docs

- Note breaking API changes in `CHANGELOG.md`
- Add `> **Since:** vX.Y.Z` for new endpoints when applicable
- Deprecations: strikethrough in tables + migration note

## Review checklist

Before merging documentation:

- [ ] Linked from section `README.md` and `docs/README.md`
- [ ] Spelling & grammar pass
- [ ] Code examples match current implementation
- [ ] Mermaid renders in GitHub preview
- [ ] `pnpm docs:index` run if files added/renamed
- [ ] No secrets or real credentials in examples
