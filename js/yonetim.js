// ============================================================
// DOSYA: js/yonetim.js
// Bina yonetimi: secili ev ya da kampi TASI veya YIK.
// KOMUTLAR: tasimaBaslat, tasimaYerlestir, tasimaIptal, binaYik.  DURUM: tasima, yikOnay.
// Yikinca malzemenin %50'si geri gelir. Ev yikmak icin 2 kez tiklanir (onay).
// ============================================================

let tasima = null;     // null | { tur: "ev" | "kamp", ref }   (tasinan bina hayalet olur, fareyi izler)
let yikOnay = null;    // { ref, zaman }  ev yikma onayi bekliyor
const YIK_IADE = 0.5;
const YIK_ONAY_SURESI = 3000;   // ms: "Emin misin?" bu kadar sure gecerli

function secilenBina() {
  if (ev && ev.secili) return { tur: "ev", ref: ev };
  const k = kamplar.find(m => m.secili);
  return k ? { tur: "kamp", ref: k } : null;
}

function evTasinabilir() { return !YENI_BASLANGIC || evSeviyesi() >= EV_TASIMA_SEVIYESI; }   // eski test modunda kilit yok
function tasimaKilitli(s) { return s.tur === "ev" && !evTasinabilir(); }

function yonetimDugmeleri() {       // secili binanin yaninda iki dugme: Tasi, Yik
  if (tasima || kurmaModu) return [];
  const s = secilenBina();
  if (!s) return [];
  const a = s.tur === "ev" ? evAlani() : kampAlani(s.ref);
  const w = 84, h = 26;
  let x = a.x2 + 6;
  if (x + w > DUNYA_GEN - 4) x = a.x1 - 6 - w;
  const y = Math.max(4, Math.min(DUNYA_YUK - 3 * h - 12, a.y1));
  return [{ id: "tasi", ad: tasimaKilitli(s) ? "Taşı (Sv " + EV_TASIMA_SEVIYESI + ")" : "Taşı", kilitli: tasimaKilitli(s), x, y, w: tasimaKilitli(s) ? 110 : w, h }, { id: "yik", ad: "Yık", x, y: y + h + 4, w, h }, { id: "yukselt", ad: "Yükselt", x, y: y + 2 * (h + 4), w, h }];
}

function yikOnayiAktif(ref) { return yikOnay && yikOnay.ref === ref && performance.now() - yikOnay.zaman < YIK_ONAY_SURESI; }

function yonetimTikla(x, y) {       // dugmeye tiklandiysa true
  for (const d of yonetimDugmeleri()) {
    if (x < d.x || x > d.x + d.w || y < d.y || y > d.y + d.h) continue;
    const s = secilenBina();
    if (d.id === "yukselt") binaYukselt(s);
    else if (d.id === "tasi") { if (!d.kilitli) tasimaBaslat(); }
    else if (s.tur === "kamp" || yikOnayiAktif(s.ref)) binaYik(s);
    else yikOnay = { ref: s.ref, zaman: performance.now() };
    return true;
  }
  return false;
}

// ---------- KOMUTLAR ----------
// Secili ev/kampi bir ust seviyeye yukseltir (malzeme + sure). Ayni anda INSAAT_YUVASI kadar insaat yapilabilir.
function yukseltmeBilgisi(s) {          // { tur, hedef, maliyet, sure, neden } ; neden doluysa yukseltilemez
  const tur = s.tur === "ev" ? "ev" : s.ref.tur;
  const mevcut = s.tur === "ev" ? evSeviyesi() : kampSeviyesiOf(s.ref);
  const hedef = mevcut + 1;
  const b = { tur, hedef, maliyet: null, sure: 0, neden: "" };
  if (s.tur === "kamp" && !kampHazir(s.ref)) b.neden = "İnşaat sürüyor";
  else if (s.ref.yuk) b.neden = "Yükseltiliyor";
  else if (mevcut >= BINA_MAX[tur]) b.neden = "En üst seviye";
  else if (insaatSayisi() >= INSAAT_YUVASI) b.neden = "İnşaat yuvası dolu";
  if (hedef <= BINA_MAX[tur]) { b.maliyet = yukseltmeMaliyeti(tur, hedef); b.sure = insaatSuresi(tur, hedef); }
  if (!b.neden && b.maliyet && !maliyetYeter(b.maliyet)) b.neden = "Malzeme yetersiz";
  return b;
}
function binaYukselt(s) {
  if (!s) return false;
  const b = yukseltmeBilgisi(s);
  if (b.neden) return false;
  maliyetOde(b.maliyet);
  if (b.sure <= 0) { s.ref.seviye = b.hedef; }
  else s.ref.yuk = { seviye: b.hedef, bitis: oyunSaati + b.sure, toplam: b.sure };
  return true;
}
function tasimaBaslat() {
  const s = secilenBina();
  if (!s || tasimaKilitli(s)) return false;
  tasima = s;
  yikOnay = null;
  return true;
}
function tasimaIptal() { tasima = null; }

function tasimaYerlestir(mx, my) {      // yeni konuma birak (malzeme harcanmaz)
  if (!tasima) return false;
  if (tasima.tur === "ev") {
    const p = evKonumu(mx, my);
    if (!evKonulabilir(p.x, p.y, true)) return false;
    ev.x = p.x; ev.y = p.y;
  } else {
    const p = kampKonumu(mx, my);
    if (!kampKonulabilir(p.x, p.y, tasima.ref)) return false;
    tasima.ref.x = p.x; tasima.ref.y = p.y;
  }
  for (const i of isciler) i.teslim = null;       // isciler teslim noktasini yeniden secer
  tasima = null;
  return true;
}

function binaYik(s) {
  if (!s) return false;
  if (s.tur === "ev") {
    odun += Math.floor(EV_ICIN_ODUN * YIK_IADE);
    tas += Math.floor(EV_ICIN_TAS * YIK_IADE);
    ev = null;
  } else {
    const b = binaTanimi(s.ref.tur);
    odun += Math.floor(b.odun * YIK_IADE);
    tas += Math.floor(b.tas * YIK_IADE);
    kamplar.splice(kamplar.indexOf(s.ref), 1);
  }
  for (const i of isciler) i.teslim = null;
  yikOnay = null;
  tasima = null;
  return true;
}

// ---------- CIZIM ----------
function cizYonetimPaneli() {
  const s = secilenBina();
  const dugmeler = yonetimDugmeleri();
  for (const d of dugmeler) {
    const yk = d.id === "yukselt" ? yukseltmeBilgisi(s) : null;
    const onay = d.id === "yik" && yikOnayiAktif(s.ref);
    cizim.fillStyle = onay ? "#8e1c1c" : (d.kilitli ? "rgba(60,60,60,0.92)" : yk && yk.neden ? "rgba(60,60,60,0.92)" : "rgba(25,25,25,0.92)");
    cizim.fillRect(d.x, d.y, d.w, d.h);
    cizim.strokeStyle = d.kilitli ? "#757575" : d.id === "yik" ? "#e57373" : (d.id === "yukselt" ? (yk.neden ? "#757575" : "#ffd54f") : "#90caf9");
    cizim.lineWidth = 1.5;
    cizim.strokeRect(d.x + 0.5, d.y + 0.5, d.w - 1, d.h - 1);
    cizim.fillStyle = "#fff";
    cizim.font = "bold 14px sans-serif";
    cizim.textAlign = "center";
    cizim.fillText(onay ? "Emin misin?" : d.ad, d.x + d.w / 2, d.y + 18);
    cizim.textAlign = "left";
    if (yk && yk.maliyet) {         // maliyet ve sure bilgisi, dugmenin hemen altinda degil sagina/soluna kucuk etiket
      const t = (yk.neden ? yk.neden + " · " : "") + "Sv " + yk.hedef + ": " + maliyetMetni(yk.maliyet) + (yk.sure > 0 ? ", " + sureYazi(yk.sure) : "");
      cizim.font = "12px sans-serif";
      const g = cizim.measureText(t).width + 10;
      const bx = d.x + g + d.w + 4 > DUNYA_GEN ? d.x - g - 4 : d.x + d.w + 4;
      cizim.fillStyle = "rgba(0,0,0,0.7)"; cizim.fillRect(bx, d.y + 4, g, 18);
      cizim.fillStyle = yk.neden ? "#ef9a9a" : "#fff"; cizim.fillText(t, bx + 5, d.y + 17);
    } else if (yk) {
      cizim.font = "12px sans-serif";
      cizim.fillStyle = "#ffd54f"; cizim.fillText(yk.neden, d.x + d.w + 6, d.y + 17);
    }
  }
}

function cizTasimaHayaleti() {          // tasinan bina fareyi izler: yesil = konabilir, kirmizi = konamaz
  if (fare.x < 0 || arayuzAlaninda(fareEkran.x, fareEkran.y)) return;
  if (tasima.tur === "ev") {
    const p = evKonumu(fare.x, fare.y), gecerli = evKonulabilir(p.x, p.y, true);
    cizim.globalAlpha = 0.6; cizEvAt(p.x, p.y); cizim.globalAlpha = 1;
    cizim.strokeStyle = gecerli ? "#2e7d32" : "#b71c1c"; cizim.lineWidth = 3;
    cizim.strokeRect(p.x - 40, p.y - 52, 80, 76);
  } else {
    const p = kampKonumu(fare.x, fare.y), gecerli = kampKonulabilir(p.x, p.y, tasima.ref);
    cizim.globalAlpha = 0.6; cizKampAt(tasima.ref.tur, p.x, p.y); cizim.globalAlpha = 1;
    cizim.strokeStyle = gecerli ? "#2e7d32" : "#b71c1c"; cizim.lineWidth = 3;
    cizim.strokeRect(p.x - KAMP_YARI + 1, p.y - KAMP_YARI + 1, KAMP_YARI * 2 - 2, KAMP_YARI * 2 - 2);
  }
  cizim.font = "bold 16px sans-serif";
  const metin = "TAŞI: sol tık bırak  |  sağ tık / Esc: iptal", gen = cizim.measureText(metin).width + 24;
  const y = (menuAcik ? menuPanel().y : DUNYA_YUK) - 36, x = (DUNYA_GEN - gen) / 2;
  cizim.fillStyle = "rgba(0,0,0,0.65)"; cizim.fillRect(x, y, gen, 26);
  cizim.fillStyle = "#fff"; cizim.textAlign = "left"; cizim.fillText(metin, x + 12, y + 19);
}
