// ============================================================
// DOSYA: js/girdi.js
// Klavye ve fare: tuslar, Basla butonuna tiklama.
// ============================================================

addEventListener("keydown", e => {
  const t = e.key.toLowerCase();
  if (!basladi) { if (t === "enter" || t === " ") basla(); return; }
  tuslar[t] = true;
  if (t === TUS_AYARLAR && !e.repeat) { ayarlarDegistir(); return; }
  if (t === "escape" && ayarlarAcik) { ayarlarAcik = false; return; }
  if (ayarlarAcik) return;                                          // ayarlar acikken oyun tuslari calismaz
  if (t === TUS_KAMERA && !e.repeat) kameraOrtala();
  if (t === "e" && !e.repeat && KLAVYE_KONTROLU) topla();
  if (t === TUS_ISCI && !e.repeat && ev && ev.secili) isciUret();    // isci, SECILI evden uretilir
  if (t === TUS_MENU && !e.repeat) menuDegistir();
  if (!e.repeat) for (const b of BINALAR) if (b.tus && t === b.tus) binaSec(b.id);   // bina kisayollari (B, V...)
  if (t === "escape") { kurmaModuKapat(); tasimaIptal(); }
});
addEventListener("keyup", e => tuslar[e.key.toLowerCase()] = false);

tuval.addEventListener("click", e => {          // sadece giris ekranindaki BASLA butonu
  if (basladi) return;
  const b = butonAlani();
  const x = e.offsetX / olcek, y = e.offsetY / olcek;      // ekran pikseli -> dunya koordinati
  if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) basla();
});
tuval.addEventListener("mousedown", e => {      // sol tus basili: tik mi kutu mu, birakinca belli olur
  if (!basladi || e.button !== 0) return;
  const ex = e.offsetX / olcek, ey = e.offsetY / olcek;      // EKRAN koordinati (menu, ayarlar)
  if (ayarlarTikla(ex, ey)) return;                          // ayarlar dugmesi / paneli (panel aciksa her tik ona aittir)
  const d = ekrandanDunyaya(ex, ey), x = d.x, y = d.y;       // DUNYA koordinati (harita)
  if (tasima) { if (!arayuzAlaninda(ex, ey)) tasimaYerlestir(x, y); return; }   // bina tasiniyor: sol tik yeni yere birakir
  if (arayuzAlaninda(ex, ey)) { menuTikla(ex, ey); return; }   // alttaki insaat menusu
  if (isciPaneliTikla(x, y)) return;                         // secili evin Erkek/Kadin isci dugmeleri
  if (yonetimTikla(x, y)) return;                            // secili binanin Tasi / Yik dugmeleri
  if (kurmaModu === "ev") { evKoy(x, y); return; }          // ev yerlestir
  if (KAMP_TURLERI[kurmaModu]) { kampKoy(kurmaModu, x, y); return; }   // oduncu kampi / tas ocagi yerlestir
  fareBasildi(x, y);
});
tuval.addEventListener("mouseup", e => {
  if (!basladi || e.button !== 0) return;
  if (kurmaBasili) { kurmaBasili = false; return; }
  const d = ekrandanDunyaya(e.offsetX / olcek, e.offsetY / olcek);
  fareBirakildi(d.x, d.y, e.shiftKey);   // Shift: secime ekle
});
tuval.addEventListener("mouseleave", () => { secimKutusu.aktif = false; kurmaBasili = false; fareEkran.x = fareEkran.y = -1; });
tuval.addEventListener("contextmenu", e => {
  e.preventDefault();          // tarayici menusu cikmasin
  if (!basladi) return;
  if (ayarlarAcik) return;                          // ayarlar acikken oyuna emir verilmez
  if (tasima) { tasimaIptal(); return; }            // sag tik tasimayi iptal eder
  if (kurmaModu) { kurmaModuKapat(); return; }     // sag tik kurma modundan cikar
  const ex = e.offsetX / olcek, ey = e.offsetY / olcek;
  if (arayuzAlaninda(ex, ey) || icinde(ayarlarButonu(), ex, ey)) return;   // menunun ustunde emir verilmez
  const d = ekrandanDunyaya(ex, ey);
  emirVer(d.x, d.y);   // sag tik: yuru / topla
});
tuval.addEventListener("mousemove", e => {
  fareEkran.x = e.offsetX / olcek;
  fareEkran.y = e.offsetY / olcek;
  const d = ekrandanDunyaya(fareEkran.x, fareEkran.y);
  fare.x = d.x;
  fare.y = d.y;
  fareSurukle(fare.x, fare.y);
});

function basla() {
  basladi = true;
  sesBaslat();                           // tarayici sesi kullanici hareketiyle baslar
  baslangicZamani = performance.now();   // sure, Basla'ya basinca baslar
  if (YENI_BASLANGIC) baslangicKoyu();   // kahraman yok: ev ortada, 2 isci
  gorevBaslat();                         // ilk gorev de BASLA ile baslar
  if (yakin > 1) kameraOrtala();         // kayitli yakinlastirma varsa ana binaya (ya da kahramana) odaklan
}
