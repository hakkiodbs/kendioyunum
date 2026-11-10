// ============================================================
// DOSYA: js/secim.js
// AoE tarzi secim: tek tik, Shift+tik (ekle), surukleyip kutu cizerek coklu secim.
// Secilebilen birimler: kahraman (oyuncu.secili) ve iscilerin hepsi (isci.secili).
// ============================================================

const secimKutusu = { aktif: false, x0: 0, y0: 0, x1: 0, y1: 0 };   // fare basili surukleniyor mu
const SURUKLEME_ESIGI = 6;   // piksel: bundan az oynarsa "tik", fazlaysa "kutu"

// Her birimin tiklanabilir dikdortgeni (cizilen insana gore). "on" buyuk olan ustte durur.
function kahramanKutusu() {
  const cx = oyuncu.x + oyuncu.boyut / 2, fy = oyuncu.y + oyuncu.boyut;
  return { x1: cx - 13, x2: cx + 13, y1: fy - KAHRAMAN_BOY - 2, y2: fy + 4, on: fy };
}
function iscKutusu(i) {
  const fy = i.y + 6;
  return { x1: i.x - 8, x2: i.x + 8, y1: fy - 30, y2: fy + 3, on: fy };
}

function evKutusu() {      // evin tiklanabilir alani (cati dahil)
  const a = evAlani();
  return { x1: a.x1, x2: a.x2, y1: a.y1, y2: a.y2, on: -1000 };   // on = -1000: birimler evin ustunde cizilir, tiklamada da onlar kazanir
}

function kampKutusu(k) { const a = kampAlani(k); return { x1: a.x1, x2: a.x2, y1: a.y1, y2: a.y2, on: -1000 }; }

function birimler() {
  const l = YENI_BASLANGIC ? [] : [{ ref: oyuncu, kutu: kahramanKutusu() }];
  if (ev) l.push({ ref: ev, kutu: evKutusu() });
  for (const k of kamplar) l.push({ ref: k, kutu: kampKutusu(k) });
  for (const i of isciler) l.push({ ref: i, kutu: iscKutusu(i) });
  return l;
}

function secimVar() {
  return oyuncu.secili || isciler.some(i => i.secili);
}

function secimiBirak() {
  oyuncu.secili = false;
  if (ev) ev.secili = false;
  for (const k of kamplar) k.secili = false;
  for (const i of isciler) i.secili = false;
}

// Tek tik: noktadaki en onde duran birimi sec. Bos yere tiklarsan (Shift yoksa) secim kalkar.
function secimTikla(x, y, ekle) {
  let en = null;
  for (const b of birimler()) {
    const k = b.kutu;
    if (x >= k.x1 && x <= k.x2 && y >= k.y1 && y <= k.y2 && (!en || k.on > en.kutu.on)) en = b;
  }
  if (!ekle) secimiBirak();
  if (en) en.ref.secili = ekle ? !en.ref.secili : true;
}

// Kutu secimi: kutunun icine denk gelen tum birimler (AoE gibi, ayak noktasina bakar).
function secimKutuSec(x0, y0, x1, y1, ekle) {
  const ax = Math.min(x0, x1), bx = Math.max(x0, x1), ay = Math.min(y0, y1), by = Math.max(y0, y1);
  if (!ekle) secimiBirak();
  for (const b of birimler()) {
    if (b.ref === ev || kamplar.includes(b.ref)) continue;   // kutuyla ev/kamp secilmez, sadece tikla
    const k = b.kutu, cx = (k.x1 + k.x2) / 2, cy = (k.y1 + k.y2) / 2;
    if (cx >= ax && cx <= bx && cy >= ay && cy <= by) b.ref.secili = true;
  }
}

function fareBasildi(x, y) {
  secimKutusu.aktif = true;
  secimKutusu.x0 = secimKutusu.x1 = x;
  secimKutusu.y0 = secimKutusu.y1 = y;
}
function fareSurukle(x, y) {
  if (!secimKutusu.aktif) return;
  secimKutusu.x1 = x;
  secimKutusu.y1 = y;
}
function fareBirakildi(x, y, ekle) {
  if (!secimKutusu.aktif) return;
  secimKutusu.aktif = false;
  const k = secimKutusu;
  if (Math.hypot(x - k.x0, y - k.y0) < SURUKLEME_ESIGI) secimTikla(x, y, ekle);
  else secimKutuSec(k.x0, k.y0, x, y, ekle);
}

function cizSecimKutusu() {
  const k = secimKutusu;
  if (!k.aktif || Math.hypot(k.x1 - k.x0, k.y1 - k.y0) < SURUKLEME_ESIGI) return;
  cizim.fillStyle = "rgba(76,175,80,0.15)";
  cizim.fillRect(Math.min(k.x0, k.x1), Math.min(k.y0, k.y1), Math.abs(k.x1 - k.x0), Math.abs(k.y1 - k.y0));
  cizim.strokeStyle = "#4caf50";
  cizim.lineWidth = 1;
  cizim.strokeRect(Math.min(k.x0, k.x1), Math.min(k.y0, k.y1), Math.abs(k.x1 - k.x0), Math.abs(k.y1 - k.y0));
}
