import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(request) {
  try {
    const { productName, analysis, question } = await request.json();

    const system = [
      "あなたはAmazon商品の購買アドバイザーです。",
      "ユーザーが検討している商品の分析結果をもとに、追加の質問に答えてください。",
      "回答は3文以内で簡潔に。専門用語は使わず、友達に話すような自然な口調で。",
    ].join("\n");

    const context = [
      "商品名: " + (productName || "不明"),
      "AI分析結果:",
      "- 評価: " + (analysis.productGrade || "不明") + " (" + (analysis.productScore || "?") + "/100)",
      "- 総評: " + (analysis.summary || ""),
      "- AI判断: " + (analysis.conclusion?.message || ""),
      "- 良い点: " + (analysis.pros?.join("、") || ""),
      "- 気になる点: " + (analysis.cons?.join("、") || ""),
    ].join("\n");

    let response;
    for (let i = 0; i < 3; i++) {
      try {
        response = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 512,
          system,
          messages: [{ role: "user", content: context + "\n\n質問: " + question }],
        });
        break;
      } catch (e) {
        if (i < 2 && (e.status === 529 || e.status === 500)) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        throw e;
      }
    }

    const text = response.content[0].text;
    return Response.json({ answer: text });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
