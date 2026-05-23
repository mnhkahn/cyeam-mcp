import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

function listen(server: http.Server): Promise<number> {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      assert.equal(typeof address, "object");
      assert.notEqual(address, null);
      resolve(address!.port);
    });
  });
}

function close(server: http.Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

test("tech_news accepts RSS endpoints that serve application/xml", async () => {
  const title = "Personal update: I've joined Anthropic";
  let rssAccept = "";
  let baseUrl = "";

  const server = http.createServer((req, res) => {
    if (req.url === "/open-apis/auth/v3/tenant_access_token/internal") {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ code: 0, msg: "ok", tenant_access_token: "token" }));
      return;
    }

    if (req.url === "/open-apis/sheets/v2/spreadsheets/fake/values/Sheet1") {
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          code: 0,
          msg: "ok",
          data: {
            revision: 1,
            spreadsheetToken: "fake",
            valueRange: {
              majorDimension: "ROWS",
              range: "Sheet1",
              revision: 1,
              values: [
                ["title", "url", "full_content", "limit"],
                ["Karpathy", `${baseUrl}/rss`, "false", "0"],
              ],
            },
          },
        })
      );
      return;
    }

    if (req.url === "/rss") {
      rssAccept = req.headers.accept || "";
      if (!rssAccept.includes("application/xml")) {
        res.statusCode = 406;
        res.setHeader("accept", "application/xml");
        res.end();
        return;
      }

      res.setHeader("content-type", "application/xml;charset=UTF-8");
      res.end(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Karpathy</title>
    <item>
      <title>${title}</title>
      <link>https://x.com/karpathy/status/2056753169888334312</link>
      <description>joined Anthropic</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <guid isPermaLink="false">2056753169888334312</guid>
    </item>
  </channel>
</rss>`);
      return;
    }

    res.statusCode = 404;
    res.end();
  });

  const port = await listen(server);
  baseUrl = `http://127.0.0.1:${port}`;
  process.env.LARK_API_HOST = baseUrl;
  process.env.LARK_APP_ID = "app";
  process.env.LARK_APP_SECRET = "secret";
  process.env.LARK_SHEET_URL = `${baseUrl}/sheets/fake?sheet=Sheet1`;

  try {
    const { getTechNews } = await import("../src/news.ts");
    const result = await getTechNews(10);

    assert.match(rssAccept, /application\/xml/);
    assert.equal(result.news.length, 1, result.logs.join("\n"));
    assert.equal(result.news[0].title, `[Karpathy]${title}`);
  } finally {
    await close(server);
  }
});
