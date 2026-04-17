import express, { Request, Response } from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { randomUUID } from "node:crypto";
import fs from "fs";
import path from "path";
import {
  wikiQuery,
  wikiGetArticle,
  wikiSearchIndex,
  wikiGetGraph,
} from "./engine.js";
import { WIKI_QUERY_SYSTEM, TECH_NEWS_PROMPT } from "./prompts.js";
import { getTechNews } from "./news.js";

const PORT = parseInt(process.env.PORT || "8000", 10);
const rawHost = process.env.HOST || "0.0.0.0";
const HOST = rawHost === "[::]" ? "::" : rawHost;
const WIKI_DIR = path.resolve(process.cwd(), "wiki");

function createServer() {
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
          description:
            "Return the knowledge graph image of the wiki. Optionally filter by a query to show only related articles and their neighbors.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description:
                  "Optional keyword to filter articles. Only matched articles and their linked neighbors are shown.",
              },
              depth: {
                type: "integer",
                default: 1,
                description:
                  "How many layers of wikilinks to expand from matched articles (0 = matched only, 1 = one hop, 2 = two hops)",
              },
              max_nodes: {
                type: "integer",
                default: 50,
                description: "Max number of nodes to render in the filtered graph",
              },
            },
          },
        },
        {
          name: "tech_news",
          description: "Get daily technical news from RSS feeds",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "integer",
                default: 20,
                description: "Max number of news items to return",
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
      const query = String((args as any).query || "");
      const depth = Number((args as any).depth ?? 1);
      const maxNodes = Number((args as any).max_nodes ?? 50);
      const result = await wikiGetGraph({ query, depth, maxNodes });
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
    if (name === "tech_news") {
      const limit = Number((args as any).limit ?? 20);
      const { news, logs } = await getTechNews(limit);
      if (news.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No tech news found in the last 2 days.\n\nDebug logs:\n${logs.join("\n")}`,
            },
          ],
        };
      }
      const content: any[] = news.map((item) => ({
        type: "resource_link",
        uri: item.link,
        name: item.title,
        title: item.title,
        description: item.createTime
          ? `${item.createTime}|||${item.description}`
          : item.description,
      }));
      content.push({
        type: "text",
        text: `Debug logs:\n${logs.join("\n")}`,
      });
      return { content };
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
      const result = await wikiGetGraph();
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
        {
          name: "tech_news_prompt",
          description: "Summarize the latest news through LLM",
          arguments: [
            {
              name: "news",
              description: "News data in json format",
              required: true,
            },
          ],
        },
      ],
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
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
    if (name === "tech_news_prompt") {
      const news = String((args as any)?.news || "");
      if (!news) {
        throw new Error("required argument 'news' is missing or empty");
      }
      return {
        description: "科技新闻总结提示词",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: TECH_NEWS_PROMPT(news),
            },
          },
        ],
      };
    }
    throw new Error(`Unknown prompt: ${name}`);
  });

  return server;
}

// ---------------------------------------------------------------------------
// Express + Streamable HTTP
// ---------------------------------------------------------------------------

interface Session {
  server: Server;
  transport: StreamableHTTPServerTransport;
}

const sessions = new Map<string, Session>();

async function main() {
  const app = express();

  app.get("/health", (_req: Request, res: Response) => {
    res.send("ok");
  });

  app.all("/mcp", async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let session: Session | undefined;

    if (sessionId) {
      session = sessions.get(sessionId);
    }

    if (!session) {
      const sid = randomUUID();
      const server = createServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sid,
      });
      await server.connect(transport);
      session = { server, transport };
      sessions.set(sid, session);
    }

    session.transport.handleRequest(req, res, req.body).catch((err: any) => {
      console.error("Transport request error:", err);
    });
  });

  app.listen(PORT, HOST, () => {
    console.log(`Wiki MCP Server running on http://${HOST}:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
