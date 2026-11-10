// ============================================================
// DOSYA: js/arayuz.js
// Ekran yazilari: gorev paneli, giris/tanitim ekrani, bitis ekrani.
// ============================================================

// ---- Ev dikilince kisa tebrik yazisi (oyun devam eder) ----
function tebrikGoster() {
  return ev !== null && performance.now() - bitisZamani < TEBRIK_SURESI * 1000;
}

function cizTebrik() {
  if (!tebrikGoster()) return;
  const y0 = 90, h = 60;
  cizim.fillStyle = "rgba(0, 0, 0, 0.7)";
  cizim.fillRect(0, y0, DUNYA_GEN, h);
  cizim.textAlign = "center";
  cizim.fillStyle = "#fff";
  cizim.font = "bold 30px sans-serif";
  cizim.fillText(TEBRIK_YAZISI, DUNYA_GEN / 2, y0 + 40);
}

// ---- Sag ust: gorev paneli (aktif gorev: GOREVLER listesinden) ----
function gorevSatirlari(g) {         // [{metin, renk}] : ilerleme satirlari + ipucu
  const L = [];
  const yesil = "#69f0ae", kirmizi = "#ff8a80";
  if (g.tur === "ev") {
    L.push({ metin: "Odun: " + odun + " / " + EV_ICIN_ODUN, renk: odun >= EV_ICIN_ODUN ? yesil : kirmizi });
    L.push({ metin: "Taş: " + tas + " / " + EV_ICIN_TAS, renk: tas >= EV_ICIN_TAS ? yesil : kirmizi });
    if (evYeterli()) L.push({ metin: "Evini kurabilirsin! (B ya da menü)", renk: "#fff", kucuk: true });
    return L;
  }
  const n = Math.min(gorevIlerleme(g), g.hedef);
  const ad = { isci: "İşçi", duvar: "Köy Duvarı", oduncu: "Oduncu Kampı", ocak: "Taş Ocağı", odunToplanan: "Odun", tasToplanan: "Taş" }[g.tur];
  L.push({ metin: ad + ": " + n + " / " + g.hedef, renk: n >= g.hedef ? yesil : kirmizi });
  const ipucu = {
    isci: "Evi seç, Erkek/Kadın düğmesine bas (" + ISCI_MALIYETI_ODUN + " odun)",
    duvar: "Menüden Köy Duvarı'na tıkla (" + duvarMaliyet(1).odun + " odun)",
    oduncu: "Menüden seç, ağaçlara yakın kur (" + binaTanimi("oduncu").odun + " odun)",
    ocak: "Menüden seç, kayalara yakın kur (" + binaTanimi("ocak").odun + " odun)",
    odunToplanan: "Ağaca sağ tıkla, kahraman toplasın",
    tasToplanan: "Kayaya sağ tıkla, kahraman toplasın"
  }[g.tur];
  if (ipucu) L.push({ metin: ipucu, renk: "#fff", kucuk: true });
  return L;
}

// Metni, verilen genislige sigmayacaksa alt satirlara boler (kelime kelime). Once cizim.font ayarlanmis olmali.
function metniSar(metin, genislik) {
  const satirlar = [];
  let simdiki = "";
  for (const kelime of metin.split(" ")) {
    const deneme = simdiki ? simdiki + " " + kelime : kelime;
    if (simdiki && cizim.measureText(deneme).width > genislik) { satirlar.push(simdiki); simdiki = kelime; }
    else simdiki = deneme;
  }
  if (simdiki) satirlar.push(simdiki);
  return satirlar;
}

function cizGorevPaneli() {
  const gen = 270, ic = gen - 24;          // ic: yazinin sigacagi genislik
  const x0 = DUNYA_GEN - gen - 16;
  const y0 = UST_YUK + 10;
  const g = aktifGorev();
  const girdiler = [];                      // [{metin, renk, font, aralik}] : her biri gerekirse alt satirlara bolunur
  girdiler.push({ metin: g ? "GÖREV " + (gorevIndex + 1) + "/" + GOREVLER.length + ": " + g.ad : "TÜM GÖREVLER BİTTİ", renk: "#fff", font: "bold 17px sans-serif", aralik: 22, bosluk: 8 });
  const satirlar = g ? gorevSatirlari(g) : [{ metin: "Hepsi tamam, aferin!", renk: "#69f0ae" }];
  for (const s of satirlar) girdiler.push({ metin: s.metin, renk: s.renk, font: s.kucuk ? "14px sans-serif" : "18px sans-serif", aralik: s.kucuk ? 18 : 24, bosluk: 6 });
  if (g) girdiler.push({ metin: "Ödül: " + odulMetni(g.odul), renk: "#ffd54f", font: "bold 14px sans-serif", aralik: 18, bosluk: 0 });

  let yuk = 18;                             // ust bosluk; once yuksekligi hesapla
  for (const e of girdiler) {
    cizim.font = e.font;
    e.satirlar = metniSar(e.metin, ic);
    yuk += e.satirlar.length * e.aralik + e.bosluk;
  }
  yuk += 8;

  cizim.fillStyle = "rgba(0, 0, 0, 0.55)";
  cizim.fillRect(x0, y0, gen, yuk);
  cizim.textAlign = "left";
  let y = y0 + 18;
  for (const e of girdiler) {
    cizim.font = e.font;
    cizim.fillStyle = e.renk;
    for (const satir of e.satirlar) { y += e.aralik; cizim.fillText(satir, x0 + 12, y - 4); }
    y += e.bosluk;
  }
}

// ---- Giris / tanitim ekrani ----
function butonAlani() {
  const w = 220, h = 56;
  return { x: DUNYA_GEN / 2 - w / 2, y: DUNYA_YUK / 2 + 105, w: w, h: h };
}

function cizGiris() {
  if (basladi) return;
  const cx = DUNYA_GEN / 2;
  const cy = DUNYA_YUK / 2;
  cizim.fillStyle = "rgba(20, 30, 20, 0.94)";
  cizim.fillRect(0, 0, DUNYA_GEN, DUNYA_YUK);
  cizim.textAlign = "center";
  cizim.fillStyle = "#fff";
  cizim.font = "bold 48px sans-serif";
  cizim.fillText("İlk Gün", cx, cy - 190);

  cizim.fillStyle = "#ffd54f";
  cizim.font = "bold 22px sans-serif";
  cizim.fillText("NASIL OYNANIR", cx, cy - 135);
  cizim.fillStyle = "#fff";
  cizim.font = "20px sans-serif";
  cizim.fillText("Seç: birime sol tıkla, ya da sürükleyip kutu çiz (Shift: ekle).  Yürüt: yere sağ tıkla", cx, cy - 98);
  cizim.fillText("Toplama: seçili birimle ağaca (odun) ya da kayaya (taş) sağ tıkla", cx, cy - 64);
  cizim.fillText("İnşaat: alttaki menüden bina seç (B ev, " + TUS_DUVAR.toUpperCase() + " köy duvarı (tek tık), O oduncu kampı, T taş ocağı), fareyle yerleştir", cx, cy - 30);
  cizim.fillText("İşçi: evine tıkla, Erkek ya da Kadın düğmesine bas (" + TUS_ISCI.toUpperCase() + " tuşu sırayla çıkarır). İşçiler kendisi toplar", cx, cy + 4);

  cizim.fillStyle = "#ffd54f";
  cizim.font = "bold 22px sans-serif";
  cizim.fillText("GÖREVİN", cx, cy + 46);
  cizim.fillStyle = "#fff";
  cizim.font = "20px sans-serif";
  cizim.fillText("Evini kur, sonra işçilerini çalıştır.", cx, cy + 78);

  const b = butonAlani();
  cizim.fillStyle = "#66bb6a";
  cizim.fillRect(b.x, b.y, b.w, b.h);
  cizim.fillStyle = "#12261a";
  cizim.font = "bold 28px sans-serif";
  cizim.fillText("BAŞLA", cx, b.y + 38);
  cizim.fillStyle = "#bbb";
  cizim.font = "15px sans-serif";
  cizim.fillText("(butona tıkla veya Enter'a bas)", cx, b.y + b.h + 24);
}
