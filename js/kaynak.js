// ============================================================
// DOSYA: js/kaynak.js
// KAYNAKLAR: odun, tahta, tas, altin, et. Tek yerde: stok okuma/yazma, maliyet kontrolu/odeme, gosterim.
// Maliyet = { odun: 10, tas: 4, tahta: 0, altin: 0, et: 0 }  (eksik anahtar = 0).
// Uretim zinciri:  odun -> (Testere ile) tahta   |   Tas Ocagi -> (Maden Arama ile) altin   |   Avci Kampi -> et
// ============================================================

const KAYNAKLAR = [
  { id: "odun",  ad: "Odun",  kucuk: "odun" },
  { id: "tahta", ad: "Tahta", kucuk: "tahta" },
  { id: "tas",   ad: "Taş",   kucuk: "taş" },
  { id: "altin", ad: "Altın", kucuk: "altın" },
  { id: "et",    ad: "Et",    kucuk: "et" }
];
let tahta = 0, altin = 0, et = ET_BASLANGIC;       // odun ve tas durum.js'te
toplanan.tahta = 0; toplanan.altin = 0; toplanan.et = 0;

function kaynakDeger(id) { return id === "odun" ? odun : id === "tas" ? tas : id === "tahta" ? tahta : id === "altin" ? altin : id === "et" ? et : 0; }
function kaynakAyarla(id, v) { if (id === "odun") odun = v; else if (id === "tas") tas = v; else if (id === "tahta") tahta = v; else if (id === "altin") altin = v; else if (id === "et") et = v; }
function kaynakAd(id) { return KAYNAKLAR.find(k => k.id === id).kucuk; }

function maliyetYeter(m) { return KAYNAKLAR.every(k => (m[k.id] || 0) <= kaynakDeger(k.id)); }
function maliyetOde(m) { for (const k of KAYNAKLAR) if (m[k.id]) kaynakAyarla(k.id, kaynakDeger(k.id) - m[k.id]); }
function maliyetIade(m, oran) { for (const k of KAYNAKLAR) if (m[k.id]) kaynakAyarla(k.id, kaynakDeger(k.id) + Math.floor(m[k.id] * oran)); }
function maliyetVar(m) { return KAYNAKLAR.some(k => (m[k.id] || 0) > 0); }
// Gosterim: [{ id, n, ok }] (yalniz 0'dan buyukler)  /  "25 odun, 10 tas"
function maliyetParcalari(m) { return KAYNAKLAR.filter(k => (m[k.id] || 0) > 0).map(k => ({ id: k.id, n: m[k.id], ok: kaynakDeger(k.id) >= m[k.id] })); }
function maliyetMetni(m) { return maliyetParcalari(m).map(p => p.n + " " + kaynakAd(p.id)).join(", "); }
const ISCI_MALIYET = { odun: ISCI_MALIYETI_ODUN, et: ISCI_MALIYETI_ET };   // bir isciyi uretmenin maliyeti
