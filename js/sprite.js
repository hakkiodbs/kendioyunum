// ============================================================
// DOSYA: js/sprite.js
// 2D sprite (PNG) yukleme ve cizme. Sprite hazir degilse (yuklenmediyse / testte) cagiran eski kodla cizer.
// Sprite'lar 3D modellerden tools/blender_render.py ile uretildi (assets/oyun/).
// ============================================================

const SPRITE_ADLARI = ["House_1", "Sawmill", "Blacksmith", "Stable", "CommonTree_1", "CommonTree_2", "CommonTree_3", "CommonTree_4", "CommonTree_5", "Pine_1", "Pine_2", "Pine_3", "Pine_4", "Pine_5", "Rock_Medium_1", "Rock_Medium_2", "Rock_Medium_3"];
const sprite = {};      // ad -> Image

function spriteleriYukle() {
  if (typeof Image === "undefined") return;
  for (const ad of SPRITE_ADLARI) {
    const im = new Image();
    im.onload = () => { sprite[ad] = im; };
    im.src = "assets/oyun/" + ad + ".png";
  }
}
spriteleriYukle();

function spriteHazir(ad) { return !!sprite[ad]; }

// Sprite'in zemin merkezi (model orijini) sprite'in en altindan kac piksel yukarida: yukseklik orani (kaynak piksele gore).
const SPRITE_ZEMIN = {
 CommonTree_1: 0.086,
 CommonTree_2: 0.084,
 CommonTree_3: 0.067,
 CommonTree_4: 0.07,
 CommonTree_5: 0.093,
 Pine_1: 0.05,
 Pine_2: 0.05,
 Pine_3: 0.049,
 Pine_4: 0.053,
 Pine_5: 0.057,
 Rock_Medium_1: 0.311,
 Rock_Medium_2: 0.21,
 Rock_Medium_3: 0.352,
 House_1: 0.142,
 Sawmill: 0.271,
 Blacksmith: 0.198,
 Stable: 0.242
};

// Secim konturu: sprite'in GERCEK siluetinin etrafinda renkli cizgi (daire/kutu yerine). Onbellekli.
const konturOnbellek = {};
function spriteKontur(ad, renk, kk) {
  const anahtar = ad + "|" + renk + "|" + kk;
  if (konturOnbellek[anahtar] !== undefined) return konturOnbellek[anahtar];
  const im = sprite[ad];
  if (!im || typeof document === "undefined" || typeof document.createElement !== "function") return null;
  let sonuc = null;
  try {
    const c = document.createElement("canvas");
    c.width = im.width + 2 * kk; c.height = im.height + 2 * kk;
    const g = c.getContext("2d");
    for (let a = 0; a < 16; a++) g.drawImage(im, kk + Math.cos(a * Math.PI / 8) * kk, kk + Math.sin(a * Math.PI / 8) * kk);   // silueti her yone genislet
    g.globalCompositeOperation = "source-in";
    g.fillStyle = renk;
    g.fillRect(0, 0, c.width, c.height);
    sonuc = c;
  } catch (e) { sonuc = null; }
  konturOnbellek[anahtar] = sonuc;
  return sonuc;
}

// Ruzgar: yavas "ruzgar patlamasi" dalgasi konuma gore yayilir; her agacin kendi fazi var. Cam agaclar daha sert (az sallanir).
const RUZGAR_GUCU = 0.045;          // 0 = kapali; tepe, boyunun yuzde kaci kadar kayar
function ruzgarEgimi(ad, x, y) {
  const t = (typeof performance !== "undefined" ? performance.now() : 0) / 1000, faz = x * 0.011 + y * 0.006;
  const patlama = 0.55 + 0.45 * Math.sin(t * 0.33 + x * 0.003 - y * 0.002);       // yavas esme/dinme
  const salin = Math.sin(t * 1.15 + faz) * 0.7 + Math.sin(t * 2.4 + faz * 1.7) * 0.3;
  return RUZGAR_GUCU * (ad.charAt(0) === "P" ? 0.6 : 1) * (0.25 + patlama * salin + patlama * 0.6);
}

// Sprite'i alt-orta noktasi (x, altY) olacak sekilde, genislik w ve yukseklik h SINIRINA sigdirarak cizer.
// Golge, sprite'in alt kenarina degil ZEMIN MERKEZINE konur (yoksa bina havada durur).
// kontur: renk verilirse binanin/agacin gercek siluetini cizgiyle sarar. Doner: 0 cizilemedi, 1 cizildi, 2 cizildi + kontur var.
function spriteCiz(ad, x, altY, w, h, golge, kontur) {
  const im = sprite[ad];
  if (!im) return 0;
  const s = Math.min(w / im.width, h / im.height), dw = im.width * s, dh = im.height * s;
  if (golge) {
    const zy = altY - dh * (SPRITE_ZEMIN[ad] || 0.15), rx = dw * 0.42;
    const agacMi = /^(CommonTree|Pine)/.test(ad);                      // agaclarin golgesi daha koyu ve genis (zeminden ayrilsin)
    cizim.fillStyle = agacMi ? "rgba(0,15,0,0.34)" : "rgba(0,0,0,0.20)";
    cizim.beginPath();
    cizim.ellipse(x, zy, agacMi ? rx * 1.15 : rx, (agacMi ? rx * 1.15 : rx) * 0.5, 0, 0, Math.PI * 2);
    cizim.fill();
  }
  let sonuc = 1;
  const agac = /^(CommonTree|Pine)/.test(ad);
  let ox = x, oy = altY, kaydi = false;
  if (agac && RUZGAR_GUCU > 0) {                                        // ruzgar: agac govdesi sabit, tepe dogru egilir (kayma)
    const sw = ruzgarEgimi(ad, x, altY);
    cizim.save(); kaydi = true;
    cizim.translate(x, altY); cizim.transform(1, 0, -sw, 1, 0, 0);
    ox = 0; oy = 0;
  }
  if (!kontur && agac) {                                                // agaclara ince koyu kenar: yesil zeminde silueti belli olsun
    const kk = Math.max(1, Math.round(1.6 / s)), kc = spriteKontur(ad, "#0c1f06", kk);
    if (kc) { cizim.globalAlpha = 0.85; cizim.drawImage(kc, ox - dw / 2 - kk * s, oy - dh - kk * s, kc.width * s, kc.height * s); cizim.globalAlpha = 1; }
  }
  if (kontur) {
    const kk = Math.max(1, Math.round(2.5 / s)), kc = spriteKontur(ad, kontur, kk);
    if (kc) { cizim.drawImage(kc, ox - dw / 2 - kk * s, oy - dh - kk * s, kc.width * s, kc.height * s); sonuc = 2; }
  }
  cizim.drawImage(im, ox - dw / 2, oy - dh, dw, dh);
  if (kaydi) cizim.restore();
  return sonuc;
}

// ============================================================
// INSAAT GORUNUMU: temel -> duvarlar yukselir -> cati. Etrafinda ahsap iskele, malzeme yigini, toz.
// ============================================================
function spriteOlcu(ad, w, h) {
  const im = sprite[ad];
  const s = Math.min(w / im.width, h / im.height);
  return { dw: im.width * s, dh: im.height * s };
}

// Ahsap iskele (tek duzlem). ox, oy: derinlik ofseti (arka duzlem icin), arka: soluk/karanlik cizim.
function iskeleDuzlemi(x, altY, w, H, ox, oy, arka) {
  if (H < 6) return;
  const x0 = x - w / 2 + ox, x1 = x + w / 2 + ox, yb = altY + oy;
  cizim.save();
  cizim.globalAlpha = arka ? 0.6 : 1;
  const direk = "#6d4c41", acik = "#a1887f", tahta = arka ? "#8d6e43" : "#b58b5a";
  // direkler (sol, orta, sag)
  for (const px of [x0, (x0 + x1) / 2, x1]) {
    cizim.fillStyle = direk; cizim.fillRect(px - 1.5, yb - H, 3, H);
    cizim.fillStyle = acik; cizim.fillRect(px - 1.5, yb - H, 1, H);
  }
  // capraz destekler (her kat arasinda, dönüşümlü yon)
  cizim.strokeStyle = direk; cizim.lineWidth = 1.2; cizim.globalAlpha = arka ? 0.4 : 0.55; cizim.beginPath();    // capraz destekler soluk: bina gorunsun
  const kat = 26;
  for (let k = 0, yy = yb; yy - kat >= yb - H; k++, yy -= kat) {
    if (k % 2 === 0) { cizim.moveTo(x0, yy); cizim.lineTo(x1, yy - kat); } else { cizim.moveTo(x1, yy); cizim.lineTo(x0, yy - kat); }
  }
  cizim.stroke();
  cizim.globalAlpha = arka ? 0.6 : 1;
  // calisma platformlari (tahta zemin)
  for (let yy = yb - kat; yy >= yb - H + 2; yy -= kat) {
    cizim.fillStyle = tahta; cizim.fillRect(x0 - 5, yy - 1.5, x1 - x0 + 10, 3);
    cizim.fillStyle = "rgba(0,0,0,0.35)"; cizim.fillRect(x0 - 5, yy + 2, x1 - x0 + 10, 1);
    cizim.strokeStyle = direk; cizim.lineWidth = 1; cizim.strokeRect(x0 - 4.5, yy - 1.5, x1 - x0 + 9, 3);
  }
  // ust korkuluk
  cizim.fillStyle = direk; cizim.fillRect(x0 - 4, yb - H, x1 - x0 + 8, 2);
  cizim.restore();
}

// Merdiven (iskelenin sag yani).
function iskeleMerdiveni(x, altY, w, H) {
  if (H < 20) return;
  const mx = x + w / 2 + 9, ust = altY - H + 4;
  cizim.strokeStyle = "#6d4c41"; cizim.lineWidth = 2;
  cizim.beginPath();
  cizim.moveTo(mx - 4, altY + 3); cizim.lineTo(mx - 4, ust);
  cizim.moveTo(mx + 4, altY + 3); cizim.lineTo(mx + 4, ust);
  cizim.stroke();
  cizim.lineWidth = 1.5; cizim.strokeStyle = "#a1887f"; cizim.beginPath();
  for (let yy = altY - 4; yy > ust; yy -= 8) { cizim.moveTo(mx - 4, yy); cizim.lineTo(mx + 4, yy); }
  cizim.stroke();
}

// Insaat malzemesi yigini: tas ocagi icin tas bloklari, digerleri icin tahta + fici.
function malzemeYigini(x, y, tas) {
  if (tas) {
    for (const [dx, dy, r] of [[0, 0, 7], [11, 1, 6], [5, -6, 6], [-9, 2, 5]]) {
      cizim.fillStyle = "#8d949a"; cizim.beginPath(); cizim.ellipse(x + dx, y + dy, r, r * 0.7, 0, 0, Math.PI * 2); cizim.fill();
      cizim.fillStyle = "#b0bec5"; cizim.beginPath(); cizim.ellipse(x + dx - 1.5, y + dy - 2, r * 0.5, r * 0.3, 0, 0, Math.PI * 2); cizim.fill();
    }
  } else {
    for (let r = 0; r < 3; r++) {
      cizim.fillStyle = r % 2 ? "#a47c52" : "#c19a6b"; cizim.fillRect(x - 14 + r, y - 4 * r - 3, 28 - r * 2, 4);
      cizim.fillStyle = "rgba(0,0,0,0.3)"; cizim.fillRect(x - 14 + r, y - 4 * r, 28 - r * 2, 1);
    }
    cizim.fillStyle = "#6d4c41"; cizim.fillRect(x + 16, y - 10, 3, 12);                       // dikili kalas
  }
}

// Toz bulutlari + kivilcim: isci calisirken.
function insaatTozu(x, y) {
  const t = performance.now() / 1000;
  for (let k = 0; k < 4; k++) {
    const ph = (t * 1.3 + k * 0.25) % 1;
    cizim.fillStyle = "rgba(215,204,200," + (0.42 * (1 - ph)).toFixed(3) + ")";
    cizim.beginPath();
    cizim.ellipse(x + (k - 1.5) * 11 + Math.sin(k * 5 + t) * 3, y - ph * 18, 4 + ph * 8, 3 + ph * 5, 0, 0, Math.PI * 2);
    cizim.fill();
  }
  if (Math.floor(t * 6) % 2 === 0) {                                  // cekic kivilcimi
    cizim.strokeStyle = "#ffe082"; cizim.lineWidth = 1.5; cizim.beginPath();
    const kx = x + 14, ky = y - 12;
    cizim.moveTo(kx, ky); cizim.lineTo(kx + 5, ky - 4); cizim.moveTo(kx, ky); cizim.lineTo(kx + 6, ky + 1); cizim.moveTo(kx, ky); cizim.lineTo(kx + 2, ky - 6);
    cizim.stroke();
  }
}

// Temel: toprak zemin + tas temel cercevesi + kazik ve ip (insaatin en basinda gorunur).
function insaatTemeli(x, zy, rx, ilerleme) {
  const ry = rx * 0.5;
  cizim.fillStyle = "rgba(121,85,72,0.75)";
  cizim.beginPath(); cizim.moveTo(x, zy - ry); cizim.lineTo(x + rx, zy); cizim.lineTo(x, zy + ry); cizim.lineTo(x - rx, zy); cizim.closePath(); cizim.fill();
  cizim.strokeStyle = ilerleme < 0.2 ? "#cfd8dc" : "#90a4ae"; cizim.lineWidth = 3; cizim.stroke();
  cizim.strokeStyle = "#e0c58f"; cizim.lineWidth = 1;                                          // ip
  cizim.beginPath(); cizim.moveTo(x, zy - ry - 6); cizim.lineTo(x + rx + 4, zy - 5); cizim.lineTo(x, zy + ry - 5); cizim.lineTo(x - rx - 4, zy - 5); cizim.closePath(); cizim.stroke();
  cizim.fillStyle = "#6d4c41";
  for (const [kx, ky] of [[x, zy - ry], [x + rx, zy], [x, zy + ry], [x - rx, zy]]) cizim.fillRect(kx - 1.5, ky - 8, 3, 9);   // kazik
}

// YENI BINA insaati: oran 0..1. Temel -> alttan yukari yukselen duvarlar/cati; iskele binayi biraz geçerek tirmanir.
function spriteInsaatCiz(ad, x, altY, w, h, oran, tas, calisiyor) {
  if (!sprite[ad]) return false;
  const { dw, dh } = spriteOlcu(ad, w, h), im = sprite[ad];
  const zy = altY - dh * (SPRITE_ZEMIN[ad] || 0.15), gorunen = Math.max(0, Math.min(1, oran));
  const iskeleH = Math.min(dh * 1.02, dh * gorunen + 34);
  const gen = dw * 0.86;
  insaatTemeli(x, zy, dw * 0.46, gorunen);
  iskeleDuzlemi(x, altY - 4, gen, iskeleH, 11, -7, true);                                       // arka duzlem (derinlik)
  if (gorunen > 0.02) {                                                                       // yukselen bina (alttan kesit)
    const sh = im.height * gorunen;
    cizim.drawImage(im, 0, im.height - sh, im.width, sh, x - dw / 2, altY - dh * gorunen, dw, dh * gorunen);
  }
  iskeleDuzlemi(x, altY, gen, iskeleH, 0, 0, false);                                           // on duzlem
  iskeleMerdiveni(x, altY, gen, iskeleH);
  malzemeYigini(x - dw * 0.62, altY + 2, tas);
  if (calisiyor) insaatTozu(x, altY + 2);
  return true;
}

// YUKSELTME: bina yerinde durur, etrafi iskele ile sarilir.
function spriteYukseltmeCiz(ad, x, altY, w, h, tas, calisiyor) {
  if (!sprite[ad]) return false;
  const { dw, dh } = spriteOlcu(ad, w, h), gen = dw * 0.9, iskeleH = dh * 0.9;
  iskeleDuzlemi(x, altY - 4, gen, iskeleH, 11, -7, true);
  spriteCiz(ad, x, altY, w, h, true);
  iskeleDuzlemi(x, altY, gen, iskeleH, 0, 0, false);
  iskeleMerdiveni(x, altY, gen, iskeleH);
  malzemeYigini(x - dw * 0.62, altY + 2, tas);
  if (calisiyor) insaatTozu(x, altY + 2);
  return true;
}
