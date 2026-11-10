// ============================================================
// DOSYA: js/insan.js
// Insan cizimi: kahraman ve iscilerin ortak govdesi (kod ile cizilmis).
// Ayak (cx, fy) noktasindadir. s = buyuklugu, yon = 1 saga / -1 sola bakar.
// ============================================================

function cizCizgi(x1, y1, x2, y2, kalinlik, renk) {
  cizim.strokeStyle = renk;
  cizim.lineWidth = kalinlik;
  cizim.lineCap = "round";
  cizim.beginPath();
  cizim.moveTo(x1, y1);
  cizim.lineTo(x2, y2);
  cizim.stroke();
}

// Yururken bacak/kol salinir, toplarken alet (balta/kazma) sallar.
function cizInsan(cx, fy, s, yon, yuruyor, topluyor, anim, gomlek, cins) {
  const kadin = cins === "kadin";
  cizim.save();
  cizim.translate(cx, fy);
  cizim.scale(s * yon, s);               // yon -1 ise ayna: hep saga bakiyormus gibi ciziyoruz
  const salin = yuruyor ? Math.sin(anim * 10) : 0;
  const TEN = "#e0ac82";

  cizim.fillStyle = "rgba(0,0,0,0.25)";                                  // golge
  cizim.beginPath();
  cizim.ellipse(0, 0, 11, 4, 0, 0, Math.PI * 2);
  cizim.fill();

  cizCizgi(0, -14, -salin * 6, -1, 5, "#243049");                        // arka bacak
  cizCizgi(0, -29, salin * 6, -16, 4, "#c9956b");                        // arka kol

  cizim.fillStyle = gomlek;                                              // govde
  cizim.beginPath();
  if (cizim.roundRect) cizim.roundRect(-7, -31, 14, 18, 4); else cizim.rect(-7, -31, 14, 18);
  cizim.fill();
  cizim.fillStyle = "#5d4037";                                           // kemer
  cizim.fillRect(-7, -16, 14, 3);

  cizCizgi(0, -14, salin * 6, -1, 5, "#2f3e5e");                         // on bacak
  cizCizgi(salin * 6, -1, salin * 6 + 4, 0, 4, "#3e2723");               // ayakkabi
  if (kadin) {                                                           // elbise etegi (gomlek renginde)
    cizim.fillStyle = gomlek;
    cizim.beginPath();
    cizim.moveTo(-7, -16); cizim.lineTo(7, -16); cizim.lineTo(11, -5); cizim.lineTo(-11, -5);
    cizim.closePath();
    cizim.fill();
  }

  if (topluyor) {                                                        // on kol: alet sallar
    const sallan = Math.sin(anim * 9);
    const ex = 9 + 4 * sallan, ey = -35 + 14 * Math.max(0, sallan);
    cizCizgi(0, -29, ex, ey, 4, TEN);
    cizCizgi(ex, ey, ex + 5, ey - 9, 2, "#6d4c41");                      // sap
    cizim.fillStyle = "#9e9e9e";
    cizim.fillRect(ex, ey - 12, 7, 4);                                   // alet basi
  } else {
    cizCizgi(0, -29, -salin * 6, -16, 4, TEN);
  }

  cizCizgi(0, -30, 0, -34, 4, TEN);                                      // boyun
  if (kadin) {                                                           // arkadan uzun sac
    cizim.fillStyle = "#3b2a1f";
    cizim.beginPath();
    if (cizim.roundRect) cizim.roundRect(-10, -45, 9, 20, 4); else cizim.rect(-10, -45, 9, 20);
    cizim.fill();
  }
  cizim.fillStyle = TEN;                                                 // bas
  cizim.beginPath();
  cizim.arc(0, -40, 7, 0, Math.PI * 2);
  cizim.fill();
  cizim.fillStyle = "#3b2a1f";                                           // sac
  cizim.beginPath();
  cizim.arc(-1, -41, 7.4, Math.PI * 1.02, Math.PI * 2);
  cizim.fill();
  cizim.fillStyle = "#222";                                              // goz
  cizim.beginPath();
  cizim.arc(3, -39, 1.1, 0, Math.PI * 2);
  cizim.fill();
  cizim.restore();
}
