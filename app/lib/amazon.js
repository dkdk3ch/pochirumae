export function getAmazonUrl(asin, tag) {
  const affiliateTag = tag || process.env.NEXT_PUBLIC_AMAZON_TAG || "";
  if (!asin || asin.length !== 10) return null;
  const base = "https://www.amazon.co.jp/dp/" + asin;
  return affiliateTag ? base + "?tag=" + affiliateTag : base;
}

export function getAmazonSearchUrl(productName, tag) {
  const affiliateTag = tag || process.env.NEXT_PUBLIC_AMAZON_TAG || "";
  const base = "https://www.amazon.co.jp/s?k=" + encodeURIComponent(productName);
  return affiliateTag ? base + "&tag=" + affiliateTag : base;
}

export function extractAsin(url) {
  if (!url) return null;
  const match = url.match(/\/dp\/([A-Z0-9]{10})/);
  return match ? match[1] : null;
}
