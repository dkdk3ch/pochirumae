"use client";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { extractAsin } from "../lib/amazon.js";

const toYen = (v) => v ? Math.round(v).toLocaleString() + "円" : "不明";

function PriceBadge({ label, value, color }) {
  return (
    <div style={{ background:"#0A0A0F", borderRadius:10, padding:"10px 14px", flex:1, textAlign:"center" }}>
      <p style={{ fontSize:10, color:"#555", marginBottom:4 }}>{label}</p>
      <p style={{ fontSize:14, color: color || "#E8E8F0", fontWeight:700 }}>{toYen(value)}</p>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#1A1A2E", border:"1px solid #333", borderRadius:8, padding:"8px 12px" }}>
      <p style={{ fontSize:11, color:"#888", marginBottom:4 }}>{label}</p>
      <p style={{ fontSize:14, color:"#FFC107", fontWeight:700 }}>{payload[0].value.toLocaleString()}円</p>
    </div>
  );
};

export default function KeepaChart({ url, asin: asinProp }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const asin = asinProp || extractAsin(url || "");

  const load = async () => {
    if (!asin) { setError("ASINが取得できませんでした。URLを確認してください。"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/keepa?asin=" + asin);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
　　　window.__keepaData = json;
      setLoaded(true);
    } catch (e) {
      setError("価格データの取得に失敗しました: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // グラフデータから90日最安値を計算
  const calc = (history) => {
    if (!history || history.length === 0) return { min90: null, avg90: null };
    const now = Date.now();
    const days90 = 90 * 24 * 60 * 60 * 1000;
    const recent = history.filter(h => now - new Date(h.date).getTime() <= days90);
    if (recent.length === 0) return { min90: null, avg90: null };
    const prices = recent.map(h => h.price);
    const min90 = Math.min(...prices);
    const avg90 = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    return { min90, avg90 };
  };

  const { min90, avg90 } = data ? calc(data.priceHistory) : { min90: null, avg90: null };
  const currentPrice = data?.currentPrice || null;

  const getBuySignal = () => {
    if (!currentPrice || !avg90) return null;
    const ratio = currentPrice / avg90;
    if (ratio <= 0.9)  return { label: "90日平均より安い！今が買い時です", color: "#00C896" };
    if (ratio <= 1.05) return { label: "ほぼ平均価格。標準的なタイミング", color: "#FFC107" };
    return { label: "現在は平均より高め。セールを待つのがおすすめ", color: "#F44336" };
  };

  const signal = getBuySignal();

  const chartData = data?.priceHistory
    ? data.priceHistory.filter((_, i, arr) => i % Math.ceil(arr.length / 30) === 0)
    : [];

  return (
    <div style={{ background:"#12121A", border:"1px solid #222230", borderRadius:16, padding:"18px 20px" }}>
      <p style={{ fontSize:10, color:"#4CAF50", marginBottom:12, letterSpacing:".15em" }}>📈 Keepa 価格推移</p>

      {!loaded && !loading && (
        <button onClick={load} disabled={!asin}
          style={{ background:"#1A1A28", border:"1px solid #333", borderRadius:10, color:"#AAA", fontSize:13, padding:"10px 16px", cursor:"pointer", opacity: !asin ? 0.4 : 1 }}>
          {!asin ? "URLを入力すると価格履歴が見られます" : "📈 価格履歴を見る"}
        </button>
      )}

      {loading && <p style={{ color:"#555", fontSize:13 }}>価格データを取得中...</p>}
      {error && <p style={{ color:"#F44336", fontSize:13 }}>{error}</p>}

      {loaded && data && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

          {signal && (
            <div style={{ background:"#0A0A0F", borderRadius:10, padding:"10px 14px", borderLeft:`3px solid ${signal.color}` }}>
              <p style={{ fontSize:13, color:signal.color, fontWeight:600 }}>{signal.label}</p>
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
            <PriceBadge label="現在価格"    value={currentPrice} color="#FFC107" />
            <PriceBadge label="90日平均"    value={avg90}        color="#AAA" />
            <PriceBadge label="90日最安値"  value={min90}        color="#00C896" />
          </div>

          {chartData.length > 0 && (
            <div style={{ marginTop:8 }}>
              <p style={{ fontSize:10, color:"#555", marginBottom:8 }}>直近の価格推移</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{ top:4, right:4, bottom:4, left:4 }}>
                  <XAxis dataKey="date" tick={{ fontSize:9, fill:"#444" }} tickLine={false} axisLine={false}
                    tickFormatter={v => v.slice(5)} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize:9, fill:"#444" }} tickLine={false} axisLine={false}
                    tickFormatter={v => v.toLocaleString()} width={55} />
                  <Tooltip content={<CustomTooltip />} />
                  {avg90 && (
                    <ReferenceLine y={avg90} stroke="#555" strokeDasharray="4 4"
                      label={{ value:"90日平均", fill:"#555", fontSize:9 }} />
                  )}
                  <Line type="monotone" dataKey="price" stroke="#FFC107" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <p style={{ fontSize:10, color:"#333", textAlign:"right" }}>Powered by Keepa</p>
        </div>
      )}
    </div>
  );
}
