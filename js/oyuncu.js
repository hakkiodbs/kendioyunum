// ============================================================
// DOSYA: js/oyuncu.js
// Kahraman: AoE tarzi fare kontrolu (sol tik sec, sag tik yuru/topla).
// ============================================================

const KAHRAMAN_DURMA = 3;
const KAHRAMAN_BOY = 46;    // cizilen insanin boyu (piksel); carpisma kutusu 30x30 kalir   // piksel: hedefe bu kadar yaklasinca durur

function kahramanMerkez() { return { x: oyuncu.x + oyuncu.boyut / 2, y: oyuncu.y + oyuncu.boyut / 2 }; }

// Noktanin altindaki agac/kaya (yoksa null). Fare uzerine gelince de bununla bakilir.
function noktadakiKaynak(x, y) {
  let en = null, enUzak = Infinity;
  for (const k of kaynaklar) {
    if (k.kalan <= 0) continue;
    const cy = k.tur === "agac" ? k.y - 4 : k.y;           // cizilen seklin merkezi
    const d = Math.hypot(k.x - x, cy - y);
    const r = k.tur === "agac" ? 22 : 24;                  // tiklama yaricapi (cizimden biraz buyuk)
    if (d <= r && d < enUzak) { enUzak = d; en = k; }
  }
  return en;
}

// Sag tik: SECILI birimlere emir verilir (kahraman ve/veya isciler). Hicbiri secili degilse bir sey olmaz.
function emirVer(x, y) {
  if (!secimVar()) return;
  x = Math.max(0, Math.min(DUNYA_GEN, x));
  y = Math.max(0, Math.min(DUNYA_YUK, y));
  const k = noktadakiKaynak(x, y);
  if (k) emirIsareti = { x: k.x, y: k.tur === "agac" ? k.y - 4 : k.y, tur: "topla", sure: 0.6 };
  else emirIsareti = { x, y, tur: "git", sure: 0.6 };

  if (oyuncu.secili) {
    oyuncu.topluyor = false;
    oyuncu.sayac = 0;
    if (k) { oyuncu.kaynak = k; oyuncu.hedef = null; }
    else { oyuncu.kaynak = null; oyuncu.hedef = { x, y }; }
  }
  iscilereEmir(x, y, k);
}

// Kahramani (merkezi) hedefe dogru yuruter. Vardiysa true.
function kahramanYuru(hx, hy, durma) {      // yol bularak yuru (engellerin etrafindan dolanir)
  const m = kahramanMerkez(), n = yolNoktasi(oyuncu, m.x, m.y, hx, hy);
  return kahramanDuzYuru(n.x, n.y, n.son ? durma : 0) && n.son;
}
function kahramanDuzYuru(hx, hy, durma) {
  const m = kahramanMerkez();
  const dx = hx - m.x, dy = hy - m.y;
  const mesafe = Math.hypot(dx, dy);
  if (mesafe <= durma + 0.01) return true;      // kucuk tolerans: kayan nokta hatasi yuzunden takilmasin
  const adim = Math.min(HIZ * 60 * dt, mesafe - durma);
  oyuncu.x += dx / mesafe * adim;
  oyuncu.y += dy / mesafe * adim;
  oyuncu.yuruyor = true;
  if (Math.abs(dx) > 0.5) oyuncu.yon = dx > 0 ? 1 : -1;
  return mesafe - adim <= durma + 0.01;          // bu karede vardiysa hemen true
}

// Kaynak bitince ayni turden, yakindaki en yakin kaynaga gec (AoE koylusu gibi).
function sonrakiKaynagaGec(eski) {
  const m = kahramanMerkez();
  let en = null, enUzak = KAHRAMAN_ARAMA;
  for (const k of kaynaklar) {
    if (k.kalan <= 0 || k.tur !== eski.tur) continue;
    const d = Math.hypot(k.x - m.x, k.y - m.y);
    if (d <= enUzak) { enUzak = d; en = k; }
  }
  oyuncu.kaynak = en;
  oyuncu.topluyor = false;
  oyuncu.sayac = 0;
}

function kahramaniYurut() {
  const k = oyuncu.kaynak;
  if (k) {
    if (k.kalan <= 0) { sonrakiKaynagaGec(k); return; }
    // kaynagin TOPLAMA_MESAFESI icine girince durur ve toplar
    const vardi = kahramanYuru(k.x, k.y, TOPLAMA_MESAFESI * 0.8);
    if (!vardi) { oyuncu.topluyor = false; oyuncu.sayac = 0; return; }
    oyuncu.topluyor = true;
    oyuncu.yon = k.x >= kahramanMerkez().x ? 1 : -1;     // kaynaga bak
    oyuncu.sayac += dt;
    if (oyuncu.sayac >= KAHRAMAN_TOPLAMA_SURESI) {
      oyuncu.sayac -= KAHRAMAN_TOPLAMA_SURESI;
      k.kalan--;
      kaynakEkle(k.tur, 1);
      if (k.kalan <= 0) sonrakiKaynagaGec(k);
    }
  } else if (oyuncu.hedef) {
    if (kahramanYuru(oyuncu.hedef.x, oyuncu.hedef.y, KAHRAMAN_DURMA)) oyuncu.hedef = null;
  }
}

function guncelle() {
  if (!basladi) return;
  kaynaklariGuncelle();
  insaatGuncelle();
  pasifUretimGuncelle();
  gelistirmeGuncelle();
  engelGuncelle();
  kameraGuncelle();
  iscileriGuncelle();
  gorevleriKontrolEt();
  gorevBildirimiGuncelle();
  oyuncu.yuruyor = false;
  oyuncu.animSure += dt;
  if (emirIsareti) { emirIsareti.sure -= dt; if (emirIsareti.sure <= 0) emirIsareti = null; }

  // klavye (eski kontrol) ancak ayardan acilirsa; klavye kullanilinca fare emri iptal olur
  if (KLAVYE_KONTROLU) {
    const sol = tuslar["arrowleft"] || tuslar["a"], sag = tuslar["arrowright"] || tuslar["d"];
    const yuk = tuslar["arrowup"] || tuslar["w"], asa = tuslar["arrowdown"] || tuslar["s"];
    if (sol || sag || yuk || asa) { oyuncu.hedef = null; oyuncu.kaynak = null; oyuncu.topluyor = false; }
    if (sol) oyuncu.x -= HIZ * 60 * dt;
    if (sag) oyuncu.x += HIZ * 60 * dt;
    if (yuk) oyuncu.y -= HIZ * 60 * dt;
    if (asa) oyuncu.y += HIZ * 60 * dt;
  }
  if (YENI_BASLANGIC) { oyuncu.secili = false; return; }     // kahraman yok
  kahramaniYurut();
  oyuncu.x = Math.max(0, Math.min(DUNYA_GEN - oyuncu.boyut, oyuncu.x));
  oyuncu.y = Math.max(KAHRAMAN_BOY - oyuncu.boyut, Math.min(DUNYA_YUK - oyuncu.boyut, oyuncu.y));   // ust sinir: kafa disari tasmasin
}

// Fare uzerindeki kaynagi isaretle; kahraman toplarken ya da klavye modunda yakin olani isaretle.
function isaretliKaynak() {
  if (oyuncu.kaynak && oyuncu.kaynak.kalan > 0) return oyuncu.kaynak;
  if (secimVar()) { const h = noktadakiKaynak(fare.x, fare.y); if (h) return h; }
  return KLAVYE_KONTROLU ? enYakinKaynak() : null;
}

// Kahraman: secim halkasi + insan govdesi (js/insan.js) + toplama cubugu.
function cizKahraman() {
  if (YENI_BASLANGIC) return;        // kahraman yok
  const o = oyuncu;
  const cx = o.x + o.boyut / 2;      // ayaklarin ortasi
  const fy = o.y + o.boyut;          // ayak hizasi (yer)

  if (o.secili) {                    // AoE secim halkasi (yesil elips, ayaklarin altinda)
    cizim.strokeStyle = "#4caf50";
    cizim.lineWidth = 2;
    cizim.beginPath();
    cizim.ellipse(cx, fy, 17, 7, 0, 0, Math.PI * 2);
    cizim.stroke();
  }
  cizInsan(cx, fy, 1, o.yon, o.yuruyor, o.topluyor, o.animSure, RENK);

  if (o.topluyor) {        // toplama ilerleme cubugu (basin ustunde)
    const oran = Math.min(1, o.sayac / KAHRAMAN_TOPLAMA_SURESI);
    const by = fy - KAHRAMAN_BOY - 6;
    cizim.fillStyle = "#000";
    cizim.fillRect(cx - 16, by, 32, 6);
    cizim.fillStyle = "#ffd54f";
    cizim.fillRect(cx - 15, by + 1, 30 * oran, 4);
  }
}

// Sag tik isareti: yere giderken yesil halka, kaynaga giderken sari halka.
function cizEmirIsareti() {
  if (!emirIsareti) return;
  const oran = emirIsareti.sure / 0.6;
  cizim.strokeStyle = emirIsareti.tur === "topla" ? "#ffd54f" : "#4caf50";
  cizim.lineWidth = 2;
  cizim.beginPath();
  cizim.arc(emirIsareti.x, emirIsareti.y, 6 + 14 * (1 - oran), 0, Math.PI * 2);
  cizim.stroke();
}
