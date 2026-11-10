// ============================================================
// DOSYA: js/kamera.js
// KAMERA + AYARLAR MENUSU. Yakinlastirma orani (zoom) ayarlardan secilir; yakinlasinca harita oklarla ya da
// fareyi ekran kenarina goturerek kaydirilir. Menu, panel ve yazilar (arayuz) her zaman ayni boyutta kalir.
// Iki koordinat: EKRAN (arayuz, 1280x720 sanal) ve DUNYA (harita). Fare tiklari ikisine de cevrilir.
// KOMUTLAR: yakinAyarla(oran), kameraOrtala(), ayarlarDegistir().  DURUM: yakin, kamera, ayarlarAcik.
// ============================================================

function gorunenGen() { return DUNYA_GEN / yakin; }
function gorunenYuk() { return DUNYA_YUK / yakin; }
function ekrandanDunyaya(ex, ey) { return { x: kamera.x + ex / yakin, y: kamera.y + ey / yakin }; }
function dunyadanEkrana(x, y) { return { x: (x - kamera.x) * yakin, y: (y - kamera.y) * yakin }; }

function kameraSinirla() {
  kamera.x = Math.max(0, Math.min(DUNYA_GEN - gorunenGen(), kamera.x));
  kamera.y = Math.max(0, Math.min(DUNYA_YUK - gorunenYuk(), kamera.y));
}
function kameraOrtala() {                    // kamerayi kahramana (yeni modda ana binaya) odakla
  const m = YENI_BASLANGIC && ev ? { x: ev.x, y: ev.y } : kahramanMerkez();
  kamera.x = m.x - gorunenGen() / 2;
  kamera.y = m.y - gorunenYuk() / 2;
  kameraSinirla();
}

// KOMUT: yakinlastirma orani (ekranin ortasi sabit kalir). Secenekler disinda deger kabul edilmez.
function yakinAyarla(oran) {
  if (!YAKIN_SECENEKLERI.includes(oran)) return false;
  const mx = kamera.x + gorunenGen() / 2, my = kamera.y + gorunenYuk() / 2;
  yakin = oran;
  kamera.x = mx - gorunenGen() / 2;
  kamera.y = my - gorunenYuk() / 2;
  kameraSinirla();
  ayarlariKaydet();
  return true;
}
function yakinAdim(yon) {                    // -1 / +1: bir sonraki secenek
  const i = YAKIN_SECENEKLERI.indexOf(yakin) + yon;
  if (i >= 0 && i < YAKIN_SECENEKLERI.length) yakinAyarla(YAKIN_SECENEKLERI[i]);
}
function ayarlarDegistir() { ayarlarAcik = !ayarlarAcik; }

// Kalici ayar (tarayici hafizasi). Hata verirse (file://, gizli mod) sessizce yok sayilir.
function ayarlariKaydet() { try { localStorage.setItem("kendioyunum_ayarlar", JSON.stringify({ yakin, oyunHizi })); } catch (e) {} }
function ayarlariYukle() {
  try {
    const a = JSON.parse(localStorage.getItem("kendioyunum_ayarlar") || "null");
    if (a && YAKIN_SECENEKLERI.includes(a.yakin)) yakin = a.yakin;
    if (a && HIZ_SECENEKLERI.includes(a.oyunHizi)) oyunHizi = a.oyunHizi;
  } catch (e) {}
}
ayarlariYukle();

// Her karede: ok tuslari ve ekran kenari ile kaydir (sadece yakinlasmisken).
function kameraGuncelle() {
  if (yakin <= 1) { kamera.x = 0; kamera.y = 0; return; }
  if (ayarlarAcik) return;
  const hiz = KAMERA_HIZI * dt / yakin;
  let dx = 0, dy = 0;
  if (tuslar["arrowleft"]) dx -= 1;
  if (tuslar["arrowright"]) dx += 1;
  if (tuslar["arrowup"]) dy -= 1;
  if (tuslar["arrowdown"]) dy += 1;
  if (fareEkran.x >= 0 && !menuAlaninda(fareEkran.x, fareEkran.y) && !icinde(ayarlarButonu(), fareEkran.x, fareEkran.y)) {
    if (fareEkran.x < KAMERA_KENAR) dx -= 1;
    if (fareEkran.x > DUNYA_GEN - KAMERA_KENAR) dx += 1;
    if (fareEkran.y < KAMERA_KENAR) dy -= 1;
    if (fareEkran.y > DUNYA_YUK - KAMERA_KENAR) dy += 1;
  }
  kamera.x += dx * hiz;
  kamera.y += dy * hiz;
  kameraSinirla();
}

// ---------- AYARLAR MENUSU (ekran koordinatlari) ----------
function ayarlarButonu() { return { x: 770, y: 8, w: 104, h: 28 }; }
function ayarlarPaneli() { const w = 460, h = 420; return { x: (DUNYA_GEN - w) / 2, y: (DUNYA_YUK - h) / 2, w, h }; }
function ayarlarDugmeleri() {
  const p = ayarlarPaneli(), l = [];
  l.push({ id: "eksi", ad: "−", x: p.x + 30, y: p.y + 70, w: 56, h: 44 });
  l.push({ id: "arti", ad: "+", x: p.x + p.w - 86, y: p.y + 70, w: 56, h: 44 });
  const gen = 62, bosluk = 6, toplam = YAKIN_SECENEKLERI.length * gen + (YAKIN_SECENEKLERI.length - 1) * bosluk;
  YAKIN_SECENEKLERI.forEach((o, i) => l.push({ id: "oran", oran: o, ad: Math.round(o * 100) + "%", x: p.x + (p.w - toplam) / 2 + i * (gen + bosluk), y: p.y + 130, w: gen, h: 34 }));
  const hg = 80, hb = 8, ht = HIZ_SECENEKLERI.length * hg + (HIZ_SECENEKLERI.length - 1) * hb;
  HIZ_SECENEKLERI.forEach((h, i) => l.push({ id: "hiz", hiz: h, ad: h + "×", x: p.x + (p.w - ht) / 2 + i * (hg + hb), y: p.y + 214, w: hg, h: 34 }));
  const sg = 86, sb = 8, st = SES_SECENEKLERI.length * sg + (SES_SECENEKLERI.length - 1) * sb;
  SES_SECENEKLERI.forEach((v, i) => l.push({ id: "ses", ses: v, ad: v === 0 ? "Kapalı" : Math.round(v * 100) + "%", x: p.x + (p.w - st) / 2 + i * (sg + sb), y: p.y + 284, w: sg, h: 34 }));
  l.push({ id: "kapat", ad: "Kapat", x: p.x + p.w / 2 - 60, y: p.y + p.h - 52, w: 120, h: 36 });
  return l;
}
// Tiklama ekran konumunda ayarlara aitse true doner. Panel aciksa BUTUN tiklamalar panele aittir (oyuna gecmez).
function ayarlarTikla(ex, ey) {
  if (icinde(ayarlarButonu(), ex, ey)) { ayarlarDegistir(); return true; }
  if (!ayarlarAcik) return false;
  for (const d of ayarlarDugmeleri()) {
    if (!icinde(d, ex, ey)) continue;
    if (d.id === "eksi") yakinAdim(-1);
    else if (d.id === "arti") yakinAdim(1);
    else if (d.id === "oran") yakinAyarla(d.oran);
    else if (d.id === "hiz") { oyunHizi = d.hiz; ayarlariKaydet(); }
    else if (d.id === "ses") { sesAyarla(d.ses); sesCal("cekic"); }
    else if (d.id === "kapat") ayarlarAcik = false;
    return true;
  }
  if (!icinde(ayarlarPaneli(), ex, ey)) ayarlarAcik = false;       // panelin disina tiklayinca kapanir
  return true;
}

function cizAyarlar() {
  const b = ayarlarButonu();
  temaPlaket(b, ayarlarAcik);
  cizim.fillStyle = ayarlarAcik ? "#ffe9a0" : TEMA_KREM; cizim.font = "bold 13px " + TEMA_YAZI; cizim.textAlign = "center";
  cizim.fillText("⚙ Ayarlar [" + TUS_AYARLAR.toUpperCase() + "]", b.x + b.w / 2, b.y + 18);
  cizim.textAlign = "left";
  if (!ayarlarAcik) return;

  cizim.fillStyle = "rgba(0,0,0,0.5)";                              // arka plan karartma
  cizim.fillRect(0, 0, DUNYA_GEN, DUNYA_YUK);
  const p = ayarlarPaneli();
  cizim.fillStyle = "rgba(30,30,30,0.97)"; cizim.fillRect(p.x, p.y, p.w, p.h);
  cizim.strokeStyle = "#888"; cizim.lineWidth = 2; cizim.strokeRect(p.x + 1, p.y + 1, p.w - 2, p.h - 2);
  cizim.textAlign = "center";
  cizim.fillStyle = "#ffd54f"; cizim.font = "bold 22px sans-serif";
  cizim.fillText("Ayarlar", p.x + p.w / 2, p.y + 32);
  cizim.fillStyle = "#ddd"; cizim.font = "14px sans-serif";
  cizim.fillText("Yakınlaştırma oranı", p.x + p.w / 2, p.y + 56);
  cizim.fillStyle = "#fff"; cizim.font = "bold 28px sans-serif";
  cizim.fillText(Math.round(yakin * 100) + "%", p.x + p.w / 2, p.y + 103);
  for (const d of ayarlarDugmeleri()) {
    const secili = (d.id === "oran" && d.oran === yakin) || (d.id === "hiz" && d.hiz === oyunHizi) || (d.id === "ses" && d.ses === sesSeviyesi);
    cizim.fillStyle = d.id === "kapat" ? "#7a2d2d" : secili ? "#2e5a2e" : "#3b3b3b";
    cizim.fillRect(d.x, d.y, d.w, d.h);
    cizim.strokeStyle = secili ? "#4caf50" : "#777"; cizim.lineWidth = secili ? 3 : 1;
    cizim.strokeRect(d.x + 0.5, d.y + 0.5, d.w - 1, d.h - 1);
    cizim.fillStyle = "#fff"; cizim.font = (d.id === "eksi" || d.id === "arti") ? "bold 26px sans-serif" : "bold 15px sans-serif";
    cizim.fillText(d.ad, d.x + d.w / 2, d.y + d.h / 2 + (d.id === "eksi" || d.id === "arti" ? 9 : 5));
  }
  cizim.fillStyle = "#ddd"; cizim.font = "14px sans-serif";
  cizim.fillText("Oyun hızı (inşaat süreleri)", p.x + p.w / 2, p.y + 204);
  cizim.fillStyle = "#ddd"; cizim.font = "14px sans-serif";
  cizim.fillText("Ses (inşaat, çekiç)", p.x + p.w / 2, p.y + 274);
  cizim.fillStyle = "#aaa"; cizim.font = "12px sans-serif";
  cizim.fillText("Yakınken haritayı ok tuşlarıyla ya da fareyi ekranın kenarına götürerek kaydır.", p.x + p.w / 2, p.y + 340);
  cizim.fillText("C: kamerayı ana binaya odakla   |   " + TUS_AYARLAR.toUpperCase() + " / Esc: ayarları kapat", p.x + p.w / 2, p.y + 360);
  cizim.textAlign = "left";
}
