// ============================================================
// DOSYA: js/ustbar.js
// UST CUBUK (tarihi tema): ekranin ustunde boydan boya. Solda oyuncu profili, yaninda envanter (odun, tas, isci),
// ortada Ayarlar dugmesi, sagda koy durumu (koy/duvar seviyesi, oyun hizi, gecen sure). Yeni kaynaklar (yiyecek...) buraya eklenir.
// ============================================================

// Kucuk ikonlar (kod ile cizilir). cx, cy ikonun merkezi, kutu yaklasik 22x22.
function ustIkon(tur, cx, cy) {
  const g = cizim;
  if (tur === "odun") {
    for (const [dx, dy] of [[-5, 4], [5, 4], [0, -4]]) {
      g.fillStyle = "#6b4423"; g.fillRect(cx + dx - 8, cy + dy - 4, 16, 8);
      g.fillStyle = "#c9a06a"; g.beginPath(); g.ellipse(cx + dx + 8, cy + dy, 3, 4, 0, 0, 7); g.fill();
      g.strokeStyle = "#3a2410"; g.lineWidth = 1; g.beginPath(); g.ellipse(cx + dx + 8, cy + dy, 3, 4, 0, 0, 7); g.stroke();
    }
  } else if (tur === "tas") {
    g.fillStyle = "#8d8d8d"; g.beginPath(); g.moveTo(cx - 10, cy + 7); g.lineTo(cx - 6, cy - 6); g.lineTo(cx + 3, cy - 9); g.lineTo(cx + 10, cy - 1); g.lineTo(cx + 8, cy + 7); g.closePath(); g.fill();
    g.fillStyle = "#b5b5b5"; g.beginPath(); g.moveTo(cx - 6, cy - 6); g.lineTo(cx + 3, cy - 9); g.lineTo(cx + 2, cy - 1); g.lineTo(cx - 6, cy + 1); g.closePath(); g.fill();
    g.strokeStyle = "#3d3d3d"; g.lineWidth = 1; g.beginPath(); g.moveTo(cx - 10, cy + 7); g.lineTo(cx - 6, cy - 6); g.lineTo(cx + 3, cy - 9); g.lineTo(cx + 10, cy - 1); g.lineTo(cx + 8, cy + 7); g.closePath(); g.stroke();
  } else if (tur === "tahta") {
    for (let i = 0; i < 3; i++) {
      const y = cy - 9 + i * 6;
      g.fillStyle = i % 2 ? "#c99a5b" : "#d8ab6a"; g.fillRect(cx - 10 + (i % 2) * 2, y, 18, 5);
      g.strokeStyle = "#5a3a1a"; g.lineWidth = 1; g.strokeRect(cx - 9.5 + (i % 2) * 2, y + 0.5, 17, 4);
      g.fillStyle = "rgba(90,58,26,0.5)"; g.fillRect(cx - 6 + (i % 2) * 2, y + 2, 8, 1);
    }
  } else if (tur === "altin") {
    for (const [dx, dy] of [[-4, 3], [4, 3], [0, -4]]) {
      const lg = g.createLinearGradient(cx + dx - 6, cy + dy - 6, cx + dx + 6, cy + dy + 6); lg.addColorStop(0, "#fff2a8"); lg.addColorStop(1, "#c79a14");
      g.fillStyle = lg; g.beginPath(); g.ellipse(cx + dx, cy + dy, 6, 5, 0, 0, 7); g.fill();
      g.strokeStyle = "#7a5a08"; g.lineWidth = 1; g.beginPath(); g.ellipse(cx + dx, cy + dy, 6, 5, 0, 0, 7); g.stroke();
    }
  } else if (tur === "et") {
    g.fillStyle = "#f2ead8"; g.fillRect(cx + 1, cy + 2, 11, 3); g.beginPath(); g.arc(cx + 12, cy + 2, 2.2, 0, 7); g.arc(cx + 12, cy + 5, 2.2, 0, 7); g.fill();
    g.fillStyle = "#b5483a"; g.beginPath(); g.ellipse(cx - 3, cy - 1, 9, 7, -0.3, 0, 7); g.fill();
    g.fillStyle = "#d66b5a"; g.beginPath(); g.ellipse(cx - 5, cy - 3, 4, 3, -0.3, 0, 7); g.fill();
    g.strokeStyle = "#5a1d14"; g.lineWidth = 1; g.beginPath(); g.ellipse(cx - 3, cy - 1, 9, 7, -0.3, 0, 7); g.stroke();
  } else if (tur === "isci") {
    g.fillStyle = "#e0b48a"; g.beginPath(); g.arc(cx, cy - 4, 5, 0, 7); g.fill();
    g.fillStyle = "#a0522d"; g.beginPath(); g.moveTo(cx - 9, cy + 9); g.quadraticCurveTo(cx, cy - 5, cx + 9, cy + 9); g.closePath(); g.fill();
    g.strokeStyle = "#3a2410"; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy - 4, 5, 0, 7); g.stroke();
  } else if (tur === "koy") {
    g.fillStyle = "#8a1c1c"; g.beginPath(); g.moveTo(cx - 8, cy - 9); g.lineTo(cx + 8, cy - 9); g.lineTo(cx + 8, cy + 1); g.quadraticCurveTo(cx + 8, cy + 8, cx, cy + 10); g.quadraticCurveTo(cx - 8, cy + 8, cx - 8, cy + 1); g.closePath(); g.fill();
    g.strokeStyle = "#e2b84a"; g.lineWidth = 1.6; g.stroke();
    g.fillStyle = "#e2b84a"; g.fillRect(cx - 1, cy - 6, 2, 12); g.fillRect(cx - 5, cy - 2, 10, 2);
  } else if (tur === "duvar") {
    g.fillStyle = "#8d8d8d"; g.fillRect(cx - 10, cy - 3, 20, 12);
    for (let i = 0; i < 3; i++) g.fillRect(cx - 10 + i * 8, cy - 8, 4, 5);
    g.strokeStyle = "#444"; g.lineWidth = 1; g.strokeRect(cx - 9.5, cy - 2.5, 19, 11);
    g.beginPath(); g.moveTo(cx - 10, cy + 3); g.lineTo(cx + 10, cy + 3); g.moveTo(cx - 3, cy - 3); g.lineTo(cx - 3, cy + 3); g.moveTo(cx + 4, cy + 3); g.lineTo(cx + 4, cy + 9); g.stroke();
  } else if (tur === "hiz") {
    g.fillStyle = "#e2b84a";
    for (let i = 0; i < 2; i++) { const x = cx - 8 + i * 9; g.beginPath(); g.moveTo(x, cy - 7); g.lineTo(x + 8, cy); g.lineTo(x, cy + 7); g.closePath(); g.fill(); }
  } else if (tur === "sure") {
    g.fillStyle = "#e8d9a8";
    g.beginPath(); g.moveTo(cx - 6, cy - 9); g.lineTo(cx + 6, cy - 9); g.lineTo(cx + 1, cy); g.lineTo(cx + 6, cy + 9); g.lineTo(cx - 6, cy + 9); g.lineTo(cx - 1, cy); g.closePath(); g.fill();
    g.fillStyle = "#c79c43"; g.fillRect(cx - 8, cy - 10, 16, 2); g.fillRect(cx - 8, cy + 8, 16, 2);
  }
}

// Envanter kutusu: ikon + kucuk etiket + deger.
function ustCip(x, w, ikon, etiket, deger, renk) {
  const y = 6, h = UST_YUK - 14;
  const lg = cizim.createLinearGradient(x, y, x, y + h); lg.addColorStop(0, "#2c2115"); lg.addColorStop(1, "#1b140c");
  cizim.fillStyle = lg; cizim.fillRect(x, y, w, h);
  cizim.fillStyle = "rgba(0,0,0,0.4)"; cizim.fillRect(x, y, w, 2);
  temaBronzCizgi(x + 0.5, y + 0.5, w - 1, h - 1, 1.5, false);
  ustIkon(ikon, x + 16, y + h / 2);
  cizim.textAlign = "left";
  cizim.fillStyle = "#b9a679"; cizim.font = "10px " + TEMA_YAZI; cizim.fillText(etiket, x + 32, y + 13);
  cizim.fillStyle = renk || "#fff"; cizim.font = "bold 15px " + TEMA_YAZI; cizim.fillText(deger, x + 32, y + h - 6);
}

function ustSure(sn) {
  sn = Math.max(0, Math.floor(sn));
  const s = sn % 60, d = Math.floor(sn / 60) % 60, sa = Math.floor(sn / 3600);
  return (sa > 0 ? sa + ":" + String(d).padStart(2, "0") : d) + ":" + String(s).padStart(2, "0");
}

// Profil: madalyon (bronz halkali, basit siluet) + ad + unvan.
function ustProfil(x) {
  const cy = UST_YUK / 2 - 1;
  cizim.fillStyle = "#140b04"; cizim.beginPath(); cizim.arc(x + 21, cy, 20, 0, 7); cizim.fill();
  const lg = cizim.createLinearGradient(x, cy - 19, x, cy + 19); lg.addColorStop(0, "#f0d27a"); lg.addColorStop(0.5, "#8a6325"); lg.addColorStop(1, "#c79c43");
  cizim.fillStyle = lg; cizim.beginPath(); cizim.arc(x + 21, cy, 18.5, 0, 7); cizim.fill();
  cizim.fillStyle = "#33281a"; cizim.beginPath(); cizim.arc(x + 21, cy, 15, 0, 7); cizim.fill();
  cizim.save(); cizim.beginPath(); cizim.arc(x + 21, cy, 15, 0, 7); cizim.clip();       // siluet: bas + omuzlar
  cizim.fillStyle = "#6b5a3a"; cizim.beginPath(); cizim.arc(x + 21, cy - 3, 6, 0, 7); cizim.fill();
  cizim.beginPath(); cizim.moveTo(x + 5, cy + 16); cizim.quadraticCurveTo(x + 21, cy - 6, x + 37, cy + 16); cizim.closePath(); cizim.fill();
  cizim.restore();
  cizim.textAlign = "left";
  cizim.fillStyle = "rgba(0,0,0,0.7)"; cizim.font = "bold 16px " + TEMA_YAZI; cizim.fillText(OYUNCU_ADI, x + 47, cy - 1);
  cizim.fillStyle = TEMA_ALTIN; cizim.fillText(OYUNCU_ADI, x + 46, cy - 2);
  cizim.fillStyle = "#c9b88a"; cizim.font = "italic 11px " + TEMA_YAZI; cizim.fillText(OYUNCU_UNVAN, x + 46, cy + 13);
}

function cizUstCubuk() {
  const w = DUNYA_GEN, h = UST_YUK;
  const ah = temaAhsap(w, h);
  if (ah) cizim.drawImage(ah, 0, 0); else { cizim.fillStyle = "#3b2a1a"; cizim.fillRect(0, 0, w, h); }
  cizim.fillStyle = "rgba(0,0,0,0.6)"; cizim.fillRect(0, h - 6, w, 6);                    // alt serit: bronz suslu
  const lg = cizim.createLinearGradient(0, h - 5, 0, h); lg.addColorStop(0, "#e0bd62"); lg.addColorStop(0.5, "#8a6325"); lg.addColorStop(1, "#c79c43");
  cizim.fillStyle = lg; cizim.fillRect(0, h - 5, w, 4);
  cizim.fillStyle = "#140b04"; cizim.fillRect(0, h - 1, w, 1); cizim.fillRect(0, 0, w, 1);
  for (let x = 40; x < w; x += 80) temaPercin(x, h - 3, 1.5, "#f0d27a");
  const cx = w / 2;                                                                       // alt ortada baklava
  cizim.fillStyle = "#140b04"; cizim.beginPath(); cizim.moveTo(cx - 16, h - 3); cizim.lineTo(cx, h + 3); cizim.lineTo(cx + 16, h - 3); cizim.lineTo(cx, h - 9); cizim.closePath(); cizim.fill();
  cizim.fillStyle = "#c79c43"; cizim.beginPath(); cizim.moveTo(cx - 12, h - 3); cizim.lineTo(cx, h + 1); cizim.lineTo(cx + 12, h - 3); cizim.lineTo(cx, h - 7); cizim.closePath(); cizim.fill();

  ustProfil(12);
  temaAyrac(168, 8, h - 10);
  let x = 180;
  for (const k of KAYNAKLAR) { ustCip(x, 92, k.id, k.ad.toUpperCase(), String(Math.floor(kaynakDeger(k.id)))); x += 96; }      // envanter: odun, tahta, tas, altin, et
  const dolu = isciler.length >= isciSiniri();
  ustCip(x, 92, "isci", "İŞÇİ", isciler.length + " / " + isciSiniri(), dolu ? "#ffb74d" : "#fff");
  let sx = DUNYA_GEN - 12 - 90 - 90 - 76 - 92 - 3 * 4;
  temaAyrac(sx - 10, 8, h - 10);
  ustCip(sx, 90, "koy", "KÖY", String(koySeviyesi()), TEMA_ALTIN); sx += 94;
  ustCip(sx, 90, "duvar", "DUVAR", duvarSeviye + " / " + DUVAR_MAX_SEVIYE); sx += 94;
  ustCip(sx, 76, "hiz", "HIZ", oyunHizi + "×"); sx += 80;
  ustCip(sx, 92, "sure", "SÜRE", ustSure(oyunSaati));
}
