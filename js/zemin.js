// ============================================================
// DOSYA: js/zemin.js
// Zemin: duz yesil yerine, BIR KEZ onceden cizilen dokulu cimen (gurultu ile acik/koyu bolgeler, ot tutamlari,
// cicekler, ufak taslar, toprak lekeleri). Dosya/gorsel gerekmez; tohum sabit oldugu icin her acilista ayni gorunur.
// ============================================================

const ZEMIN_OLCEK = 2;              // onbellek cozunurlugu (dunya pikseli basina)
const ZEMIN_RENK = "#7fb069";       // zemin hazirlanamazsa (test ortami) duz renk
let zeminKanvas = null, zeminDenendi = false;
let ZEMIN_TUR = "gercek";          // "gercek" (dogal cimen) | "karo" (AoE tarzi baklava karolar) | "cayir" (sade boyama cayir) | "doku" (benekli dokulu)

function zeminRastgele(tohum) {     // kucuk, tohumlu rastgele sayi uretici (mulberry32)
  let a = tohum >>> 0;
  return function () { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Deger gurultusu (value noise): ızgara noktalarina rastgele deger, aralarda yumusak gecis.
function zeminGurultu(rnd, hucre, gen, yuk) {
  const gx = Math.ceil(gen / hucre) + 2, gy = Math.ceil(yuk / hucre) + 2, v = new Float32Array(gx * gy);
  for (let i = 0; i < v.length; i++) v[i] = rnd();
  return function (x, y) {
    const fx = x / hucre, fy = y / hucre, ix = Math.floor(fx), iy = Math.floor(fy);
    let tx = fx - ix, ty = fy - iy;
    tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
    const a = v[iy * gx + ix], b = v[iy * gx + ix + 1], c = v[(iy + 1) * gx + ix], d = v[(iy + 1) * gx + ix + 1];
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
  };
}

function zeminDoku() {
  if (typeof document === "undefined" || typeof document.createElement !== "function") return null;
  let kv;
  try { kv = document.createElement("canvas"); kv.width = DUNYA_GEN * ZEMIN_OLCEK; kv.height = DUNYA_YUK * ZEMIN_OLCEK; } catch (e) { return null; }
  const g = kv.getContext("2d");
  if (!g || typeof g.createImageData !== "function") return null;
  const W = kv.width, H = kv.height, S = ZEMIN_OLCEK, rnd = zeminRastgele(20241109);

  // 1) Taban: uc katmanli gurultu ile acik/koyu cimen bolgeleri + ince benek
  const buyuk = zeminGurultu(rnd, 260 * S, W, H), orta = zeminGurultu(rnd, 90 * S, W, H), kucuk = zeminGurultu(rnd, 22 * S, W, H);
  const img = g.createImageData(W, H), d = img.data;
  const koyu = [92, 145, 80], taban = [122, 173, 98], acik = [150, 196, 108];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let t = buyuk(x, y) * 0.55 + orta(x, y) * 0.3 + kucuk(x, y) * 0.15;       // 0..1
    t = (t - 0.5) * 1.5 + 0.5;
    const a = t < 0.5 ? koyu : taban, b = t < 0.5 ? taban : acik, k = t < 0.5 ? t * 2 : (t - 0.5) * 2, kk = Math.max(0, Math.min(1, k));
    const ben = (rnd() - 0.5) * 7, i = (y * W + x) * 4;
    d[i] = a[0] + (b[0] - a[0]) * kk + ben; d[i + 1] = a[1] + (b[1] - a[1]) * kk + ben; d[i + 2] = a[2] + (b[2] - a[2]) * kk + ben * 0.6; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  g.scale(S, S);                                                              // buradan sonrasi dunya koordinati

  const merkezdenUzak = (x, y, r) => Math.hypot(x - DUNYA_GEN / 2, y - DUNYA_YUK / 2) > r;

  // 2) Toprak lekeleri (cok hafif, yumusak kenarli)
  for (let i = 0; i < 7; i++) {
    const x = 60 + rnd() * (DUNYA_GEN - 120), y = 60 + rnd() * (DUNYA_YUK - 120), r = 40 + rnd() * 55;
    if (!merkezdenUzak(x, y, 130)) continue;
    g.save(); g.translate(x, y); g.scale(1, 0.55);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, r);
    gr.addColorStop(0, "rgba(150,118,72,0.55)"); gr.addColorStop(0.6, "rgba(150,118,72,0.28)"); gr.addColorStop(1, "rgba(150,118,72,0)");
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill(); g.restore();
  }

  // 3) Ot tutamlari: kucuk egik cizgiler (koyu ve acik)
  g.lineCap = "round";
  for (let i = 0; i < 4200; i++) {
    const x = rnd() * DUNYA_GEN, y = rnd() * DUNYA_YUK, h = 3 + rnd() * 4, e = (rnd() - 0.5) * 3, acikMi = rnd() < 0.45;
    g.strokeStyle = acikMi ? "rgba(185,220,120,0.55)" : "rgba(60,110,55,0.5)";
    g.lineWidth = 0.9;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + e, y - h); g.moveTo(x + 1.6, y); g.lineTo(x + 1.6 + e * 0.6, y - h * 0.8); g.stroke();
  }

  // 4) Cicek kumeleri
  const renkler = ["#ffffff", "#fff176", "#f48fb1", "#ce93d8", "#ffcc80"];
  for (let k = 0; k < 38; k++) {
    const cx = 40 + rnd() * (DUNYA_GEN - 80), cy = 40 + rnd() * (DUNYA_YUK - 80);
    if (!merkezdenUzak(cx, cy, 80)) continue;
    const renk = renkler[Math.floor(rnd() * renkler.length)], n = 4 + Math.floor(rnd() * 7);
    for (let i = 0; i < n; i++) {
      const x = cx + (rnd() - 0.5) * 34, y = cy + (rnd() - 0.5) * 22;
      g.strokeStyle = "rgba(50,100,45,0.8)"; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 3.5); g.stroke();
      g.fillStyle = renk; g.beginPath(); g.arc(x, y, 1.5, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#f9a825"; g.beginPath(); g.arc(x, y, 0.6, 0, Math.PI * 2); g.fill();
    }
  }

  // 5) Ufak taslar (golgeli)
  for (let i = 0; i < 46; i++) {
    const x = rnd() * DUNYA_GEN, y = rnd() * DUNYA_YUK, r = 1.6 + rnd() * 2.4;
    if (!merkezdenUzak(x, y, 70)) continue;
    g.fillStyle = "rgba(0,0,0,0.18)"; g.beginPath(); g.ellipse(x + 0.8, y + r * 0.6, r * 1.1, r * 0.55, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = rnd() < 0.5 ? "#9e9e9e" : "#b0aaa0"; g.beginPath(); g.ellipse(x, y, r, r * 0.75, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgba(255,255,255,0.35)"; g.beginPath(); g.ellipse(x - r * 0.25, y - r * 0.3, r * 0.45, r * 0.25, 0, 0, Math.PI * 2); g.fill();
  }

  // 6) Kenarlara hafif karartma (derinlik hissi)
  const vg = g.createRadialGradient(DUNYA_GEN / 2, DUNYA_YUK / 2, DUNYA_YUK * 0.45, DUNYA_GEN / 2, DUNYA_YUK / 2, DUNYA_GEN * 0.62);
  vg.addColorStop(0, "rgba(0,30,0,0)"); vg.addColorStop(1, "rgba(0,30,0,0.22)");
  g.fillStyle = vg; g.fillRect(0, 0, DUNYA_GEN, DUNYA_YUK);
  return kv;
}


function zeminKanvasAc() {
  if (typeof document === "undefined" || typeof document.createElement !== "function") return null;
  try { const kv = document.createElement("canvas"); kv.width = DUNYA_GEN * ZEMIN_OLCEK; kv.height = DUNYA_YUK * ZEMIN_OLCEK; const g = kv.getContext("2d"); if (!g) return null; g.scale(ZEMIN_OLCEK, ZEMIN_OLCEK); return { kv, g }; } catch (e) { return null; }
}
function zeminOtTutam(g, x, y, boy, rnd, koyu, acik) {      // yelpaze gibi acilan ot yapraklari
  const n = 5 + Math.floor(rnd() * 3);
  g.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.32 + (rnd() - 0.5) * 0.15, b = boy * (0.7 + rnd() * 0.5);
    g.strokeStyle = i % 2 ? koyu : acik; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * b * 0.5, y + Math.sin(a) * b * 0.6, x + Math.cos(a) * b, y + Math.sin(a) * b); g.stroke();
  }
}
function zeminCicek(g, x, y, rnd) {
  const renk = ["#ffffff", "#fff176", "#f48fb1", "#ce93d8"][Math.floor(rnd() * 4)];
  g.strokeStyle = "#3f7d3a"; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 5); g.stroke();
  g.fillStyle = renk; for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; g.beginPath(); g.arc(x + Math.cos(a) * 1.6, y - 5 + Math.sin(a) * 1.6, 1.3, 0, 7); g.fill(); }
  g.fillStyle = "#f9a825"; g.beginPath(); g.arc(x, y - 5, 1, 0, 7); g.fill();
}

// AoE tarzi: 64x32'lik baklava (izometrik) karolar; her karo hafif farkli yesil, aralarda cok ince cizgi, yer yer toprak karo, ot tutami ve cicek.
function zeminKaro() {
  const a = zeminKanvasAc(); if (!a) return null;
  const g = a.g, rnd = zeminRastgele(777), TW = 64, TH = 32, gur = zeminGurultu(rnd, 7, 80, 80), gur2 = zeminGurultu(rnd, 3, 80, 80);
  const merkezUzak = (x, y, r) => Math.hypot(x - DUNYA_GEN / 2, y - DUNYA_YUK / 2) > r;
  g.fillStyle = "#6fa656"; g.fillRect(0, 0, DUNYA_GEN, DUNYA_YUK);
  const kar = [];
  for (let r = -1; r < DUNYA_YUK / (TH / 2) + 2; r++) for (let c = -1; c < DUNYA_GEN / TW + 2; c++) {
    const cx = c * TW + (r & 1 ? TW / 2 : 0), cy = r * TH / 2, n = gur(c + 20, r + 20) * 0.6 + gur2(c + 20, r + 20) * 0.4;
    const toprak = n > 0.74 && merkezUzak(cx, cy, 120) && cx > 30 && cx < DUNYA_GEN - 30 && cy > 30 && cy < DUNYA_YUK - 30;
    const l = 40 + (n - 0.5) * 12 + (rnd() - 0.5) * 3.5;
    g.fillStyle = toprak ? "hsl(33,32%," + (46 + (rnd() - 0.5) * 5) + "%)" : "hsl(" + (100 + (n - 0.5) * 16) + ",38%," + l + "%)";
    g.beginPath(); g.moveTo(cx, cy - TH / 2); g.lineTo(cx + TW / 2, cy); g.lineTo(cx, cy + TH / 2); g.lineTo(cx - TW / 2, cy); g.closePath(); g.fill();
    g.strokeStyle = toprak ? "rgba(70,45,20,0.10)" : "rgba(20,60,20,0.10)"; g.lineWidth = 0.6; g.stroke();
    kar.push({ cx, cy, toprak });
  }
  for (const t of kar) {                                                        // karo uzerindeki detaylar
    if (t.toprak) { if (rnd() < 0.3) { g.fillStyle = "rgba(90,65,35,0.5)"; g.beginPath(); g.ellipse(t.cx + (rnd() - 0.5) * 30, t.cy + (rnd() - 0.5) * 10, 3, 1.5, 0, 0, 7); g.fill(); } continue; }
    if (rnd() < 0.26) zeminOtTutam(g, t.cx + (rnd() - 0.5) * 34, t.cy + (rnd() - 0.3) * 12, 5 + rnd() * 3, rnd, "rgba(50,105,48,0.9)", "rgba(150,200,95,0.9)");
    if (rnd() < 0.035 && merkezUzak(t.cx, t.cy, 80)) zeminCicek(g, t.cx + (rnd() - 0.5) * 24, t.cy + 2, rnd);
  }
  const vg = g.createRadialGradient(DUNYA_GEN / 2, DUNYA_YUK / 2, DUNYA_YUK * 0.5, DUNYA_GEN / 2, DUNYA_YUK / 2, DUNYA_GEN * 0.62);
  vg.addColorStop(0, "rgba(0,30,0,0)"); vg.addColorStop(1, "rgba(0,30,0,0.18)");
  g.fillStyle = vg; g.fillRect(0, 0, DUNYA_GEN, DUNYA_YUK);
  return a.kv;
}

// Sade boyama cayir: duz, temiz yesil + yumusak buyuk lekeler + belirli yerlerde koyu ot kumeleri (benek yok).
function zeminCayir() {
  const a = zeminKanvasAc(); if (!a) return null;
  const g = a.g, rnd = zeminRastgele(4242), merkezUzak = (x, y, r) => Math.hypot(x - DUNYA_GEN / 2, y - DUNYA_YUK / 2) > r;
  g.fillStyle = "#8cc063"; g.fillRect(0, 0, DUNYA_GEN, DUNYA_YUK);
  for (let i = 0; i < 70; i++) {                                                // yumusak acik/koyu lekeler
    const x = rnd() * DUNYA_GEN, y = rnd() * DUNYA_YUK, r = 60 + rnd() * 120, acik = rnd() < 0.5;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, acik ? "rgba(190,230,120,0.30)" : "rgba(60,130,70,0.22)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let k = 0; k < 150; k++) {                                               // koyu ot kumeleri (yan yana 3-5 tutam)
    const cx = rnd() * DUNYA_GEN, cy = rnd() * DUNYA_YUK;
    if (!merkezUzak(cx, cy, 90)) continue;
    g.fillStyle = "rgba(0,40,0,0.10)"; g.beginPath(); g.ellipse(cx, cy + 1, 13, 4, 0, 0, 7); g.fill();
    const n = 3 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) zeminOtTutam(g, cx + (i - n / 2) * 6 + rnd() * 3, cy + (rnd() - 0.5) * 4, 7 + rnd() * 4, rnd, "rgba(60,125,60,0.95)", "rgba(170,215,100,0.95)");
  }
  for (let k = 0; k < 26; k++) {                                                // cicek demetleri
    const cx = 40 + rnd() * (DUNYA_GEN - 80), cy = 40 + rnd() * (DUNYA_YUK - 80);
    if (!merkezUzak(cx, cy, 80)) continue;
    for (let i = 0; i < 3 + Math.floor(rnd() * 3); i++) zeminCicek(g, cx + (rnd() - 0.5) * 28, cy + (rnd() - 0.5) * 14, rnd);
  }
  return a.kv;
}


// GERCEKCI: sonuk dogal cimen tonlari, kokleri dikey uzayan ince ot dokusu, dogal kenarli toprak, kuru ot, taslar. Cizgi film unsuru yok.
function zeminGercek() {
  const a = zeminKanvasAc(); if (!a) return null;
  const kv = a.kv, g = a.g, S = ZEMIN_OLCEK, rnd = zeminRastgele(90210);
  let kucuk, kg;                                                                  // yumusak alanlar YARIM cozunurlukte hesaplanir (hiz icin), sonra buyutulur
  try { kucuk = document.createElement("canvas"); kucuk.width = DUNYA_GEN / 2; kucuk.height = DUNYA_YUK / 2; kg = kucuk.getContext("2d"); } catch (e) { return null; }
  if (!kg || typeof kg.createImageData !== "function") return null;
  const w = kucuk.width, h = kucuk.height;                                         // 1 piksel = 2 dunya pikseli
  const n1 = zeminGurultu(rnd, 150, w, h), n2 = zeminGurultu(rnd, 55, w, h), n3 = zeminGurultu(rnd, 19, w, h),
        bozma = zeminGurultu(rnd, 70, w, h), kuru = zeminGurultu(rnd, 85, w, h), toprakG = zeminGurultu(rnd, 105, w, h);
  const kos = [86, 112, 50], tab = [112, 140, 62], ac = [136, 160, 76], kr = [156, 150, 84], top = [122, 100, 68];
  const yum = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  const img = kg.createImageData(w, h), d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const wx = Math.max(0, Math.min(w - 1.01, x + (bozma(x, y) - 0.5) * 45)), wy = Math.max(0, Math.min(h - 1.01, y + (bozma(y, x) - 0.5) * 45));                  // alan bukme: organik leke kenarlari
    let t = n1(wx, wy) * 0.5 + n2(wx, wy) * 0.3 + n3(x, y) * 0.2;
    t = (t - 0.5) * 1.7 + 0.5;
    const k1 = yum(0.15, 0.5, t), k2 = yum(0.5, 0.85, t);
    let r = kos[0] + (tab[0] - kos[0]) * k1 + (ac[0] - tab[0]) * k2, gg = kos[1] + (tab[1] - kos[1]) * k1 + (ac[1] - tab[1]) * k2, b = kos[2] + (tab[2] - kos[2]) * k1 + (ac[2] - tab[2]) * k2;
    const kr0 = yum(0.66, 0.85, kuru(wx, wy)) * 0.35;                                                // kuru, sararmis bolgeler
    r += (kr[0] - r) * kr0; gg += (kr[1] - gg) * kr0; b += (kr[2] - b) * kr0;
    const dk = yum(0.70, 0.75, toprakG(Math.min(w - 1.01, wx + 200), wy)) * yum(120, 170, Math.hypot(x - w / 2, y - h / 2));   // toprak: dogal kenarli, merkezden uzak
    if (dk > 0) { r += (top[0] - r) * dk; gg += (top[1] - gg) * dk; b += (top[2] - b) * dk; }
    const i = (y * w + x) * 4;
    d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255;
  }
  kg.putImageData(img, 0, 0);
  g.imageSmoothingEnabled = true;
  g.drawImage(kucuk, 0, 0, kv.width, kv.height);
  // ince tane / dikey ot dokusu: kucuk bir desen karosu, 'overlay' ile uzerine dosenir
  try {
    const tw = 256, th = 256, tk = document.createElement("canvas"); tk.width = tw; tk.height = th;
    const tg = tk.getContext("2d"), ti = tg.createImageData(tw, th), td = ti.data;
    const dikis = (hx, hy) => {                                    // DIKISSIZ (kenarlari birlesen) deger gurultusu
      const gx = Math.ceil(tw / hx), gy = Math.ceil(th / hy), v = new Float32Array(gx * gy); for (let i = 0; i < v.length; i++) v[i] = rnd();
      return (x, y) => { const fx = x / hx, fy = y / hy, ix = Math.floor(fx), iy = Math.floor(fy); let tx = fx - ix, ty = fy - iy; tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
        const x1 = (ix + 1) % gx, y1 = (iy + 1) % gy, A = v[(iy % gy) * gx + ix % gx], B = v[(iy % gy) * gx + x1], C = v[y1 * gx + ix % gx], D = v[y1 * gx + x1]; return A + (B - A) * tx + (C - A) * ty + (A - B - C + D) * tx * ty; };
    };
    const ts = dikis(2, 16), tf = dikis(3, 3);                     // dikey ince seritler + ince tane
    for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
      const v = 128 + (ts(x, y) - 0.5) * 90 + (tf(x, y) - 0.5) * 60, i = (y * tw + x) * 4;
      td[i] = td[i + 1] = td[i + 2] = Math.max(0, Math.min(255, v)); td[i + 3] = 255;
    }
    tg.putImageData(ti, 0, 0);
    g.save(); g.setTransform(S * 0.5, 0, 0, S * 0.5, 0, 0);
    g.globalCompositeOperation = "overlay"; g.globalAlpha = 0.45;
    g.fillStyle = g.createPattern(tk, "repeat"); g.fillRect(0, 0, DUNYA_GEN * 2, DUNYA_YUK * 2);
    g.restore();
  } catch (e) { /* desen olusmazsa sadece taban kalir */ }
  g.setTransform(S, 0, 0, S, 0, 0);
  const dunyaToprak = (x, y) => { const px = Math.min(w - 1.01, x / 2), py = Math.min(h - 1.01, y / 2); return yum(0.70, 0.75, toprakG(Math.min(w - 1.01, px + 200), py)) * yum(120, 170, Math.hypot(px - w / 2, py - h / 2)); };

  // ince, sonuk ot yapraklari (kucuk, hafif egik, dusuk opaklik)
  g.lineCap = "round";
  const boyaR = [[40, 70, 28], [70, 100, 40], [110, 136, 60], [150, 150, 80], [96, 124, 50]];
  for (let i = 0; i < 9000; i++) {
    const x = rnd() * DUNYA_GEN, y = rnd() * DUNYA_YUK, dt = dunyaToprak(x, y);
    if (dt > 0.6) continue;
    const c = boyaR[Math.floor(rnd() * boyaR.length)], h = 3 + rnd() * 6, e = (rnd() - 0.5) * 3.2;
    g.strokeStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + (0.30 + rnd() * 0.25) + ")"; g.lineWidth = 0.55 + rnd() * 0.35;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + e * 0.3, y - h * 0.6, x + e, y - h); g.stroke();
  }
  // toprak kenarinda kuru ot kumeleri
  for (let i = 0; i < 1500; i++) {
    const x = rnd() * DUNYA_GEN, y = rnd() * DUNYA_YUK, dt = dunyaToprak(x, y);
    if (dt < 0.08 || dt > 0.75) continue;
    g.strokeStyle = "rgba(" + (150 + Math.floor(rnd() * 30)) + "," + (130 + Math.floor(rnd() * 25)) + ",70,0.5)"; g.lineWidth = 0.6;
    const h = 3 + rnd() * 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 3, y - h); g.stroke();
  }
  // toprak uzerinde cakil ve ufak taslar
  for (let i = 0; i < 900; i++) {
    const x = rnd() * DUNYA_GEN, y = rnd() * DUNYA_YUK;
    if (dunyaToprak(x, y) < 0.7) continue;
    const r = 0.5 + rnd() * 1.3, v = 110 + Math.floor(rnd() * 60);
    g.fillStyle = "rgba(0,0,0,0.22)"; g.beginPath(); g.ellipse(x + 0.5, y + 0.5, r, r * 0.6, 0, 0, 7); g.fill();
    g.fillStyle = "rgb(" + v + "," + (v - 6) + "," + (v - 14) + ")"; g.beginPath(); g.ellipse(x, y, r, r * 0.75, 0, 0, 7); g.fill();
  }
  // cimende seyrek, kucuk, sonuk yabani cicekler (belli belirsiz)
  for (let k = 0; k < 22; k++) {
    const cx = 40 + rnd() * (DUNYA_GEN - 80), cy = 40 + rnd() * (DUNYA_YUK - 80);
    if (dunyaToprak(cx, cy) > 0.1 || Math.hypot(cx - DUNYA_GEN / 2, cy - DUNYA_YUK / 2) < 90) continue;
    const renk = rnd() < 0.6 ? "rgba(235,235,215,0.8)" : "rgba(225,195,80,0.8)";
    for (let i = 0; i < 3 + Math.floor(rnd() * 4); i++) { g.fillStyle = renk; g.beginPath(); g.arc(cx + (rnd() - 0.5) * 22, cy + (rnd() - 0.5) * 12, 0.9, 0, 7); g.fill(); }
  }
  // gunes isigi: sol ustte hafif aydinlik, sag altta hafif golge + kenar karartmasi
  const lg = g.createLinearGradient(0, 0, DUNYA_GEN, DUNYA_YUK);
  lg.addColorStop(0, "rgba(255,245,200,0.10)"); lg.addColorStop(0.5, "rgba(0,0,0,0)"); lg.addColorStop(1, "rgba(0,20,10,0.14)");
  g.fillStyle = lg; g.fillRect(0, 0, DUNYA_GEN, DUNYA_YUK);
  const vg = g.createRadialGradient(DUNYA_GEN / 2, DUNYA_YUK / 2, DUNYA_YUK * 0.5, DUNYA_GEN / 2, DUNYA_YUK / 2, DUNYA_GEN * 0.62);
  vg.addColorStop(0, "rgba(0,20,0,0)"); vg.addColorStop(1, "rgba(0,20,0,0.25)");
  g.fillStyle = vg; g.fillRect(0, 0, DUNYA_GEN, DUNYA_YUK);
  return kv;
}

function zeminHazirla() { return ZEMIN_TUR === "gercek" ? zeminGercek() : ZEMIN_TUR === "cayir" ? zeminCayir() : ZEMIN_TUR === "doku" ? zeminDoku() : zeminKaro(); }

// Dunya koordinatinda, her seyin en altina cizilir.
function cizZemin() {
  if (!zeminDenendi) { zeminDenendi = true; try { zeminKanvas = zeminHazirla(); } catch (e) { zeminKanvas = null; } }
  if (zeminKanvas) cizim.drawImage(zeminKanvas, 0, 0, DUNYA_GEN, DUNYA_YUK);
  else { cizim.fillStyle = ZEMIN_RENK; cizim.fillRect(0, 0, DUNYA_GEN, DUNYA_YUK); }
}
