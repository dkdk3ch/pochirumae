export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const category = searchParams.get("category") || "";

  if (!query) {
    return Response.json({ error: "query required" }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  // カテゴリに応じてキーワードを追加
  const categoryKeywords = {
    "イヤホン": "レビュー 音質 比較",
    "ヘッドホン": "レビュー 音質 比較",
    "モバイルモニター": "レビュー 開封 比較",
    "充電器": "レビュー 検証 比較",
    "キーボード": "レビュー 打鍵感 比較",
    "マウス": "レビュー 使用感 比較",
    "SSD": "レビュー 速度 比較",
    "スマホ": "レビュー 実機 比較",
  };

  const extra = categoryKeywords[category] || "レビュー 比較 おすすめ";
  const searchQuery = query + " " + extra;

  try {
    // 検索1：商品名＋カテゴリキーワード（関連度順）
    const url1 = "https://www.googleapis.com/youtube/v3/search"
      + "?part=snippet&type=video&maxResults=6"
      + "&order=relevance"
      + "&q=" + encodeURIComponent(searchQuery)
      + "&regionCode=JP"
      + "&relevanceLanguage=ja"
      + "&key=" + apiKey;

    const res1 = await fetch(url1);
    const data1 = await res1.json();

    if (data1.error) {
      return Response.json({ error: data1.error.message }, { status: 500 });
    }

    // 動画IDリストを取得して再生数・いいね数で絞り込む
    const videoIds = data1.items.map(item => item.id.videoId).join(",");

    const url2 = "https://www.googleapis.com/youtube/v3/videos"
      + "?part=statistics,contentDetails,snippet"
      + "&id=" + videoIds
      + "&key=" + apiKey;

    const res2 = await fetch(url2);
    const data2 = await res2.json();

    // 再生数でソートして上位4件を返す
    const videos = data2.items
      .map(item => ({
        id: item.id,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.medium.url,
        url: "https://www.youtube.com/watch?v=" + item.id,
        viewCount: parseInt(item.statistics.viewCount || "0"),
        likeCount: parseInt(item.statistics.likeCount || "0"),
        publishedAt: item.snippet.publishedAt,
      }))
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 4);

    return Response.json({ videos });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
