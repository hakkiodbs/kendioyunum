// ============================================================
// DOSYA: js/ayarlar.js
// Oyunun tum ayarlari (hiz, sayilar, maliyetler, yazilar). Oynayacagin yer burasi.
// ============================================================

// ====== BUNLARI SEN DEGISTIR ======
const HIZ = 2;                  // oyuncu hizi: 60 FPS'te kare basina piksel (2 = saniyede 120 piksel). Her monitorde ayni.
const RENK = "#c62828";
const AGAC_SAYISI = 80;        // ekranda kac agac olsun
const TOPLAMA_MESAFESI = 20;  // yaklasinca toplayabilirsin
const AGAC_YENILENME_SURESI = 150;   // saniye: kesilen agac bu sure sonra yeniden buyur (tas madeni yenilenmez)
const AGAC_BASINA_ODUN = 25;   // her agactan en fazla kac odun
// --- Gun 3 gorevi: bu ikisini sen degistir ---
const TAS_SAYISI = 28;         // ekranda kac kaya olsun
const KAYA_BASINA_TAS = 25;    // her kayadan en fazla kac tas
const CERCEVE_PAYI = 0;        // beyaz cerceve: 0 = nesneye tam oturur, 5 = biraz genis, -3 = daha dar
// --- Gun 4 gorevi: bu ikisini sen degistir ---
const EV_ICIN_ODUN = 10;      // ev icin kac odun lazim
const EV_ICIN_TAS = 6;        // ev icin kac tas lazim
// --- Gun 5 gorevi: bu ikisini sen degistir ---
const TEBRIK_YAZISI = "Tebrikler! Hanen Hazır Güle güle Otur..";  // bitis ekraninda gorunen yazi
const TEBRIK_SURESI = 5;                           // ev dikilince tebrik yazisi kac saniye ekranda kalsin
// --- Gun 6 gorevi ---
const TAM_EKRAN = true;   // true = oyun pencereye sigdirilir (her monitorde), false = 1280x720 sabit kutu + baslik
// (EV_ICIN_ODUN ve EV_ICIN_TAS de bu gunun gorevi: yukarida, 27-28. satirlar)
// --- Asama 1: ISCILER (ev kurulunca N tusu ile isci cikar) ---
const ISCI_MALIYETI_ODUN = 5;    // bir isci kac odun (+ ISCI_MALIYETI_ET et, bkz ISCI_MALIYET)
const ISCI_MAX = 6;              // en fazla kac isci
const ISCI_HIZI = 50;           // yuruyus hizi, piksel/SANIYE (AoE gibi yavas: 40-60). Oyuncunun HIZ degerinden bagimsiz
const ISCI_TOPLAMA_SURESI = 1.5;  // 1 birim toplamak kac saniye surer
const ISCI_TASIMA = 5;           // kac birim dolunca eve doner (dolana kadar toplar)
const ISCI_HEDEF = 4;            // gorev: kac isci calistir
const TUS_ISCI = "n";            // isci cikarma tusu (kucuk harf yaz). Turkce klavyede i/ı karisabilir, o yuzden N.

// --- EKRAN: oyun dunyasi HERKES icin ayni boyutta (adil). Pencereye orani bozulmadan sigdirilir. ---
const DUNYA_GEN = 1280;          // dunya genisligi
const DUNYA_YUK = 720;           // dunya yuksekligi

// ==================================

// --- KAHRAMAN KONTROLU (Age of Empires tarzi fare) ---
// Sol tik: sec / secimi birak.  Sag tik: yere = yuru, agac/kayaya = git ve topla.
const KLAVYE_KONTROLU = false;      // true yaparsan ok tuslari/WASD ve E tusu da calisir (eski kontrol)
const KAHRAMAN_TOPLAMA_SURESI = 1.0; // saniye: kahraman 1 odun/tas icin bu kadar bekler
const KAHRAMAN_ARAMA = 300;         // piksel: kaynak bitince ayni turden en yakin kaynagi bu yaricapta arar

// --- BINA SISTEMI (Asama 2): izgara ve duvar ---
const KARE = 40;               // izgara kare boyutu (piksel). Dunya 1280x720 -> 32 x 18 kare
const DUVAR_MAX_SEVIYE = 30;     // koy duvari 30 seviye
const DUVAR_TAS_SEVIYESI = 25;   // 1-25 ODUN duvar, 26-30 TAS duvar
const DUVAR_ILK_ODUN = 60;       // seviye 1 odun maliyeti (SONRA YUKSELTILECEK: harita kaynagi karari bekliyor, bkz docs)
const DUVAR_ILK_TAS = 300;       // seviye 26 tas maliyeti
const DUVAR_ARTIS = 1.15;        // her seviyede maliyet carpani (Klanlar gibi ustel)
const TUS_DUVAR = "v";         // duvar kurma modunu ac/kapa

// --- INSAAT MENUSU (alttaki cubuk) ---
const UST_YUK = 46;             // ustteki bilgi cubugunun yuksekligi (piksel)
const OYUNCU_ADI = "Hakkı", OYUNCU_UNVAN = "Köy Reisi";   // profil (ileride giris/hesap sistemine baglanacak)
const MENU_YUK = 122;           // alttaki menu panelinin yuksekligi (piksel)
// Her bina: ad, kisayol tusu, hangi KOY SEVIYESINDE acilir, maliyet, hazir (kodu yazildi mi), tek (sadece bir tane)
//   Koy seviyesi: 1 baslangic, 2 = ev kuruldu, 3 = ev + ISCI_HEDEF kadar isci
const BINALAR = [
  { kat: "ekonomi", id: "ev",    ad: "Ev",    tus: "b",       seviye: 1, odun: EV_ICIN_ODUN, tas: EV_ICIN_TAS,    hazir: true,  tek: true },
  { kat: "savunma", id: "duvar", ad: "Köy Duvarı", tus: TUS_DUVAR, seviye: 2, odun: 0, tas: 0,           hazir: true,  tek: false },   // maliyet: duvarMaliyet()
  { kat: "ekonomi", id: "oduncu", ad: "Oduncu Kampı", tus: "o",    seviye: 2, odun: 8,            tas: 0,              hazir: true,  tek: false },
  { kat: "ekonomi", id: "ocak",   ad: "Taş Ocağı",    tus: "t",    seviye: 2, odun: 10,           tas: 0,              hazir: true,  tek: false },
  { kat: "ekonomi", id: "avci",   ad: "Avcı Kampı",   tus: "h",    seviye: 2, odun: 12,           tas: 2,              hazir: true,  tek: false }
];
const TUS_MENU = "m";            // insaat menusunu gizle/goster

// --- ISCI ISIMLERI (cinsiyete gore, sirayla verilir) ---
const ERKEK_ISIMLERI = ["Ahmet", "Mehmet", "Mustafa", "Ali", "Hasan", "Hüseyin", "İbrahim", "Yusuf", "Murat", "Kemal", "Osman", "Ömer"];
const KADIN_ISIMLERI = ["Ayşe", "Fatma", "Emine", "Hatice", "Zeynep", "Elif", "Meryem", "Hacer", "Sevgi", "Leyla", "Selma", "Gül"];

// --- GOREVLER (sirayla gelir, her biri BIR KEZ; bitince odul verilir, siradaki gorev ekrana gelir) ---
// tur: ev | isci | duvar | oduncu | ocak | odunToplanan | tasToplanan   (odunToplanan/tasToplanan: gorev basladiktan SONRA toplanan miktar)
// hedef: ulasilacak sayi    odul: {odun, tas}
const GOREVLER = [
  { id: "ev",     ad: "Bir ev yap",     tur: "ev",           hedef: 1,         odul: { odun: 10 } },
  { id: "isci4",  ad: "İşçi çalıştır",  tur: "isci",         hedef: ISCI_HEDEF, odul: { odun: 15 } },
  { id: "oduncu1", ad: "Oduncu Kampı kur", tur: "oduncu",    hedef: 1,         odul: { odun: 10 } },
  { id: "ocak1",  ad: "Taş Ocağı kur",    tur: "ocak",      hedef: 1,         odul: { odun: 10, tas: 5 } },
  { id: "duvar1", ad: "Köy duvarını kur", tur: "duvar",     hedef: 1,         odul: { tas: 10 } },
  { id: "odun50", ad: "Odun topla",     tur: "odunToplanan", hedef: 50,        odul: { odun: 20, tas: 5 } },
  { id: "tas30",  ad: "Taş topla",      tur: "tasToplanan",  hedef: 30,        odul: { tas: 15 } },
  { id: "isci6",  ad: "6 işçiye ulaş",  tur: "isci",         hedef: ISCI_MAX,  odul: { odun: 30, tas: 10 } }
];
const GOREV_BILDIRIM_SURESI = 3;   // saniye: "Gorev tamamlandi" / "Yeni gorev" yazisi ekranda kalir


// --- KAYNAK ALANLARI ve KAMPLAR (Age of Empires tarzi) ---
const ORMAN_BOYUTU = 40;      // bir ormanda kac agac (sik, tek kutle)
const MADEN_BOYUTU = 14;      // bir tas madeninde kac kaya
const KAYNAK_GRUBU = 5;      // agaclar/kayalar ormanlar ve kaya alanlari halinde toplu dururlar: her grupta en fazla kac tane
const KAMP_YARI = 40;        // kamp 2x2 kare (80x80 piksel) yer kaplar: merkezden bu kadar her yone

// --- KAMERA / AYARLAR ---
const YAKIN_SECENEKLERI = [1, 1.25, 1.5, 1.75, 2, 2.5];   // yakinlastirma oranlari (1 = 100%)
const KAMERA_HIZI = 500;        // kaydirma hizi (piksel/saniye, ekranda)
const KAMERA_KENAR = 18;        // fare ekran kenarina bu kadar yaklasinca harita kayar
const TUS_AYARLAR = "p";        // ayarlar menusu
const TUS_KAMERA = "c";         // kamerayi kahramana odakla

// --- INSAAT SURELERI (saniye) ---
const INSAAT_YUVASI = 2;           // ayni anda en fazla kac insaat (Klanlar gibi kuyruk)
const INSA_EV_SURESI = 0;          // ev anlik (baslangic binasi)
const INSA_KAMP_SURESI = 20;       // oduncu kampi / tas ocagi
const DUVAR_INSA_ILK = 60;         // duvar seviye 1 suresi; her seviyede x DUVAR_INSA_ARTIS (30. seviye ~33 saat, toplam ~6 gun)
const DUVAR_INSA_ARTIS = 1.3;
const HIZ_SECENEKLERI = [1, 10, 100, 1000];   // oyun hizi carpani (sadece insaat sureleri; test icin)

// --- BINA SEVIYELERI (Klanlar gibi: her bina seviyelenir, yukseltmeler sure ve malzeme ister) ---
const BINA_MAX = { ev: 20, oduncu: 20, ocak: 20, avci: 20, duvar: 30 };            // en yuksek seviyeler
const BINA_MALIYET_ARTIS = 1.28;                                         // her seviyede maliyet carpani
const BINA_TEMEL = { ev: { odun: 10, tas: 6 }, oduncu: { odun: 8, tas: 4 }, ocak: { odun: 10, tas: 6 }, avci: { odun: 10, tas: 3 } };   // 2. seviye maliyeti (sonrasi x BINA_MALIYET_ARTIS)
const INSA_EV_ILK = 45;           // ev 2. seviye suresi (sn); sonraki seviyeler x 1.3
const INSA_KAMP_ARTIS = 1.3;      // kamp suresi her seviyede carpani (1. seviye: INSA_KAMP_SURESI)
const EV_HIZ_BONUSU = 0.04;       // Ana bina her seviyesinde TUM insaat sureleri %4 kisalir (ustel)
const ISCI_ARTIS = 2;             // Ev her seviyesinde isci siniri +2
const KAMP_HIZ_ARTIS = 0.1;       // kamp her seviyesinde ilgili iscilerin toplama hizi +%10
const KAMP_YUK_ADIM = 4;          // kamp her 4 seviyede isci tasima kapasitesi +1

// --- BASLANGIC (Klanlar gibi: kahraman yok, ana bina ortada kurulu, 1 erkek + 1 kadin isci) ---
// --- PASIF URETIM: hazir her kamp, isci olmasa da yavasca kaynak uretir (oyun saatine bagli; hiz secenekleriyle hizlanir) ---
const ET_BASLANGIC = 30;           // baslangic eti (isci uretmek icin)
const ISCI_MALIYETI_ET = 3;        // bir isci kac et
const AVCI_ARALIK = 15;            // Avci Kampi Sv1 kac oyun-saniyede bir et uretir
const TAHTA_ARALIK = 24, TAHTA_ODUN = 2, TAHTA_KORUMA = 10;   // Testere: kamp her TAHTA_ARALIK sn'de TAHTA_ODUN odunu 1 tahtaya cevirir (stokta en az KORUMA odun kalirsa)
const ALTIN_ARALIK = 45;           // Maden Arama: Tas Ocagi Sv1 kac oyun-saniyede bir altin cikarir
const YUKSELT_TAHTA_SEVIYE = 4, YUKSELT_TAHTA_ORAN = 0.3;     // bu seviyeden itibaren yukseltme tahta ister (odun maliyetinin orani)
const YUKSELT_ALTIN_SEVIYE = 6, YUKSELT_ALTIN_ORAN = 0.25;    // bu seviyeden itibaren altin ister (tas maliyetinin orani)
const PASIF_ARALIK = 20;         // Sv1 kamp kac oyun-saniyede BIR birim uretir
const PASIF_SEVIYE_ARTIS = 0.25; // her ek seviyede uretim hizi bu kadar artar (Sv5 = 2 kat)
let YENI_BASLANGIC = true;       // false = eski mod (kahraman var, ev elle kurulur); testler eski modu kullanir
const EV_TASIMA_SEVIYESI = 3;    // ana bina bu seviyeye gelince tasinabilir (oyuncu koyunu kendine gore duzenler)
