import Parser from "rss-parser";

const LARK_API_HOST = process.env.LARK_API_HOST || "";

export interface RssInfo {
  title: string;
  url: string;
  full_content: boolean;
  limit: number;
}

export interface NewsItem {
  title: string;
  link: string;
  description: string;
  createTime: number;
}

export interface TechNewsResult {
  news: NewsItem[];
  logs: string[];
}

interface LarkTokenResponse {
  code: number;
  msg: string;
  tenant_access_token?: string;
  expire?: number;
}

interface LarkSheetResponse {
  code: number;
  msg: string;
  data?: {
    revision: number;
    spreadsheetToken: string;
    valueRange: {
      majorDimension: string;
      range: string;
      revision: number;
      values: string[][];
    };
  };
}

async function getTenantAccessToken(appId: string, appSecret: string): Promise<string> {
  if (!LARK_API_HOST) {
    throw new Error("LARK_API_HOST must be set");
  }
  const resp = await fetch(`${LARK_API_HOST}/open-apis/auth/v3/tenant_access_token/internal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  });
  const data = (await resp.json()) as LarkTokenResponse;
  if (data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`Lark auth error: ${data.msg}`);
  }
  return data.tenant_access_token;
}

function getSheetTokenByUrl(larkUrl: string): { token: string; sheet: string } {
  const url = new URL(larkUrl);
  const pathParts = url.pathname.split("/").filter(Boolean);
  if (pathParts.length < 2 || pathParts[0] !== "sheets" || !pathParts[1]) {
    throw new Error("Invalid Lark sheet URL");
  }
  const token = pathParts[1];
  const sheet = url.searchParams.get("sheet") || "";
  return { token, sheet };
}

async function readSheetsContent(
  token: string,
  sheet: string,
  accessToken: string
): Promise<LarkSheetResponse["data"]> {
  const range = sheet || "sheet1";
  const resp = await fetch(
    `${LARK_API_HOST}/open-apis/sheets/v2/spreadsheets/${token}/values/${range}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const data = (await resp.json()) as LarkSheetResponse;
  if (data.code !== 0 || !data.data) {
    throw new Error(`Lark sheet error: ${data.msg}`);
  }
  return data.data;
}

async function getRssInfo(sheetUrl: string): Promise<RssInfo[]> {
  const appId = process.env.LARK_APP_ID || "";
  const appSecret = process.env.LARK_APP_SECRET || "";
  if (!appId || !appSecret) {
    throw new Error("LARK_APP_ID and LARK_APP_SECRET must be set");
  }

  const accessToken = await getTenantAccessToken(appId, appSecret);
  const { token, sheet } = getSheetTokenByUrl(sheetUrl);
  const data = await readSheetsContent(token, sheet, accessToken);

  const values = data!.valueRange.values;
  if (values.length < 2) {
    return [];
  }

  const headers = values[0];
  const result: RssInfo[] = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const item: any = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j];
      const val = row[j] || "";
      item[key] = val;
    }
    result.push({
      title: String(item.title || ""),
      url: String(item.url || ""),
      full_content: String(item.full_content || "").toLowerCase() === "true",
      limit: parseInt(String(item.limit || "0"), 10) || 0,
    });
  }
  return result;
}

function parseFeedDate(item: any): number {
  // rss-parser provides isoDate when it can parse the date
  const raw = item.isoDate || item.pubDate || item.dcDate || item.date;
  if (!raw) return 0;
  const ts = new Date(raw).getTime();
  return isNaN(ts) ? 0 : ts / 1000;
}

async function getPostInfo(rss: RssInfo, logs: string[]): Promise<NewsItem[]> {
  const parser = new Parser({ timeout: 20000 });
  try {
    const feed = await parser.parseURL(rss.url);
    const items: NewsItem[] = [];
    for (const item of feed.items || []) {
      let description = item.contentSnippet || item.content || "";
      if (rss.full_content && item.content) {
        description = item.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      }
      const createTime = parseFeedDate(item);
      items.push({
        title: item.title || "",
        link: item.link || "",
        description,
        createTime,
      });
    }
    if (rss.limit > 0 && rss.limit < items.length) {
      return items.slice(0, rss.limit);
    }
    logs.push(`[OK] ${rss.title} (${rss.url}) -> ${items.length} items`);
    return items;
  } catch (err: any) {
    logs.push(`[ERR] ${rss.title} (${rss.url}): ${err.message || String(err)}`);
    return [];
  }
}

export async function getTechNews(limit = 20): Promise<TechNewsResult> {
  const logs: string[] = [];
  const sheetUrl = process.env.LARK_SHEET_URL || "";
  if (!sheetUrl) {
    throw new Error("LARK_SHEET_URL must be set");
  }

  const rssLinks = await getRssInfo(sheetUrl);
  logs.push(`Fetched ${rssLinks.length} RSS sources from Lark sheet`);
  if (rssLinks.length === 0) {
    logs.push("Warning: no RSS sources found in sheet");
    return { news: [], logs };
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 2);
  const startTs = start.getTime() / 1000;

  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const endTs = end.getTime() / 1000;

  logs.push(`Date filter: ${new Date(startTs * 1000).toISOString()} ~ ${new Date(endTs * 1000).toISOString()}`);

  const allItems: NewsItem[] = [];
  const promises = rssLinks.map(async (rss) => {
    if (!rss.url) {
      logs.push(`[SKIP] ${rss.title}: empty URL`);
      return;
    }
    const items = await getPostInfo(rss, logs);
    let kept = 0;
    for (const item of items) {
      if (item.createTime >= startTs && item.createTime <= endTs) {
        item.title = `[${rss.title}]${item.title}`;
        allItems.push(item);
        kept++;
      }
    }
    logs.push(`  -> ${kept} items within date range`);
  });
  await Promise.all(promises);

  allItems.sort((a, b) => a.createTime - b.createTime);

  logs.push(`Total news items after filtering: ${allItems.length}`);

  if (allItems.length >= limit) {
    return { news: allItems.slice(0, limit), logs };
  }
  return { news: allItems, logs };
}
