// ============================================================
// DOSYA: js/dunya.js
// Dunya: agaclar ve kayalar. Yerlestirme, toplama ve cizimleri.
// ============================================================

// Kaynaklari (agac + kaya) rastgele yerlestir: birbirine ve oyuncuya cok yakin olmasin
const kaynaklar = [];
// Harita duzeni (AoE gibi): sehir icin ORTA bolge bos kalir; ormanlar ve madenler KOSE bolgelerine yerlesir.
// Capraz iki kose orman, diger capraz iki kose maden (hangi capraz hangisi: rastgele).
const KOSE_ALANLARI = [
  { x: 190,  y: 215 }, { x: 1090, y: 215 },     // ust sol, ust sag
  { x: 190,  y: 435 }, { x: 1090, y: 435 }      // alt sol, alt sag
];
function yerlestir(tur, sayi, miktar, grupBoyu, yaricap, aralik, merkezler) {
  let eklenen = 0;
  for (const m of merkezler) {
    const grup = Math.min(grupBoyu, sayi - eklenen);
    if (grup <= 0) break;
    const cx = m.x + (Math.random() - 0.5) * 40, cy = m.y + (Math.random() - 0.5) * 40;   // az oynama
    let g = 0, d2 = 0;
    while (g < grup && d2 < 3000) {
      d2++;
      const aci = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * yaricap;   // sqrt: merkezde de ayni sik
      const x = cx + Math.cos(aci) * r, y = cy + Math.sin(aci) * r;
      if (x < 60 || x > DUNYA_GEN - 60 || y < 60 || y > DUNYA_YUK - MENU_YUK - 40) continue;
      if (kaynaklar.some(k => Math.hypot(k.x - x, k.y - y) < aralik)) continue;
      kaynaklar.push({ tur, x, y, kalan: miktar });
      g++; eklenen++;
    }
  }
}
{
  const capraz = Math.random() < 0.5;                                   // hangi capraz orman olsun
  const ormanlar = capraz ? [KOSE_ALANLARI[0], KOSE_ALANLARI[3]] : [KOSE_ALANLARI[1], KOSE_ALANLARI[2]];
  const madenler = capraz ? [KOSE_ALANLARI[1], KOSE_ALANLARI[2]] : [KOSE_ALANLARI[0], KOSE_ALANLARI[3]];
  yerlestir("agac", AGAC_SAYISI, AGAC_BASINA_ODUN, ORMAN_BOYUTU, 150, 33, ormanlar);
  yerlestir("kaya", TAS_SAYISI, KAYA_BASINA_TAS, MADEN_BOYUTU, 105, 38, madenler);
}

function enYakinKaynak() {
  let en = null, enUzak = Infinity;
  for (const k of kaynaklar) {
    if (k.kalan <= 0) continue;
    const d = Math.hypot(k.x - (oyuncu.x + oyuncu.boyut / 2), k.y - (oyuncu.y + oyuncu.boyut / 2));
    if (d < enUzak) { enUzak = d; en = k; }
  }
  return enUzak <= TOPLAMA_MESAFESI ? en : null;
}

function topla() {
  const k = enYakinKaynak();
  if (!k) return;
  k.kalan--;
  kaynakEkle(k.tur, 1);
}

// Tukenen agaclar zamanla yeniden buyur (fidan -> agac). Bir bina/kampin altinda kalirsa bekler.
function kaynaklariGuncelle() {
  for (const k of kaynaklar) {
    if (k.tur !== "agac" || k.kalan > 0) continue;
    k.yenile = Math.min(AGAC_YENILENME_SURESI, (k.yenile || 0) + dt);
    if (k.yenile >= AGAC_YENILENME_SURESI && !kaynakAltindaBinaVar(k)) { k.kalan = AGAC_BASINA_ODUN; k.yenile = 0; }
  }
}
function kaynakAltindaBinaVar(k) {
  const e = ev ? evAlani() : null;
  if (e && k.x > e.x1 - 18 && k.x < e.x2 + 18 && k.y > e.y1 - 18 && k.y < e.y2 + 18) return true;
  return kamplar.some(m => Math.abs(k.x - m.x) < KAMP_YARI + 18 && Math.abs(k.y - m.y) < KAMP_YARI + 18);
}

function cizAgac(k, isaretli) {          // doner: 2 = sprite + gercek kontur cizildi (halka gerekmez)
  if (k.kalan <= 0) {                 // tukenmis agac: kutuk (+ buyuyen fidan)
    cizim.fillStyle = "#6b4a2b";
    cizim.fillRect(k.x - 8, k.y - 4, 16, 8);
    const ilerleme = (k.yenile || 0) / AGAC_YENILENME_SURESI;
    if (ilerleme > 0.15) {
      cizim.fillStyle = "#43a047";
      cizim.beginPath();
      cizim.arc(k.x, k.y - 6, 3 + 14 * ilerleme, 0, Math.PI * 2);
      cizim.fill();
    }
    return;
  }
  const hs = Math.abs(Math.floor(k.x * 7 + k.y * 13)), ad = hs % 10 < 5 ? "CommonTree_" + (1 + hs % 5) : "Pine_" + (1 + hs % 5);
  const r = spriteCiz(ad, k.x, k.y + 14, 58, 80 + (hs % 3) * 6, true, isaretli ? "#ffffff" : null);   // sprite agac (govde tabani agacin konumunda)
  if (r) return r;
  cizim.fillStyle = "#4e342e";
  cizim.fillRect(k.x - 5, k.y, 10, 22);
  cizim.fillStyle = "#1b5e20";
  cizim.beginPath();
  cizim.arc(k.x, k.y - 4, 20, 0, Math.PI * 2);
  cizim.fill();
}

function cizKaya(k, isaretli) {
  if (k.kalan <= 0) {                 // tukenmis kaya: kucuk cakil
    cizim.fillStyle = "#9e9e9e";
    cizim.beginPath();
    cizim.arc(k.x, k.y, 6, 0, Math.PI * 2);
    cizim.fill();
    return;
  }
  const rs = "Rock_Medium_" + (1 + Math.abs(Math.floor(k.x * 7 + k.y * 13)) % 3);        // her kayaya sabit bir model
  const r = spriteCiz(rs, k.x, k.y + 14, 58, 44, true, isaretli ? "#ffffff" : null);
  if (r) return r;
  cizim.fillStyle = "#757575";
  cizim.beginPath();
  cizim.ellipse(k.x, k.y, 22, 16, 0, 0, Math.PI * 2);
  cizim.fill();
  cizim.fillStyle = "#9e9e9e";        // isik vurmus ust kisim
  cizim.beginPath();
  cizim.ellipse(k.x - 5, k.y - 5, 9, 6, 0, 0, Math.PI * 2);
  cizim.fill();
}

// Toplanan kaynagi stoka ekler ve "toplanan" sayacini arttirir (gorevler bunu okur).
function kaynakEkle(tur, n) {
  if (tur === "agac") { odun += n; toplanan.odun += n; }
  else if (tur === "et") { et += n; toplanan.et += n; }
  else { tas += n; toplanan.tas += n; }
}
