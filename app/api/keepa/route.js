export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const asin = searchParams.get("asin");

  if (!asin) {
    return Response.json({ error: "asin required" }, { status: 400 });
  }

  const apiKey = process.env.KEEPA_API_KEY;

  try {
    const url = "https://api.keepa.com/product"
      + "?key=" + apiKey
      + "&domain=5"
      + "&asin=" + asin
      + "&stats=180"
      + "&history=1";

    const res = await fetch(url);
    const data = await res.json();

    if (!data.products || data.products.length === 0) {
      return Response.json({ error: "商品が見つかりませんでした" }, { status: 404 });
    }

    const product = data.products[0];
    const stats = product.stats || {};

    const getPrice = (arr) => {
      if (!arr) return null;
      for (let i = 0; i < Math.min(arr.length, 3); i++) {
        if (arr[i] && arr[i] > 0) return arr[i];
      }
      return null;
    };

    const currentPrice = getPrice(stats.current);
    const avg90Price   = getPrice(stats.avg90);
    const avg180Price  = getPrice(stats.avg180);
    const min90Price   = getPrice(stats.minInInterval) || getPrice(stats.min);
    const max90Price   = getPrice(stats.maxInInterval) || getPrice(stats.max);
    const allTimeLow   = getPrice(stats.min);

    const csv = product.csv || [];
    const rawCsv = csv[0]?.length > 2 ? csv[0] : (csv[1] || []);
    const priceHistory = parsePriceHistory(rawCsv);

    console.log("価格データ:", { currentPrice, avg90Price, min90Price, max90Price, allTimeLow, historyCount: priceHistory.length });

    return Response.json({
      asin,
      title: product.title,
      currentPrice,
      avg90Price,
      avg180Price,
      min90Price,
      max90Price,
      allTimeLow,
      priceHistory: priceHistory.slice(-60),
    });

  } catch (e) {
    console.error("Keepaエラー:", e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

function parsePriceHistory(csv) {
  if (!csv || csv.length < 2) return [];
  const result = [];
  for (let i = 0; i < csv.length - 1; i += 2) {
    const keepaTime = csv[i];
    const price     = csv[i + 1];
    if (keepaTime < 0 || price < 0) continue;
    const unixMs = (keepaTime + 21564000) * 60000;
    const date   = new Date(unixMs);
    result.push({
      date: date.toISOString().slice(0, 10),
      price: price,
    });
  }
  return result;
}
