import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const PROMPT = [
  "あなたはAmazon商品のカテゴリ判定と質問生成の専門家です。",
  "商品名・URLからカテゴリを判定し、購買判断に役立つ質問を生成してください。",
  "JSONのみで回答。前置き不要。",
  "{",
  '  "category": "カテゴリ名（例：イヤホン、モバイルモニター、充電器など）",',
  '  "questions": [',
  '    {',
  '      "id": "q1",',
  '      "text": "質問文",',
  '      "type": "selectまたはfree",',
  '      "options": ["選択肢1", "選択肢2", "選択肢3"]',
  '    }',
  '  ]',
  "}",
  "",
  "質問は3〜5問。selectは選択式、freeはフリー入力。",
  "optionsはselect時のみ。freeのときはoptionsは空配列。",
  "質問はそのカテゴリで購入者が実際に迷うポイントに絞る。",
  "最後の1問は必ずfreeで「他に気になることはありますか？」とする。"
].join("\n");

export async function POST(request) {
  try {
    const { productName, url } = await request.json();

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: PROMPT,
      messages: [{
        role: "user",
        content: "商品名: " + (productName || "不明") + "\nURL: " + (url || "未入力"),
      }],
    });

    const text = response.content[0].text;
    const cleaned = text.replace(/```json|```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    const result = JSON.parse(cleaned.slice(start, end + 1));

    return Response.json(result);
  } catch (e) {
    console.error("質問生成エラー:", e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
