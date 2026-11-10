// ============================================================
// DOSYA: js/gelistirme.js
// GELISTIRMELER (teknolojiler): AoE'deki gibi bir binayi secince orada arastirilir, bir kez yapilir, tum koye etki eder.
// Bina SEVIYESI gelistirmeyi acar (ornek: Oduncu Kampi Sv2 -> Testere). Zincir: ust gelistirme icin onceki sart.
// Arastirma sirasinda isci gerekmez; sure oyun saatiyle akar. Bir bina ayni anda tek gelistirme arastirir.
// etki alanlari: hiz (toplama hizi %), tasima (+birim), pasif (pasif uretim hizi %), yuruyus (%), insaat (sure -%), isciSiniri (+kisi)
// kaynak: "agac" | "kaya" | "hepsi" (yalniz hiz/tasima/pasif icin)
// ============================================================

const GELISTIRMELER = [
  // --- ODUNCU KAMPI ---
  { id: "testere",     bina: "oduncu", ad: "Testere",       seviye: 2, odun: 25,  tas: 10,                            sure: 30,  etki: { hiz: 0.25, kaynak: "agac" },   ack: "Çift kollu testere: odun işçileri %25 hızlanır. Kamp, fazla odunu kendiliğinden TAHTAYA çevirir." },
  { id: "demirbalta",  bina: "oduncu", ad: "Demir Balta",   seviye: 4, odun: 60,  tas: 30,  tahta: 10,               sure: 60,  once: "testere",    etki: { hiz: 0.35, kaynak: "agac" },   ack: "Sert demir balta: odun toplama hızı %35 daha artar." },
  { id: "odunarabasi", bina: "oduncu", ad: "Odun Arabası",  seviye: 6, odun: 120, tas: 70,  tahta: 25, altin: 5,   sure: 90,  once: "demirbalta", etki: { tasima: 3, kaynak: "agac" },    ack: "İşçiler eve dönmeden 3 odun daha fazla taşır." },
  { id: "ormanustasi", bina: "oduncu", ad: "Orman Ustası",  seviye: 8, odun: 220, tas: 140, tahta: 60, altin: 15,  sure: 120, once: "odunarabasi", etki: { pasif: 0.5, kaynak: "agac" },   ack: "Kampın kendi kendine odun üretimi %50 hızlanır." },
  // --- TAS OCAGI ---
  { id: "celikkazma",  bina: "ocak", ad: "Çelik Kazma",    seviye: 2, odun: 25,  tas: 10,                            sure: 30,  etki: { hiz: 0.25, kaynak: "kaya" },   ack: "Çelik uçlu kazma: taş işçileri %25 hızlanır." },
  { id: "madenarama",  bina: "ocak", ad: "Maden Arama",    seviye: 3, odun: 40,  tas: 20,                            sure: 45,  once: "celikkazma", etki: { urun: "altın" },          ack: "Ocak, kayaların arasında altın damarı bulur ve kendiliğinden ALTIN çıkarır." },
  { id: "balyoz",      bina: "ocak", ad: "Balyoz",         seviye: 4, odun: 60,  tas: 30,  tahta: 10,               sure: 60,  once: "madenarama", etki: { hiz: 0.35, kaynak: "kaya" },   ack: "Ağır balyoz: taş toplama hızı %35 daha artar." },
  { id: "tasarabasi",  bina: "ocak", ad: "Taş Arabası",    seviye: 6, odun: 120, tas: 70,  tahta: 25, altin: 5,   sure: 90,  once: "balyoz",     etki: { tasima: 3, kaynak: "kaya" },    ack: "İşçiler eve dönmeden 3 taş daha fazla taşır." },
  { id: "tasustasi",   bina: "ocak", ad: "Taş Ustası",     seviye: 8, odun: 220, tas: 140, tahta: 60, altin: 15,  sure: 120, once: "tasarabasi", etki: { pasif: 0.5, kaynak: "kaya" },    ack: "Ocağın kendi kendine taş üretimi %50 hızlanır." },
  // --- AVCI KAMPI ---
  { id: "tuzak",       bina: "avci", ad: "Tuzaklar",       seviye: 2, odun: 30,  tas: 5,                             sure: 30,  etki: { pasif: 0.25, kaynak: "et" },   ack: "Kurulan tuzaklar: avcı kampının et üretimi %25 artar." },
  { id: "avkopegi",    bina: "avci", ad: "Av Köpeği",      seviye: 4, odun: 50,  tas: 10,  tahta: 10,               sure: 60,  once: "tuzak",      etki: { pasif: 0.4, kaynak: "et" },    ack: "Eğitilmiş av köpeği: et üretimi %40 daha artar." },
  // --- EV ---
  { id: "sepet",       bina: "ev", ad: "Sepet ve Çuval",   seviye: 2, odun: 20,  tas: 5,                             sure: 25,                       etki: { tasima: 1, kaynak: "hepsi" }, ack: "Tüm işçiler bir seferde 1 birim daha fazla taşır." },
  { id: "cizme",       bina: "ev", ad: "Sağlam Çizme",     seviye: 3, odun: 40,  tas: 15,                            sure: 45,                       etki: { yuruyus: 0.2 },                ack: "İşçilerin yürüme hızı %20 artar." },
  { id: "marangoz",    bina: "ev", ad: "Usta Marangoz",    seviye: 4, odun: 80,  tas: 40,  tahta: 10,               sure: 70,  once: "cizme",      etki: { insaat: 0.15 },                ack: "Tüm inşaat ve yükseltme süreleri %15 kısalır." },
  { id: "meclis",      bina: "ev", ad: "Köy Meclisi",      seviye: 6, odun: 150, tas: 90,  tahta: 25, altin: 8,   sure: 100, once: "marangoz",   etki: { isciSiniri: 2 },               ack: "Köy 2 işçi daha barındırabilir." }
];

let arastirilan = {};            // biten gelistirmeler: id -> true

function gelistirmeTanimi(id) { return GELISTIRMELER.find(t => t.id === id); }
function tumBinalar() { return (ev ? [ev] : []).concat(kamplar); }
function gelBinaAnahtar(s) { return s.tur === "ev" ? "ev" : s.ref.tur; }
function gelBinaSeviye(s) { return s.tur === "ev" ? evSeviyesi() : kampSeviyesiOf(s.ref); }
function gelistirmeListesi(s) { return s ? GELISTIRMELER.filter(t => t.bina === gelBinaAnahtar(s)) : []; }
function gelistirmeSuruyor(id) { return tumBinalar().find(b => b.arastirma && b.arastirma.id === id) || null; }
function gelistirmeSure(t) { return insaatAnlik ? 0 : t.sure; }

// Toplam etki: biten gelistirmelerin 'alan' degerlerinin toplami. kaynak verilirse yalniz o kaynaga (ya da "hepsi"ye) ait olanlar.
function gelEtki(alan, kaynak) {
  let top = 0;
  for (const id in arastirilan) {
    const t = gelistirmeTanimi(id);
    if (!t || t.etki[alan] === undefined) continue;
    const k = t.etki.kaynak;
    if (kaynak !== undefined && k && k !== "hepsi" && k !== kaynak) continue;
    top += t.etki[alan];
  }
  return top;
}

// Durum: yapildi | suruyor | mesgul | kilitli | yetersiz | hazir   (+ neden metni)
function gelistirmeDurum(t, s) {
  if (arastirilan[t.id]) return { d: "yapildi", neden: "Tamam" };
  const b = gelistirmeSuruyor(t.id);
  if (b) return { d: "suruyor", neden: "Sürüyor", bina: b };
  if (s.tur === "kamp" && !kampHazir(s.ref)) return { d: "kilitli", neden: "İnşaat sürüyor" };
  if (t.once && !arastirilan[t.once]) return { d: "kilitli", neden: "Önce: " + gelistirmeTanimi(t.once).ad };
  if (gelBinaSeviye(s) < t.seviye) return { d: "kilitli", neden: "Sv " + t.seviye + " gerekli" };
  if (s.ref.arastirma) return { d: "mesgul", neden: "Başka geliştirme sürüyor" };
  if (!maliyetYeter(t)) return { d: "yetersiz", neden: "Malzeme yetersiz" };
  return { d: "hazir", neden: "" };
}

// KOMUT: secili binada gelistirmeyi arastirmaya baslar.
function gelistirmeArastir(t, s) {
  if (!t || !s || gelistirmeDurum(t, s).d !== "hazir") return false;
  maliyetOde(t);
  const sure = gelistirmeSure(t);
  s.ref.arastirma = { id: t.id, bitis: oyunSaati + sure, toplam: sure };
  return true;
}

function gelistirmeGuncelle() {
  for (const b of tumBinalar()) {
    if (!b.arastirma || oyunSaati < b.arastirma.bitis) continue;
    const t = gelistirmeTanimi(b.arastirma.id);
    b.arastirma = null;
    if (!t) continue;
    arastirilan[t.id] = true;
    sesCal("bitis");
    gorevBildir("Geliştirme tamamlandı", t.ad + ": " + gelistirmeEtkiYazi(t).buyuk + " " + gelistirmeEtkiYazi(t).etiket, "#ffd54f");
  }
}

// Karede gosterilecek kisa etki: { buyuk: "+25%", etiket: "hız" }
function gelistirmeEtkiYazi(t) {
  const e = t.etki;
  if (e.hiz) return { buyuk: "+" + Math.round(e.hiz * 100) + "%", etiket: "toplama hızı" };
  if (e.tasima) return { buyuk: "+" + e.tasima, etiket: "taşıma" };
  if (e.pasif) return { buyuk: "+" + Math.round(e.pasif * 100) + "%", etiket: "pasif üretim" };
  if (e.yuruyus) return { buyuk: "+" + Math.round(e.yuruyus * 100) + "%", etiket: "yürüme hızı" };
  if (e.insaat) return { buyuk: "-" + Math.round(e.insaat * 100) + "%", etiket: "inşaat süresi" };
  if (e.isciSiniri) return { buyuk: "+" + e.isciSiniri, etiket: "işçi sınırı" };
  if (e.urun) return { buyuk: e.urun.toUpperCase(), etiket: "üretimi açar" };
  return { buyuk: "?", etiket: "" };
}
