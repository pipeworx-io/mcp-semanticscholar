# mcp-semanticscholar

Semantic Scholar Academic Graph MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `search_papers` | Search 200M+ academic papers on Semantic Scholar by keyword or exact title. Returns titles, authors, year, venue, CITATION COUNTS, DOI, and open-access PDF links. PREFER for "how many citations does <paper title> have", "citation count for <paper>", "how cited is <paper>" — search the title and read citationCount off the match. Optionally filter by year range and field of study. Keyless. |
| `get_paper` | Get full metadata for a single paper by ID. Accepts a Semantic Scholar paper ID, or a prefixed ID like "DOI:10.1145/3292500", "arXiv:2106.15928", or "CorpusId:215416146". Returns abstract, TLDR summary, authors, venue, citation/reference counts, fields of study, and open-access PDF. Keyless. |
| `get_paper_citations` | List papers that CITE a given paper (the works citing it), with their titles, authors, year, and citation counts. Useful for forward citation tracing and finding follow-up work. Keyless. |
| `get_author` | Search for academic authors by name on Semantic Scholar. Returns up to 5 matches with affiliations, paper count, total citation count, h-index, and profile URL. Keyless. |

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

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

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
