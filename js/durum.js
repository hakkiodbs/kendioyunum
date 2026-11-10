// ============================================================
// DOSYA: js/durum.js
// Oyunun baslangic durumu: tuval, oyuncu, toplanan odun/tas, ev, sure.
// ============================================================

const tuval = document.getElementById("oyun");
const cizim = tuval.getContext("2d");

const oyuncu = {
  x: DUNYA_GEN / 2 - 15, y: DUNYA_YUK / 2 - 15, boyut: 30,
  secili: true,      // sol tikla secilir (AoE gibi)
  hedef: null,       // {x, y}: yurunecek nokta (kahramanin MERKEZI)
  kaynak: null,      // toplamaya gidilen agac/kaya
  topluyor: false,   // kaynagin yaninda toplama yapiyor
  sayac: 0,          // toplama suresi sayaci (saniye)
  yon: 1,            // bakis yonu: 1 = saga, -1 = sola
  yuruyor: false,    // bu karede yuruduyse true (animasyon icin)
  animSure: 0        // yuruyus/toplama animasyon saati (saniye)
};
let emirIsareti = null;   // son sag tik: {x, y, tur:"git"|"topla", sure}
const fare = { x: -1, y: -1 };   // fare konumu (DUNYA koordinati)
const fareEkran = { x: -1, y: -1 };   // fare konumu (EKRAN koordinati: menu ve arayuz icin)
let yakin = 1;                   // yakinlastirma orani (ayarlardan)
const kamera = { x: 0, y: 0 };   // ekranin sol ust kosesinin dunya konumu (yakinken kayar)
let oyunSaati = 0;               // oyun saati (saniye): sadece oyun acikken ilerler (insaat sureleri bunu kullanir)
let oyunHizi = 1;                // ayarlardan: oyun saatini hizlandirir (1, 10, 100, 1000)
let duvarInsaat = null;          // devam eden duvar yukseltmesi: {seviye, bitis}
let insaatAnlik = false;         // gelistirici/test bayragi: tum insaatlar aninda biter
let ayarlarAcik = false;         // ayarlar paneli acik mi
const tuslar = {};
let odun = 0;
let tas = 0;
let ev = null;   // ev dikilince {x, y} olur
let bitisZamani = 0;
let baslangicZamani = performance.now();
let basladi = false;   // giris ekraninda "Basla"ya basilinca true olur
const isciler = [];   // calisan isciler
let dt = 0;   // son karenin suresi (saniye). Tum hareketler bunu kullanir, boylece her monitorde ayni hiz
let duvarSeviye = 0;     // koy duvari seviyesi (0 = yok, 1..30)
const duvarlar = [];   // kurulan duvarlar: {gx, gy} (izgara kare numarasi)
let kurmaModu = null;    // hangi bina yerlestiriliyor: null | "ev" | "duvar" (hayalet fareyi izler)
let kurmaBasili = false; // kurma modunda sol tus basili mi (surukleyerek cok duvar)
let menuAcik = true;     // alttaki insaat menusu gorunuyor mu
// --- gorev sistemi (durum) ---
let gorevIndex = 0;                  // siradaki aktif gorev (GOREVLER[gorevIndex])
const tamamlananGorevler = [];       // bitmis gorev id'leri: bir daha asla gelmez
let gorevTaban = { odun: 0, tas: 0 };// aktif gorev basladiginda toplanan miktar (toplama gorevleri buradan sayar)
const toplanan = { odun: 0, tas: 0 };// oyun boyunca TOPLANAN toplam (odul sayilmaz)
const gorevBildirimleri = [];        // ekranda sirayla gosterilecek yazilar
const kamplar = [];     // kurulan kamplar: {tur: "oduncu" | "ocak", x, y} (x,y: izgara kesisimindeki merkez)
