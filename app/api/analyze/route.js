import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./prompt.js";

const client = new Anthropic();

export async function POST(request) {
  try {
    const { productName, url } = await request.json();

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: "URL: " + (url || "未入力") + "\n商品名: " + (productName || "不明") + "\nこの商品を分析して類似品と比較してください。",
        },
      ],
    });

    const text = response.content[0].text;
    console.log("AIレスポンス:", text);

    const cleaned = text.replace(/```json|```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    const jsonStr = cleaned.slice(start, end + 1);
    const result = JSON.parse(jsonStr);

    return Response.json(result);

  } catch (e) {
    console.error("エラー:", e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
