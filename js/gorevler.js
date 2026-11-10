// ============================================================
// DOSYA: js/gorevler.js
// Gorev sistemi: sirayla gelen gorevler, ilerleme, odul, bildirim yazisi.
// KOMUT/MANTIK: gorevBaslat, gorevleriKontrolEt, odulVer.  DURUM: gorevIndex, tamamlananGorevler (durum.js).
// Bir gorev bitince ayni gorev bir daha gelmez (id tamamlananGorevler'e yazilir).
// ============================================================

function aktifGorev() { return GOREVLER[gorevIndex] || null; }

function gorevIlerleme(g) {
  switch (g.tur) {
    case "ev":           return ev ? 1 : 0;
    case "isci":         return isciler.length;
    case "duvar":        return duvarSeviye;
    case "oduncu":       return kamplar.filter(k => k.tur === "oduncu" && kampHazir(k)).length;
    case "ocak":         return kamplar.filter(k => k.tur === "ocak" && kampHazir(k)).length;
    case "odunToplanan": return toplanan.odun - gorevTaban.odun;
    case "tasToplanan":  return toplanan.tas - gorevTaban.tas;
  }
  return 0;
}
function gorevTamam(g) { return gorevIlerleme(g) >= g.hedef; }

function gorevTabaniAl() { gorevTaban = { odun: toplanan.odun, tas: toplanan.tas }; }

function odulMetni(o) { return KAYNAKLAR.filter(k => o[k.id]).map(k => "+" + o[k.id] + " " + k.kucuk).join(", "); }
function odulVer(o) {          // oduller stoka eklenir ama "toplanan" sayilmaz
  for (const k of KAYNAKLAR) if (o[k.id]) kaynakAyarla(k.id, kaynakDeger(k.id) + o[k.id]);
}

function gorevBildir(baslik, alt, renk) {
  // Siradaki eski "Yeni Gorev" yazilari eskimistir (o gorev zaten bitti): at. Kuyruk en fazla 4 yazi.
  for (let i = gorevBildirimleri.length - 1; i >= 1; i--) if (gorevBildirimleri[i].baslik === "Yeni Görev") gorevBildirimleri.splice(i, 1);
  gorevBildirimleri.push({ baslik, alt, renk, sure: GOREV_BILDIRIM_SURESI });
  while (gorevBildirimleri.length > 4) gorevBildirimleri.splice(1, 1);
}

// Oyun "BASLA" ile baslayinca ilk gorev de baslar.
function gorevBaslat() {
  gorevIndex = 0;
  tamamlananGorevler.length = 0;
  if (YENI_BASLANGIC) tamamlananGorevler.push("ev");      // ev zaten kurulu geliyor: "Bir ev yap" gorevi atlanir
  gorevBildirimleri.length = 0;
  gorevTabaniAl();
  const g = aktifGorev();
  if (g) gorevBildir("Yeni Görev", g.ad, "#90caf9");
}

// Her karede cagrilir: aktif gorev bittiyse odul ver, siradakine gec. Ayni gorev ikinci kez verilmez.
function gorevleriKontrolEt() {
  if (!basladi) return;
  let g = aktifGorev();
  while (g) {
    if (tamamlananGorevler.includes(g.id)) { gorevIndex++; g = aktifGorev(); continue; }   // emniyet: bitmis gorev tekrar gelmez
    if (!gorevTamam(g)) break;
    tamamlananGorevler.push(g.id);
    odulVer(g.odul);
    gorevIndex++;
    gorevTabaniAl();
    gorevBildir("Görev Tamamlandı!", g.ad + "   Ödül: " + odulMetni(g.odul), "#ffd54f");
    g = aktifGorev();
    if (g) gorevBildir("Yeni Görev", g.ad, "#90caf9");
    else gorevBildir("Tüm görevler tamamlandı!", "Köyün artık kendi ayaklarının üstünde", "#69f0ae");
  }
}

function gorevBildirimiGuncelle() {
  if (gorevBildirimleri.length === 0) return;
  gorevBildirimleri[0].sure -= dt;
  if (gorevBildirimleri[0].sure <= 0) gorevBildirimleri.shift();
}

// Ekranin ustunde (tebrik seridinin altinda) kisa bildirim.
function cizGorevBildirimi() {
  const b = gorevBildirimleri[0];
  if (!b) return;
  const gen = 520, h = 70, x = (DUNYA_GEN - gen) / 2, y = 170;
  cizim.globalAlpha = Math.min(1, b.sure / 0.4);          // son 0.4 sn'de silinir
  cizim.fillStyle = "rgba(15, 30, 15, 0.9)";
  cizim.fillRect(x, y, gen, h);
  cizim.strokeStyle = b.renk;
  cizim.lineWidth = 3;
  cizim.strokeRect(x + 1.5, y + 1.5, gen - 3, h - 3);
  cizim.textAlign = "center";
  cizim.fillStyle = b.renk;
  cizim.font = "bold 24px sans-serif";
  cizim.fillText(b.baslik, DUNYA_GEN / 2, y + 30);
  cizim.fillStyle = "#fff";
  cizim.font = "18px sans-serif";
  cizim.fillText(b.alt, DUNYA_GEN / 2, y + 55);
  cizim.textAlign = "left";
  cizim.globalAlpha = 1;
}
