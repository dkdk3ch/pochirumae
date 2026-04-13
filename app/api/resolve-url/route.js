export async function POST(request) {
  try {
    const { url } = await request.json();
    if (!url) return Response.json({ error: "url required" }, { status: 400 });

    // Amazon短縮URL判定
    const isShortened = url.includes("amzn.to") || url.includes("amzn.asia") || url.includes("a.co");

    if (!isShortened) {
      return Response.json({ resolvedUrl: url });
    }

    // リダイレクト先を取得
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
    });

    return Response.json({ resolvedUrl: res.url });
  } catch (e) {
    console.error("URL解決エラー:", e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
