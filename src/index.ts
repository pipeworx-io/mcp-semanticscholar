interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Semantic Scholar Academic Graph MCP.
 *
 * Search 200M+ academic papers, resolve papers by ID/DOI/arXiv, trace
 * citations, and look up authors with citation metrics and h-index — via the
 * Semantic Scholar Academic Graph API. Keyless (public graph endpoints; be
 * polite with a User-Agent). Rate-limited without a key, so 429s are expected
 * under load.
 */


const BASE = 'https://api.semanticscholar.org/graph/v1';
const UA = 'pipeworx/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'search_papers',
    description:
      'Search 200M+ academic papers on Semantic Scholar by keyword. Returns titles, authors, year, venue, citation counts, DOI, and open-access PDF links. Optionally filter by year range and field of study. Keyless.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query, e.g. "transformer attention mechanism" or "CRISPR gene editing".',
        },
        limit: {
          type: 'number',
          description: 'Max results to return (default 10, max 25).',
        },
        year: {
          type: 'string',
          description: 'Filter by publication year or range, e.g. "2023" or "2020-2024".',
        },
        fields_of_study: {
          type: 'string',
          description:
            'Filter by field of study, e.g. "Computer Science", "Medicine", "Biology", "Physics".',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_paper',
    description:
      'Get full metadata for a single paper by ID. Accepts a Semantic Scholar paper ID, or a prefixed ID like "DOI:10.1145/3292500", "arXiv:2106.15928", or "CorpusId:215416146". Returns abstract, TLDR summary, authors, venue, citation/reference counts, fields of study, and open-access PDF. Keyless.',
    inputSchema: {
      type: 'object',
      properties: {
        paper_id: {
          type: 'string',
          description:
            'Paper identifier. A Semantic Scholar ID, or prefixed: "DOI:10...", "arXiv:2106.15928", "CorpusId:...".',
        },
      },
      required: ['paper_id'],
    },
  },
  {
    name: 'get_paper_citations',
    description:
      'List papers that CITE a given paper (the works citing it), with their titles, authors, year, and citation counts. Useful for forward citation tracing and finding follow-up work. Keyless.',
    inputSchema: {
      type: 'object',
      properties: {
        paper_id: {
          type: 'string',
          description:
            'Paper identifier. A Semantic Scholar ID, or prefixed: "DOI:10...", "arXiv:2106.15928", "CorpusId:...".',
        },
        limit: {
          type: 'number',
          description: 'Max citing papers to return (default 10, max 25).',
        },
      },
      required: ['paper_id'],
    },
  },
  {
    name: 'get_author',
    description:
      'Search for academic authors by name on Semantic Scholar. Returns up to 5 matches with affiliations, paper count, total citation count, h-index, and profile URL. Keyless.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Author name to search for, e.g. "Yoshua Bengio".',
        },
      },
      required: ['name'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  try {
    switch (name) {
      case 'search_papers':
        return searchPapers(args);
      case 'get_paper':
        return getPaper(args);
      case 'get_paper_citations':
        return getPaperCitations(args);
      case 'get_author':
        return getAuthor(args);
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

function truncate(s: unknown, n: number): string | undefined {
  if (typeof s !== 'string' || !s) return undefined;
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

function rateLimited(): { error: string } {
  return {
    error:
      'Semantic Scholar rate limit (429). The keyless public API throttles aggressively — wait a few seconds and retry.',
  };
}

/** Map a raw Semantic Scholar paper object → compact shape. */
function mapPaper(p: Record<string, unknown>, abstractChars = 400, authorLimit = 8): unknown {
  const authors = Array.isArray(p.authors)
    ? (p.authors as Array<Record<string, unknown>>).slice(0, authorLimit).map((a) => a.name)
    : undefined;
  const externalIds = (p.externalIds as Record<string, unknown> | undefined) ?? undefined;
  const openAccessPdf = (p.openAccessPdf as Record<string, unknown> | undefined)?.url;
  return {
    paperId: p.paperId,
    title: p.title,
    year: p.year,
    authors,
    citationCount: p.citationCount,
    venue: p.venue,
    doi: externalIds?.DOI,
    url: p.url,
    openAccessPdf: openAccessPdf ?? undefined,
    abstract: truncate(p.abstract, abstractChars),
  };
}

async function searchPapers(args: Record<string, unknown>): Promise<unknown> {
  const query = typeof args.query === 'string' ? args.query.trim() : '';
  if (!query) return { error: 'provide a query', query: args.query ?? null };
  const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 25);
  const fields = 'title,abstract,year,authors,citationCount,venue,externalIds,url,openAccessPdf';

  let url = `${BASE}/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=${encodeURIComponent(fields)}`;
  if (typeof args.year === 'string' && args.year.trim())
    url += `&year=${encodeURIComponent(args.year.trim())}`;
  if (typeof args.fields_of_study === 'string' && args.fields_of_study.trim())
    url += `&fieldsOfStudy=${encodeURIComponent(args.fields_of_study.trim())}`;

  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (res.status === 429) return rateLimited();
  if (!res.ok) return { error: `Semantic Scholar: ${res.status} ${(await res.text()).slice(0, 200)}` };

  const body = (await res.json()) as Record<string, unknown>;
  const data = Array.isArray(body.data) ? (body.data as Array<Record<string, unknown>>) : [];
  return {
    total: body.total ?? data.length,
    papers: data.map((p) => mapPaper(p)),
  };
}

async function getPaper(args: Record<string, unknown>): Promise<unknown> {
  const paperId = typeof args.paper_id === 'string' ? args.paper_id.trim() : '';
  if (!paperId) return { error: 'provide a paper_id', paper_id: args.paper_id ?? null };
  const fields =
    'title,abstract,year,authors,citationCount,referenceCount,venue,externalIds,url,openAccessPdf,tldr,fieldsOfStudy,publicationTypes';

  const url = `${BASE}/paper/${encodeURIComponent(paperId)}?fields=${encodeURIComponent(fields)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (res.status === 429) return rateLimited();
  if (res.status === 404) return { error: 'paper not found', paper_id: paperId };
  if (!res.ok) return { error: `Semantic Scholar: ${res.status} ${(await res.text()).slice(0, 200)}` };

  const p = (await res.json()) as Record<string, unknown>;
  const externalIds = (p.externalIds as Record<string, unknown> | undefined) ?? undefined;
  const openAccessPdf = (p.openAccessPdf as Record<string, unknown> | undefined)?.url;
  const tldr = (p.tldr as Record<string, unknown> | undefined)?.text;
  const authors = Array.isArray(p.authors)
    ? (p.authors as Array<Record<string, unknown>>).slice(0, 15).map((a) => a.name)
    : undefined;
  return {
    paperId: p.paperId,
    title: p.title,
    year: p.year,
    authors,
    venue: p.venue,
    citationCount: p.citationCount,
    referenceCount: p.referenceCount,
    doi: externalIds?.DOI,
    url: p.url,
    openAccessPdf: openAccessPdf ?? undefined,
    tldr: tldr ?? undefined,
    fieldsOfStudy: p.fieldsOfStudy,
    publicationTypes: p.publicationTypes,
    abstract: truncate(p.abstract, 800),
  };
}

async function getPaperCitations(args: Record<string, unknown>): Promise<unknown> {
  const paperId = typeof args.paper_id === 'string' ? args.paper_id.trim() : '';
  if (!paperId) return { error: 'provide a paper_id', paper_id: args.paper_id ?? null };
  const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 25);
  const fields = 'title,year,authors,citationCount';

  const url = `${BASE}/paper/${encodeURIComponent(paperId)}/citations?fields=${encodeURIComponent(fields)}&limit=${limit}`;
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (res.status === 429) return rateLimited();
  if (res.status === 404) return { error: 'paper not found', paper_id: paperId };
  if (!res.ok) return { error: `Semantic Scholar: ${res.status} ${(await res.text()).slice(0, 200)}` };

  const body = (await res.json()) as Record<string, unknown>;
  const data = Array.isArray(body.data) ? (body.data as Array<Record<string, unknown>>) : [];
  const citations = data
    .map((row) => row.citingPaper as Record<string, unknown> | undefined)
    .filter((p): p is Record<string, unknown> => !!p)
    .map((p) => {
      const compact = mapPaper(p, 400, 6) as Record<string, unknown>;
      return {
        paperId: compact.paperId,
        title: compact.title,
        year: compact.year,
        authors: compact.authors,
        citationCount: compact.citationCount,
      };
    });
  return { count: citations.length, citations };
}

async function getAuthor(args: Record<string, unknown>): Promise<unknown> {
  const name = typeof args.name === 'string' ? args.name.trim() : '';
  if (!name) return { error: 'provide an author name', name: args.name ?? null };
  const fields = 'name,affiliations,paperCount,citationCount,hIndex,url';

  const url = `${BASE}/author/search?query=${encodeURIComponent(name)}&fields=${encodeURIComponent(fields)}&limit=5`;
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (res.status === 429) return rateLimited();
  if (!res.ok) return { error: `Semantic Scholar: ${res.status} ${(await res.text()).slice(0, 200)}` };

  const body = (await res.json()) as Record<string, unknown>;
  const data = Array.isArray(body.data) ? (body.data as Array<Record<string, unknown>>) : [];
  return {
    count: data.length,
    authors: data.map((a) => ({
      authorId: a.authorId,
      name: a.name,
      affiliations: a.affiliations,
      paperCount: a.paperCount,
      citationCount: a.citationCount,
      hIndex: a.hIndex,
      url: a.url,
    })),
  };
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
