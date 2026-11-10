# Kendi Oyunum (test sürümü)

Klanlar + Mount & Blade + Age of Empires karışımı, tarayıcıda oynanan 2B strateji oyunu.
Şu an **tek kişilik test sürümü**: köy kur, işçi üret, kaynak topla, geliştirme araştır.

## Oynamak
Tarayıcıdan oyun sayfasını aç (GitHub Pages bağlantısı). Kurulum gerekmez.
Sayfa takılırsa **Ctrl+F5** ile yenile.

## Kaynaklar
Odun, Tahta, Taş, Altın, Et.
- **Oduncu Kampı** odun toplar; "Testere" geliştirmesiyle odunun bir kısmı tahtaya dönüşür.
- **Taş Ocağı** taş çıkarır; "Maden Arama" (Sv3) ile altın da çıkarır.
- **Avcı Kampı** (köy Sv2) kendiliğinden et üretir. İşçi üretmek odun + et ister.

## Test eden arkadaşlar için
Bir hata, takılma ya da "bu eksik" dediğin şey olursa Issues sekmesinden yaz:
ne yaptığını, ne beklediğini ve ne olduğunu kısaca anlat (mümkünse ekran görüntüsü ekle).

## Geliştirme
Düz HTML + Canvas + JavaScript, derleme yok. `index.html`'i açmak yeterli.
Testler: `node tests/test_baslangic.js` (diğerleri `tests/` içinde). Yol haritası: `docs/YOL_HARITASI.md`.
Çok oyunculu mod henüz yok, sunucu gerektirdiği için ileri aşamada.

Grafikler: Quaternius (CC0) 3B modellerinden üretildi.
