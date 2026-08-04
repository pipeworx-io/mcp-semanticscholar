# mcp-semanticscholar

Semantic Scholar Academic Graph MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Semanticscholar data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
