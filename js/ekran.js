// ============================================================
// DOSYA: js/ekran.js
// Ekran: oyun dunyasi herkes icin ayni boyutta (DUNYA_GEN x DUNYA_YUK).
// Pencereye orani bozulmadan sigdirilir (kucuk, buyuk, genis monitor fark etmez).
// Retina / 4K ekranlarda keskin cizilir. Pencere boyutu degisince kendisi ayarlanir.
// ============================================================

let olcek = 1;          // dunya -> ekran (CSS piksel) carpani
let cizimOlcegi = 1;    // dunya -> gercek piksel carpani (olcek x ekran yogunlugu)

function ayarlaEkran() {
  const yogunluk = window.devicePixelRatio || 1;
  if (TAM_EKRAN) {
    olcek = Math.min(window.innerWidth / DUNYA_GEN, window.innerHeight / DUNYA_YUK);
    document.querySelector("h3").style.display = "none";
    document.querySelector("p").style.display = "none";
    document.body.style.overflow = "hidden";
    document.body.style.background = "#111";            // siyah seritler
    tuval.style.position = "absolute";
    tuval.style.margin = "0";
    tuval.style.border = "none";
    tuval.style.left = Math.round((window.innerWidth - DUNYA_GEN * olcek) / 2) + "px";
    tuval.style.top = Math.round((window.innerHeight - DUNYA_YUK * olcek) / 2) + "px";
  } else {
    olcek = 1;
  }
  tuval.style.width = Math.round(DUNYA_GEN * olcek) + "px";
  tuval.style.height = Math.round(DUNYA_YUK * olcek) + "px";
  tuval.width = Math.round(DUNYA_GEN * olcek * yogunluk);     // gercek piksel sayisi
  tuval.height = Math.round(DUNYA_YUK * olcek * yogunluk);
  cizimOlcegi = olcek * yogunluk;
}

addEventListener("resize", ayarlaEkran);
ayarlaEkran();
