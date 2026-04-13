"use client";
import { useState } from "react";
import { getAmazonUrl, getAmazonSearchUrl, extractAsin } from "./lib/amazon.js";
import KeepaChart from "./components/KeepaChart.js";

const gradeConfig = {
  S: { color: "#00C896", bg: "#00C89612", label: "最高評価" },
  A: { color: "#4CAF50", bg: "#4CAF5012", label: "優秀" },
  B: { color: "#FFC107", bg: "#FFC10712", label: "良好" },
  C: { color: "#FF9800", bg: "#FF980012", label: "普通" },
  D: { color: "#F44336", bg: "#F4433612", label: "微妙" },
};
const conclusionConfig = {
  buy:         { icon: "✅", label: "この商品がベスト",        color: "#00C896" },
  alternative: { icon: "🔀", label: "他にもっと良い商品あり",  color: "#FFC107" },
  consider:    { icon: "🤔", label: "よく考えて",              color: "#FF9800" },
};
const timingConfig = {
  now:  { icon: "⚡",  label: "今が買い時",     color: "#00C896" },
  wait: { icon: "📅",  label: "もう少し待って", color: "#FFC107" },
  sale: { icon: "🏷️", label: "セールを狙って", color: "#FF9800" },
};
const verdictConfig = {
  better: { label: "こっちの方がおすすめ", color: "#00C896" },
  same:   { label: "同等レベル",           color: "#FFC107" },
  worse:  { label: "元の商品の方が良い",   color: "#F44336" },
};
const tagColors = {
  "コスパ最強": "#FF6B35",
  "定番":       "#4CAF50",
  "高品質":     "#CC00FF",
  "初心者向け": "#2196F3",
  "玄人向け":   "#FF3366",
};

const CATEGORIES = [
  {
    id: "electronics", label: "📱 家電・カメラ・AV機器", subs: [
      "スマートフォン・携帯電話", "タブレット", "スマートウォッチ・ウェアラブル",
      "イヤホン・ヘッドホン", "Bluetoothスピーカー", "テレビ", "プロジェクター",
      "カメラ・デジカメ", "ビデオカメラ", "電子書籍リーダー",
    ]
  },
  {
    id: "pc", label: "💻 パソコン・周辺機器", subs: [
      "ノートパソコン", "デスクトップパソコン", "モニター・ディスプレイ",
      "キーボード", "マウス", "USBハブ・ドッキングステーション",
      "外付けSSD・HDD", "プリンター・スキャナー", "Webカメラ・マイク",
      "ルーター・Wi-Fi機器", "PCバッグ・ケース",
    ]
  },
  {
    id: "smartphone_acc", label: "📲 スマホ・タブレットアクセサリ", subs: [
      "スマホケース・カバー", "モバイルバッテリー", "充電器・ケーブル",
      "スマホスタンド・ホルダー", "画面保護フィルム", "ワイヤレス充電器",
      "タブレットケース・カバー", "スマホリング・ストラップ",
    ]
  },
  {
    id: "home_appliance", label: "🏠 大型家電", subs: [
      "冷蔵庫", "洗濯機・乾燥機", "エアコン", "電子レンジ・オーブン",
      "食器洗い乾燥機", "掃除機・ロボット掃除機", "空気清浄機",
      "加湿器・除湿器", "ドライヤー・ヘアアイロン",
    ]
  },
  {
    id: "kitchen", label: "🍳 キッチン・調理家電", subs: [
      "炊飯器", "電気ケトル", "コーヒーメーカー・エスプレッソ",
      "トースター・オーブントースター", "ミキサー・フードプロセッサー",
      "フライパン・鍋", "包丁・まな板", "水筒・タンブラー・マグ",
      "保存容器・弁当箱", "コーヒー用品・お茶用品",
    ]
  },
  {
    id: "fashion", label: "👔 ファッション", subs: [
      "メンズトップス・シャツ", "メンズパンツ・ボトムス", "レディーストップス",
      "レディーススカート・ワンピース", "スニーカー・シューズ",
      "バッグ・リュック", "財布・小物", "時計", "サングラス・アクセサリー",
      "帽子・キャップ", "傘・レインウェア",
    ]
  },
  {
    id: "beauty", label: "💄 ビューティー・健康", subs: [
      "スキンケア・化粧水・乳液", "日焼け止め・UVケア", "メイクアップ・コスメ",
      "シャンプー・コンディショナー", "ヘアカラー・白髪染め",
      "電動歯ブラシ・オーラルケア", "ひげそり・脱毛器",
      "体重計・体組成計", "マッサージ器・フォームローラー",
      "サプリメント・プロテイン",
    ]
  },
  {
    id: "sports", label: "⚽ スポーツ・アウトドア", subs: [
      "ランニングシューズ・ウェア", "筋トレ・ヨガ用品",
      "自転車・サイクリング用品", "キャンプ・テント・寝袋",
      "登山・トレッキング用品", "水泳・マリンスポーツ",
      "ゴルフ用品", "テニス・バドミントン",
      "フィットネス機器・ダンベル", "スポーツバッグ・リュック",
    ]
  },
  {
    id: "book_hobby", label: "📚 本・ホビー・楽器", subs: [
      "ビジネス書・自己啓発", "小説・文学・エッセイ", "参考書・資格・検定",
      "ギター・ベース", "ピアノ・キーボード", "DTM・レコーディング機材",
      "ボードゲーム・カードゲーム", "プラモデル・フィギュア",
      "手帳・ノート・文具", "画材・アート用品",
    ]
  },
  {
    id: "toy_baby", label: "👶 おもちゃ・ベビー・キッズ", subs: [
      "知育玩具・おもちゃ", "ブロック・レゴ", "ぬいぐるみ・人形",
      "ゲーム・テレビゲーム周辺機器", "ベビーカー・チャイルドシート",
      "哺乳瓶・授乳用品", "ベビーベッド・寝具・布団",
      "ベビー服・子供服", "ランドセル・学習机",
    ]
  },
  {
    id: "pet", label: "🐾 ペット用品", subs: [
      "犬用フード・おやつ", "猫用フード・おやつ",
      "ペット用おもちゃ・用品", "キャリーバッグ・ケージ",
      "トイレ・シーツ", "シャンプー・グルーミング用品",
      "首輪・リード・ハーネス", "爪とぎ・キャットタワー",
    ]
  },
  {
    id: "furniture", label: "🛋 家具・インテリア・収納", subs: [
      "デスク・作業テーブル", "椅子・オフィスチェア", "ベッド・マットレス",
      "枕・掛け布団", "収納ラック・棚", "カーテン・ブラインド",
      "照明・デスクライト", "ラグ・カーペット", "観葉植物・フラワー",
    ]
  },
  {
    id: "office", label: "🖊 文房具・オフィス用品", subs: [
      "ボールペン・万年筆", "ノート・メモ帳", "ファイル・バインダー",
      "はさみ・カッター・テープ", "付箋・ふせん", "シュレッダー",
      "デスク収納・整理用品", "プロジェクター・ホワイトボード",
    ]
  },
  {
    id: "car", label: "🚗 車・バイク用品", subs: [
      "カーナビ・ドライブレコーダー", "カーチャージャー・車載充電器",
      "カーシート・シートカバー", "タイヤ・ホイール",
      "洗車・カーケア用品", "バイク用ヘルメット・グローブ",
      "自転車用ヘルメット・ライト",
    ]
  },
  {
    id: "diy", label: "🔧 DIY・工具・ガーデン", subs: [
      "電動ドライバー・インパクト", "工具セット", "脚立・はしご",
      "塗料・接着剤", "防犯カメラ・センサーライト",
      "園芸用品・プランター", "芝刈り機・除草剤",
    ]
  },
  {
    id: "food", label: "🍎 食品・飲料・お酒", subs: [
      "お米・穀物", "麺類・パスタ", "調味料・ソース・ドレッシング",
      "お菓子・スナック", "コーヒー・紅茶・お茶", "水・ジュース・炭酸飲料",
      "ビール・日本酒・ワイン", "健康食品・オーガニック",
    ]
  },
];

function TopPage({ onSelectUrl, onSelectCategory }) {
  return (
    <main style={{ minHeight:"100vh", background:"#0A0A0F", color:"#E8E8F0", fontFamily:"sans-serif" }}>
      <div style={{ padding:"60px 24px 40px", maxWidth:680, margin:"0 auto", textAlign:"center" }}>
        <p style={{ fontSize:11, letterSpacing:".25em", color:"#FF3366", marginBottom:12 }}>POCHIRUMAE.COM</p>
        <h1 style={{ fontSize:36, fontWeight:900, lineHeight:1.2, marginBottom:16 }}>ポチる前に、確認しよう。</h1>
        <p style={{ color:"#555", fontSize:14, lineHeight:1.8 }}>AIが類似品と比較して最適な商品を提案。URLを貼るだけで購買判断をサポートします。</p>
      </div>
      <div style={{ maxWidth:680, margin:"0 auto", padding:"0 24px 80px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <button onClick={onSelectUrl} style={{ background:"#12121A", border:"1px solid #FF336640", borderRadius:20, padding:"32px 24px", cursor:"pointer", textAlign:"left", display:"flex", flexDirection:"column", gap:12 }}>
          <span style={{ fontSize:36 }}>🔍</span>
          <div>
            <p style={{ fontSize:11, color:"#FF3366", marginBottom:6 }}>TYPE A</p>
            <p style={{ fontSize:18, fontWeight:700, color:"#E8E8F0", marginBottom:8 }}>この商品、買っていい？</p>
            <p style={{ fontSize:12, color:"#666", lineHeight:1.7 }}>URLを貼るだけ。AIが類似品と比較して最適な判断を提案します。</p>
          </div>
          <p style={{ color:"#FF3366", fontSize:13, fontWeight:600 }}>判定する →</p>
        </button>
        <button onClick={onSelectCategory} style={{ background:"#12121A", border:"1px solid #4CAF5040", borderRadius:20, padding:"32px 24px", cursor:"pointer", textAlign:"left", display:"flex", flexDirection:"column", gap:12 }}>
          <span style={{ fontSize:36 }}>🛍</span>
          <div>
            <p style={{ fontSize:11, color:"#4CAF50", marginBottom:6 }}>TYPE B</p>
            <p style={{ fontSize:18, fontWeight:700, color:"#E8E8F0", marginBottom:8 }}>何を買えばいいかわからない</p>
            <p style={{ fontSize:12, color:"#666", lineHeight:1.7 }}>カテゴリと用途を選ぶだけ。AIコンシェルジュが最適な商品を提案します。</p>
          </div>
          <p style={{ color:"#4CAF50", fontSize:13, fontWeight:600 }}>相談する →</p>
        </button>
      </div>
      <div style={{ borderTop:"1px solid #1A1A2E", padding:"40px 24px", maxWidth:680, margin:"0 auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24 }}>
          {[
            { icon:"🤖", title:"AI類似品比較", desc:"競合商品と徹底比較" },
            { icon:"⚡", title:"買い時分析", desc:"セール時期と値引き率を予測" },
            { icon:"📺", title:"動画レビュー", desc:"YouTubeの検証動画も確認" },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ textAlign:"center" }}>
              <div style={{ fontSize:28, marginBottom:8 }}>{icon}</div>
              <p style={{ fontSize:13, fontWeight:700, color:"#E8E8F0", marginBottom:4 }}>{title}</p>
              <p style={{ fontSize:11, color:"#555", lineHeight:1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function YouTubeSection({ productName, category }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!productName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/youtube?q=" + encodeURIComponent(productName) + "&category=" + encodeURIComponent(category || ""));
      const data = await res.json();
      setVideos(data.videos || []);
      setSearched(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background:"#12121A", border:"1px solid #222230", borderRadius:16, padding:"18px 20px" }}>
      <p style={{ fontSize:10, color:"#FF6B35", marginBottom:12, letterSpacing:".15em" }}>📺 YouTube レビュー動画</p>
      {!searched ? (
        <button onClick={search} disabled={loading || !productName.trim()} style={{ background:"#1A1A28", border:"1px solid #333", borderRadius:10, color:"#AAA", fontSize:13, padding:"10px 16px", cursor:"pointer", opacity: !productName.trim() ? 0.4 : 1 }}>
          {loading ? "検索中..." : "📺 YouTubeで動画を探す"}
        </button>
      ) : videos.length === 0 ? (
        <p style={{ color:"#555", fontSize:13 }}>動画が見つかりませんでした</p>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {videos.map(v => (
            <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer"
              style={{ display:"flex", gap:12, textDecoration:"none", background:"#0A0A0F", borderRadius:10, padding:10, border:"1px solid #1A1A2E" }}>
              <img src={v.thumbnail} alt={v.title} style={{ width:120, height:68, objectFit:"cover", borderRadius:6, flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:12, color:"#E8E8F0", lineHeight:1.5, marginBottom:4, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{v.title}</p>
                <p style={{ fontSize:11, color:"#555" }}>{v.channel}</p>
                {v.viewCount > 0 && <p style={{ fontSize:10, color:"#444", marginTop:2 }}>▶ {v.viewCount.toLocaleString()}回視聴</p>}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultView({ result, url, productName, onReset, onAnalyzeAlternative }) {
  const grade      = gradeConfig[result.productGrade]                    || gradeConfig["C"];
  const conclusion = conclusionConfig[result.conclusion?.recommendation] || conclusionConfig["consider"];
  const timing     = result?.timing ? (timingConfig[result.timing.recommendation] || timingConfig["wait"]) : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ background: grade.bg, border:"1px solid #333", borderRadius:16, padding:24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <span style={{ fontSize:48, fontWeight:900, color:grade.color }}>{result.productGrade}</span>
          <div>
            <p style={{ fontSize:12, color:grade.color, marginBottom:4 }}>{grade.label} — スコア {result.productScore}/100</p>
            <p style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>{result.headline}</p>
            <p style={{ fontSize:13, color:"#999", lineHeight:1.6 }}>{result.summary}</p>
          </div>
        </div>
      </div>

      <div style={{ background:"#12121A", border:`1px solid ${conclusion.color}40`, borderRadius:16, padding:"18px 20px" }}>
        <p style={{ fontSize:10, color:"#666", marginBottom:8 }}>AI判断</p>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <span style={{ fontSize:24 }}>{conclusion.icon}</span>
          <span style={{ fontSize:18, fontWeight:700, color:conclusion.color }}>{conclusion.label}</span>
        </div>
        <div style={{ background:"#0A0A0F", borderRadius:10, padding:"12px 16px", fontSize:13, lineHeight:1.7, color:"#CCC", borderLeft:`3px solid ${conclusion.color}` }}>
          {result.conclusion?.message}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div style={{ background:"#12121A", border:"1px solid #222230", borderRadius:16, padding:16 }}>
          <p style={{ fontSize:10, color:"#00C896", marginBottom:8 }}>良い点</p>
          {result.pros?.map((s, i) => (
            <div key={i} style={{ display:"flex", gap:8, marginBottom:6 }}>
              <span style={{ color:"#00C896", flexShrink:0 }}>+</span>
              <span style={{ fontSize:12, color:"#BBB", lineHeight:1.5 }}>{s}</span>
            </div>
          ))}
        </div>
        <div style={{ background:"#12121A", border:"1px solid #222230", borderRadius:16, padding:16 }}>
          <p style={{ fontSize:10, color:"#F44336", marginBottom:8 }}>気になる点</p>
          {result.cons?.map((w, i) => (
            <div key={i} style={{ display:"flex", gap:8, marginBottom:6 }}>
              <span style={{ color:"#F44336", flexShrink:0 }}>!</span>
              <span style={{ fontSize:12, color:"#BBB", lineHeight:1.5 }}>{w}</span>
            </div>
          ))}
        </div>
      </div>

      {result.alternatives && result.alternatives.length > 0 && (
        <div style={{ background:"#12121A", border:"1px solid #222230", borderRadius:16, padding:"18px 20px" }}>
          <p style={{ fontSize:10, color:"#CC00FF", marginBottom:16, letterSpacing:".15em" }}>🔀 類似品比較</p>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {result.alternatives.map((alt, i) => {
              const v = verdictConfig[alt.verdict] || verdictConfig["same"];
              return (
                <div key={i} style={{ background:"#0A0A0F", borderRadius:12, padding:"14px 16px", border:`1px solid ${v.color}30` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <p style={{ fontSize:14, fontWeight:700, color:"#E8E8F0" }}>{alt.name}</p>
                    <span style={{ fontSize:11, color:v.color, background:v.color+"20", padding:"2px 8px", borderRadius:20, whiteSpace:"nowrap", marginLeft:8 }}>{v.label}</span>
                  </div>
                  <p style={{ fontSize:12, color:"#888", marginBottom:6 }}>📦 {alt.priceRange} ／ ⭐ {alt.rating}</p>
                  <p style={{ fontSize:12, color:"#CCC", lineHeight:1.6, marginBottom:6 }}>{alt.reason}</p>
                  <p style={{ fontSize:11, color:"#555", marginBottom:10 }}>👤 {alt.bestFor}</p>
                  <div style={{ display:"flex", gap:8 }}>
                    <a href={getAmazonSearchUrl(alt.name)} target="_blank" rel="noopener noreferrer"
                      style={{ flex:1, display:"block", textAlign:"center", background:"linear-gradient(135deg,#FF9900,#FF6600)", borderRadius:8, color:"#fff", fontWeight:700, fontSize:12, padding:"8px 12px", textDecoration:"none" }}>
                      🛒 Amazonで検索
                    </a>
                    <button onClick={() => onAnalyzeAlternative(alt.name)}
                      style={{ flex:1, background:"#1A1A28", border:"1px solid #4CAF5040", borderRadius:8, color:"#4CAF50", fontSize:12, fontWeight:700, padding:"8px 12px", cursor:"pointer" }}>
                      🔍 この商品を判定
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ background:"#12121A", border:"1px solid #222230", borderRadius:16, padding:"16px 20px" }}>
        <div style={{ display:"flex", gap:16 }}>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:10, color:"#4CAF50", marginBottom:6 }}>向いている人</p>
            <p style={{ fontSize:13, color:"#CCC", lineHeight:1.65 }}>👤 {result.targetUser}</p>
          </div>
          <div style={{ width:1, background:"#222" }} />
          <div style={{ flex:1, paddingLeft:16 }}>
            <p style={{ fontSize:10, color:"#FF9800", marginBottom:6 }}>不向きな人</p>
            <p style={{ fontSize:13, color:"#CCC", lineHeight:1.65 }}>⚠️ {result.notForUser}</p>
          </div>
        </div>
      </div>

      {timing && result.timing && (
        <div style={{ background:"#12121A", border:`1px solid ${timing.color}40`, borderRadius:16, padding:"18px 20px" }}>
          <p style={{ fontSize:10, color:"#FFC107", marginBottom:8 }}>買い時タイミング</p>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <span style={{ fontSize:22 }}>{timing.icon}</span>
            <span style={{ fontSize:18, fontWeight:700, color:timing.color }}>{timing.label}</span>
          </div>
          <p style={{ fontSize:13, color:"#CCC", lineHeight:1.7, marginBottom:12 }}>{result.timing.reason}</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <div style={{ background:"#0A0A0F", borderRadius:10, padding:"12px 14px" }}>
              <p style={{ fontSize:10, color:"#555", marginBottom:4 }}>おすすめセール</p>
              <p style={{ fontSize:13, color:"#E8E8F0", fontWeight:600 }}>🗓 {result.timing.bestSalePeriod}</p>
            </div>
            <div style={{ background:"#0A0A0F", borderRadius:10, padding:"12px 14px" }}>
              <p style={{ fontSize:10, color:"#555", marginBottom:4 }}>期待値引き率</p>
              <p style={{ fontSize:13, color:"#FFC107", fontWeight:600 }}>💰 {result.timing.estimatedDiscount}</p>
            </div>
          </div>
        </div>
      )}

      <KeepaChart url={url} />
      <YouTubeSection productName={productName} category={result.category || ""} />

      {url && extractAsin(url) && (
        <a href={getAmazonUrl(extractAsin(url))} target="_blank" rel="noopener noreferrer"
          style={{ display:"block", textAlign:"center", background:"linear-gradient(135deg,#FF9900,#FF6600)", borderRadius:12, color:"#fff", fontWeight:700, fontSize:16, padding:16, textDecoration:"none" }}>
          🛒 Amazonで見る
        </a>
      )}

      <button onClick={onReset} style={{ background:"#1A1A28", border:"1px solid #2A2A40", borderRadius:10, color:"#777", fontSize:13, padding:12, cursor:"pointer" }}>
        ← 別の商品を調べる
      </button>
    </div>
  );
}

function AnalyzePage({ onBack, initialProductName }) {
  const [url, setUrl] = useState("");
  const [productName, setProductName] = useState(initialProductName || "");
  const [step, setStep] = useState("input");
  const [questions, setQuestions] = useState([]);
  const [category, setCategory] = useState("");
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyzeAlternative = (name) => {
    setProductName(name);
    setUrl("");
    setStep("input");
    setResult(null);
    setQuestions([]);
    setAnswers({});
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fetchQuestions = async () => {
    if (!productName.trim() && !url.trim()) { setError("URLまたは商品名を入力してください"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, productName }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setQuestions(data.questions || []);
      setCategory(data.category || "");
      setStep("questions");
    } catch (e) {
      setError("AIが混み合っています。しばらく待ってから「再試行」を押してください。");
    } finally {
      setLoading(false);
    }
  };

　　const analyze = async () => {
    setLoading(true); setError("");
    const answerText = questions.map(q => q.text + ": " + (answers[q.id] || "回答なし")).join("\n");

    // KeepaデータをローカルStorageから取得（KeepaChartが保存している場合）
    const keepaData = window.__keepaData || null;

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, productName, answers: answerText, category, keepaData }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setStep("result");
    } catch (e) {
      setError("AIが混み合っています。しばらく待ってから「再試行」を押してください。");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("input"); setResult(null); setQuestions([]);
    setAnswers({}); setUrl(""); setProductName(""); setError("");
  };

  const steps = ["入力", "質問", "結果"];
  const stepIndex = step === "input" ? 0 : step === "questions" ? 1 : 2;

  return (
    <main style={{ minHeight:"100vh", background:"#0A0A0F", color:"#E8E8F0", fontFamily:"sans-serif", padding:"24px 20px" }}>
      <div style={{ maxWidth:640, margin:"0 auto" }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:"#555", fontSize:13, cursor:"pointer", marginBottom:24, padding:0 }}>← トップに戻る</button>

        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:24 }}>
          {steps.map((s, i) => (
            <div key={s} style={{ display:"flex", alignItems:"center", gap:8, flex: i < steps.length - 1 ? 1 : "none" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:24, height:24, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700,
                  background: i <= stepIndex ? "#FF3366" : "#1A1A28",
                  color: i <= stepIndex ? "#fff" : "#444",
                  border: i <= stepIndex ? "none" : "1px solid #333" }}>
                  {i + 1}
                </div>
                <span style={{ fontSize:12, color: i <= stepIndex ? "#E8E8F0" : "#444" }}>{s}</span>
              </div>
              {i < steps.length - 1 && <div style={{ flex:1, height:1, background: i < stepIndex ? "#FF3366" : "#222" }} />}
            </div>
          ))}
        </div>

        <p style={{ fontSize:11, color:"#FF3366", marginBottom:8 }}>🔍 TYPE A — AI購買コンシェルジュ</p>
        <h2 style={{ fontSize:24, fontWeight:900, marginBottom:24 }}>この商品、買っていい？</h2>

        {step === "input" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ background:"#12121A", border:"1px solid #222230", borderRadius:16, padding:"14px 16px" }}>
              <p style={{ fontSize:10, color:"#FF3366", marginBottom:6 }}>AMAZON URL</p>
              <input type="text" placeholder="https://www.amazon.co.jp/dp/..." value={url} onChange={e => setUrl(e.target.value)} style={{ background:"transparent", border:"none", outline:"none", color:"#E8E8F0", width:"100%", fontSize:14 }} />
            </div>
            <div style={{ background:"#12121A", border:"1px solid #222230", borderRadius:16, padding:"14px 16px" }}>
              <p style={{ fontSize:10, color:"#888", marginBottom:6 }}>商品名</p>
              <input type="text" placeholder="例：Anker PowerCore 10000" value={productName} onChange={e => setProductName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchQuestions()}
                style={{ background:"transparent", border:"none", outline:"none", color:"#E8E8F0", width:"100%", fontSize:14 }} />
            </div>
            {error && (
  <div style={{ background:"#1A0A0A", border:"1px solid #F4433640", borderRadius:10, padding:"12px 16px" }}>
    <p style={{ color:"#F44336", fontSize:13, marginBottom:8 }}>{error}</p>
    <button onClick={fetchQuestions} disabled={loading}
      style={{ background:"#F44336", border:"none", borderRadius:8, color:"#fff", fontSize:12, fontWeight:700, padding:"8px 16px", cursor:"pointer" }}>
      再試行する
    </button>
  </div>
)}
            <button onClick={fetchQuestions} disabled={loading || (!productName.trim() && !url.trim())}
              style={{ background:"linear-gradient(135deg,#FF6B35,#FF3366)", border:"none", borderRadius:12, color:"#fff", fontWeight:700, fontSize:16, padding:16, cursor:"pointer", opacity: loading || (!productName.trim() && !url.trim()) ? 0.5 : 1 }}>
              {loading ? "🤖 カテゴリ判定中..." : "次へ →"}
            </button>
          </div>
        )}

        {step === "questions" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ background:"#12121A", border:"1px solid #4CAF5030", borderRadius:12, padding:"12px 16px" }}>
              <p style={{ fontSize:11, color:"#4CAF50" }}>カテゴリ：{category}</p>
            </div>
            <p style={{ fontSize:13, color:"#666", lineHeight:1.7 }}>より正確な提案のために、いくつか教えてください。</p>
            {questions.map((q, i) => (
              <div key={q.id} style={{ background:"#12121A", border:"1px solid #222230", borderRadius:16, padding:"16px" }}>
                <p style={{ fontSize:14, fontWeight:600, color:"#E8E8F0", marginBottom:12 }}>Q{i + 1}. {q.text}</p>
                {q.type === "select" ? (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {q.options?.map(opt => (
                      <button key={opt} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                        style={{ padding:"8px 16px", borderRadius:20, fontSize:13, cursor:"pointer",
                          border: answers[q.id] === opt ? "1px solid #FF3366" : "1px solid #333",
                          background: answers[q.id] === opt ? "#FF336620" : "#0A0A0F",
                          color: answers[q.id] === opt ? "#FF3366" : "#888" }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <textarea placeholder="自由に入力してください（スキップ可）" value={answers[q.id] || ""} onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))} rows={3}
                    style={{ background:"#0A0A0F", border:"1px solid #333", borderRadius:10, padding:"10px 12px", color:"#E8E8F0", width:"100%", fontSize:13, lineHeight:1.7, resize:"none", outline:"none" }} />
                )}
              </div>
            ))}
            {error && (
  <div style={{ background:"#1A0A0A", border:"1px solid #F4433640", borderRadius:10, padding:"12px 16px" }}>
    <p style={{ color:"#F44336", fontSize:13, marginBottom:8 }}>{error}</p>
    <button onClick={fetchQuestions} disabled={loading}
      style={{ background:"#F44336", border:"none", borderRadius:8, color:"#fff", fontSize:12, fontWeight:700, padding:"8px 16px", cursor:"pointer" }}>
      再試行する
    </button>
  </div>
)}
            <button onClick={analyze} disabled={loading}
              style={{ background:"linear-gradient(135deg,#FF6B35,#FF3366)", border:"none", borderRadius:12, color:"#fff", fontWeight:700, fontSize:16, padding:16, cursor:"pointer", opacity: loading ? 0.5 : 1 }}>
              {loading ? "🤖 AI分析中..." : "AIに判定してもらう →"}
            </button>
            {loading && <p style={{ textAlign:"center", color:"#444", fontSize:12 }}>類似品と比較しています。少々お待ちください...</p>}
            <button onClick={() => setStep("input")} style={{ background:"none", border:"none", color:"#555", fontSize:13, cursor:"pointer", padding:0 }}>← 商品を変更する</button>
          </div>
        )}

        {step === "result" && result && (
          <ResultView result={result} url={url} productName={productName} onReset={reset} onAnalyzeAlternative={handleAnalyzeAlternative} />
        )}
      </div>
    </main>
  );
}

function CategoryPage({ onBack, onAnalyze }) {
  const [step, setStep] = useState("category");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchQuestions = async (cat) => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName: cat.label }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setQuestions(data.questions || []);
      setStep("questions");
    } catch (e) {
      setError("質問の生成に失敗しました: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    setLoading(true); setError("");
    const answerText = questions.map(q => q.text + ": " + (answers[q.id] || "回答なし")).join("\n");
    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: selectedCategory.label, answers: answerText }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setStep("result");
    } catch (e) {
      setError("AIが混み合っています。しばらく待ってから「再試行」を押してください。");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("category"); setSelectedCategory(null);
    setQuestions([]); setAnswers({}); setResult(null); setError("");
  };

  const steps = ["カテゴリ", "質問", "提案"];
  const stepIndex = step === "category" ? 0 : step === "questions" ? 1 : 2;

  return (
    <main style={{ minHeight:"100vh", background:"#0A0A0F", color:"#E8E8F0", fontFamily:"sans-serif", padding:"24px 20px" }}>
      <div style={{ maxWidth:640, margin:"0 auto" }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:"#555", fontSize:13, cursor:"pointer", marginBottom:24, padding:0 }}>← トップに戻る</button>

        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:24 }}>
          {steps.map((s, i) => (
            <div key={s} style={{ display:"flex", alignItems:"center", gap:8, flex: i < steps.length - 1 ? 1 : "none" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:24, height:24, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700,
                  background: i <= stepIndex ? "#4CAF50" : "#1A1A28",
                  color: i <= stepIndex ? "#fff" : "#444",
                  border: i <= stepIndex ? "none" : "1px solid #333" }}>
                  {i + 1}
                </div>
                <span style={{ fontSize:12, color: i <= stepIndex ? "#E8E8F0" : "#444" }}>{s}</span>
              </div>
              {i < steps.length - 1 && <div style={{ flex:1, height:1, background: i < stepIndex ? "#4CAF50" : "#222" }} />}
            </div>
          ))}
        </div>

        <p style={{ fontSize:11, color:"#4CAF50", marginBottom:8 }}>🛍 TYPE B — AIコンシェルジュ</p>
        <h2 style={{ fontSize:24, fontWeight:900, marginBottom:24 }}>何を買えばいいかわからない</h2>

        {step === "category" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <p style={{ fontSize:13, color:"#666", lineHeight:1.7 }}>まず大カテゴリを選んでください。</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat)}
                  style={{ background: selectedCategory?.id === cat.id ? "#4CAF5020" : "#12121A",
                    border: selectedCategory?.id === cat.id ? "1px solid #4CAF50" : "1px solid #222230",
                    borderRadius:12, padding:"14px 16px", cursor:"pointer", textAlign:"left",
                    color: selectedCategory?.id === cat.id ? "#4CAF50" : "#E8E8F0", fontSize:13, fontWeight:500 }}>
                  {cat.label}
                </button>
              ))}
            </div>
            {selectedCategory && (
              <>
                <p style={{ fontSize:13, color:"#666", lineHeight:1.7, marginTop:8 }}>次にサブカテゴリを選んでください。</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {selectedCategory.subs.map(sub => (
                    <button key={sub} onClick={() => fetchQuestions({ label: sub })}
                      style={{ padding:"8px 16px", borderRadius:20, fontSize:13, cursor:"pointer",
                        border:"1px solid #333", background:"#0A0A0F", color:"#AAA", transition:"all .15s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor="#4CAF50"; e.currentTarget.style.color="#4CAF50"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor="#333"; e.currentTarget.style.color="#AAA"; }}>
                      {sub}
                    </button>
                  ))}
                </div>
              </>
            )}
            {loading && <p style={{ textAlign:"center", color:"#444", fontSize:12 }}>質問を準備中...</p>}
            {error && (
  <div style={{ background:"#1A0A0A", border:"1px solid #F4433640", borderRadius:10, padding:"12px 16px" }}>
    <p style={{ color:"#F44336", fontSize:13, marginBottom:8 }}>{error}</p>
    <button onClick={fetchQuestions} disabled={loading}
      style={{ background:"#F44336", border:"none", borderRadius:8, color:"#fff", fontSize:12, fontWeight:700, padding:"8px 16px", cursor:"pointer" }}>
      再試行する
    </button>
  </div>
)}
          </div>
        )}

        {step === "questions" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ background:"#12121A", border:"1px solid #4CAF5030", borderRadius:12, padding:"12px 16px" }}>
              <p style={{ fontSize:11, color:"#4CAF50" }}>カテゴリ：{selectedCategory?.label}</p>
            </div>
            <p style={{ fontSize:13, color:"#666", lineHeight:1.7 }}>条件を教えてください。AIが最適な商品を提案します。</p>
            {questions.map((q, i) => (
              <div key={q.id} style={{ background:"#12121A", border:"1px solid #222230", borderRadius:16, padding:"16px" }}>
                <p style={{ fontSize:14, fontWeight:600, color:"#E8E8F0", marginBottom:12 }}>Q{i + 1}. {q.text}</p>
                {q.type === "select" ? (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {q.options?.map(opt => (
                      <button key={opt} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                        style={{ padding:"8px 16px", borderRadius:20, fontSize:13, cursor:"pointer",
                          border: answers[q.id] === opt ? "1px solid #4CAF50" : "1px solid #333",
                          background: answers[q.id] === opt ? "#4CAF5020" : "#0A0A0F",
                          color: answers[q.id] === opt ? "#4CAF50" : "#888" }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <textarea placeholder="自由に入力してください（スキップ可）" value={answers[q.id] || ""} onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))} rows={3}
                    style={{ background:"#0A0A0F", border:"1px solid #333", borderRadius:10, padding:"10px 12px", color:"#E8E8F0", width:"100%", fontSize:13, lineHeight:1.7, resize:"none", outline:"none" }} />
                )}
              </div>
            ))}
            {error && (
  <div style={{ background:"#1A0A0A", border:"1px solid #F4433640", borderRadius:10, padding:"12px 16px" }}>
    <p style={{ color:"#F44336", fontSize:13, marginBottom:8 }}>{error}</p>
    <button onClick={fetchQuestions} disabled={loading}
      style={{ background:"#F44336", border:"none", borderRadius:8, color:"#fff", fontSize:12, fontWeight:700, padding:"8px 16px", cursor:"pointer" }}>
      再試行する
    </button>
  </div>
)}
            <button onClick={fetchRecommendations} disabled={loading}
              style={{ background:"linear-gradient(135deg,#00C896,#4CAF50)", border:"none", borderRadius:12, color:"#fff", fontWeight:700, fontSize:16, padding:16, cursor:"pointer", opacity: loading ? 0.5 : 1 }}>
              {loading ? "🤖 おすすめを探しています..." : "AIにおすすめを聞く →"}
            </button>
            {loading && <p style={{ textAlign:"center", color:"#444", fontSize:12 }}>最適な商品を選んでいます。少々お待ちください...</p>}
            <button onClick={() => setStep("category")} style={{ background:"none", border:"none", color:"#555", fontSize:13, cursor:"pointer", padding:0 }}>← カテゴリを選び直す</button>
          </div>
        )}

        {step === "result" && result && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ background:"#12121A", border:"1px solid #4CAF5030", borderRadius:16, padding:"16px 20px" }}>
              <p style={{ fontSize:11, color:"#4CAF50", marginBottom:4 }}>AIコンシェルジュより</p>
              <p style={{ fontSize:14, color:"#CCC", lineHeight:1.7 }}>{result.message}</p>
            </div>
            {result.products?.map((p, i) => {
              const tagColor = tagColors[p.tag] || "#888";
              return (
                <div key={i} style={{ background:"#12121A", border:"1px solid #222230", borderRadius:16, padding:"18px 20px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:20, fontWeight:900, color:"#4CAF50", fontFamily:"monospace" }}>#{p.rank}</span>
                      <p style={{ fontSize:15, fontWeight:700, color:"#E8E8F0" }}>{p.name}</p>
                    </div>
                    <span style={{ fontSize:11, color:tagColor, background:tagColor+"20", padding:"2px 10px", borderRadius:20, whiteSpace:"nowrap", marginLeft:8 }}>{p.tag}</span>
                  </div>
                  <p style={{ fontSize:12, color:"#888", marginBottom:8 }}>📦 {p.priceRange} ／ ⭐ {p.rating}</p>
                  <p style={{ fontSize:13, color:"#CCC", lineHeight:1.6, marginBottom:6 }}>{p.reason}</p>
                  <p style={{ fontSize:11, color:"#555", marginBottom:12 }}>👤 {p.bestFor}</p>
                  <div style={{ display:"flex", gap:8 }}>
                    <a href={getAmazonSearchUrl(p.name)} target="_blank" rel="noopener noreferrer"
                      style={{ flex:1, display:"block", textAlign:"center", background:"linear-gradient(135deg,#FF9900,#FF6600)", borderRadius:8, color:"#fff", fontWeight:700, fontSize:12, padding:"8px 12px", textDecoration:"none" }}>
                      🛒 Amazonで検索
                    </a>
                    <button onClick={() => onAnalyze(p.name)}
                      style={{ flex:1, background:"#1A1A28", border:"1px solid #FF336640", borderRadius:8, color:"#FF3366", fontSize:12, fontWeight:700, padding:"8px 12px", cursor:"pointer" }}>
                      🔍 この商品を判定
                    </button>
                  </div>
                </div>
              );
            })}
            <button onClick={reset} style={{ background:"#1A1A28", border:"1px solid #2A2A40", borderRadius:10, color:"#777", fontSize:13, padding:12, cursor:"pointer" }}>
              ← 最初からやり直す
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function Home() {
  const [page, setPage] = useState("top");
  const [analyzeTarget, setAnalyzeTarget] = useState("");

  const goToAnalyze = (name) => {
    setAnalyzeTarget(name);
    setPage("analyze");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {page === "top"      && <TopPage onSelectUrl={() => { setAnalyzeTarget(""); setPage("analyze"); }} onSelectCategory={() => setPage("category")} />}
      {page === "analyze"  && <AnalyzePage onBack={() => setPage("top")} initialProductName={analyzeTarget} />}
      {page === "category" && <CategoryPage onBack={() => setPage("top")} onAnalyze={goToAnalyze} />}
    </>
  );
}
