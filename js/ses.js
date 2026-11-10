// ============================================================
// DOSYA: js/ses.js
// Ses efektleri: ses DOSYASI YOK, hepsi tarayicida (Web Audio) uretilir. Sesi Ayarlar'dan degistirilir.
// KOMUTLAR: sesBaslat() (Basla'da), sesCal(ad, ses), sesAyarla(v).  DURUM: sesSeviyesi (kalici).
// Sesler: "cekic" (insaatci isci vurur), "bitis" (insaat tamamlandi).
// ============================================================

const SES_SECENEKLERI = [0, 0.3, 0.6, 1];     // kapali, %30, %60, %100
let sesSeviyesi = 0.6;
let sesBaglam = null, sesUsta = null, sesGurultu = null;

try { const v = parseFloat(localStorage.getItem("kendioyunum_ses")); if (SES_SECENEKLERI.includes(v)) sesSeviyesi = v; } catch (e) {}

function sesAyarla(v) {
  if (!SES_SECENEKLERI.includes(v)) return false;
  sesSeviyesi = v;
  try { localStorage.setItem("kendioyunum_ses", String(v)); } catch (e) {}
  if (sesUsta) sesUsta.gain.value = v;
  return true;
}

// Tarayici sesi ancak kullanici bir seye tiklayinca/tusa basinca baslatir: Basla'da cagrilir.
function sesBaslat() {
  if (sesBaglam) return;
  const AC = typeof AudioContext !== "undefined" ? AudioContext : (typeof webkitAudioContext !== "undefined" ? webkitAudioContext : null);
  if (!AC) return;
  try {
    sesBaglam = new AC();
    sesUsta = sesBaglam.createGain();
    sesUsta.gain.value = sesSeviyesi;
    sesUsta.connect(sesBaglam.destination);
    const n = Math.floor(sesBaglam.sampleRate * 0.25);
    sesGurultu = sesBaglam.createBuffer(1, n, sesBaglam.sampleRate);
    const d = sesGurultu.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  } catch (e) { sesBaglam = null; }
}

function sesHazir() {
  if (!sesBaglam || sesSeviyesi <= 0) return false;
  if (sesBaglam.state === "suspended") sesBaglam.resume();
  return true;
}

function sesZarf(g, t, tepe, sure) {                // hizli yukselis, ustel sonum
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(tepe, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
}

function cekicSesi(ses) {                            // ahsap uzerine cekic: "tok" + tahta tikirtisi
  const t = sesBaglam.currentTime, c = sesBaglam;
  const kaynak = c.createBufferSource(); kaynak.buffer = sesGurultu;
  const filtre = c.createBiquadFilter(); filtre.type = "bandpass"; filtre.frequency.value = 1800 + Math.random() * 900; filtre.Q.value = 1.1;
  const g1 = c.createGain(); sesZarf(g1, t, 0.9 * ses, 0.07);
  kaynak.connect(filtre); filtre.connect(g1); g1.connect(sesUsta);
  kaynak.start(t); kaynak.stop(t + 0.08);
  const o = c.createOscillator(); o.type = "sine";
  o.frequency.setValueAtTime(230 + Math.random() * 40, t); o.frequency.exponentialRampToValueAtTime(85, t + 0.1);
  const g2 = c.createGain(); sesZarf(g2, t, 0.7 * ses, 0.11);
  o.connect(g2); g2.connect(sesUsta); o.start(t); o.stop(t + 0.12);
  const o2 = c.createOscillator(); o2.type = "triangle"; o2.frequency.value = 520 + Math.random() * 120;
  const g3 = c.createGain(); sesZarf(g3, t + 0.01, 0.18 * ses, 0.05);
  o2.connect(g3); g3.connect(sesUsta); o2.start(t + 0.01); o2.stop(t + 0.07);
}

function bitisSesi(ses) {                            // insaat tamamlandi: yukselen uc nota
  const t = sesBaglam.currentTime, c = sesBaglam;
  [523.25, 659.25, 783.99].forEach((f, i) => {
    const o = c.createOscillator(); o.type = "triangle"; o.frequency.value = f;
    const g = c.createGain(); sesZarf(g, t + i * 0.13, 0.35 * ses, 0.4);
    o.connect(g); g.connect(sesUsta); o.start(t + i * 0.13); o.stop(t + i * 0.13 + 0.45);
  });
}

// ses: 0..1 goreli siddet (uzaktaki sesler kisik).
function sesCal(ad, ses) {
  if (!sesHazir()) return;
  if (ses === undefined) ses = 1;
  try {
    if (ad === "cekic") cekicSesi(ses);
    else if (ad === "bitis") bitisSesi(ses);
  } catch (e) {}
}

// Konum ekranda gorunuyorsa tam, degilse kisik.
function sesYakinligi(x, y) {
  const gx = kamera.x, gy = kamera.y;
  return x >= gx && x <= gx + gorunenGen() && y >= gy && y <= gy + gorunenYuk() ? 1 : 0.3;
}
