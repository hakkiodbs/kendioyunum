// ============================================================
// DOSYA: js/insaat.js
// INSAAT SURELERI (Klanlar gibi): yukseltme ve kamp kurma gercek sure alir, malzeme basta harcanir.
// Oyun saati (oyunSaati, saniye) oyun ACIKKEN ilerler; hiz carpani (ayarlar) sadece bu saati hizlandirir.
// Sunucu asamasinda oyunSaati yerine sunucu saati kullanilir; digerleri ayni kalir.
// KOMUTLAR: duvarYukselt (binalar.js), kampKoy (binalar.js).  DURUM: oyunSaati, oyunHizi, duvarInsaat, kamplar[].bitis
// ============================================================

function evSeviyesi() { return ev ? (ev.seviye || 1) : 1; }
function kampSeviyesiOf(k) { return k.seviye || 1; }
function evHizCarpani() { return Math.pow(1 - EV_HIZ_BONUSU, evSeviyesi() - 1); }   // Ana bina seviyesi tum insaatlari hizlandirir

// Saniye cinsinden insa suresi (tur, hedef seviye). insaatAnlik = test/gelistirici bayragi (sureleri sifirlar).
function insaatSuresi(tur, seviye) {
  if (insaatAnlik) return 0;
  seviye = seviye || 1;
  let sn = 0;
  if (tur === "ev") sn = seviye <= 1 ? INSA_EV_SURESI : INSA_EV_ILK * Math.pow(INSA_KAMP_ARTIS, seviye - 2);
  else if (tur === "oduncu" || tur === "ocak" || tur === "avci") sn = INSA_KAMP_SURESI * Math.pow(INSA_KAMP_ARTIS, seviye - 1);
  else if (tur === "duvar") sn = DUVAR_INSA_ILK * Math.pow(DUVAR_INSA_ARTIS, seviye - 1);
  if (sn <= 0) return 0;
  return Math.max(1, Math.round(sn * evHizCarpani() * Math.max(0.4, 1 - gelEtki("insaat"))));
}

function sureYazi(sn) {           // 45 sn | 3 dk 20 sn | 2 sa 5 dk | 1 gün 4 sa
  sn = Math.max(0, Math.ceil(sn));
  if (sn < 60) return sn + " sn";
  if (sn < 3600) return Math.floor(sn / 60) + " dk " + (sn % 60 ? (sn % 60) + " sn" : "");
  if (sn < 86400) return Math.floor(sn / 3600) + " sa " + (Math.floor(sn % 3600 / 60) ? Math.floor(sn % 3600 / 60) + " dk" : "");
  return Math.floor(sn / 86400) + " gün " + (Math.floor(sn % 86400 / 3600) ? Math.floor(sn % 86400 / 3600) + " sa" : "");
}

function kampHazir(k) { return !k.bitis || oyunSaati >= k.bitis; }
function kalanSure(bitis) { return Math.max(0, bitis - oyunSaati); }

function insaatSayisi() { return (duvarInsaat ? 1 : 0) + (ev && ev.yuk ? 1 : 0) + kamplar.filter(k => !kampHazir(k) || k.yuk).length; }
function insaatYuvasiVar() { return insaatSayisi() < INSAAT_YUVASI; }

// ---------- INSAATCI ISCI ----------
// Her insaat bir ISCI ister: isci insaat noktasina yurur, orada calisirken sure ilerler.
// Isci yokken ya da yoldayken sure DURUR (bitis ileri kayar; digerleri bitis'i okudugu icin hicbir sey degismez).
// Isci hic yoksa (eski test modu) insaat eskisi gibi sadece sureyle biter.
function duvarInsaatNoktasi() {      // duvarin ana binaya en yakin kenari (iceride)
  const e = ev || { x: DUNYA_GEN / 2, y: DUNYA_YUK / 2 }, m = 34;
  const aday = [{ x: e.x, y: m }, { x: e.x, y: DUNYA_YUK - m }, { x: m, y: e.y }, { x: DUNYA_GEN - m, y: e.y }];
  aday.sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y));
  return aday[0];
}
function insaatKayitlari() {         // devam eden tum insaatlar: { obj: bitis'i tasiyan nesne, x, y }
  const l = [];
  if (duvarInsaat) { const p = duvarInsaatNoktasi(); l.push({ obj: duvarInsaat, x: p.x, y: p.y }); }
  if (ev && ev.yuk) l.push({ obj: ev.yuk, x: ev.x, y: ev.y + 38 });
  for (const k of kamplar) {
    if (!kampHazir(k)) l.push({ obj: k, x: k.x, y: k.y + KAMP_YARI + 10 });
    else if (k.yuk) l.push({ obj: k.yuk, x: k.x, y: k.y + KAMP_YARI + 10 });
  }
  return l;
}
let aktifInsaatlar = new Set();
function insaatciCalisiyor(obj) {
  const w = obj.insaatci;
  return !!(w && w.durum === "insa" && w.insaat === obj && w.insaVardi);
}
function insaatciAta(kayitlar) {
  for (const c of kayitlar) {
    const w = c.obj.insaatci;
    if (w && isciler.includes(w) && w.durum === "insa" && w.insaat === c.obj) continue;     // atanmis ve hala geliyor/calisiyor
    c.obj.insaatci = null;
    let en = null, enUzak = Infinity, bekli = null, bekliUzak = Infinity;
    for (const i of isciler) {
      if (i.durum === "insa") continue;
      const d = Math.hypot(i.x - c.x, i.y - c.y);
      if (i.insaBekle > 0) { if (d < bekliUzak) { bekliUzak = d; bekli = i; } }           // oyuncu az once emir verdi: baska isci yoksa al
      else if (d < enUzak) { enUzak = d; en = i; }
    }
    const i = en || bekli;
    if (!i) continue;
    i.durum = "insa"; i.insaat = c.obj; i.insaNokta = { x: c.x, y: c.y }; i.insaVardi = false;
    i.hedef = null; i.siradaki = null; i.nokta = null;
    c.obj.insaatci = i;
  }
}

// Her karede: oyun saatini ilerlet, biten insaatlari tamamla.
function insaatGuncelle() {
  const kayitlar = insaatKayitlari();
  aktifInsaatlar = new Set(kayitlar.map(c => c.obj));
  if (isciler.length > 0) {
    insaatciAta(kayitlar);
    const adim = dt * oyunHizi;
    for (const c of kayitlar) {
      if (!insaatciCalisiyor(c.obj)) { c.obj.bitis += adim; continue; }                 // isci yokken sure ilerlemez
      c.obj.sesSayac = (c.obj.sesSayac || 0) - dt;                                       // isci calisirken cekic sesi
      if (c.obj.sesSayac <= 0) { sesCal("cekic", sesYakinligi(c.x, c.y)); c.obj.sesSayac = 0.5 + Math.random() * 0.25; }
    }
  }
  oyunSaati += dt * oyunHizi;
  if (duvarInsaat && oyunSaati >= duvarInsaat.bitis) {
    duvarSeviye = duvarInsaat.seviye;
    if (duvarSeviye === 1) duvarHalkasiniKur();
    sesCal("bitis"); gorevBildir("İnşaat tamamlandı", "Köy Duvarı Seviye " + duvarSeviye, "#a5d6a7");
    duvarInsaat = null;
  }
  if (ev && ev.yuk && oyunSaati >= ev.yuk.bitis) {
    ev.seviye = ev.yuk.seviye;
    ev.yuk = null;
    sesCal("bitis"); gorevBildir("İnşaat tamamlandı", "Ev Seviye " + ev.seviye, "#a5d6a7");
  }
  for (const k of kamplar) {
    if (k.bitis && !k.bildirildi && oyunSaati >= k.bitis) {
      k.bildirildi = true;
      sesCal("bitis"); gorevBildir("İnşaat tamamlandı", KAMP_TURLERI[k.tur].ad, "#a5d6a7");
    }
    if (k.yuk && oyunSaati >= k.yuk.bitis) {
      k.seviye = k.yuk.seviye;
      k.yuk = null;
      sesCal("bitis"); gorevBildir("İnşaat tamamlandı", KAMP_TURLERI[k.tur].ad + " Seviye " + k.seviye, "#a5d6a7");
    }
  }
}

// Ekranin sol ustunde (Odun/Tas yazisinin altinda) devam eden insaatlar.
function cizInsaatListesi() {
  const satirlar = [];
  const bekle = o => isciler.length > 0 && !insaatciCalisiyor(o) ? "  (işçi yolda)" : "";
  if (duvarInsaat) satirlar.push("Köy Duvarı → Sv " + duvarInsaat.seviye + ":  " + sureYazi(kalanSure(duvarInsaat.bitis)) + bekle(duvarInsaat));
  if (ev && ev.yuk) satirlar.push("Ev → Sv " + ev.yuk.seviye + ":  " + sureYazi(kalanSure(ev.yuk.bitis)) + bekle(ev.yuk));
  for (const k of kamplar) {
    if (!kampHazir(k)) satirlar.push(KAMP_TURLERI[k.tur].ad + ":  " + sureYazi(kalanSure(k.bitis)) + bekle(k));
    else if (k.yuk) satirlar.push(KAMP_TURLERI[k.tur].ad + " → Sv " + k.yuk.seviye + ":  " + sureYazi(kalanSure(k.yuk.bitis)) + bekle(k.yuk));
  }
  if (!satirlar.length) return;
  cizim.font = "bold 13px sans-serif";
  cizim.textAlign = "left";
  const gen = Math.max(...satirlar.map(s => cizim.measureText(s).width)) + 20;
  cizim.fillStyle = "rgba(0,0,0,0.6)";
  cizim.fillRect(10, UST_YUK + 8, gen, 8 + satirlar.length * 18);
  cizim.fillStyle = "#ffd54f";
  satirlar.forEach((s, i) => cizim.fillText(s, 20, UST_YUK + 26 + i * 18));
}

// Insaatin ilerleme orani 0..1 (toplam sure kayitliysa). nesne: bitis + toplam tasiyan kayit.
function insaatOrani(obj) {
  if (!obj || !obj.toplam) return 0.5;
  return Math.max(0, Math.min(1, 1 - kalanSure(obj.bitis) / obj.toplam));
}
