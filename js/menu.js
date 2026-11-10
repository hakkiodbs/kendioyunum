// ============================================================
// DOSYA: js/menu.js
// Insaat menusu (Age of Empires tarzi): sol tarafta KATEGORI sekmeleri (Ekonomi / Savunma / Askeri),
// ortada bina KARELERI (ikon + kucuk ad + maliyet), uzerine gelince AYRINTI kutusu (tooltip), sagda koy durumu.
// Sag ustteki Gizle/Goster dugmesi (ya da M tusu) menuyu gizler; kapaliyken alt kisim da kullanilir.
// ============================================================

const MENU_SEKME_GEN = 100, MENU_SEKME_YUK = 20;
const MENU_YAN = 12, MENU_KAT_GEN = 96, MENU_KAT_YUK = 24, MENU_KAT_ARA = 3;
const MENU_KARE_GEN = 86, MENU_KARE_YUK = 102, MENU_BOSLUK = 8, MENU_KARE_ADET = 4, MENU_BILGI_GEN = 170;

// Kategoriler: AoE II'deki gibi amaca gore (Ekonomi, Savunma, Askeri). Askeri henuz yapim asamasinda.
const MENU_KATEGORILER = [
  { id: "ekonomi", ad: "Ekonomi", yakinda: [] },
  { id: "savunma", ad: "Savunma", yakinda: ["Gözcü Kulesi"] },
  { id: "askeri",  ad: "Askeri",  yakinda: ["Kışla", "Okçu Menzili", "Ahır"] },
  { id: "gelistirme", ad: "Geliştirme", yakinda: [] }          // secili binanin gelistirmeleri (AoE'deki gibi)
];
const MENU_IKON = { ev: "House_1", oduncu: "Sawmill", ocak: "Blacksmith", avci: "Stable" };
const MENU_ACIKLAMA = {
  ev: "Köyün kalbi. İşçi üretir, kamp ve duvar seviyelerini sınırlar. Yükseltildikçe hızlanır.",
  duvar: "Köyü çevreler. Seviye atladıkça güçlenir (1-25 odun, 26-30 taş).",
  oduncu: "Yakındaki ağaçlardan odun toplama hızını ve taşıma kapasitesini artırır.",
  ocak: "Yakındaki kayalardan taş toplama hızını ve taşıma kapasitesini artırır.",
  avci: "Ormanda avlanır; kendiliğinden ET üretir. Et, işçi üretmek için gerekir."
};
let menuKat = "ekonomi", menuOncekiKat = "ekonomi", menuSonSecim = null;

// Bir bina secilince menu otomatik "Geliştirme" sekmesine gecer; secim kalkinca eski sekmeye doner.
function menuSecimiIzle() {
  const sb = secilenBina(), kimlik = sb ? sb.ref : null;
  if (kimlik === menuSonSecim) return;
  menuSonSecim = kimlik;
  if (kimlik && gelistirmeListesi(sb).length) { if (menuKat !== "gelistirme") menuOncekiKat = menuKat; menuKat = "gelistirme"; }
  else if (!kimlik && menuKat === "gelistirme") menuKat = menuOncekiKat;
}

function menuGen() { return MENU_YAN * 2 + MENU_KAT_GEN + 12 + MENU_KARE_ADET * (MENU_KARE_GEN + MENU_BOSLUK) - MENU_BOSLUK + 12 + MENU_BILGI_GEN; }
function menuPanel() {       // acik menunun dikdortgeni (yatayda ortali)
  const g = menuGen();
  return { x: (DUNYA_GEN - g) / 2, y: DUNYA_YUK - MENU_YUK, w: g, h: MENU_YUK };
}
function menuDegistir() { menuAcik = !menuAcik; }   // KOMUT (arayuz): menuyu gizle/goster

function menuSekme() {       // dugme: panelin sag ust kenarinin hemen ustunde; menu kapaliysa ekranin altinda ayni hizada
  const p = menuPanel();
  return { x: p.x + p.w - MENU_SEKME_GEN, y: (menuAcik ? p.y : DUNYA_YUK) - MENU_SEKME_YUK, w: MENU_SEKME_GEN, h: MENU_SEKME_YUK };
}

function icinde(r, x, y) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }
function kesisir(r, x1, y1, x2, y2) { return x1 < r.x + r.w && x2 > r.x && y1 < r.y + r.h && y2 > r.y; }

function menuKatDugmeleri() {
  const p = menuPanel();
  return MENU_KATEGORILER.map((k, i) => ({ k, x: p.x + MENU_YAN, y: p.y + 9 + i * (MENU_KAT_YUK + MENU_KAT_ARA), w: MENU_KAT_GEN, h: MENU_KAT_YUK }));
}
// Aktif kategorinin kareleri: once gercek binalar, sonra "yakinda" yer tutucular.
function menuDugmeleri() {
  const p = menuPanel(), x0 = p.x + MENU_YAN + MENU_KAT_GEN + 12;
  if (menuKat === "gelistirme") {
    const sb = secilenBina();
    return gelistirmeListesi(sb).map((t, i) => ({ t, sb, x: x0 + i * (MENU_KARE_GEN + MENU_BOSLUK), y: p.y + 10, w: MENU_KARE_GEN, h: MENU_KARE_YUK }));
  }
  const kat = MENU_KATEGORILER.find(k => k.id === menuKat);
  const liste = BINALAR.filter(b => b.kat === menuKat).map(b => ({ b })).concat(kat.yakinda.map(ad => ({ yakinda: ad })));
  return liste.map((o, i) => Object.assign(o, { x: x0 + i * (MENU_KARE_GEN + MENU_BOSLUK), y: p.y + 10, w: MENU_KARE_GEN, h: MENU_KARE_YUK }));
}

// Bu nokta menunun (ya da Gizle/Goster dugmesinin) ustunde mu? Evetse dunyaya tiklanmis sayilmaz.
// Ust cubuk dahil, arayuzun herhangi bir parcasi mi? (tiklama / hayalet bina / emir icin). Kenar kaydirmada SADECE alt menu sayilir.
function arayuzAlaninda(x, y) { return y < UST_YUK || menuAlaninda(x, y); }
function menuAlaninda(x, y) { return icinde(menuSekme(), x, y) || (menuAcik && icinde(menuPanel(), x, y)); }
// Bu dikdortgen menunun altinda kaliyor mu? (bina konamaz)
function menuEngelliMi(x1, y1, x2, y2) {        // dunya dikdortgeni -> ekrana cevrilip menuyle karsilastirilir
  const a = dunyadanEkrana(x1, y1), b = dunyadanEkrana(x2, y2);
  return kesisir({ x: 0, y: 0, w: DUNYA_GEN, h: UST_YUK }, a.x, a.y, b.x, b.y) || kesisir(menuSekme(), a.x, a.y, b.x, b.y) || (menuAcik && kesisir(menuPanel(), a.x, a.y, b.x, b.y));
}

function menuTikla(x, y) {
  if (icinde(menuSekme(), x, y)) { menuDegistir(); return; }
  if (!menuAcik) return;
  for (const d of menuKatDugmeleri()) if (icinde(d, x, y)) { menuKat = d.k.id; return; }
  for (const d of menuDugmeleri()) {
    if (d.b && icinde(d, x, y)) { binaSec(d.b.id); return; }
    if (d.t && icinde(d, x, y)) { gelistirmeArastir(d.t, d.sb); return; }
  }
}

function cizSekme() {
  const s = menuSekme();
  temaPlaket(s, false);
  cizim.fillStyle = TEMA_KREM;
  cizim.font = "bold 11px " + TEMA_YAZI;
  cizim.textAlign = "center";
  cizim.fillText((menuAcik ? "▼ Gizle" : "▲ Menü") + "  [" + TUS_MENU.toUpperCase() + "]", s.x + s.w / 2, s.y + 14);
  cizim.textAlign = "left";
}

// Karenin ikonu: bina sprite'i; duvar icin kucuk tas duvar cizimi; sprite yoksa harf.
function menuIkonCiz(b, cx, alt, w, h, soluk) {
  cizim.save();
  if (soluk) cizim.globalAlpha = 0.4;
  if (MENU_IKON[b.id] && spriteCiz(MENU_IKON[b.id], cx, alt, w, h, false)) { /* sprite cizildi */ }
  else if (b.id === "duvar") {
    const x0 = cx - w / 2 + 4, y0 = alt - 30, gen = w - 8;
    cizim.fillStyle = "#8d8d8d"; cizim.fillRect(x0, y0, gen, 28);
    cizim.fillStyle = "#a9a9a9"; cizim.fillRect(x0, y0, gen, 6);
    cizim.strokeStyle = "#5a5a5a"; cizim.lineWidth = 1;
    for (let r = 0; r < 3; r++) for (let c = r % 2 ? 0 : 1; c < 5; c++) { const bx = x0 + c * (gen / 4); cizim.strokeRect(bx - gen / 8, y0 + 6 + r * 7.3, gen / 4, 7.3); }
    cizim.fillStyle = "#8d8d8d";
    for (let i = 0; i < 4; i++) cizim.fillRect(x0 + i * (gen / 4) + 2, y0 - 6, gen / 4 - 6, 6);   // siper dislerı
  } else {
    cizim.fillStyle = "#555"; cizim.fillRect(cx - 16, alt - 34, 32, 32);
    cizim.fillStyle = "#ddd"; cizim.font = "bold 20px " + TEMA_YAZI; cizim.textAlign = "center"; cizim.fillText(b.ad[0], cx, alt - 11);
  }
  cizim.restore();
}

// Karenin altindaki kisa durum / maliyet satiri (renkli). Doner: false ise maliyet cizildi.
function menuDurum(b) {
  if (b.tek && ev) return { t: "✔ Kuruldu", r: "#69f0ae" };
  if (!binaAcik(b)) return { t: "Köy Sv " + b.seviye, r: "#999" };
  if (!b.hazir) return { t: "Yakında", r: "#ffd54f" };
  if (b.id === "duvar" && duvarInsaat) return { t: "İnşaatta " + sureYazi(kalanSure(duvarInsaat.bitis)), r: "#ffd54f" };
  if (b.id === "duvar" && duvarSeviye >= DUVAR_MAX_SEVIYE) return { t: "En üst seviye", r: "#69f0ae" };
  if (b.id !== "ev" && !insaatYuvasiVar()) return { t: "Yuva dolu", r: "#ff8a80" };
  return null;
}

// Gelistirme karesi: buyuk etki yazisi (+25% gibi), ad, durum/maliyet.
function menuTekKareCiz(d, ustunde) {
  const t = d.t, du = gelistirmeDurum(t, d.sb), y = gelistirmeEtkiYazi(t), cx = d.x + d.w / 2;
  const yapildi = du.d === "yapildi", suruyor = du.d === "suruyor", hazir = du.d === "hazir", soluk = du.d === "kilitli" || du.d === "mesgul";
  temaKare(d, yapildi ? "yapildi" : suruyor ? "suruyor" : soluk ? "soluk" : (ustunde && hazir ? "ustunde" : "normal"));
  cizim.fillStyle = yapildi ? "#3f7d3f" : soluk ? "#3a3a3a" : "#7a6128";           // rozet
  cizim.fillRect(d.x + 8, d.y + 8, d.w - 16, 46);
  cizim.textAlign = "center";
  cizim.fillStyle = soluk ? "#777" : "#fff"; cizim.font = "bold 20px " + TEMA_YAZI; cizim.fillText(y.buyuk, cx, d.y + 33);
  cizim.fillStyle = soluk ? "#666" : "#e8d9a8"; cizim.font = "10px " + TEMA_YAZI; cizim.fillText(y.etiket, cx, d.y + 48);
  if (suruyor) {                                                                    // ilerleme cubugu
    const b = du.bina.arastirma, o = b.toplam > 0 ? Math.max(0, Math.min(1, 1 - kalanSure(b.bitis) / b.toplam)) : 1;
    cizim.fillStyle = "rgba(0,0,0,0.6)"; cizim.fillRect(d.x + 8, d.y + 50, d.w - 16, 4);
    cizim.fillStyle = "#ffd54f"; cizim.fillRect(d.x + 8, d.y + 50, (d.w - 16) * o, 4);
  }
  cizim.fillStyle = soluk ? "#888" : "#fff"; cizim.font = "bold 11px " + TEMA_YAZI;
  if (cizim.measureText(t.ad).width > d.w - 8) cizim.font = "bold 10px " + TEMA_YAZI;
  cizim.fillText(t.ad, cx, d.y + 74);
  cizim.font = "11px " + TEMA_YAZI;
  if (yapildi) { cizim.fillStyle = "#69f0ae"; cizim.fillText("✔ Tamam", cx, d.y + 92); }
  else if (suruyor) { cizim.fillStyle = "#ffd54f"; cizim.fillText("Kalan " + sureYazi(kalanSure(du.bina.arastirma.bitis)), cx, d.y + 92); }
  else if (soluk) {
    cizim.fillStyle = "#999";
    if (cizim.measureText(du.neden).width > d.w - 6) cizim.font = "9px " + TEMA_YAZI;          // uzun neden kareye sigsin
    if (cizim.measureText(du.neden).width > d.w - 6) cizim.font = "8px " + TEMA_YAZI;
    cizim.fillText(du.neden, cx, d.y + 92);
  }
  else {
    menuMaliyetCiz(maliyetParcalari(t), cx, d.y + 92);
  }
  cizim.textAlign = "left";
}

function menuTekIpucuCiz(d) {
  const t = d.t, du = gelistirmeDurum(t, d.sb), y = gelistirmeEtkiYazi(t), satirlar = [];
  cizim.font = "12px " + TEMA_YAZI;
  let cur = "";
  for (const w of t.ack.split(" ")) { if (cizim.measureText(cur + " " + w).width > 280) { satirlar.push(cur); cur = w; } else cur = cur ? cur + " " + w : w; }
  if (cur) satirlar.push(cur);
  const w = 300, h = 54 + satirlar.length * 15 + 20 + (du.neden && du.d !== "hazir" ? 18 : 0);
  const x = Math.min(Math.max(4, d.x + d.w / 2 - w / 2), DUNYA_GEN - w - 4), yy = d.y - h - 6;
  temaIpucu(x, yy, w, h);
  cizim.textAlign = "left"; cizim.fillStyle = "#ffd54f"; cizim.font = "bold 14px " + TEMA_YAZI; cizim.fillText(t.ad, x + 10, yy + 20);
  cizim.textAlign = "right"; cizim.fillStyle = TEMA_KREM; cizim.font = "12px " + TEMA_YAZI; cizim.fillText("Süre: " + sureYazi(gelistirmeSure(t)), x + w - 10, yy + 20); cizim.textAlign = "left";
  cizim.fillStyle = "#e8d9a8"; cizim.font = "bold 12px " + TEMA_YAZI; cizim.fillText(y.buyuk + " " + y.etiket, x + 10, yy + 37);
  cizim.fillStyle = "#ccc"; cizim.font = "12px " + TEMA_YAZI;
  satirlar.forEach((tx, i) => cizim.fillText(tx, x + 10, yy + 54 + i * 15));
  let ly = yy + 54 + satirlar.length * 15 + 6, xx = x + 10;
  const ek = menuIpucuMaliyet(t);
  for (const e of ek) { cizim.fillStyle = e.r; cizim.fillText(e.t, xx, ly + 10); xx += cizim.measureText(e.t).width + 14; }
  if (du.neden && du.d !== "hazir") { cizim.fillStyle = du.d === "yapildi" ? "#69f0ae" : "#ff8a80"; cizim.fillText(du.neden, x + 10, ly + 28); }
}

// Maliyet satiri: kucuk kaynak ikonu + sayi (yesil = yeterli, kirmizi = eksik). Dar karelere sigsin diye metin yerine ikon.
function menuMaliyetCiz(parcalar, cx, y) {
  cizim.font = "bold 11px " + TEMA_YAZI;
  const ara = 7, ik = 11;
  const gen = parcalar.reduce((a, p) => a + ik + 2 + cizim.measureText(String(p.n)).width, 0) + (parcalar.length - 1) * ara;
  let x = cx - gen / 2;
  cizim.textAlign = "left";
  for (const p of parcalar) {
    cizim.save(); cizim.translate(x + ik / 2, y - 4); cizim.scale(0.5, 0.5); ustIkon(p.id, 0, 0); cizim.restore();
    cizim.fillStyle = p.ok ? "#69f0ae" : "#ff8a80"; cizim.fillText(String(p.n), x + ik + 2, y);
    x += ik + 2 + cizim.measureText(String(p.n)).width + ara;
  }
}
function menuIpucuMaliyet(m) { return maliyetParcalari(m).map(p => ({ t: KAYNAKLAR.find(k => k.id === p.id).ad + ": " + p.n, r: p.ok ? "#69f0ae" : "#ff8a80" })); }

function menuKareCiz(d, ustunde) {
  if (d.t) { menuTekKareCiz(d, ustunde); return; }
  if (!d.b) {                                       // yakinda yer tutucu
    temaKare(d, "soluk");
    cizim.fillStyle = "#555"; cizim.font = "bold 26px " + TEMA_YAZI; cizim.textAlign = "center"; cizim.fillText("🔒", d.x + d.w / 2, d.y + 50);
    cizim.fillStyle = "#777"; cizim.font = "11px " + TEMA_YAZI; cizim.fillText(d.yakinda, d.x + d.w / 2, d.y + 80);
    cizim.fillStyle = "#666"; cizim.font = "10px " + TEMA_YAZI; cizim.fillText("Yakında", d.x + d.w / 2, d.y + 94);
    cizim.textAlign = "left";
    return;
  }
  const b = d.b, acik = binaAcik(b), secili = kurmaModu === b.id, durum = menuDurum(b);
  temaKare(d, secili ? "secili" : (acik ? (ustunde ? "ustunde" : "normal") : "soluk"));

  menuIkonCiz(b, d.x + d.w / 2, d.y + 58, d.w - 14, 50, !acik);
  if (b.tus) {                                      // kisayol tusu (sag ust, kucuk)
    cizim.textAlign = "right"; cizim.font = "10px " + TEMA_YAZI; cizim.fillStyle = "#aaa";
    cizim.fillText(b.tus.toUpperCase(), d.x + d.w - 5, d.y + 12);
  }
  cizim.textAlign = "center";
  cizim.fillStyle = acik ? "#fff" : "#888";
  const ad = b.ad + (b.id === "duvar" && duvarSeviye > 0 ? " " + duvarSeviye : "");
  cizim.font = "bold 11px " + TEMA_YAZI;
  if (cizim.measureText(ad).width > d.w - 8) cizim.font = "bold 10px " + TEMA_YAZI;   // uzun isim kareye sigsin
  cizim.fillText(ad, d.x + d.w / 2, d.y + 74);
  cizim.font = "11px " + TEMA_YAZI;
  if (durum) { cizim.fillStyle = durum.r; cizim.fillText(durum.t, d.x + d.w / 2, d.y + 92); }
  else {                                            // maliyet: yesil = yeterli, kirmizi = eksik
    menuMaliyetCiz(maliyetParcalari(binaMaliyet(b)), d.x + d.w / 2, d.y + 92);
  }
  cizim.textAlign = "left";
}

// AoE tarzi ayrinti kutusu: karenin ustunde acilir.
function menuIpucuCiz(d) {
  const b = d.b, m = binaMaliyet(b), sure = b.id === "duvar" ? insaatSuresi("duvar", duvarSeviye + 1) : insaatSuresi(b.id);
  const satirlar = [];
  const aciklama = MENU_ACIKLAMA[b.id] || "";
  cizim.font = "12px " + TEMA_YAZI;
  // aciklamayi kelime kelime sar
  let cur = "";
  for (const w of aciklama.split(" ")) { if (cizim.measureText(cur + " " + w).width > 280) { satirlar.push(cur); cur = w; } else cur = cur ? cur + " " + w : w; }
  if (cur) satirlar.push(cur);
  const ek = menuIpucuMaliyet(m);
  const durum = menuDurum(b);
  const w = 300, h = 34 + satirlar.length * 15 + (ek.length ? 20 : 0) + (durum ? 18 : 0);
  let x = Math.min(Math.max(4, d.x + d.w / 2 - w / 2), DUNYA_GEN - w - 4), y = d.y - h - 6;
  temaIpucu(x, y, w, h);
  cizim.textAlign = "left"; cizim.fillStyle = "#ffd54f"; cizim.font = "bold 14px " + TEMA_YAZI;
  cizim.fillText(b.ad + (b.tus ? "  (" + b.tus.toUpperCase() + ")" : ""), x + 10, y + 20);
  if (sure > 0) { cizim.textAlign = "right"; cizim.fillStyle = TEMA_KREM; cizim.font = "12px " + TEMA_YAZI; cizim.fillText("Süre: " + sureYazi(sure), x + w - 10, y + 20); cizim.textAlign = "left"; }
  cizim.fillStyle = "#ccc"; cizim.font = "12px " + TEMA_YAZI;
  satirlar.forEach((t, i) => cizim.fillText(t, x + 10, y + 38 + i * 15));
  let yy = y + 38 + satirlar.length * 15;
  if (ek.length) { let xx = x + 10; yy += 4; for (const e of ek) { cizim.fillStyle = e.r; cizim.fillText(e.t, xx, yy + 10); xx += cizim.measureText(e.t).width + 14; } yy += 16; }
  if (durum) { cizim.fillStyle = durum.r; cizim.fillText(durum.t, x + 10, yy + 12); }
}

function cizMenu() {
  menuSecimiIzle();
  if (menuAcik) {
    const p = menuPanel();
    temaPanel(p);

    for (const d of menuKatDugmeleri()) {           // kategori sekmeleri
      const aktif = d.k.id === menuKat;
      temaPlaket(d, aktif);
      cizim.fillStyle = aktif ? "#ffe9a0" : "#c9b88a";
      cizim.font = "bold 13px " + TEMA_YAZI;
      cizim.textAlign = "center";
      cizim.fillText(d.k.ad, d.x + d.w / 2, d.y + 20);
    }

    let ustte = null;
    const kareler = menuDugmeleri();
    for (const d of kareler) {
      const u = icinde(d, fareEkran.x, fareEkran.y);
      if (u && (d.b || d.t)) ustte = d;
      menuKareCiz(d, u);
    }
    if (menuKat === "gelistirme" && kareler.length === 0) {
      cizim.fillStyle = "#aaa"; cizim.font = "13px " + TEMA_YAZI; cizim.textAlign = "left";
      cizim.fillText("Geliştirmeleri görmek için bir bina seç:", p.x + MENU_YAN + MENU_KAT_GEN + 16, p.y + 52);
      cizim.fillStyle = "#888"; cizim.font = "12px " + TEMA_YAZI;
      cizim.fillText("Ev, Oduncu Kampı veya Taş Ocağı (bina seviyesi geliştirmeleri açar)", p.x + MENU_YAN + MENU_KAT_GEN + 16, p.y + 72);
    }

    temaAyrac(p.x + p.w - MENU_BILGI_GEN - MENU_YAN - 6, p.y + 14, p.y + p.h - 14);
    const bx = p.x + p.w - MENU_YAN - 6;                // koy durumu (sag)
    cizim.textAlign = "right";
    cizim.fillStyle = TEMA_ALTIN;
    cizim.font = "bold 16px " + TEMA_YAZI;
    cizim.fillText("Köy Seviyesi: " + koySeviyesi(), bx, p.y + 32);
    cizim.fillStyle = "#bbb";
    cizim.font = "12px " + TEMA_YAZI;
    cizim.fillText("Duvar: Sv " + duvarSeviye + " / " + DUVAR_MAX_SEVIYE, bx, p.y + 54);
    cizim.fillText("Odun " + Math.floor(odun) + "  ·  Taş " + Math.floor(tas), bx, p.y + 74);
    cizim.textAlign = "left";
    if (ustte) { if (ustte.t) menuTekIpucuCiz(ustte); else menuIpucuCiz(ustte); }
  }

  cizSekme();

  if (kurmaModu) {                                // mod ipucu (menu / sekmenin hemen ustunde, ortali)
    const metin = binaTanimi(kurmaModu).ad.toUpperCase() + ": sol tık yerleştir  |  sağ tık / Esc: iptal";
    cizim.font = "bold 16px " + TEMA_YAZI;
    const gen = cizim.measureText(metin).width + 24;
    const y = (menuAcik ? menuPanel().y : DUNYA_YUK) - 36;
    const x = (DUNYA_GEN - gen) / 2;
    cizim.fillStyle = "rgba(0,0,0,0.65)";
    cizim.fillRect(x, y, gen, 26);
    cizim.fillStyle = "#fff";
    cizim.textAlign = "left";
    cizim.fillText(metin, x + 12, y + 19);
  }
}
