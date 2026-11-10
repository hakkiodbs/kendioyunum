// ============================================================
// DOSYA: js/yol.js
// YOL BULMA: kahraman ve isciler engellerin (ev, kamp, duvar, agac govdesi, kaya) icinden gecmez, etrafindan dolanir.
// Dunya 20 piksellik hucrelere bolunur; A* ile en kisa yol bulunur, sonra dogrusal kisimlar duzlestirilir.
// Engeller degisince (bina kuruldu/yikildi/tasindi, agac bitti/buyudu) yollar otomatik yeniden hesaplanir.
// ============================================================

const YOL_HUCRE = 20;
const YOL_GEN = DUNYA_GEN / YOL_HUCRE, YOL_YUK = DUNYA_YUK / YOL_HUCRE;   // 64 x 36 hucre
const AGAC_GOVDE_R = 11, KAYA_ENGEL_R = 14;       // agac sadece govdesiyle, kaya bir daire olarak engel

let engelSurumu = 0, engelImzasi = "", engelHaritasi = null;

function engelImzasiHesapla() {
  let s = (ev ? ev.x + "," + ev.y : "-") + "|" + (duvarSeviye > 0 ? "d" : "-") + "|" + kamplar.map(k => k.x + "," + k.y).join(";");
  let canli = 0;
  for (const k of kaynaklar) if (k.kalan > 0) canli++;
  return s + "|" + canli;
}
function engelGuncelle() {            // her karede bir kez: engeller degistiyse surum artar, yollar yenilenir
  const s = engelImzasiHesapla();
  if (s !== engelImzasi) { engelImzasi = s; engelSurumu++; engelHaritasi = null; }
}

function engelHaritasiniKur() {
  const h = new Uint8Array(YOL_GEN * YOL_YUK);
  const alanlar = [];
  if (ev) alanlar.push(evAlani());
  for (const k of kamplar) alanlar.push(kampAlani(k));
  for (let gy = 0; gy < YOL_YUK; gy++) for (let gx = 0; gx < YOL_GEN; gx++) {
    const cx = gx * YOL_HUCRE + YOL_HUCRE / 2, cy = gy * YOL_HUCRE + YOL_HUCRE / 2;
    let e = false;
    if (duvarSeviye > 0 && (cx < KARE || cx > DUNYA_GEN - KARE || cy < KARE || cy > DUNYA_YUK - KARE)) e = true;
    if (!e) for (const a of alanlar) if (cx >= a.x1 && cx < a.x2 && cy >= a.y1 && cy < a.y2) { e = true; break; }
    h[gy * YOL_GEN + gx] = e ? 1 : 0;
  }
  for (const k of kaynaklar) {
    if (k.kalan <= 0) continue;
    const mx = k.x, my = k.tur === "agac" ? k.y + 10 : k.y, r = k.tur === "agac" ? AGAC_GOVDE_R : KAYA_ENGEL_R;
    const g0x = Math.max(0, Math.floor((mx - r) / YOL_HUCRE)), g1x = Math.min(YOL_GEN - 1, Math.floor((mx + r) / YOL_HUCRE));
    const g0y = Math.max(0, Math.floor((my - r) / YOL_HUCRE)), g1y = Math.min(YOL_YUK - 1, Math.floor((my + r) / YOL_HUCRE));
    for (let gy = g0y; gy <= g1y; gy++) for (let gx = g0x; gx <= g1x; gx++) {
      const cx = gx * YOL_HUCRE + YOL_HUCRE / 2, cy = gy * YOL_HUCRE + YOL_HUCRE / 2;
      if (Math.hypot(cx - mx, cy - my) < r + YOL_HUCRE * 0.35) h[gy * YOL_GEN + gx] = 1;
    }
  }
  return h;
}
function engeller() { if (!engelHaritasi) engelHaritasi = engelHaritasiniKur(); return engelHaritasi; }

function hucre(x, y) {
  return { gx: Math.max(0, Math.min(YOL_GEN - 1, Math.floor(x / YOL_HUCRE))), gy: Math.max(0, Math.min(YOL_YUK - 1, Math.floor(y / YOL_HUCRE))) };
}
function hucreMerkezi(i) { return { x: (i % YOL_GEN) * YOL_HUCRE + YOL_HUCRE / 2, y: Math.floor(i / YOL_GEN) * YOL_HUCRE + YOL_HUCRE / 2 }; }
function engelliMi(x, y) { const c = hucre(x, y); return engeller()[c.gy * YOL_GEN + c.gx] === 1; }

// Noktaya en yakin serbest hucre (halka halka arar). Hucre numarasi doner.
function enYakinSerbest(x, y) {
  const h = engeller(), c = hucre(x, y);
  let en = -1, enUzak = Infinity;
  for (let r = 0; r < Math.max(YOL_GEN, YOL_YUK); r++) {
    for (let gy = c.gy - r; gy <= c.gy + r; gy++) for (let gx = c.gx - r; gx <= c.gx + r; gx++) {
      if (gx < 0 || gy < 0 || gx >= YOL_GEN || gy >= YOL_YUK) continue;
      if (Math.max(Math.abs(gx - c.gx), Math.abs(gy - c.gy)) !== r) continue;
      const i = gy * YOL_GEN + gx;
      if (h[i]) continue;
      const m = hucreMerkezi(i), d = Math.hypot(m.x - x, m.y - y);
      if (d < enUzak) { enUzak = d; en = i; }
    }
    if (en >= 0 && r * YOL_HUCRE > enUzak) break;       // daha yakin hucre cikamaz
  }
  return en;
}

function gorusHatti(x0, y0, x1, y1) {   // iki nokta arasi engelsiz mi
  const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 2);
  for (let s = 1; s < n; s++) if (engelliMi(x0 + (x1 - x0) * s / n, y0 + (y1 - y0) * s / n)) return false;
  return true;
}

// A*: (sx,sy) -> (hx,hy). Nokta listesi doner (son nokta tam hedef). Yol yoksa dogrudan hedef.
function yolBul(sx, sy, hx, hy) {
  const h = engeller();
  const hedef = { x: hx, y: hy };
  let bas = hucre(sx, sy), basI = bas.gy * YOL_GEN + bas.gx;
  const onek = [];                                    // engelin icindeysek once en yakin serbest hucreye cik
  if (h[basI]) { const s = enYakinSerbest(sx, sy); if (s < 0) return [hedef]; basI = s; onek.push(hucreMerkezi(s)); }
  let gC = hucre(hx, hy), gI = gC.gy * YOL_GEN + gC.gx;
  let sonNokta = hedef;                               // hedef engelin icindeyse (duvar, bina...) en yakin serbest hucrede durulur
  if (h[gI]) { const s = enYakinSerbest(hx, hy); if (s < 0) return [hedef]; gI = s; sonNokta = hucreMerkezi(s); }
  if (basI === gI) return onek.concat([sonNokta]);

  const N = YOL_GEN * YOL_YUK;
  const g = new Float32Array(N).fill(Infinity), f = new Float32Array(N), ata = new Int32Array(N).fill(-1), kapali = new Uint8Array(N);
  const gx0 = gI % YOL_GEN, gy0 = Math.floor(gI / YOL_GEN);
  const sezgi = i => { const dx = Math.abs((i % YOL_GEN) - gx0), dy = Math.abs(Math.floor(i / YOL_GEN) - gy0); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
  g[basI] = 0; f[basI] = sezgi(basI);
  const acik = [basI];
  let bulundu = false;
  while (acik.length) {
    let bi = 0;
    for (let k = 1; k < acik.length; k++) if (f[acik[k]] < f[acik[bi]]) bi = k;
    const cur = acik[bi]; acik[bi] = acik[acik.length - 1]; acik.pop();
    if (cur === gI) { bulundu = true; break; }
    kapali[cur] = 1;
    const cx = cur % YOL_GEN, cy = Math.floor(cur / YOL_GEN);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= YOL_GEN || ny >= YOL_YUK) continue;
      const ni = ny * YOL_GEN + nx;
      if (h[ni] || kapali[ni]) continue;
      if (dx && dy && (h[cy * YOL_GEN + nx] || h[ny * YOL_GEN + cx])) continue;     // kose kesme yok
      const yeni = g[cur] + (dx && dy ? 1.414 : 1);
      if (yeni < g[ni]) {
        if (g[ni] === Infinity) acik.push(ni);
        g[ni] = yeni; f[ni] = yeni + sezgi(ni); ata[ni] = cur;
      }
    }
  }
  if (!bulundu) return onek.concat([hedef]);
  const hucreler = [];
  for (let i = gI; i !== -1; i = ata[i]) hucreler.push(i);
  hucreler.reverse();
  let noktalar = onek.concat(hucreler.map(hucreMerkezi));
  noktalar.push(sonNokta);
  // duzlestir: gorus hatti acik olan en uzak noktaya dogrudan git
  const sonuc = [];
  let ax = sx, ay = sy, i = 0;
  while (i < noktalar.length) {
    let j = noktalar.length - 1;
    while (j > i && !gorusHatti(ax, ay, noktalar[j].x, noktalar[j].y)) j--;
    sonuc.push(noktalar[j]);
    ax = noktalar[j].x; ay = noktalar[j].y;
    i = j + 1;
  }
  return sonuc;
}

// Birimin siradaki ara noktasi: { x, y, son }. Hedef ya da engeller degisince yol yeniden hesaplanir.
function yolNoktasi(b, px, py, hx, hy) {
  let y = b.yolBilgi;
  if (!y || y.surum !== engelSurumu || y.hx !== hx || y.hy !== hy) {
    y = b.yolBilgi = { surum: engelSurumu, hx, hy, noktalar: yolBul(px, py, hx, hy), idx: 0 };
  }
  while (y.idx < y.noktalar.length - 1 && Math.hypot(y.noktalar[y.idx].x - px, y.noktalar[y.idx].y - py) < 4) y.idx++;
  const n = y.noktalar[y.idx];
  return { x: n.x, y: n.y, son: y.idx === y.noktalar.length - 1 };
}

// Isci icin: yolu izleyerek hedefe yuru. Hedefe vardiysa true.
function yolluHareket(i, hx, hy, dt) {
  const n = yolNoktasi(i, i.x, i.y, hx, hy);
  return hareketEt(i, n.x, n.y, dt) && n.son;
}
