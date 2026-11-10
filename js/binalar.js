// ============================================================
// DOSYA: js/binalar.js
// Binalar: koy seviyesi, bina secme, ev ve duvar kurma (KOMUT), ev ve duvar cizimi.
// KOMUTLAR (oyuncunun istegi): binaSec, evKoy, duvarYukselt.  DURUM: ev, duvarlar, kurmaModu.
// ============================================================

function isciSiniri() { return ISCI_MAX + (evSeviyesi() - 1) * ISCI_ARTIS + gelEtki("isciSiniri"); }     // Ev seviyesi isci sinirini artirir
function yukseltmeMaliyeti(tur, n) {                // n. seviyeye (n >= 2) yukseltmenin maliyeti
  const t = BINA_TEMEL[tur], c = Math.pow(BINA_MALIYET_ARTIS, n - 2);
  const m = { odun: Math.round(t.odun * c), tas: Math.round(t.tas * c) };
  if (n >= YUKSELT_TAHTA_SEVIYE) m.tahta = Math.max(1, Math.round(m.odun * YUKSELT_TAHTA_ORAN));       // ust seviyeler tahta ister
  if (n >= YUKSELT_ALTIN_SEVIYE) m.altin = Math.max(1, Math.round(m.tas * YUKSELT_ALTIN_ORAN));        // en ustler altin ister
  return m;
}
function evYeterli() { return odun >= EV_ICIN_ODUN && tas >= EV_ICIN_TAS; }

// ---------- Koy seviyesi ve bina tanimlari (BINALAR: ayarlar.js) ----------
function koySeviyesi() {
  let s = 1;
  if (ev) s = 2;
  if (ev && isciler.length >= ISCI_HEDEF) s = 3;
  return s;
}
function binaTanimi(id) { return BINALAR.find(b => b.id === id); }
function binaAcik(b) { return koySeviyesi() >= b.seviye; }
function binaMaliyet(b) { return b.id === "duvar" ? duvarMaliyet(duvarSeviye + 1) : { odun: b.odun || 0, tas: b.tas || 0, tahta: b.tahta || 0, altin: b.altin || 0, et: b.et || 0 }; }
function binaYeter(b) { return maliyetYeter(binaMaliyet(b)); }
function binaKullanilabilir(b) { return b.hazir && binaAcik(b) && !(b.tek && ev) && !(b.id === "duvar" && (duvarSeviye >= DUVAR_MAX_SEVIYE || duvarInsaat)) && (b.id === "ev" || insaatYuvasiVar()); }

// KOMUT: menuden ya da kisayol tusuyla bina sec. Ayni binaya tekrar basarsan secim kalkar.
function binaSec(id) {
  tasimaIptal();
  const b = binaTanimi(id);
  if (!b || !binaKullanilabilir(b) || !binaYeter(b)) return;
  if (id === "duvar") { duvarYukselt(); return; }   // duvar yerlestirilmez: tek tikla tum cevre
  kurmaModu = kurmaModu === id ? null : id;
  kurmaBasili = false;
}
function kurmaModuKapat() { kurmaModu = null; kurmaBasili = false; }

// ---------- EV ----------
function evAlani() {      // evin kapladigi dikdortgen (cati dahil)
  return ev ? { x1: ev.x - 40, y1: ev.y - 52, x2: ev.x + 40, y2: ev.y + 24 } : null;
}

// Fare konumunu izgaraya oturtur: ev 2 kare genisliginde, tabani izgara cizgisine denk gelir.
function evKonumu(mx, my) {
  return { x: Math.round(mx / KARE) * KARE, y: Math.round((my + 38) / KARE) * KARE - 24 };
}

// Dikdortgen (x1,y1,x2,y2) bir agac/kayaya degiyor mu?
function kaynagaDegiyor(x1, y1, x2, y2) {
  for (const k of kaynaklar) {
    if (k.kalan <= 0) continue;
    const cx = k.x, cy = k.tur === "agac" ? k.y - 4 : k.y, r = k.tur === "agac" ? 18 : 16;
    const yakinX = Math.max(x1, Math.min(cx, x2)), yakinY = Math.max(y1, Math.min(cy, y2));
    if (Math.hypot(cx - yakinX, cy - yakinY) < r) return true;
  }
  return false;
}

function evKonulabilir(x, y, tasi) {        // tasi=true: mevcut ev tasiniyor (tek ev kuraliyla engellenmez)
  if (ev && !tasi) return false;
  const x1 = x - 40, y1 = y - 52, x2 = x + 40, y2 = y + 24;
  if (x1 < 0 || y1 < 0 || x2 > DUNYA_GEN || y2 > DUNYA_YUK) return false;
  if (menuEngelliMi(x1, y1, x2, y2)) return false;                      // menunun altina olmaz
  if (duvarHalkasinaGirer(x1, y1, x2, y2)) return false;                // duvarin yeri bos kalir
  for (const d of duvarlar) {
    const dx = d.gx * KARE, dy = d.gy * KARE;
    if (x1 < dx + KARE && x2 > dx && y1 < dy + KARE && y2 > dy) return false;
  }
  if (kamplaCakisir(x1, y1, x2, y2)) return false;
  return !kaynagaDegiyor(x1, y1, x2, y2);
}

// KOMUT: evi fare konumuna kur. Malzeme yetmezse ya da yer uygun degilse kurulmaz.
// Yeni oyun baslangici: ana bina haritanin ortasinda kurulu, 1 erkek + 1 kadin isci.
function baslangicKoyu() {
  oyuncu.secili = false;
  const p = evKonumu(DUNYA_GEN / 2, DUNYA_YUK / 2);
  ev = { x: p.x, y: p.y, secili: true, seviye: 1 };
  isciOlustur("erkek");
  isciOlustur("kadin");
  kameraOrtala();
}

function evKoy(mx, my) {
  const p = evKonumu(mx, my);
  if (!evKonulabilir(p.x, p.y) || !evYeterli()) return false;
  odun -= EV_ICIN_ODUN;
  tas -= EV_ICIN_TAS;
  secimiBirak();
  ev = { x: p.x, y: p.y, secili: true, seviye: 1 };      // yeni ev secili baslar: hemen isci uretilebilir
  bitisZamani = performance.now();
  kurmaModu = null;
  return true;
}

function cizEvAt(x, y, kontur) {
  const r = spriteCiz("House_1", x, y + 24, 80, 80, true, kontur);   // sprite varsa onu ciz (secili ise gercek silueti cizgiyle), yoksa asagidaki kodla
  if (r) return r;
  cizim.fillStyle = "#d7b98e";                 // duvar
  cizim.fillRect(x - 32, y - 20, 64, 44);
  cizim.fillStyle = "#8d2f23";                 // cati
  cizim.beginPath();
  cizim.moveTo(x - 40, y - 20);
  cizim.lineTo(x, y - 52);
  cizim.lineTo(x + 40, y - 20);
  cizim.closePath();
  cizim.fill();
  cizim.fillStyle = "#4e342e";                 // kapi
  cizim.fillRect(x - 7, y + 2, 14, 22);
}
function cizEv() {
  if (!ev || (tasima && tasima.ref === ev)) return;
  let konturVar = false;
  if (!(ev.yuk && spriteYukseltmeCiz("House_1", ev.x, ev.y + 24, 80, 80, false, insaatciCalisiyor(ev.yuk)))) konturVar = cizEvAt(ev.x, ev.y, ev.secili ? "#4caf50" : null) === 2;   // yukseltmede iskeleli cizim
  if (ev.secili && !konturVar) {                                // secim cercevesi (yesil)
    cizim.strokeStyle = "#4caf50";
    cizim.lineWidth = 3;
    cizim.strokeRect(ev.x - 43, ev.y - 54, 86, 80);
  }
  let yazi = "Ev Seviye " + evSeviyesi();         // evin ustunde bina seviyesi
  if (ev.yuk) yazi += "  →  Sv " + ev.yuk.seviye + "  (" + sureYazi(kalanSure(ev.yuk.bitis)) + ")";
  if (ev.arastirma) yazi += "  ·  " + gelistirmeTanimi(ev.arastirma.id).ad + " (" + sureYazi(kalanSure(ev.arastirma.bitis)) + ")";
  cizim.font = "bold 14px sans-serif";
  const gen = cizim.measureText(yazi).width + 16;
  cizim.fillStyle = "rgba(0,0,0,0.65)";
  cizim.fillRect(ev.x - gen / 2, ev.y - 52 - 24, gen, 20);
  cizim.fillStyle = "#ffd54f";
  cizim.textAlign = "center";
  cizim.fillText(yazi, ev.x, ev.y - 52 - 9);
  cizim.textAlign = "left";
}

// Ev secilince cikan "Isci Uret" paneli: iki dugme (Erkek / Kadin), her birinde insan resmi.
const ISCI_PANEL_GEN = 232, ISCI_PANEL_YUK = 80;
function isciDugmesi() {            // panelin dikdortgeni (evin altinda, yer yoksa ustunde); ev secili degilse null
  if (!ev || !ev.secili || kurmaModu || tasima) return null;
  const w = ISCI_PANEL_GEN, h = ISCI_PANEL_YUK, x = Math.max(4, Math.min(DUNYA_GEN - w - 4, ev.x - w / 2));
  const alt = { x, y: ev.y + 30, w, h };
  const ust = { x, y: ev.y - 52 - 24 - 6 - h, w, h };
  for (const r of [alt, ust]) {
    if (r.y >= 0 && r.y + r.h <= DUNYA_YUK && !menuEngelliMi(r.x, r.y, r.x + r.w, r.y + r.h)) return r;
  }
  return alt;
}
function isciDugmeleri() {          // panelin icindeki iki dugme
  const p = isciDugmesi();
  if (!p) return [];
  return ["erkek", "kadin"].map((cins, i) => ({ cins, x: p.x + 8 + i * 112, y: p.y + 22, w: 108, h: 52 }));
}
function isciPaneliTikla(x, y) {    // panelin ustune tiklandiysa true doner (dugme ise isci uretir)
  const p = isciDugmesi();
  if (!p || x < p.x || x > p.x + p.w || y < p.y || y > p.y + p.h) return false;
  for (const d of isciDugmeleri()) if (x >= d.x && x <= d.x + d.w && y >= d.y && y <= d.y + d.h) isciUret(d.cins);
  return true;
}
function cizIsciDugmesi() {
  const p = isciDugmesi();
  if (!p) return;
  const dolu = isciler.length >= isciSiniri(), yeter = maliyetYeter(ISCI_MALIYET);
  cizim.fillStyle = "rgba(25,25,25,0.92)";
  cizim.fillRect(p.x, p.y, p.w, p.h);
  cizim.strokeStyle = "#777";
  cizim.lineWidth = 1;
  cizim.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
  cizim.textAlign = "left";
  cizim.fillStyle = "#fff";
  cizim.font = "bold 13px sans-serif";
  cizim.fillText(dolu ? "İşçi sınırı (" + isciSiniri() + ")" : "İşçi Üret  " + isciler.length + "/" + isciSiniri() + "   [" + TUS_ISCI.toUpperCase() + "]", p.x + 8, p.y + 15);
  for (const d of isciDugmeleri()) {
    const aktif = !dolu && yeter;
    cizim.fillStyle = "#3b3b3b";
    cizim.fillRect(d.x, d.y, d.w, d.h);
    cizim.strokeStyle = aktif ? "#4caf50" : "#666";
    cizim.lineWidth = 2;
    cizim.strokeRect(d.x + 1, d.y + 1, d.w - 2, d.h - 2);
    cizInsan(d.x + 24, d.y + d.h - 6, 0.85, 1, false, false, 0, d.cins === "kadin" ? "#ab47bc" : "#42a5f5", d.cins);   // insan resmi
    cizim.textAlign = "left";
    cizim.fillStyle = aktif ? "#fff" : "#888";
    cizim.font = "bold 14px sans-serif";
    cizim.fillText(d.cins === "kadin" ? "Kadın" : "Erkek", d.x + 50, d.y + 24);
    cizim.font = "13px sans-serif";
    cizim.fillStyle = yeter ? "#69f0ae" : "#ff8a80";
    cizim.fillText(maliyetMetni(ISCI_MALIYET), d.x + 50, d.y + 42);
  }
}

// ============================================================
// KOY DUVARI (Klanlar tarzi): TEK bina, tum dunya cercevesini kaplar, yerlestirilmez.
// Menuden tiklayinca kurulur (seviye 1), her tiklamada bir seviye yukselir (en fazla 30).
//   Seviye 1-25: ODUN duvar    Seviye 26-30: TAS duvar (maliyet de tasa doner)
// KOMUT: duvarYukselt().  DURUM: duvarSeviye + duvarlar[] (kenar halkasi kareleri, carpisma icin).
// ============================================================

function duvarMaliyet(n) {                  // n. seviyeye cikmanin maliyeti
  if (n <= DUVAR_TAS_SEVIYESI) return { odun: Math.round(DUVAR_ILK_ODUN * Math.pow(DUVAR_ARTIS, n - 1)), tas: 0 };
  return { odun: 0, tas: Math.round(DUVAR_ILK_TAS * Math.pow(DUVAR_ARTIS, n - DUVAR_TAS_SEVIYESI - 1)) };
}
const DUVAR_YON = DUNYA_GEN / KARE, DUVAR_YUK = DUNYA_YUK / KARE;   // izgara olculeri (32 x 18)
function duvarHalkasinaGirer(x1, y1, x2, y2) {      // dikdortgen dunya kenarindaki duvar halkasina giriyor mu
  return x1 < KARE || y1 < KARE || x2 > DUNYA_GEN - KARE || y2 > DUNYA_YUK - KARE;
}
function duvarHalkasiniKur() {              // kenar karelerini listeye yaz (cakisma kontrolleri bunu okur)
  duvarlar.length = 0;
  for (let gx = 0; gx < DUVAR_YON; gx++) for (let gy = 0; gy < DUVAR_YUK; gy++) {
    if (gx === 0 || gy === 0 || gx === DUVAR_YON - 1 || gy === DUVAR_YUK - 1) duvarlar.push({ gx, gy });
  }
}

// KOMUT: duvar insaatini baslat (ilk kurulus ya da bir ust seviye). Malzeme HEMEN harcanir, duvar sure sonunda hazir olur.
// Yetmezse / insaat yuvasi doluysa / zaten insaattaysa / en ustse hicbir sey olmaz.
function duvarYukselt() {
  if (!ev || duvarInsaat || duvarSeviye >= DUVAR_MAX_SEVIYE || !insaatYuvasiVar()) return false;
  const yeni = duvarSeviye + 1, m = duvarMaliyet(yeni);
  if (!maliyetYeter(m)) return false;
  maliyetOde(m);
  const sure = insaatSuresi("duvar", yeni);
  if (sure <= 0) {                                   // anlik (test): hemen tamamla
    duvarSeviye = yeni;
    if (yeni === 1) duvarHalkasiniKur();
    return true;
  }
  duvarInsaat = { seviye: yeni, bitis: oyunSaati + sure, toplam: sure };
  return true;
}

function cizDuvarlar() {
  if (duvarSeviye <= 0 && !duvarInsaat) return;
  const yariSaydam = duvarSeviye <= 0;                  // ilk kurulus insaat halinde: soluk cizilir
  if (yariSaydam) cizim.globalAlpha = 0.35;
  const tasDuvar = duvarSeviye > DUVAR_TAS_SEVIYESI;
  const kalin = 12 + Math.max(1, Math.min(duvarSeviye, DUVAR_MAX_SEVIYE)) * 0.5;          // seviye arttikca kalinlasir
  const G = DUNYA_GEN, Y = DUNYA_YUK;
  const bantlar = [[0, 0, G, kalin], [0, Y - kalin, G, kalin], [0, 0, kalin, Y], [G - kalin, 0, kalin, Y]];
  const dolgu = tasDuvar ? "#9e9e9e" : "#8d6e43";
  const cizgi = tasDuvar ? "#616161" : "#4e342e";
  for (const b of bantlar) {
    cizim.fillStyle = dolgu;
    cizim.fillRect(b[0], b[1], b[2], b[3]);
    cizim.strokeStyle = cizgi;
    cizim.lineWidth = 1;
    cizim.beginPath();
    if (b[2] > b[3]) { for (let x = b[0] + 10; x < b[0] + b[2]; x += tasDuvar ? 24 : 10) { cizim.moveTo(x, b[1]); cizim.lineTo(x, b[1] + b[3]); } }
    else { for (let y = b[1] + 10; y < b[1] + b[3]; y += tasDuvar ? 24 : 10) { cizim.moveTo(b[0], y); cizim.lineTo(b[0] + b[2], y); } }
    cizim.stroke();
    cizim.strokeRect(b[0] + 0.5, b[1] + 0.5, b[2] - 1, b[3] - 1);
  }
  const kule = kalin + 14;                                                   // kose kuleleri
  for (const [kx, ky] of [[0, 0], [G - kule, 0], [0, Y - kule], [G - kule, Y - kule]]) {
    cizim.fillStyle = tasDuvar ? "#757575" : "#6d4c41";
    cizim.fillRect(kx, ky, kule, kule);
    cizim.strokeStyle = cizgi;
    cizim.lineWidth = 2;
    cizim.strokeRect(kx + 1, ky + 1, kule - 2, kule - 2);
  }
  if (yariSaydam) cizim.globalAlpha = 1;
  let yazi = duvarSeviye > 0 ? "Duvar Seviye " + duvarSeviye + (tasDuvar ? " (Taş)" : "") : "Duvar";      // duvarin ustunde seviye (ust kenar, ortada)
  if (duvarInsaat) yazi += "  →  Sv " + duvarInsaat.seviye + "  (" + sureYazi(kalanSure(duvarInsaat.bitis)) + ")";
  cizim.font = "bold 14px sans-serif";
  const gen = cizim.measureText(yazi).width + 16;
  cizim.fillStyle = "rgba(0,0,0,0.65)";
  cizim.fillRect((G - gen) / 2, kalin + 2, gen, 20);
  cizim.fillStyle = "#ffd54f";
  cizim.textAlign = "center";
  cizim.fillText(yazi, G / 2, kalin + 17);
  cizim.textAlign = "left";
}

// Kurma modunda fareyi izleyen hayalet bina: yesil = konabilir, kirmizi = konamaz.
function cizHayalet() {
  if (tasima) { cizTasimaHayaleti(); return; }
  if (!kurmaModu || fare.x < 0 || arayuzAlaninda(fareEkran.x, fareEkran.y)) return;
  if (kurmaModu === "ev") {
    const p = evKonumu(fare.x, fare.y);
    const gecerli = evKonulabilir(p.x, p.y) && evYeterli();
    cizim.globalAlpha = 0.6;
    cizEvAt(p.x, p.y);
    cizim.globalAlpha = 1;
    cizim.strokeStyle = gecerli ? "#2e7d32" : "#b71c1c";
    cizim.lineWidth = 3;
    cizim.strokeRect(p.x - 40, p.y - 52, 80, 76);
  } else if (KAMP_TURLERI[kurmaModu]) {
    const p = kampKonumu(fare.x, fare.y);
    const b = binaTanimi(kurmaModu);
    const gecerli = kampKonulabilir(p.x, p.y) && binaYeter(b);
    cizim.globalAlpha = 0.6;
    cizKampAt(kurmaModu, p.x, p.y);
    cizim.globalAlpha = 1;
    cizim.strokeStyle = gecerli ? "#2e7d32" : "#b71c1c";
    cizim.lineWidth = 3;
    cizim.strokeRect(p.x - KAMP_YARI + 1, p.y - KAMP_YARI + 1, KAMP_YARI * 2 - 2, KAMP_YARI * 2 - 2);
  }
}

// ============================================================
// KAMPLAR (Age of Empires tarzi): Oduncu Kampi (odun teslim noktasi) ve Tas Ocagi (tas teslim noktasi).
// Isciler topladiklarini en yakin UYGUN teslim noktasina (ev ya da kamp) goturur.
// KOMUT: kampKoy(tur, x, y).  DURUM: kamplar[].
// ============================================================

const KAMP_TURLERI = {
  oduncu: { ad: "Oduncu Kampı", kaynak: "agac" },   // odun kabul eder
  ocak:   { ad: "Taş Ocağı",    kaynak: "kaya" },   // tas kabul eder
  avci:   { ad: "Avcı Kampı",   kaynak: "et" }       // kendiliginden et uretir (isci toplamaz)
};
const KAMP_SPRITE = { oduncu: "Sawmill", ocak: "Blacksmith", avci: "Stable" };

function kampKonumu(mx, my) {       // kamp 2x2 kare: merkez izgara kesisimine oturur
  return { x: Math.round(mx / KARE) * KARE, y: Math.round(my / KARE) * KARE };
}
function kampAlani(k) { return { x1: k.x - KAMP_YARI, y1: k.y - KAMP_YARI, x2: k.x + KAMP_YARI, y2: k.y + KAMP_YARI }; }

function kamplaCakisir(x1, y1, x2, y2, haric) {
  return kamplar.some(k => { if (k === haric) return false; const a = kampAlani(k); return x1 < a.x2 && x2 > a.x1 && y1 < a.y2 && y2 > a.y1; });
}

function kampKonulabilir(x, y, haric) {       // haric: tasinan kamp kendisiyle cakismaz
  const x1 = x - KAMP_YARI, y1 = y - KAMP_YARI, x2 = x + KAMP_YARI, y2 = y + KAMP_YARI;
  if (!ev) return false;
  if (x1 < 0 || y1 < 0 || x2 > DUNYA_GEN || y2 > DUNYA_YUK) return false;
  if (menuEngelliMi(x1, y1, x2, y2)) return false;
  if (duvarHalkasinaGirer(x1, y1, x2, y2)) return false;
  const e = evAlani();
  if (x1 < e.x2 && x2 > e.x1 && y1 < e.y2 && y2 > e.y1) return false;        // evin ustune olmaz
  for (const d of duvarlar) {
    const dx = d.gx * KARE, dy = d.gy * KARE;
    if (x1 < dx + KARE && x2 > dx && y1 < dy + KARE && y2 > dy) return false;  // duvarin ustune olmaz
  }
  if (kamplaCakisir(x1, y1, x2, y2, haric)) return false;
  return !kaynagaDegiyor(x1, y1, x2, y2);                                     // agac/kayanin ustune olmaz
}

// KOMUT: kampi fare konumuna kur (maliyet BINALAR'da). Yetmezse/yer uygun degilse kurulmaz.
function kampKoy(tur, mx, my) {
  const b = binaTanimi(tur);
  if (!b || !KAMP_TURLERI[tur]) return false;
  const p = kampKonumu(mx, my);
  if (!kampKonulabilir(p.x, p.y) || !binaYeter(b) || !insaatYuvasiVar()) return false;
  maliyetOde(binaMaliyet(b));
  const sure = insaatSuresi(tur);
  kamplar.push(sure > 0 ? { tur, x: p.x, y: p.y, seviye: 1, bitis: oyunSaati + sure, toplam: sure } : { tur, x: p.x, y: p.y, seviye: 1 });
  kurmaModu = null;
  return true;
}

// Bir isci icin en yakin teslim noktasi: ev (her sey) ya da is turune uygun kamp. {x, y} = kapinin onu.
function teslimNoktasi(i) {
  const adaylar = [];
  if (ev) adaylar.push({ x: ev.x, y: ev.y + 24 });
  for (const k of kamplar) if (kampHazir(k) && KAMP_TURLERI[k.tur].kaynak === i.tur) adaylar.push({ x: k.x, y: k.y + KAMP_YARI + 4 });
  let en = adaylar[0], enUzak = Infinity;
  for (const a of adaylar) {
    const d = Math.hypot(a.x - i.x, a.y - i.y);
    if (d < enUzak) { enUzak = d; en = a; }
  }
  return en;
}
function kampNoktada(x, y) {       // tiklanan noktadaki kamp (yoksa null)
  return kamplar.find(k => { if (!kampHazir(k)) return false; const a = kampAlani(k); return x >= a.x1 && x <= a.x2 && y >= a.y1 && y <= a.y2; }) || null;
}

function cizKampAt(tur, x, y, kontur) {
  const oc = tur === "ocak";
  const r = spriteCiz(KAMP_SPRITE[tur], x, y + KAMP_YARI - 4, 80, 78, true, kontur);
  if (r) return r;
  cizim.fillStyle = oc ? "rgba(110,120,125,0.40)" : "rgba(120,85,50,0.40)";       // zemin
  cizim.fillRect(x - KAMP_YARI + 2, y - KAMP_YARI + 2, KAMP_YARI * 2 - 4, KAMP_YARI * 2 - 4);
  cizim.fillStyle = oc ? "#90a4ae" : "#a1887f";                                       // baraka duvari
  cizim.fillRect(x - 30, y - 10, 36, 26);
  cizim.fillStyle = oc ? "#546e7a" : "#6d4c41";                                       // cati
  cizim.beginPath();
  cizim.moveTo(x - 34, y - 10); cizim.lineTo(x - 12, y - 32); cizim.lineTo(x + 10, y - 10);
  cizim.closePath();
  cizim.fill();
  cizim.fillStyle = "#4e342e";                                                        // kapi
  cizim.fillRect(x - 17, y + 2, 10, 14);
  if (oc) {                                                                           // tas yigini
    cizim.fillStyle = "#9e9e9e"; cizim.beginPath(); cizim.ellipse(x + 22, y + 12, 13, 9, 0, 0, Math.PI * 2); cizim.fill();
    cizim.fillStyle = "#bdbdbd"; cizim.beginPath(); cizim.ellipse(x + 28, y + 2, 9, 7, 0, 0, Math.PI * 2); cizim.fill();
    cizim.fillStyle = "#757575"; cizim.beginPath(); cizim.ellipse(x + 14, y + 4, 8, 6, 0, 0, Math.PI * 2); cizim.fill();
  } else {                                                                            // odun yigini
    for (let r = 0; r < 3; r++) {
      cizim.fillStyle = "#8d6e63"; cizim.fillRect(x + 8, y + 14 - r * 8, 24, 7);
      cizim.fillStyle = "#d7b98e"; cizim.beginPath(); cizim.arc(x + 32, y + 17.5 - r * 8, 3.5, 0, Math.PI * 2); cizim.fill();
    }
  }
}
function cizKamplar() {
  for (const k of kamplar) {
    if (tasima && tasima.ref === k) continue;                   // tasinan kamp yerinde cizilmez
    const hazir = kampHazir(k);
    const oc = k.tur === "ocak";
    const kad = KAMP_SPRITE[k.tur], kalt = k.y + KAMP_YARI - 4;
    const insaatAnim = (!hazir && spriteInsaatCiz(kad, k.x, kalt, 80, 78, insaatOrani(k), oc, insaatciCalisiyor(k)))     // iskeletten binaya
      || (hazir && k.yuk && spriteYukseltmeCiz(kad, k.x, kalt, 80, 78, oc, insaatciCalisiyor(k.yuk)));                   // yukseltme: iskele
    let konturVar = false;
    if (!insaatAnim) {
      if (!hazir) cizim.globalAlpha = 0.5;                      // sprite yoksa: soluk + kalan sure
      konturVar = cizKampAt(k.tur, k.x, k.y, k.secili && hazir ? "#4caf50" : null) === 2;
      cizim.globalAlpha = 1;
    }
    if (!hazir) {                                               // ilerleme cubugu (sure yazisinin altinda)
      const o2 = insaatOrani(k);
      cizim.fillStyle = "rgba(0,0,0,0.7)"; cizim.fillRect(k.x - 26, k.y - KAMP_YARI - 1, 52, 6);
      cizim.fillStyle = "#ffb74d"; cizim.fillRect(k.x - 25, k.y - KAMP_YARI, 50 * o2, 4);
    }
    if (!hazir) {
      cizim.globalAlpha = 1;
      const t = sureYazi(kalanSure(k.bitis));
      cizim.font = "bold 13px sans-serif";
      const g = cizim.measureText(t).width + 12;
      cizim.fillStyle = "rgba(0,0,0,0.65)";
      cizim.fillRect(k.x - g / 2, k.y - KAMP_YARI - 20, g, 18);
      cizim.fillStyle = "#ffd54f";
      cizim.textAlign = "center";
      cizim.fillText(t, k.x, k.y - KAMP_YARI - 7);
      cizim.textAlign = "left";
    }
    if (hazir) {                                                // seviye etiketi (+ yukseltme suresi)
      let t = "Sv " + kampSeviyesiOf(k);
      if (k.yuk) t += " → " + k.yuk.seviye + " (" + sureYazi(kalanSure(k.yuk.bitis)) + ")";
      if (k.arastirma) t += " · " + gelistirmeTanimi(k.arastirma.id).ad + " (" + sureYazi(kalanSure(k.arastirma.bitis)) + ")";
      cizim.font = "bold 13px sans-serif";
      const g = cizim.measureText(t).width + 12;
      cizim.fillStyle = "rgba(0,0,0,0.65)";
      cizim.fillRect(k.x - g / 2, k.y - KAMP_YARI - 20, g, 18);
      cizim.fillStyle = "#ffd54f";
      cizim.textAlign = "center";
      cizim.fillText(t, k.x, k.y - KAMP_YARI - 7);
      cizim.textAlign = "left";
    }
    if (hazir && k.yuzT !== undefined && k.yuzT < 1.4) {        // pasif uretim: yukari suzulen "+1"
      const a = 1 - k.yuzT / 1.4, metin = k.yuzMetin || "+1";
      cizim.globalAlpha = Math.max(0, a); cizim.font = "bold 13px sans-serif"; cizim.textAlign = "center";
      cizim.fillStyle = "#000"; cizim.fillText(metin, k.x + 1, k.y - KAMP_YARI - 26 - k.yuzT * 18 + 1);
      cizim.fillStyle = k.yuzRenk || "#a5d6a7"; cizim.fillText(metin, k.x, k.y - KAMP_YARI - 26 - k.yuzT * 18);
      cizim.textAlign = "left"; cizim.globalAlpha = 1;
    }
    if (hazir && k.secili) {                                    // secili kamp: etki bilgisi (altinda)
      const sv = kampSeviyesiOf(k), kay = KAMP_TURLERI[k.tur].kaynak, ad = kay === "agac" ? "odun" : kay === "kaya" ? "taş" : "et";
      let t = "Üretim: 1 " + ad + " / " + Math.round(pasifAralik(k)) + " sn";
      if (k.tur !== "avci") t += "  ·  İşçi hızı +" + Math.round(KAMP_HIZ_ARTIS * (sv - 1) * 100) + "%  ·  Yük: " + (ISCI_TASIMA + Math.floor(sv / KAMP_YUK_ADIM));
      cizim.font = "12px sans-serif";
      const g = cizim.measureText(t).width + 12;
      cizim.fillStyle = "rgba(0,0,0,0.72)"; cizim.fillRect(k.x - g / 2, k.y + KAMP_YARI + 4, g, 18);
      cizim.fillStyle = "#fff"; cizim.textAlign = "center"; cizim.fillText(t, k.x, k.y + KAMP_YARI + 17); cizim.textAlign = "left";
    }
    if (k.secili && !konturVar) {                               // secim cercevesi (yesil): gercek kontur yoksa kutu
      cizim.strokeStyle = "#4caf50"; cizim.lineWidth = 3;
      cizim.strokeRect(k.x - KAMP_YARI + 1, k.y - KAMP_YARI + 1, KAMP_YARI * 2 - 2, KAMP_YARI * 2 - 2);
    }
  }
}
