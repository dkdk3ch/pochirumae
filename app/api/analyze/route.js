import Anthropic from "@anthropic-ai/sdk";
import { getSystemPrompt } from "./prompt.js";

const client = new Anthropic();

export async function POST(request) {
  try {
    const { productName, url, answers, category, keepaData } = await request.json();

    const keepaContext = keepaData
      ? [
          "【Keepa価格データ（実データ）】",
          "現在価格: " + (keepaData.currentPrice ? Math.round(keepaData.currentPrice / 10) + "円" : "不明"),
          "90日平均: " + (keepaData.avg90Price ? Math.round(keepaData.avg90Price / 10) + "円" : "不明"),
          "90日最安値: " + (keepaData.min90Price ? Math.round(keepaData.min90Price / 10) + "円" : "不明"),
          "このデータを必ずタイミング分析に使用してください。",
        ].join("\n")
      : "";

    const userMessage = [
      "URL: " + (url || "未入力"),
      "商品名: " + (productName || "不明"),
      category ? "カテゴリ: " + category : "",
      answers ? "\nユーザーの回答:\n" + answers : "",
      keepaContext ? "\n" + keepaContext : "",
    ].filter(Boolean).join("\n");

    let response;
　　for (let i = 0; i < 5; i++) {
      try {
        response = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: PROMPT,
          messages: [{ role: "user", content: "商品名: " + (productName || "不明") + "\nURL: " + (url || "未入力") }],
        });
        break;
      } catch (e) {
        if (i < 4 && (e.status === 529 || e.status === 500)) {
          await new Promise(r => setTimeout(r, (i + 1) * 3000));
          continue;
        }
        throw e;
      }
    }
    const text = response.content[0].text;
    const cleaned = text.replace(/```json|```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    const result = JSON.parse(cleaned.slice(start, end + 1));

    return Response.json(result);
  } catch (e) {
    console.error("エラー:", e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
