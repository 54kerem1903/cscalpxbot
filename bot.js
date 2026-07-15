const crypto = require('crypto');
const fs = require('fs');

function clean(v) {
  if (!v) return '';
  return String(v).replace(/[\r\n\t]/g, '').replace(/^[\s"']+|[\s"']+$/g, '').trim();
}

// ====================== AYARLAR ======================
const TG_TOKEN = clean(process.env.TG_TOKEN);
const TG_CHAT_ID = clean(process.env.TG_CHAT_ID);

const CONFIG = {
  minConfidence: 75,
  scalpTF: '5m',
  scanInterval: 300000,
  dedupeMinutes: 45,
  scanMaxDetailed: 70,
};

const TRADE = {
  live: clean(process.env.LIVE_TRADING) === 'true',
  riskPerTrade: 2,
};

// ====================== İNDİKATÖRLER ======================
function emaSeries(vals, p) {
  const out = [];
  const k = 2 / (p + 1);
  let e = vals[0];
  for (let i = 0; i < vals.length; i++) {
    e = i ? vals[i] * k + e * (1 - k) : vals[0];
    out.push(e);
  }
  return out;
}

function calcATR(bars, period = 14) {
  if (bars.length < period + 1) return null;
  let trSum = 0;
  for (let i = 1; i <= period; i++) {
    const tr = Math.max(
      bars[i].h - bars[i].l,
      Math.abs(bars[i].h - bars[i - 1].c),
      Math.abs(bars[i].l - bars[i - 1].c)
    );
    trSum += tr;
  }
  let atr = trSum / period;
  for (let i = period + 1; i < bars.length; i++) {
    const tr = Math.max(
      bars[i].h - bars[i].l,
      Math.abs(bars[i].h - bars[i - 1].c),
      Math.abs(bars[i].l - bars[i - 1].c)
    );
    atr = (atr * (period - 1) + tr) / period;
  }
  return atr;
}

function supertrend(bars, period = 10, multiplier = 3) {
  if (bars.length < 40) return null;
  const atr = calcATR(bars, period);
  if (!atr) return null;

  let upperBand = bars[period].h + multiplier * atr;
  let lowerBand = bars[period].l - multiplier * atr;
  let trend = 1;

  for (let i = period + 1; i < bars.length; i++) {
    const hl2 = (bars[i].h + bars[i].l) / 2;
    upperBand = Math.min(upperBand, hl2 + multiplier * atr);
    lowerBand = Math.max(lowerBand, hl2 - multiplier * atr);

    if (bars[i].c > upperBand) trend = 1;
    else if (bars[i].c < lowerBand) trend = -1;
  }
  return { trend, upper: upperBand, lower: lowerBand };
}

function macd(bars) {
  const closes = bars.map(b => b.c);
  const ema12 = emaSeries(closes, 12);
  const ema26 = emaSeries(closes, 26);
  const macdLine = ema12[ema12.length - 1] - ema26[ema26.length - 1];
  return { histogram: macdLine };
}

// ====================== ANA SİNYAL ======================
function calcScalpSignal(bars, price) {
  if (bars.length < 50) return null;

  const st = supertrend(bars);
  const mc = macd(bars);
  let confidence = 50;
  let signals = [];

  if (st) {
    if (st.trend === 1) { confidence += 25; signals.push("Supertrend YUKARI"); }
    if (st.trend === -1) { confidence -= 22; signals.push("Supertrend AŞAĞI"); }
  }
  if (mc.histogram > 0) confidence += 15;

  const dir = confidence > 72 ? 'LONG' : confidence < 48 ? 'SHORT' : 'NEUTRAL';

  return { dir, confidence: Math.min(95, Math.max(35, confidence)), signals };
}

// ====================== TELEGRAM ======================
async function sendTelegram(text) {
  try {
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'HTML' })
    });
  } catch (e) {
    console.error('Telegram hatası:', e.message);
  }
}

// ====================== BAŞLAT ======================
async function start() {
  console.log('🚀 Bot Başlatıldı - Vadeli + Spot Aktif');

  await sendTelegram('✅ <b>Bot Yeniden Başlatıldı!</b>\nVadeli ve Spot sinyalleri aktif.');

  // Tarama döngüleri buraya eklenecek
  setInterval(() => console.log("Tarama çalışıyor..."), 300000);
}

start();