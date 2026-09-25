# @pipeworx/semanticscholar

Semantic Scholar Academic Graph: search 200M+ papers, resolve a paper by ID,
DOI or arXiv id, trace its citations, and look up authors with citation
metrics and h-index.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1679+ live data sources.

## Tools

- `search_papers(query, year?, limit?)` — papers matching a query: title,
  year, authors, venue, citation count, DOI, open-access PDF, abstract.
- `get_paper(paper_id)` — one paper by Semantic Scholar id, `DOI:…` or
  `arXiv:…`.
- `get_paper_citations(paper_id, limit?)` — the papers citing it.
- `get_author(name)` — an author's papers and citation metrics.

## Auth

Platform key (`PLATFORM_SEMANTICSCHOLAR_KEY`) sent as `x-api-key`. Without a
key the public graph endpoints answer but rate-limit hard (429 under load).

## Licence — zero-rated (fleet #1974)

The key was issued under the Semantic Scholar API License Agreement
(<https://api.semanticscholar.org/license/>). §2(a) limits use to
*"legitimate, non-commercial, research and/or educational purposes"* and
requires that *"any public use of Data must point back to Semantic Scholar at
https://www.semanticscholar.org/ with a utm_source=api UTM parameter"*; the Use
Restrictions forbid *"sell, lease, share, transfer, sublicense, commercialize
… any Data obtained through the API"* to third parties. Consequences:

- `zeroRated: true` on the gateway entry: 0 credits on every tier, no
  volume-bracket slot.
- Every response leads with `attribution` (the point-back), `license`
  (`LicenseRef-SemanticScholar-API-License-Agreement`, `kind: vendor_terms`,
  obligations `attribution` + `non_commercial`) and `license_note`, via
  `attachLicense` in `@pipeworx/shared`.
- Zero-rating removes the fee. It does not license onward sharing: the
  caller's own use has to be non-commercial too, and the note says so.

## Data sources

- <https://api.semanticscholar.org/graph/v1/paper/search> — search.
- <https://api.semanticscholar.org/graph/v1/paper/{id}> — one paper, and
  `/citations` beneath it.
- <https://api.semanticscholar.org/graph/v1/author/search> — authors.

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "semanticscholar": {
      "url": "https://gateway.pipeworx.io/semanticscholar/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/semanticscholar/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1679+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/semanticscholar_search_papers \
  -H 'Content-Type: application/json' \
  -d '{"query":"transformer attention mechanism","year":"2023","limit":10}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/semanticscholar_search_papers`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Standalone (no gateway account)

This package also runs as a local stdio MCP server — no Pipeworx account, no
gateway round-trip:

```json
{
  "mcpServers": {
    "semanticscholar": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-semanticscholar"]
    }
  }
}
```

Or run it directly to confirm it starts:

```bash
npx -y @pipeworx/mcp-semanticscholar
```

It speaks MCP over stdin/stdout and answers `initialize`/`tools/list`/`tools/call`
for **only** this pack's tools — none of the shared meta-tools the gateway
connection above adds. Same source, same tools, no ask_pipeworx routing.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Semanticscholar data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
