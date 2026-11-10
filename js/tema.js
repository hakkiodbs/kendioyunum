// ============================================================
// DOSYA: js/tema.js
// Arayuz TEMASI: tarihi / ortacag havasi. Ahsap tahta doku (bir kez cizilip onbellege alinir), bronz cerceve, demir kose plakalari,
// percinler, serif yazi tipi. Menu bu yardimcilari kullanir. Doku uretilemezse (test ortami) duz renkle devam eder.
// ============================================================

const TEMA_YAZI = "Georgia, 'Times New Roman', serif";
const TEMA_ALTIN = "#e2b84a", TEMA_KREM = "#e8d9a8";
const temaOnbellek = {};

// Ahsap tahta: yatay tahtalar, damar cizgileri, budaklar, derz izleri.
function temaAhsap(w, h) {
  const anahtar = w + "x" + h;
  if (anahtar in temaOnbellek) return temaOnbellek[anahtar];
  let sonuc = null;
  try {
    if (typeof document !== "undefined" && typeof document.createElement === "function") {
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const g = c.getContext("2d"), rnd = zeminRastgele(1453), tahta = 31;
      g.fillStyle = "#3b2a1a"; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += tahta) {
        const ton = (rnd() - 0.5) * 14;
        g.fillStyle = "rgb(" + Math.round(60 + ton) + "," + Math.round(42 + ton * 0.7) + "," + Math.round(26 + ton * 0.5) + ")";
        g.fillRect(0, y, w, tahta);
        for (let k = 0; k < 26; k++) {                                  // damarlar
          const yy = y + rnd() * tahta;
          g.strokeStyle = rnd() < 0.5 ? "rgba(20,10,0," + (0.08 + rnd() * 0.14) + ")" : "rgba(130,92,54," + (0.06 + rnd() * 0.1) + ")";
          g.lineWidth = 0.5 + rnd() * 0.8;
          g.beginPath(); g.moveTo(0, yy); g.bezierCurveTo(w * 0.3, yy + (rnd() - 0.5) * 3, w * 0.7, yy + (rnd() - 0.5) * 3, w, yy + (rnd() - 0.5) * 2); g.stroke();
        }
        if (rnd() < 0.55) {                                             // budak
          const kx = 30 + rnd() * (w - 60), ky = y + tahta * (0.3 + rnd() * 0.4);
          for (let r = 4; r > 0; r--) { g.strokeStyle = "rgba(20,10,0," + (0.10 + (4 - r) * 0.06) + ")"; g.lineWidth = 1; g.beginPath(); g.ellipse(kx, ky, r * 3.2, r * 1.5, 0, 0, 7); g.stroke(); }
        }
        g.fillStyle = "rgba(0,0,0,0.55)"; g.fillRect(0, y, w, 1.5);        // tahta arasi derz
        g.fillStyle = "rgba(255,220,160,0.07)"; g.fillRect(0, y + 1.5, w, 1);
        const sx = rnd() * w; g.fillStyle = "rgba(0,0,0,0.45)"; g.fillRect(sx, y, 1.5, tahta);   // ek yeri
      }
      const vg = g.createLinearGradient(0, 0, 0, h); vg.addColorStop(0, "rgba(255,230,180,0.08)"); vg.addColorStop(1, "rgba(0,0,0,0.28)");
      g.fillStyle = vg; g.fillRect(0, 0, w, h);
      sonuc = c;
    }
  } catch (e) { sonuc = null; }
  temaOnbellek[anahtar] = sonuc;
  return sonuc;
}

function temaPercin(x, y, r, renk) {
  cizim.fillStyle = "rgba(0,0,0,0.55)"; cizim.beginPath(); cizim.arc(x + 0.5, y + 0.8, r, 0, 7); cizim.fill();
  cizim.fillStyle = renk || "#c79c43"; cizim.beginPath(); cizim.arc(x, y, r, 0, 7); cizim.fill();
  cizim.fillStyle = "rgba(255,245,200,0.7)"; cizim.beginPath(); cizim.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, 7); cizim.fill();
}
function temaBronzCizgi(x, y, w, h, kalin, soluk) {          // dikdortgen: koyu dis cizgi + bronz gradyan
  cizim.strokeStyle = "#140b04"; cizim.lineWidth = kalin + 1.5; cizim.strokeRect(x, y, w, h);
  const lg = cizim.createLinearGradient(x, y, x, y + h);
  if (soluk) { lg.addColorStop(0, "#6a5430"); lg.addColorStop(1, "#4a3a20"); }
  else { lg.addColorStop(0, "#e0bd62"); lg.addColorStop(0.5, "#8a6325"); lg.addColorStop(1, "#c79c43"); }
  cizim.strokeStyle = lg; cizim.lineWidth = kalin; cizim.strokeRect(x, y, w, h);
}

// Ana panel: ahsap + bronz cerceve + demir kose plakalari + ust ortada suslu baklava.
function temaPanel(p) {
  const ah = temaAhsap(Math.round(p.w), Math.round(p.h));
  if (ah) cizim.drawImage(ah, p.x, p.y); else { cizim.fillStyle = "#3b2a1a"; cizim.fillRect(p.x, p.y, p.w, p.h); }
  temaBronzCizgi(p.x + 2, p.y + 2, p.w - 4, p.h - 4, 3, false);
  cizim.strokeStyle = "rgba(0,0,0,0.55)"; cizim.lineWidth = 1; cizim.strokeRect(p.x + 5.5, p.y + 5.5, p.w - 11, p.h - 11);
  for (const [kx, ky] of [[p.x, p.y], [p.x + p.w - 15, p.y], [p.x, p.y + p.h - 15], [p.x + p.w - 15, p.y + p.h - 15]]) {   // demir kose plakalari
    const lg = cizim.createLinearGradient(kx, ky, kx + 15, ky + 15); lg.addColorStop(0, "#7d7d7d"); lg.addColorStop(1, "#3a3a3a");
    cizim.fillStyle = lg; cizim.fillRect(kx, ky, 15, 15);
    cizim.strokeStyle = "#111"; cizim.lineWidth = 1; cizim.strokeRect(kx + 0.5, ky + 0.5, 14, 14);
    temaPercin(kx + 7.5, ky + 7.5, 2.4, "#c79c43");
  }
  const cx = p.x + p.w / 2, cy = p.y + 2;                                  // ust ortada bronz baklava susu
  cizim.fillStyle = "#140b04"; cizim.beginPath(); cizim.moveTo(cx - 14, cy); cizim.lineTo(cx, cy - 7); cizim.lineTo(cx + 14, cy); cizim.lineTo(cx, cy + 7); cizim.closePath(); cizim.fill();
  const lg2 = cizim.createLinearGradient(cx, cy - 6, cx, cy + 6); lg2.addColorStop(0, "#f0d27a"); lg2.addColorStop(1, "#8a6325");
  cizim.fillStyle = lg2; cizim.beginPath(); cizim.moveTo(cx - 11, cy); cizim.lineTo(cx, cy - 5); cizim.lineTo(cx + 11, cy); cizim.lineTo(cx, cy + 5); cizim.closePath(); cizim.fill();
}

// Bina / gelistirme karesi: koyu deri-ahsap zemin, bronz kenar, percinler. ton: normal | ustunde | soluk | secili | yapildi | suruyor
function temaKare(d, ton) {
  const renk = { normal: ["#33281a", "#241a0f"], ustunde: ["#4a3a22", "#33281a"], soluk: ["#1f180f", "#17110a"], secili: ["#2d5126", "#1f3a1a"], yapildi: ["#2d5126", "#1f3a1a"], suruyor: ["#5a4519", "#3f2f10"] }[ton] || ["#33281a", "#241a0f"];
  const lg = cizim.createLinearGradient(d.x, d.y, d.x, d.y + d.h); lg.addColorStop(0, renk[0]); lg.addColorStop(1, renk[1]);
  cizim.fillStyle = lg; cizim.fillRect(d.x, d.y, d.w, d.h);
  cizim.fillStyle = "rgba(0,0,0,0.35)"; cizim.fillRect(d.x, d.y, d.w, 2); cizim.fillRect(d.x, d.y, 2, d.h);     // ic golge (oyuk gorunum)
  cizim.fillStyle = "rgba(255,230,170,0.08)"; cizim.fillRect(d.x, d.y + d.h - 1, d.w, 1);
  const yesil = ton === "secili" || ton === "yapildi";
  if (yesil) { cizim.strokeStyle = "#140b04"; cizim.lineWidth = 4; cizim.strokeRect(d.x + 1, d.y + 1, d.w - 2, d.h - 2); cizim.strokeStyle = "#6fbf5f"; cizim.lineWidth = 2.5; cizim.strokeRect(d.x + 1, d.y + 1, d.w - 2, d.h - 2); }
  else if (ton === "suruyor") { cizim.strokeStyle = "#140b04"; cizim.lineWidth = 4; cizim.strokeRect(d.x + 1, d.y + 1, d.w - 2, d.h - 2); cizim.strokeStyle = "#ffd54f"; cizim.lineWidth = 2.5; cizim.strokeRect(d.x + 1, d.y + 1, d.w - 2, d.h - 2); }
  else temaBronzCizgi(d.x + 1, d.y + 1, d.w - 2, d.h - 2, ton === "ustunde" ? 2.5 : 1.8, ton === "soluk");
  const pr = ton === "soluk" ? "#6a5430" : "#c79c43";
  temaPercin(d.x + 5, d.y + 5, 1.7, pr); temaPercin(d.x + 5, d.y + d.h - 5, 1.7, pr); temaPercin(d.x + d.w - 5, d.y + d.h - 5, 1.7, pr);
}

// Sekme / kucuk dugme: ahsap plaket.
function temaPlaket(r, aktif) {
  const lg = cizim.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
  if (aktif) { lg.addColorStop(0, "#7a5628"); lg.addColorStop(1, "#523818"); } else { lg.addColorStop(0, "#463220"); lg.addColorStop(1, "#2f2114"); }
  cizim.fillStyle = lg; cizim.fillRect(r.x, r.y, r.w, r.h);
  cizim.strokeStyle = "rgba(20,10,0,0.25)"; cizim.lineWidth = 1;
  for (let y = r.y + 5; y < r.y + r.h - 2; y += 5) { cizim.beginPath(); cizim.moveTo(r.x + 2, y); cizim.lineTo(r.x + r.w - 2, y + 0.5); cizim.stroke(); }   // damar
  cizim.fillStyle = "rgba(255,230,170,0.12)"; cizim.fillRect(r.x, r.y, r.w, 1);
  if (aktif) { cizim.strokeStyle = "#140b04"; cizim.lineWidth = 4; cizim.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2); cizim.strokeStyle = "#f0d27a"; cizim.lineWidth = 2.2; cizim.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2); }
  else temaBronzCizgi(r.x + 1, r.y + 1, r.w - 2, r.h - 2, 1.6, true);
}

// Ipucu kutusu: koyu parsomen-ahsap zemin, bronz cift cerceve.
function temaIpucu(x, y, w, h) {
  cizim.fillStyle = "rgba(28,19,10,0.97)"; cizim.fillRect(x, y, w, h);
  temaBronzCizgi(x + 1, y + 1, w - 2, h - 2, 2, false);
  cizim.strokeStyle = "rgba(255,230,170,0.15)"; cizim.lineWidth = 1; cizim.strokeRect(x + 5.5, y + 5.5, w - 11, h - 11);
}

// Dikey suslu ayrac (menunun bolumlerini ayirir).
function temaAyrac(x, y1, y2) {
  const lg = cizim.createLinearGradient(x, y1, x, y2); lg.addColorStop(0, "rgba(199,156,67,0)"); lg.addColorStop(0.5, "rgba(199,156,67,0.9)"); lg.addColorStop(1, "rgba(199,156,67,0)");
  cizim.fillStyle = lg; cizim.fillRect(x, y1, 2, y2 - y1);
  const cy = (y1 + y2) / 2; cizim.fillStyle = "#c79c43"; cizim.beginPath(); cizim.moveTo(x + 1, cy - 5); cizim.lineTo(x + 5, cy); cizim.lineTo(x + 1, cy + 5); cizim.lineTo(x - 3, cy); cizim.closePath(); cizim.fill();
}
