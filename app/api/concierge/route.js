import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const PROMPT = [
  "あなたはAmazon商品のAIコンシェルジュです。",
  "ユーザーの条件からおすすめ商品を3〜5件提案してください。",
  "JSONのみで回答。前置き不要。",
  "{",
  '  "category": "カテゴリ名",',
  '  "message": "提案の一言コメント（1文）",',
  '  "products": [',
  '    {',
  '      "name": "商品名（正式名称）",',
  '      "asin": "AmazonのASINコード（B0から始まる10桁、不明なら空文字）",',
  '      "reason": "おすすめ理由（1〜2文）",',
  '      "bestFor": "こんな人に最適",',
  '      "priceRange": "価格帯（例：3000円台）",',
  '      "rating": "5段階評価（例：4.3）",',
  '      "rank": "1〜5の順位",',
  '      "tag": "コスパ最強・定番・高品質・初心者向け・玄人向け のいずれか"',
  '    }',
  '  ]',
  "}"
].join("\n");

export async function POST(request) {
  try {
    const { category, answers } = await request.json();

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: PROMPT,
      messages: [{
        role: "user",
        content: "カテゴリ: " + category + "\n\nユーザーの条件:\n" + answers,
      }],
    });

    const text = response.content[0].text;
    const cleaned = text.replace(/```json|```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    const result = JSON.parse(cleaned.slice(start, end + 1));

    return Response.json(result);
  } catch (e) {
    console.error("コンシェルジュエラー:", e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
