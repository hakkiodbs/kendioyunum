// ============================================================
// DOSYA: js/isci.js
// Isciler: ev kurulunca N tusu ile uretilir (AoE tarzi).
// Isci kaynaga YAVAS yurur, BIRIM BIRIM toplar, yuku dolunca eve getirir.
// Durumlar: ara -> git -> topla -> don -> (tekrar) ara
// Hizlar GERCEK ZAMANA baglidir (ekran kac Hz olursa olsun ayni hiz).
// ============================================================

// KOMUT: isci uret. cins: "erkek" | "kadin" (verilmezse sirayla degisir: erkek, kadin, erkek...).
// Ev olmali, yer ve odun olmali. Is turu sirayla degisir: odun, tas, odun, tas...
function sonrakiCins() {
  const e = isciler.filter(i => i.cins === "erkek").length, k = isciler.length - e;
  return e <= k ? "erkek" : "kadin";
}
function isciUret(cins) {
  if (!ev) return false;
  if (isciler.length >= isciSiniri()) return false;
  if (!maliyetYeter(ISCI_MALIYET)) return false;
  maliyetOde(ISCI_MALIYET);
  return isciOlustur(cins);
}
// Maliyetsiz cekirdek: iscinin kendisini yaratir (baslangic iscileri de bununla gelir).
function isciOlustur(cins) {
  if (cins !== "erkek" && cins !== "kadin") cins = sonrakiCins();
  const liste = cins === "kadin" ? KADIN_ISIMLERI : ERKEK_ISIMLERI;
  const sayi = isciler.filter(i => i.cins === cins).length;
  isciler.push({
    x: ev.x, y: ev.y + 24,
    cins, ad: liste[sayi % liste.length],
    tur: isciler.length % 2 === 0 ? "agac" : "kaya",
    durum: "ara", hedef: null, sayac: 0, tasiyor: 0,
    yon: 1, yuruyor: false, anim: isciler.length * 0.7,   // animasyon icin
    secili: false, nokta: null, siradaki: null            // secim + el ile verilen emirler
  });
  return true;
}

// Kamp seviyesi bonusu: ilgili turun en yuksek seviyeli HAZIR kampi (yoksa 0). Toplama hizi ve tasima kapasitesini artirir.
function kampSeviyesi(kaynakTur) {
  let s = 0;
  for (const k of kamplar) if (kampHazir(k) && KAMP_TURLERI[k.tur].kaynak === kaynakTur) s = Math.max(s, kampSeviyesiOf(k));
  return s;
}
function toplamaSuresi(i) { const s = kampSeviyesi(i.tur); return ISCI_TOPLAMA_SURESI / ((s > 1 ? 1 + KAMP_HIZ_ARTIS * (s - 1) : 1) * (1 + gelEtki("hiz", i.tur))); }
function tasimaKapasitesi(i) { return ISCI_TASIMA + Math.floor(kampSeviyesi(i.tur) / KAMP_YUK_ADIM) + gelEtki("tasima", i.tur); }

// Pasif uretim: kampin kendi basina urettigi kaynak. Kamp seviyesi hizi artirir.
function pasifAralik(k) { return (k.tur === "avci" ? AVCI_ARALIK : PASIF_ARALIK) / ((1 + PASIF_SEVIYE_ARTIS * (kampSeviyesiOf(k) - 1)) * (1 + gelEtki("pasif", KAMP_TURLERI[k.tur].kaynak))); }
function pasifUretimGuncelle() {
  const adim = dt * oyunHizi;
  const goster = (k, metin, renk) => { k.yuzT = 0; k.yuzMetin = metin; k.yuzRenk = renk; };
  for (const k of kamplar) {
    if (k.yuzT !== undefined) k.yuzT += dt;                       // yuzen yazi zamanlayicisi (gercek zaman)
    if (!kampHazir(k)) continue;
    const kay = KAMP_TURLERI[k.tur].kaynak, kat = 1 + PASIF_SEVIYE_ARTIS * (kampSeviyesiOf(k) - 1);
    k.pasifSayac = (k.pasifSayac || 0) + adim;
    const aralik = pasifAralik(k);
    while (k.pasifSayac >= aralik) {                              // temel uretim: odun / tas / et
      k.pasifSayac -= aralik;
      kaynakEkle(kay, 1);
      goster(k, "+1 " + (kay === "agac" ? "odun" : kay === "kaya" ? "taş" : "et"), kay === "agac" ? "#a5d6a7" : kay === "kaya" ? "#e0e0e0" : "#ef9a9a");
    }
    if (k.tur === "oduncu" && arastirilan.testere) {              // Testere: fazla odunu tahtaya cevirir
      k.tahtaSayac = (k.tahtaSayac || 0) + adim;
      const ia = TAHTA_ARALIK / kat;
      if (k.tahtaSayac >= ia) {
        if (odun >= TAHTA_ODUN + TAHTA_KORUMA) { odun -= TAHTA_ODUN; tahta += 1; toplanan.tahta += 1; k.tahtaSayac -= ia; goster(k, "+1 tahta", "#ffcc80"); }
        else k.tahtaSayac = ia;                                   // odun yetmiyor: bekler
      }
    }
    if (k.tur === "ocak" && arastirilan.madenarama) {             // Maden Arama: altin cikarir
      k.altinSayac = (k.altinSayac || 0) + adim;
      const ia = ALTIN_ARALIK / kat;
      while (k.altinSayac >= ia) { k.altinSayac -= ia; altin += 1; toplanan.altin += 1; goster(k, "+1 altın", "#ffe082"); }
    }
  }
}

function iscininKaynagi(i) {
  let en = null, enUzak = Infinity;
  for (const k of kaynaklar) {
    if (k.tur !== i.tur || k.kalan <= 0) continue;
    const d = Math.hypot(k.x - i.x, k.y - i.y);
    if (d < enUzak) { enUzak = d; en = k; }
  }
  return en;
}

// Hedefe dogru ISCI_HIZI * dt kadar ilerler (dt saniye). Vardiysa true doner.
function hareketEt(i, hx, hy, dt) {
  const adim = ISCI_HIZI * (1 + gelEtki("yuruyus")) * dt;
  const dx = hx - i.x, dy = hy - i.y;
  const d = Math.hypot(dx, dy);
  if (Math.abs(dx) > 0.5) i.yon = dx > 0 ? 1 : -1;
  i.yuruyor = true;
  if (d <= adim) { i.x = hx; i.y = hy; return true; }
  i.x += dx / d * adim;
  i.y += dy / d * adim;
  return false;
}

function iscileriGuncelle() {
  for (const i of isciler) {
    if (i.durum !== "don") i.teslim = null;                     // teslim hedefi sadece don sirasinda gecerli
    i.yuruyor = false;
    i.anim += dt;
    if (i.insaBekle > 0) i.insaBekle -= dt;
    if (i.durum === "insa") {                                      // INSAATCI: insaat noktasina yuru, orada calis
      const c = i.insaat;
      if (!c || c.insaatci !== i || !aktifInsaatlar.has(c)) {      // insaat bitti / yikildi / baska isci aldi
        i.insaat = null; i.insaVardi = false;
        i.durum = i.tasiyor > 0 ? "don" : "ara";
        continue;
      }
      if (!i.insaVardi && yolluHareket(i, i.insaNokta.x, i.insaNokta.y, dt)) i.insaVardi = true;
      continue;
    }
    if (i.durum === "ara") {
      i.hedef = iscininKaynagi(i);
      if (i.hedef) i.durum = "git";
    } else if (i.durum === "git") {
      if (i.hedef.kalan <= 0) { i.durum = i.tasiyor > 0 ? "don" : "ara"; continue; }   // baskasi tuketti
      const durak = i.hedef.tur === "agac" ? 20 : 24;                                  // agacin / kayanin onunde (altinda) dur
      if (yolluHareket(i, i.hedef.x, i.hedef.y + durak, dt)) { i.durum = "topla"; i.sayac = toplamaSuresi(i); }
    } else if (i.durum === "topla") {
      i.sayac -= dt;
      if (i.sayac <= 0) {
        if (i.hedef.kalan > 0) { i.hedef.kalan--; i.tasiyor++; }
        i.sayac = toplamaSuresi(i);
        if (i.tasiyor >= tasimaKapasitesi(i) || i.hedef.kalan <= 0) {      // yuk doldu ya da kaynak bitti
          i.durum = i.tasiyor > 0 ? "don" : "ara";
        }
      }
    } else if (i.durum === "don") {
      if (!i.teslim) i.teslim = teslimNoktasi(i);                  // en yakin ev/kamp
      if (!i.teslim) { i.durum = "bekle"; continue; }              // teslim edecek yer yok (ev/kamp yikildi)
      if (yolluHareket(i, i.teslim.x, i.teslim.y, dt)) {              // vardi: teslim et
        kaynakEkle(i.tur, i.tasiyor);
        i.tasiyor = 0;
        if (i.siradaki && i.siradaki.kalan > 0) {                  // el ile verilen emir: simdi oraya git
          i.tur = i.siradaki.tur; i.hedef = i.siradaki; i.durum = "git";
        } else {
          i.durum = "ara";
        }
        i.siradaki = null;
      }
    } else if (i.durum === "yuru") {                               // el ile verilen yurume emri
      if (yolluHareket(i, i.nokta.x, i.nokta.y, dt)) { i.durum = "bekle"; i.nokta = null; }
    }                                                              // "bekle": yeni emir gelene kadar durur
  }
}

// Secili iscilere sag tik emri. Agac/kaya -> git ve topla (turu degisir). Ev -> yuku teslim et. Yer -> yuru ve bekle.
function iscilereEmir(x, y, kaynak) {
  const secililer = isciler.filter(i => i.secili);
  const kamp = kampNoktada(x, y);
  const eve = ev && x >= ev.x - 40 && x <= ev.x + 40 && y >= ev.y - 52 && y <= ev.y + 24;
  secililer.forEach((i, sira) => {
    i.insaBekle = 8;                                                // el ile emir verilen isci kisa sure insaata cagrilmaz
    i.insaat = null; i.insaVardi = false;
    i.siradaki = null;
    i.nokta = null;
    if (kaynak) {
      if (i.tasiyor > 0 && i.tur !== kaynak.tur) { i.siradaki = kaynak; i.durum = "don"; }   // once eldeki yuku birak
      else { i.tur = kaynak.tur; i.hedef = kaynak; i.durum = "git"; }
    } else if (kamp && i.tasiyor > 0 && KAMP_TURLERI[kamp.tur].kaynak === i.tur) {      // yuku uygun kampa birak
      i.durum = "don";
      i.teslim = { x: kamp.x, y: kamp.y + KAMP_YARI + 4 };
    } else if (eve && ev) {
      i.durum = "don";
      i.teslim = { x: ev.x, y: ev.y + 24 };
    } else {
      const kolon = sira % 4, satir = Math.floor(sira / 4);                                // ust uste binmesinler
      i.nokta = { x: Math.max(8, Math.min(DUNYA_GEN - 8, x + (kolon - 1.5) * 16)), y: Math.max(8, Math.min(DUNYA_YUK - 8, y + satir * 16)) };
      i.durum = "yuru";
    }
  });
}

function cizIsciler() {
  for (const i of isciler) {
    const gomlek = i.tur === "agac" ? "#ef6c00" : "#607d8b";      // turuncu = odunci, gri-mavi = tasci
    if (i.secili) {                                               // secim halkasi
      cizim.strokeStyle = "#4caf50";
      cizim.lineWidth = 2;
      cizim.beginPath();
      cizim.ellipse(i.x, i.y + 6, 11, 5, 0, 0, Math.PI * 2);
      cizim.stroke();
    }
    cizInsan(i.x, i.y + 6, 0.6, i.yon, i.yuruyor, i.durum === "topla" || (i.durum === "insa" && i.insaVardi), i.anim, gomlek, i.cins);
    if (i.secili) {                                               // secili iscinin ismi (basinin ustunde)
      cizim.font = "bold 12px sans-serif";
      const g = cizim.measureText(i.ad).width + 10;
      cizim.fillStyle = "rgba(0,0,0,0.65)";
      cizim.fillRect(i.x - g / 2, i.y - 50, g, 16);
      cizim.fillStyle = i.cins === "kadin" ? "#f48fb1" : "#90caf9";
      cizim.textAlign = "center";
      cizim.fillText(i.ad, i.x, i.y - 38);
      cizim.textAlign = "left";
    }
    if (i.tasiyor > 0) {                                          // tasidigi yuk: kutu + sayi (basin ustunde)
      cizim.fillStyle = i.tur === "agac" ? "#6b4a2b" : "#bdbdbd";
      cizim.fillRect(i.x - 3, i.y - 28, 6, 5);
      cizim.fillStyle = "#000";
      cizim.font = "bold 11px sans-serif";
      cizim.textAlign = "center";
      cizim.fillText(String(i.tasiyor), i.x, i.y - 31);
      cizim.textAlign = "left";
    }
  }
}
