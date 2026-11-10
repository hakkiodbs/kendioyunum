// ============================================================
// DOSYA: js/oyun.js
// Ana cizim ve oyun dongusu. En son yuklenir ve oyunu baslatir.
// ============================================================

function ciz() {
  cizim.setTransform(cizimOlcegi, 0, 0, cizimOlcegi, 0, 0);   // ekran koordinati
  cizim.clearRect(0, 0, DUNYA_GEN, DUNYA_YUK);
  const zk = cizimOlcegi * yakin;                              // DUNYA koordinati: yakinlastirma + kamera kaymasi
  cizim.setTransform(zk, 0, 0, zk, -kamera.x * zk, -kamera.y * zk);
  cizZemin();                                                  // dokulu cimen zemin (en alta)
  const isaretli = isaretliKaynak();

  const sirali = spriteHazir("Pine_1") ? kaynaklar.slice().sort((a, b) => a.y - b.y) : kaynaklar;   // sprite varsa alttakiler ustteki agaclarin onune gelir
  for (const k of sirali) {
    const konturlu = k.tur === "agac" ? cizAgac(k, k === isaretli) : cizKaya(k, k === isaretli);
    if (k === isaretli && konturlu !== 2) {                // toplanabilir isareti: sprite konturu yoksa beyaz halka
      cizim.strokeStyle = "#fff";
      cizim.lineWidth = 2;
      cizim.beginPath();
      if (k.tur === "agac" && k.kalan > 0 && spriteHazir("Pine_1")) {     // sprite agac: tabanin etrafinda halka
        cizim.ellipse(k.x, k.y + 14, 22 + CERCEVE_PAYI, 11 + CERCEVE_PAYI / 2, 0, 0, Math.PI * 2);
      } else if (k.tur === "agac") {         // yapragi sarar
        cizim.arc(k.x, k.y - 4, 20 + CERCEVE_PAYI, 0, Math.PI * 2);
      } else {                        // kayayi sarar
        cizim.ellipse(k.x, k.y, 22 + CERCEVE_PAYI, 16 + CERCEVE_PAYI, 0, 0, Math.PI * 2);
      }
      cizim.stroke();
    }
  }

  cizDuvarlar();
  cizKamplar();
  cizEv();
  cizIsciler();

  cizHayalet();
  cizEmirIsareti();
  cizIsciDugmesi();
  cizYonetimPaneli();
  cizKahraman();
  cizSecimKutusu();
  tuval.style.cursor = kurmaModu ? "crosshair" : (basladi && secimVar() && noktadakiKaynak(fare.x, fare.y)) ? "pointer" : "default";

  cizim.setTransform(cizimOlcegi, 0, 0, cizimOlcegi, 0, 0);   // buradan sonrasi ARAYUZ (ekran koordinati, yakinlastirmadan etkilenmez)
  cizUstCubuk();
  cizInsaatListesi();
  cizGorevPaneli();
  cizMenu();
  cizGorevBildirimi();
  cizAyarlar();
}

let sonZaman = null;
function zamaniGuncelle() {
  const simdi = performance.now();
  dt = sonZaman === null ? 0 : (simdi - sonZaman) / 1000;
  sonZaman = simdi;
  if (dt > 0.1) dt = 0.1;     // sekme arka plandayken her sey siçramasin
}

function dongu() { zamaniGuncelle(); guncelle(); ciz(); cizTebrik(); cizGiris(); requestAnimationFrame(dongu); }
dongu();
