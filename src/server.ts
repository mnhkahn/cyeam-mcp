import express, { Request, Response } from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import path from "path";
import {
  wikiQuery,
  wikiGetArticle,
  wikiSearchIndex,
  wikiGetGraph,
} from "./engine.js";
import { WIKI_QUERY_SYSTEM } from "./prompts.js";

const PORT = parseInt(process.env.PORT || "8000", 10);
const rawHost = process.env.HOST || "0.0.0.0";
const HOST = rawHost === "[::]" ? "::" : rawHost;
const WIKI_DIR = path.resolve(process.cwd(), "wiki");

const server = new Server(
  {
    name: "cyeam-wiki-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "wiki_query",
        description:
          "Query the personal knowledge wiki using its native query logic. Reads index, backlinks, and 3-8 relevant articles to synthesize an answer.",
        inputSchema: {
          type: "object",
          properties: {
            question: {
              type: "string",
              description:
                "The question to ask about the wiki subject's life/knowledge",
            },
            depth: {
              type: "integer",
              default: 2,
              description: "How many layers of wikilinks to follow (1-3)",
            },
          },
          required: ["question"],
        },
      },
      {
        name: "wiki_get_article",
        description: "Read a specific wiki article by name or path",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Article title or relative path (without .md)",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "wiki_search_index",
        description: "Search the wiki index by keyword",
        inputSchema: {
          type: "object",
          properties: {
            keyword: {
              type: "string",
              description: "Keyword to search in article titles and aliases",
            },
          },
          required: ["keyword"],
        },
      },
      {
        name: "wiki_get_graph",
        description: "Return the knowledge graph image of the wiki",
        inputSchema: {
          type: "object",
          properties: {
            format: {
              type: "string",
              enum: ["base64", "path"],
              default: "base64",
            },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  if (name === "wiki_query") {
    const question = String((args as any).question || "");
    const depth = Number((args as any).depth ?? 2);
    const result = wikiQuery(question, depth);
    return {
      content: [{ type: "text", text: result }],
    };
  }
  if (name === "wiki_get_article") {
    const articleName = String((args as any).name || "");
    const result = wikiGetArticle(articleName);
    return {
      content: [{ type: "text", text: result }],
    };
  }
  if (name === "wiki_search_index") {
    const keyword = String((args as any).keyword || "");
    const result = wikiSearchIndex(keyword);
    return {
      content: [{ type: "text", text: result }],
    };
  }
  if (name === "wiki_get_graph") {
    const result = wikiGetGraph();
    if ("error" in result) {
      return {
        content: [{ type: "text", text: result.error }],
      };
    }
    return {
      content: [
        {
          type: "image",
          mimeType: result.mimeType,
          data: result.base64,
        } as any,
      ],
    };
  }
  throw new Error(`Unknown tool: ${name}`);
});

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "wiki://index",
        mimeType: "text/markdown",
        name: "Wiki Index",
        description: "The master index of all wiki articles",
      },
      {
        uri: "wiki://backlinks",
        mimeType: "application/json",
        name: "Wiki Backlinks",
        description: "Reverse link index between wiki articles",
      },
      {
        uri: "wiki://graph",
        mimeType: "image/png",
        name: "Wiki Knowledge Graph",
        description: "Visual graph of wiki article relationships",
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  if (uri === "wiki://index") {
    const p = path.join(WIKI_DIR, "_index.md");
    return {
      contents: [
        {
          uri,
          mimeType: "text/markdown",
          text: fs.existsSync(p) ? fs.readFileSync(p, "utf-8") : "",
        },
      ],
    };
  }
  if (uri === "wiki://backlinks") {
    const p = path.join(WIKI_DIR, "_backlinks.json");
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: fs.existsSync(p) ? fs.readFileSync(p, "utf-8") : "{}",
        },
      ],
    };
  }
  if (uri.startsWith("wiki://article/")) {
    const name = uri.replace("wiki://article/", "");
    const text = wikiGetArticle(name);
    return {
      contents: [
        {
          uri,
          mimeType: "text/markdown",
          text,
        },
      ],
    };
  }
  if (uri === "wiki://graph") {
    const result = wikiGetGraph();
    if ("error" in result) {
      return {
        contents: [
          {
            uri,
            mimeType: "text/plain",
            text: result.error,
          },
        ],
      };
    }
    const buffer = Buffer.from(result.base64, "base64");
    return {
      contents: [
        {
          uri,
          mimeType: result.mimeType,
          blob: buffer.toString("base64"),
        } as any,
      ],
    };
  }
  throw new Error(`Unknown resource: ${uri}`);
});

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "wiki_query_system",
        description: "System prompt for wiki query assistant",
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name } = request.params;
  if (name === "wiki_query_system") {
    return {
      description: "Wiki 查询系统提示词",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: WIKI_QUERY_SYSTEM,
          },
        },
      ],
    };
  }
  throw new Error(`Unknown prompt: ${name}`);
});

// ---------------------------------------------------------------------------
// Express + SSE
// ---------------------------------------------------------------------------

const app = express();

const transports: Map<string, SSEServerTransport> = new Map();

app.get("/health", (_req: Request, res: Response) => {
  res.send("ok");
});

app.get("/sse", async (_req: Request, res: Response) => {
  const transport = new SSEServerTransport("/messages", res);
  transports.set(transport.sessionId, transport);
  res.on("close", () => {
    transports.delete(transport.sessionId);
  });
  await server.connect(transport);
});

app.post("/messages", async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports.get(sessionId);
  if (!transport) {
    res.status(400).send("No transport found for sessionId");
    return;
  }
  await transport.handlePostMessage(req, res);
});

app.listen(PORT, HOST, () => {
  console.log(`Wiki MCP Server running on http://${HOST}:${PORT}`);
});
