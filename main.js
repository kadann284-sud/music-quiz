const $ = (id) => document.getElementById(id);

/* ===== Sections ===== */
const setupEl = $("setup");
const commonEl = $("common");
const gameEl = $("game");
const doneEl = $("done");

/* ===== Setup UI ===== */
const setupMsg = $("setupMsg");
const dataStatus = $("dataStatus");
const commonMsg = $("commonMsg");

const btnRerollCandidates = $("btnRerollCandidates");
const btnClearRanksThis10 = $("btnClearRanksThis10");
const btnClearP2Only = $("btnClearP2Only");
const btnClearAllSaved = $("btnClearAllSaved");
const btnBuildCommon = $("btnBuildCommon");

const candidateCards = $("candidateCards");
const savedCards = $("savedCards");
const savedSummary = $("savedSummary");

/* ===== Common UI ===== */
const commonListEl = $("commonList");
const btnFetchData = $("btnFetchData");
const btnBackToSetup = $("btnBackToSetup");

/* ===== Game UI ===== */
const sbP1 = $("sbP1");
const sbP2 = $("sbP2");
const sbP1Score = $("sbP1Score");
const sbP2Score = $("sbP2Score");

const turnBadge = $("turnBadge");
const qMeta = $("qMeta");

const timeLeftEl = $("timeLeft");
const timeBarFill = $("timeBarFill");
const timerNoteEl = $("timerNote");

const handoff = $("handoff");
const handoffTitle = $("handoffTitle");
const btnReveal = $("btnReveal");

const qBox = $("qBox");
const qText = $("qText");
const qMedia = $("qMedia");
const choicesEl = $("choices");
const phaseLine = $("phaseLine");
const rankLine = $("rankLine");
const resultEl = $("result");

/* ===== Fixed action bar ===== */
const actionBar = $("actionBar");
const btnNextPlayer = $("btnNextPlayer");
const btnNextRound = $("btnNextRound");
const btnEnd = $("btnEnd");

/* ===== Done UI ===== */
const finalEl = $("final");
const btnRestart = $("btnRestart");

/* ===== Constants ===== */
const RANK_VALUE = { A: 1, B: 2, C: 3, D: 4 };
const RANKS = ["", "A", "B", "C", "D"];

/* ランク定義（表示） */
const RANK_LABELS = {
  "": "未選択",
  A: "A（ほぼすべて）",
  B: "B（30曲～）",
  C: "C（15曲～30曲）",
  D: "D（5曲～10曲）",
};

const DIFF_SET_HARD = new Set(["A","B"]);
const DIFF_SET_EASY = new Set(["C","D"]);
const DIFF_ALLOWED = new Set(["easy","normal","hard"]);

/* =========================
   SUPER BEAVER custom track list
   TOP10出題割合：
   easy  : TOP10 70% / その他 30%
   normal: TOP10 50% / その他 50%
   hard  : TOP10 20% / その他 80%
========================= */

const SUPER_BEAVER_ALL_UNIQ = [...new Set(SUPER_BEAVER_ALL)];
const SUPER_BEAVER_OTHER = SUPER_BEAVER_ALL_UNIQ.filter(t => !SUPER_BEAVER_TOP10.includes(t));

/* =========================
   Candidate sources（指定版）
========================= */
const TOP_JROCK = [
  "Mrs. GREEN APPLE","RADWIMPS","Official髭男dism",
  "back number","SEKAI NO OWARI",
  "sumika","THE ORAL CIGARETTES","MAN WITH A MISSION","マカロニえんぴつ","Saucy Dog",
  "SUPER BEAVER","04 Limited Sazabys","クリープハイプ","BLUE ENCOUNT",
  "フレデリック","My Hair is Bad","SHISHAMO","ヨルシカ","YOASOBI","Vaundy",
  "優里","米津玄師","GReeeeN","Tani Yuuki","imase"
];

const MORE_JROCK = [
  "ヤバイTシャツ屋さん",
  "indigo la End","Novelbright","緑黄色社会",
  "10-FEET","ねぐせ。","ハルカミライ","ヤングスキニー","SPYAIR",

  "プッシュプルポット","Arakezuri","bokula.","Maki","至福ぽんちょ","Atomic Skipper","Blue Mash",
  "This is Last","ハンブレッターズ","マルシィ","NELKE","go!go!vanillas","Tele","Chevon",
  "トンボコープ","レトロリロン","reGretGirl","サバシスター","UNFAIR RULE","NEE","the shes gone",
  "WurtS","moon drop","Fish and Lips","35.7","coldrain","Hump Back","Creepy Nuts"
];

/* =========================
   State
========================= */
let app = {
  players: [{ name: "P1" }, { name: "P2" }],
  totalQ: 12,
  introLen: 5,
  timeLimit: 10,
  quizMode: "mix", // intro_only / mix

  candidates: [],
  selectionsThis10: new Map(),
  globalSelections: new Map(), // artist -> {p1Rank,p2Rank}
  common: [],

  itunesByArtist: new Map(),
  albumTracksById: new Map(),

  dataQuestions: [],

  game: {
    round: 0,
    answerer: 0,
    score: [0.0, 0.0],
    usedSig: new Set(),
    currentQ: null,
    topicArtist: null,
    roundResults: [{ answered: false, ok: false }, { answered: false, ok: false }],
    introPhase: "none", // "none" | "play" | "p1" | "p2"（イントロ専用）
  }
};

/* =========================
   Helpers
========================= */
function show(section) {
  setupEl.classList.add("hidden");
  commonEl.classList.add("hidden");
  gameEl.classList.add("hidden");
  doneEl.classList.add("hidden");
  section.classList.remove("hidden");
}
function setMsg(el, text) { el.textContent = text || ""; }
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}
function normalizeKey(s){
  return (s || "").toLowerCase().replace(/\s+/g,"").replace(/[・･’'".\-‐-–—_]/g,"").normalize("NFKC");
}
function loadCache(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function saveCache(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function fmtScore(x){ return (Math.round(x * 10) / 10).toFixed(1); }

/* =========================
   Read basics
========================= */
function readSetupBasics() {
  const p1Name = $("p1Name").value.trim() || "P1";
  const p2Name = $("p2Name").value.trim() || "P2";
  app.players[0].name = p1Name;
  app.players[1].name = p2Name;

  app.totalQ = clamp(parseInt($("totalQ").value, 10) || 12, 3, 50);
  app.quizMode = $("quizMode")?.value || "mix";
  app.introLen = clamp(parseInt($("introLen")?.value ?? 5, 10) || 5, 1, 15);
  app.timeLimit = clamp(parseInt($("timeLimit")?.value ?? 10, 10) || 0, 0, 120);

  sbP1.textContent = p1Name;
  sbP2.textContent = p2Name;
}

/* =========================
   Candidates
========================= */
function generateCandidates10() {
  const top = shuffle([...new Set(TOP_JROCK)]);
  const more = shuffle([...new Set(MORE_JROCK)]);
  const merged = shuffle([...new Set([...top.slice(0, 7), ...more.slice(0, 3)])]).slice(0, 10);

  const pool = shuffle([...new Set([...TOP_JROCK, ...MORE_JROCK])]);
  while (merged.length < 10) {
    const x = pool.pop();
    if (x && !merged.includes(x)) merged.push(x);
  }
  return merged;
}

function ensureSelectionsThis10() {
  app.selectionsThis10.clear();
  for (const artist of app.candidates) {
    const saved = app.globalSelections.get(artist) || { p1Rank: "", p2Rank: "" };
    app.selectionsThis10.set(artist, { ...saved });
  }
}

function makeRankSelect(currentValue, onChange) {
  const sel = document.createElement("select");
  sel.className = "rankSel";
  for (const r of RANKS) {
    const opt = document.createElement("option");
    opt.value = r;
    opt.textContent = RANK_LABELS[r] || r;
    sel.appendChild(opt);
  }
  sel.value = currentValue || "";
  sel.addEventListener("change", () => onChange(sel.value));
  return sel;
}

function setGlobalSelection(artist, next) {
  app.globalSelections.set(artist, { ...next });
  saveCache("mm_globalSelections_v9", Object.fromEntries(app.globalSelections.entries()));
}

function renderCandidateCards() {
  candidateCards.innerHTML = "";
  const p1 = app.players[0].name;
  const p2 = app.players[1].name;

  app.candidates.forEach((artist, idx) => {
    const cur = app.selectionsThis10.get(artist) || { p1Rank: "", p2Rank: "" };

    const wrap = document.createElement("div");
    wrap.className = "cardRow";
    wrap.innerHTML = `
      <div class="cardTop">
        <div class="artistName">${escapeHtml(artist)}</div>
        <div class="badgeMini">候補 ${idx+1}/10</div>
      </div>
      <div class="rankGrid">
        <div class="rankCell" id="c_p1_${idx}"></div>
        <div class="rankCell" id="c_p2_${idx}"></div>
      </div>
    `;
    candidateCards.appendChild(wrap);

    const p1Cell = wrap.querySelector(`#c_p1_${idx}`);
    const p2Cell = wrap.querySelector(`#c_p2_${idx}`);

    const l1 = document.createElement("label"); l1.textContent = p1;
    const l2 = document.createElement("label"); l2.textContent = p2;

    const sel1 = makeRankSelect(cur.p1Rank, (v) => {
      const now = app.selectionsThis10.get(artist) || { p1Rank: "", p2Rank: "" };
      now.p1Rank = v;
      app.selectionsThis10.set(artist, now);
      setGlobalSelection(artist, now);
      renderSavedCards();
    });

    const sel2 = makeRankSelect(cur.p2Rank, (v) => {
      const now = app.selectionsThis10.get(artist) || { p1Rank: "", p2Rank: "" };
      now.p2Rank = v;
      app.selectionsThis10.set(artist, now);
      setGlobalSelection(artist, now);
      renderSavedCards();
    });

    p1Cell.appendChild(l1); p1Cell.appendChild(sel1);
    p2Cell.appendChild(l2); p2Cell.appendChild(sel2);
  });

  setMsg(setupMsg, "候補10個を更新。登録済みは下に残り続けます。");
}

function renderSavedCards() {
  savedCards.innerHTML = "";
  const p1 = app.players[0].name;
  const p2 = app.players[1].name;

  const entries = [...app.globalSelections.entries()]
    .filter(([_, v]) => (v.p1Rank || v.p2Rank))
    .sort((a, b) => a[0].localeCompare(b[0], "ja"));

  const commonCount = entries.filter(([_,v]) => v.p1Rank && v.p2Rank).length;
  savedSummary.textContent = `登録済み：${entries.length}件 / 共通（両者選択）：${commonCount}件`;

  entries.forEach(([artist, v], idx) => {
    const wrap = document.createElement("div");
    wrap.className = "cardRow";
    wrap.innerHTML = `
      <div class="cardTop">
        <div class="artistName">${escapeHtml(artist)}</div>
        <div class="badgeMini">#${idx+1}</div>
      </div>
      <div class="rankGrid">
        <div class="rankCell" id="s_p1_${idx}"></div>
        <div class="rankCell" id="s_p2_${idx}"></div>
      </div>
    `;
    savedCards.appendChild(wrap);

    const p1Cell = wrap.querySelector(`#s_p1_${idx}`);
    const p2Cell = wrap.querySelector(`#s_p2_${idx}`);

    const l1 = document.createElement("label"); l1.textContent = p1;
    const l2 = document.createElement("label"); l2.textContent = p2;

    const sel1 = makeRankSelect(v.p1Rank, (nv) => {
      const now = app.globalSelections.get(artist) || { p1Rank:"", p2Rank:"" };
      now.p1Rank = nv;
      setGlobalSelection(artist, now);
      if (app.selectionsThis10.has(artist)) app.selectionsThis10.set(artist, { ...now });
      renderCandidateCards();
      renderSavedCards();
    });

    const sel2 = makeRankSelect(v.p2Rank, (nv) => {
      const now = app.globalSelections.get(artist) || { p1Rank:"", p2Rank:"" };
      now.p2Rank = nv;
      setGlobalSelection(artist, now);
      if (app.selectionsThis10.has(artist)) app.selectionsThis10.set(artist, { ...now });
      renderCandidateCards();
      renderSavedCards();
    });

    p1Cell.appendChild(l1); p1Cell.appendChild(sel1);
    p2Cell.appendChild(l2); p2Cell.appendChild(sel2);
  });
}

function rerollCandidates() {
  readSetupBasics();
  app.candidates = generateCandidates10();
  ensureSelectionsThis10();
  renderCandidateCards();
  renderSavedCards();
}

function clearRanksOnlyThis10() {
  for (const artist of app.candidates) {
    const now = app.globalSelections.get(artist) || { p1Rank:"", p2Rank:"" };
    now.p1Rank = "";
    now.p2Rank = "";
    setGlobalSelection(artist, now);
    app.selectionsThis10.set(artist, { p1Rank:"", p2Rank:"" });
  }
  renderCandidateCards();
  renderSavedCards();
  setMsg(setupMsg, "この10個の選択だけリセットしました。");
}

function clearP2OnlyAllArtists() {
  for (const [artist, v] of app.globalSelections.entries()) {
    const next = { p1Rank: v.p1Rank || "", p2Rank: "" };
    setGlobalSelection(artist, next);
    if (app.selectionsThis10.has(artist)) app.selectionsThis10.set(artist, { ...next });
  }
  renderCandidateCards();
  renderSavedCards();
  setMsg(setupMsg, "P2だけ履歴（ランク）を全アーティストで削除しました。");
}

function clearAllSaved() {
  app.globalSelections.clear();
  saveCache("mm_globalSelections_v9", {});
  renderCandidateCards();
  renderSavedCards();
  setMsg(setupMsg, "登録済みを全消去しました。");
}

/* =========================
   Build common
========================= */
function buildCommon() {
  readSetupBasics();

  const common = [];
  for (const [artist, v] of app.globalSelections.entries()) {
    if (v.p1Rank && v.p2Rank) common.push({ label: artist, p1Rank: v.p1Rank, p2Rank: v.p2Rank });
  }

  if (common.length < 1) {
    setMsg(setupMsg, "共通アーティストが0件です。両者が同じアーティストにランクを付けたら開始できます。");
    return;
  }

  app.common = common;
  renderCommonList();
  show(commonEl);
}

function renderCommonList() {
  commonListEl.innerHTML = "";
  const p1 = app.players[0].name;
  const p2 = app.players[1].name;

  app.common
    .slice()
    .sort((a, b) => a.label.localeCompare(b.label, "ja"))
    .forEach(a => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <div>
          <div class="name">${escapeHtml(a.label)}</div>
          <div class="sub tiny">${escapeHtml(p1)}:${a.p1Rank} / ${escapeHtml(p2)}:${a.p2Rank}</div>
        </div>
      `;
      commonListEl.appendChild(div);
    });

  setMsg(commonMsg, `共通：${app.common.length}件。iTunesデータ取得して開始します。`);
}

/* =========================
   data.json loader (difficulty対応)
========================= */
async function loadDataQuestions() {
  try {
    const res = await fetch("./data.json", { cache: "no-store" });
    if (!res.ok) throw new Error("data.json not found");
    const json = await res.json();
    const qs = Array.isArray(json?.questions) ? json.questions : [];

    app.dataQuestions = qs
      .filter(q =>
        q &&
        typeof q.prompt === "string" &&
        Array.isArray(q.choices) &&
        typeof q.answer === "string" &&
        Array.isArray(q.artists)
      )
      .map(q => ({
        kind: "data_json",
        prompt: String(q.prompt),
        choices: q.choices.map(String),
        answer: String(q.answer),
        artists: q.artists.map(String),
        difficulty: DIFF_ALLOWED.has(q.difficulty) ? q.difficulty : "normal",
        meta: q.meta ? String(q.meta) : ""
      }));

    dataStatus.textContent = `data.json：${app.dataQuestions.length}問（difficulty: easy/normal/hard）`;
  } catch {
    app.dataQuestions = [];
    dataStatus.textContent = "data.json：未読み込み";
  }
}

/* =========================
   iTunes Search/Lookup
========================= */
async function fetchItunesArtistPack(artistLabel) {
  const cache = loadCache("mm_itunes_artistpack_v2", {});
  if (cache[artistLabel]) return cache[artistLabel];

  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(artistLabel)}&entity=song&country=JP&limit=60`;
  const res = await fetch(url);
  if (!res.ok) return { tracks: [], albums: [], allTrackNames: [], albumFirstIndex: {} };

  const data = await res.json();
  const results = Array.isArray(data?.results) ? data.results : [];

  const targetKey = normalizeKey(artistLabel);
  const items = results
    .filter(r => r && r.trackName && r.artistName)
    .map(r => ({
      track: String(r.trackName),
      artist: String(r.artistName),
      artistKey: normalizeKey(String(r.artistName)),
      artwork: r.artworkUrl100 ? String(r.artworkUrl100) : "",
      preview: r.previewUrl ? String(r.previewUrl) : "",
      collectionId: r.collectionId ? String(r.collectionId) : "",
      collectionName: r.collectionName ? String(r.collectionName) : "",
    }))
    .sort((a, b) => {
      const am = a.artistKey === targetKey ? 0 : 1;
      const bm = b.artistKey === targetKey ? 0 : 1;
      return am - bm;
    });

  const seenTrack = new Set();
  const tracks = [];
  const albumMap = new Map();
  const albumFirstIndex = new Map();

  for (const x of items) {
    const key = normalizeKey(x.track);
    if (!seenTrack.has(key)) {
      seenTrack.add(key);
      tracks.push({
        name: x.track,
        preview: x.preview,
        artwork: x.artwork,
        collectionId: x.collectionId,
        collectionName: x.collectionName,
      });
    }

    if (x.collectionId) {
      if (!albumMap.has(x.collectionId)) {
        albumMap.set(x.collectionId, {
          collectionId: x.collectionId,
          collectionName: x.collectionName || "",
          artwork: x.artwork || ""
        });
      }
      if (!albumFirstIndex.has(x.collectionId)) {
        albumFirstIndex.set(x.collectionId, Math.max(0, tracks.length - 1));
      }
    }

    if (tracks.length >= 35) break;
  }

  const albums = [...albumMap.values()].filter(a => a.collectionId);
  const allTrackNames = tracks.map(t => t.name);

  const pack = {
    tracks,
    albums,
    allTrackNames,
    albumFirstIndex: Object.fromEntries(albumFirstIndex.entries())
  };

  cache[artistLabel] = pack;
  saveCache("mm_itunes_artistpack_v2", cache);
  return pack;
}

async function fetchAlbumTracks(collectionId) {
  if (app.albumTracksById.has(collectionId)) return app.albumTracksById.get(collectionId);

  const url = `https://itunes.apple.com/lookup?id=${encodeURIComponent(collectionId)}&entity=song&country=JP`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const results = Array.isArray(data?.results) ? data.results : [];

  const collection = results.find(r => r && r.wrapperType === "collection") || results[0] || {};
  const songs = results
    .filter(r => r && r.wrapperType === "track" && r.trackName)
    .map(r => String(r.trackName));

  const album = {
    collectionId: String(collectionId),
    artistLabel: collection.artistName ? String(collection.artistName) : "",
    albumName: collection.collectionName ? String(collection.collectionName) : "",
    artwork: collection.artworkUrl100 ? String(collection.artworkUrl100) : "",
    trackNames: [...new Set(songs)]
  };

  app.albumTracksById.set(collectionId, album);
  return album;
}

async function fetchDataForCommon() {
  setMsg(commonMsg, "iTunesデータ取得中…");

  app.itunesByArtist.clear();
  app.albumTracksById.clear();

  for (const a of app.common) {
    const pack = await fetchItunesArtistPack(a.label);
    app.itunesByArtist.set(a.label, {
      tracks: pack.tracks,
      albums: pack.albums,
      allTrackNames: new Set(pack.allTrackNames),
      albumFirstIndex: new Map(Object.entries(pack.albumFirstIndex || {})),
      artistLabel: a.label
    });
    await new Promise(r => setTimeout(r, 60));
  }

  for (const a of app.common) {
    const pack = app.itunesByArtist.get(a.label);
    if (!pack) continue;
    const some = (pack.albums || []).slice(0, 2);
    for (const al of some) {
      if (al.collectionId) await fetchAlbumTracks(al.collectionId);
      await new Promise(r => setTimeout(r, 60));
    }
  }

  setMsg(commonMsg, "取得完了。開始！");
  startGame();
}

/* =========================
   SUPER BEAVER preview resolver (iTunes)
========================= */
const SB_PREVIEW_CACHE_KEY = "mm_sb_preview_cache_v1";
function loadSBPreviewCache(){ return loadCache(SB_PREVIEW_CACHE_KEY, {}); }
function saveSBPreviewCache(cache){ saveCache(SB_PREVIEW_CACHE_KEY, cache); }

async function fetchPreviewForSuperBeaverTrack(trackName){
  const cache = loadSBPreviewCache();
  if (cache[trackName]) return cache[trackName];

  const term = `SUPER BEAVER ${trackName}`;
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&country=JP&limit=20`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const results = Array.isArray(data?.results) ? data.results : [];

  const tKey = normalizeKey(trackName);
  const cand = results
    .filter(r => r && r.previewUrl && r.trackName && r.artistName)
    .map(r => ({
      previewUrl: String(r.previewUrl),
      artwork: r.artworkUrl100 ? String(r.artworkUrl100) : "",
      artistKey: normalizeKey(String(r.artistName)),
      trackKey: normalizeKey(String(r.trackName)),
      trackName: String(r.trackName)
    }))
    .sort((a,b) => {
      const aArtist = a.artistKey.includes("superbeaver") ? 0 : 1;
      const bArtist = b.artistKey.includes("superbeaver") ? 0 : 1;
      if (aArtist !== bArtist) return aArtist - bArtist;
      const aExact = (a.trackKey === tKey) ? 0 : 1;
      const bExact = (b.trackKey === tKey) ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      return Math.abs(a.trackKey.length - tKey.length) - Math.abs(b.trackKey.length - tKey.length);
    });

  const best = cand[0] || null;
  if (!best) return null;

  const out = { previewUrl: best.previewUrl, artwork: best.artwork };
  cache[trackName] = out;
  saveSBPreviewCache(cache);
  return out;
}

/* =========================
   Intro playback
========================= */
let introAudio = null;
async function playIntro(previewUrl, seconds, startAtSec) {
  if (introAudio) { introAudio.pause(); introAudio = null; }
  introAudio = new Audio(previewUrl);
  introAudio.currentTime = Math.max(0, startAtSec || 0);

  await introAudio.play();
  await new Promise(r => setTimeout(r, seconds * 1000));
  introAudio.pause();
}

/* =========================
   Timer (bar)
========================= */
let timerId = null;
function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}
function startTimer(seconds, onTimeout) {
  stopTimer();

  if (!seconds || seconds <= 0) {
    timeLeftEl.textContent = "--";
    timerNoteEl.textContent = "制限時間：なし";
    if (timeBarFill) timeBarFill.style.transform = "scaleX(1)";
    return;
  }

  const total = seconds;
  const startedAt = Date.now();
  timeLeftEl.textContent = String(total);
  timerNoteEl.textContent = `制限時間：${total}s`;
  if (timeBarFill) timeBarFill.style.transform = "scaleX(1)";

  timerId = setInterval(() => {
    const elapsed = (Date.now() - startedAt) / 1000;
    const remain = Math.max(0, total - elapsed);

    timeLeftEl.textContent = String(Math.ceil(remain));
    const ratio = remain / total;
    if (timeBarFill) timeBarFill.style.transform = `scaleX(${ratio})`;

    if (remain <= 0) {
      stopTimer();
      onTimeout();
    }
  }, 80);
}

/* =========================
   Difficulty + Scoring
========================= */
function rankOf(playerIndex, topicArtist) {
  return playerIndex === 0 ? topicArtist.p1Rank : topicArtist.p2Rank;
}
function rankValueOf(playerIndex, topicArtist) {
  const r = rankOf(playerIndex, topicArtist);
  return RANK_VALUE[r] ?? 1;
}
function questionLevel(topicArtist) {
  const a = topicArtist.p1Rank;
  const b = topicArtist.p2Rank;
  if (DIFF_SET_HARD.has(a) && DIFF_SET_HARD.has(b)) return "hard";
  if (DIFF_SET_EASY.has(a) && DIFF_SET_EASY.has(b)) return "easy";
  return "normal";
}
function levelJP(level){
  return level === "hard" ? "hard（マイナー寄り）" : level === "easy" ? "easy（有名寄り）" : "normal";
}

/* ★加点（正解した人だけ）
   高ランク（値が小さい）= +1
   低ランク（値が大きい）= +1 + 差/3
   同値 = +1
*/
function pointsFor(playerIndex, topicArtist) {
  const self = rankValueOf(playerIndex, topicArtist);
  const opp  = rankValueOf(1 - playerIndex, topicArtist);
  const diff = Math.abs(self - opp);

  if (self === opp) return 1;
  if (self < opp) return 1;
  return 1 + diff / 3;
}

/* =========================
   Question builders
========================= */
function makeQ_fromDataJson(topicArtist) {
  if (!app.dataQuestions.length) return null;

  const commons = new Set(app.common.map(a => a.label));
  const level = questionLevel(topicArtist);

  const related = app.dataQuestions.filter(q => q.artists.some(ar => commons.has(ar)));
  if (!related.length) return null;

  const strict = related.filter(q => q.artists.includes(topicArtist.label));
  const basePool = strict.length ? strict : related;

  const pool1 = basePool.filter(q => q.difficulty === level);
  const pool2 = basePool.filter(q => q.difficulty === "normal");
  const pool = pool1.length ? pool1 : (pool2.length ? pool2 : basePool);
  if (!pool.length) return null;

  const q = pickRandom(pool);
  if (!q.choices.includes(q.answer)) return null;

  const distractors = shuffle(q.choices.filter(c => c !== q.answer)).slice(0, 3);
  if (distractors.length < 3) return null;

  return {
    kind: "data_json",
    promptText: `${q.prompt}\n（data:${q.difficulty} / prefer:${level}）`,
    media: null,
    choices: shuffle([q.answer, ...distractors]),
    correct: q.answer
  };
}

function selectTrackPool(pack, level) {
  const usable = (pack.tracks || []).filter(t => t.preview && t.name);
  if (usable.length < 4) return usable;

  const n = usable.length;
  const win = Math.min(12, Math.max(6, Math.floor(n * 0.45)));

  if (level === "easy") return usable.slice(0, win);
  if (level === "hard") return usable.slice(Math.max(0, n - win), n);

  const start = Math.floor((n - win) / 2);
  return usable.slice(start, start + win);
}

/* ---- SUPER BEAVER の正解曲を「重み付き」で選ぶ ---- */
function pickSuperBeaverCorrect(level){
  let pTop = 0.5;
  if (level === "easy") pTop = 0.7;
  if (level === "hard") pTop = 0.2;

  const useTop = Math.random() < pTop;
  const base = (useTop ? SUPER_BEAVER_TOP10 : SUPER_BEAVER_OTHER);
  // 念のため空なら全体から
  const pool = (base && base.length >= 1) ? base : SUPER_BEAVER_ALL_UNIQ;
  return pickRandom(pool);
}

/* イントロ：曲名を当てる（SUPER BEAVERだけ曲リスト準拠 & TOP10比率アップ） */
async function makeQ_introToTitle(topicArtist) {
  const level = questionLevel(topicArtist);
  const seconds = app.introLen;

  // ===== SUPER BEAVER 特別処理 =====
  if (topicArtist.label === "SUPER BEAVER") {
    // previewが無い曲を引いたら再試行（最大12回）
    for (let attempt = 0; attempt < 12; attempt++) {
      const correct = pickSuperBeaverCorrect(level);

      const distractPool = SUPER_BEAVER_ALL_UNIQ.filter(t => t !== correct);
      const distractors = shuffle(distractPool).slice(0, 3);
      if (distractors.length < 3) continue;

      const pv = await fetchPreviewForSuperBeaverTrack(correct);
      if (!pv?.previewUrl) continue;

      const randomStart = (level === "hard");
      const startAt = randomStart ? Math.floor(Math.random() * Math.max(1, 30 - seconds)) : 0;

      return {
        kind: "intro_to_title",
        promptText: `【イントロ】SUPER BEAVER の曲名はどれ？（${seconds}秒 / ${levelJP(level)}）`,
        media: { type: "intro", previewUrl: pv.previewUrl, seconds, startAt },
        choices: shuffle([correct, ...distractors]),
        correct
      };
    }
    return null;
  }

  // ===== 通常処理（iTunes packから） =====
  const pack = app.itunesByArtist.get(topicArtist.label);
  if (!pack) return null;

  const pool = selectTrackPool(pack, level);
  if (pool.length < 4) return null;

  const track = pickRandom(pool);
  const correct = track.name;

  const distractorPool = pool.map(t => t.name).filter(n => n && n !== correct);
  const uniq = [...new Set(distractorPool)];
  if (uniq.length < 3) return null;

  const distractors = shuffle(uniq).slice(0, 3);
  const randomStart = (level === "hard");
  const startAt = randomStart ? Math.floor(Math.random() * Math.max(1, 30 - seconds)) : 0;

  return {
    kind: "intro_to_title",
    promptText: `【イントロ】${topicArtist.label} の曲名はどれ？（${seconds}秒 / ${levelJP(level)}）`,
    media: { type: "intro", previewUrl: track.preview, seconds, startAt },
    choices: shuffle([correct, ...distractors]),
    correct
  };
}

function selectAlbumPool(pack, level) {
  const albums = (pack.albums || []).filter(a => a.collectionId);
  if (albums.length < 1) return albums;

  const firstIdx = pack.albumFirstIndex || new Map();
  const withIdx = albums.map(a => ({
    ...a,
    first: Number(firstIdx.get(String(a.collectionId)) ?? 9999)
  })).sort((x, y) => x.first - y.first);

  const n = withIdx.length;
  const win = Math.min(10, Math.max(4, Math.floor(n * 0.6)));

  if (level === "easy") return withIdx.slice(0, win);
  if (level === "hard") return withIdx.slice(Math.max(0, n - win), n);

  const start = Math.floor((n - win) / 2);
  return withIdx.slice(start, start + win);
}

async function makeQ_coverAlbumToTitle(topicArtist) {
  const pack = app.itunesByArtist.get(topicArtist.label);
  if (!pack) return null;

  const level = questionLevel(topicArtist);
  const albums = selectAlbumPool(pack, level);
  if (albums.length < 1) return null;

  for (let attempt = 0; attempt < 10; attempt++) {
    const al = pickRandom(albums);
    const album = await fetchAlbumTracks(al.collectionId);
    if (!album || !album.trackNames || album.trackNames.length < 1) continue;

    const correct = pickRandom(album.trackNames);

    // 選択肢：同一アーティストの「そのアルバム以外の曲」から
    const allArtistSongs = (pack.tracks || []).map(t => t.name).filter(Boolean);
    const exclude = new Set(album.trackNames.map(normalizeKey));
    const candidates = [...new Set(allArtistSongs)]
      .filter(n => normalizeKey(n) !== normalizeKey(correct))
      .filter(n => !exclude.has(normalizeKey(n)));

    if (candidates.length < 3) continue;

    const choices = shuffle([correct, ...shuffle(candidates).slice(0, 3)]);
    const artwork = album.artwork || al.artwork || (pack.tracks.find(t => t.artwork)?.artwork || "");
    if (!artwork) continue;

    return {
      kind: "cover_album_to_title",
      promptText: `【ジャケ写】このアルバムに入っている曲名はどれ？\nアーティスト：${topicArtist.label}\n（${levelJP(level)}）`,
      media: { type: "img", url: artwork, alt: "album artwork" },
      choices,
      correct
    };
  }
  return null;
}

/* =========================
   Build a round question (mix / intro_only)
========================= */
async function buildRoundQuestionAsync() {
  const commonPool = app.common.slice();
  if (commonPool.length < 1) return null;

  for (let attempt = 0; attempt < 160; attempt++) {
    const topicArtist = pickRandom(commonPool);

    const types = app.quizMode === "intro_only"
      ? ["intro_to_title","intro_to_title","intro_to_title"]
      : shuffle(["intro_to_title","cover_album_to_title","data_json","intro_to_title"]);

    let q = null;

    for (const t of types) {
      if (t === "data_json") q = makeQ_fromDataJson(topicArtist);
      if (t === "intro_to_title") q = await makeQ_introToTitle(topicArtist); // ★await必須
      if (t === "cover_album_to_title") q = await makeQ_coverAlbumToTitle(topicArtist);

      if (!q) continue;

      const sig = `${q.kind}|${topicArtist.label}|${q.promptText}|${q.correct}`;
      if (app.game.usedSig.has(sig)) { q = null; continue; }
      app.game.usedSig.add(sig);
      break;
    }

    if (!q) continue;
    return { topicArtist, q };
  }
  return null;
}

/* =========================
   Game flow
========================= */
function setActionBarVisible(on){
  actionBar.classList.toggle("hidden", !on);
}

function startGame() {
  app.game.round = 0;
  app.game.answerer = 0;
  app.game.score = [0.0, 0.0];
  app.game.usedSig = new Set();
  app.game.currentQ = null;
  app.game.topicArtist = null;
  app.game.roundResults = [{ answered:false, ok:false }, { answered:false, ok:false }];
  app.game.introPhase = "none";

  sbP1.textContent = app.players[0].name;
  sbP2.textContent = app.players[1].name;
  sbP1Score.textContent = fmtScore(0);
  sbP2Score.textContent = fmtScore(0);

  show(gameEl);
  setActionBarVisible(true);
  showRoundHandoff();
}

function showRoundHandoff() {
  stopTimer();
  if (introAudio) { introAudio.pause(); introAudio = null; }

  timeLeftEl.textContent = "--";
  timerNoteEl.textContent = app.timeLimit > 0 ? `制限時間：${app.timeLimit}s` : "制限時間：なし";
  if (timeBarFill) timeBarFill.style.transform = "scaleX(1)";

  turnBadge.textContent = `Round ${app.game.round + 1}`;
  qMeta.textContent = `全${app.totalQ}ラウンド / モード：${app.quizMode === "intro_only" ? "イントロのみ" : "ミックス"}`;

  handoffTitle.textContent = `Round ${app.game.round + 1}：画面を隠して開始`;
  btnReveal.textContent = "問題を見る";

  handoff.classList.remove("hidden");
  qBox.classList.add("hidden");

  btnNextPlayer.classList.remove("hidden");
  btnNextPlayer.disabled = true;
  btnNextRound.classList.add("hidden");
  btnNextRound.disabled = true;
}

async function revealRound() {
  handoff.classList.add("hidden");
  qBox.classList.remove("hidden");

  const built = await buildRoundQuestionAsync();
  if (!built) {
    endGame("出題できる問題が足りなかった…（共通が少ない/曲数が少ない等）");
    return;
  }

  app.game.topicArtist = built.topicArtist;
  app.game.currentQ = built.q;
  app.game.roundResults = [{ answered:false, ok:false }, { answered:false, ok:false }];

  // イントロだけ「再生→P1→P2」
  app.game.introPhase = (app.game.currentQ.kind === "intro_to_title") ? "play" : "none";
  app.game.answerer = 0;

  renderForAnswerer();
}

function renderForAnswerer() {
  const q = app.game.currentQ;
  const topicArtist = app.game.topicArtist;

  if (q.kind === "intro_to_title") {
    return renderIntroPhases(topicArtist, q);
  }

  // それ以外は P1→P2（従来）
  const ans = app.game.answerer;

  if (introAudio) { introAudio.pause(); introAudio = null; }

  turnBadge.textContent = `Round ${app.game.round + 1}`;
  qMeta.textContent = `同じ問題を ${app.players[0].name} → ${app.players[1].name} の順に回答`;

  qText.textContent = q.promptText;

  qMedia.classList.add("hidden");
  qMedia.innerHTML = "";

  if (q.media?.type === "img" && q.media.url) {
    qMedia.classList.remove("hidden");
    qMedia.innerHTML = `<img src="${q.media.url}" alt="${escapeHtml(q.media.alt || "image")}" />`;
  }

  const level = questionLevel(topicArtist);
  const selfV = rankValueOf(ans, topicArtist);
  const oppV  = rankValueOf(1 - ans, topicArtist);
  const diff  = Math.abs(selfV - oppV);
  const pts   = pointsFor(ans, topicArtist);

  phaseLine.textContent = `${app.players[ans].name} が回答`;
  rankLine.textContent =
    `トピック：${topicArtist.label} / 自分:${rankOf(ans, topicArtist)}(${selfV}) 相手:${rankOf(1-ans, topicArtist)}(${oppV}) 差=${diff} → 正解 +${fmtScore(pts)}点 / 出題:${levelJP(level)}`;

  choicesEl.innerHTML = "";
  q.choices.forEach(ch => {
    const b = document.createElement("button");
    b.className = "choiceBtn";
    b.textContent = ch;
    b.onclick = () => answerChoice(ch);
    choicesEl.appendChild(b);
  });

  resultEl.className = "result";
  resultEl.textContent = "";

  btnNextPlayer.disabled = true;
  btnNextRound.disabled = true;
  btnNextPlayer.classList.remove("hidden");
  btnNextRound.classList.add("hidden");

  startTimer(app.timeLimit, () => onTimeout());
}

/* ===== イントロ：再生→P1→P2 ===== */
function renderIntroPhases(topicArtist, q) {
  const phase = app.game.introPhase; // "play"|"p1"|"p2"

  turnBadge.textContent = `Round ${app.game.round + 1}`;
  qMeta.textContent = `イントロ問題：再生 → ${app.players[0].name} → ${app.players[1].name}`;

  qText.textContent = q.promptText;

  qMedia.classList.remove("hidden");
  qMedia.innerHTML = `<div style="width:100%" id="introArea"></div>`;
  const introArea = $("introArea");

  choicesEl.innerHTML = "";
  resultEl.className = "result";
  resultEl.textContent = "";

  stopTimer();
  timeLeftEl.textContent = "--";
  if (timeBarFill) timeBarFill.style.transform = "scaleX(1)";

  if (phase === "play") {
    phaseLine.textContent = "イントロ再生フェーズ（まだ回答しない）";
    rankLine.textContent = `再生が終わったら ${app.players[0].name} が回答`;

    timerNoteEl.textContent = "イントロ再生中（回答フェーズ前）";

    introArea.innerHTML = `
      <button id="btnPlayIntroOnce" class="btn primary wide">▶ イントロ再生（${q.media.seconds}秒）</button>
      <div class="sub tiny" style="margin-top:8px">※このフェーズでは選択肢を出しません</div>
    `;
    $("btnPlayIntroOnce").onclick = async () => {
      const btn = $("btnPlayIntroOnce");
      btn.disabled = true;
      try {
        await playIntro(q.media.previewUrl, q.media.seconds, q.media.startAt || 0);
      } catch {
        resultEl.className = "result bad";
        resultEl.textContent = "再生に失敗…";
        btn.disabled = false;
        return;
      }
      app.game.introPhase = "p1";
      app.game.answerer = 0;
      renderIntroPhases(topicArtist, q);
    };

    btnNextPlayer.disabled = true;
    btnNextRound.disabled = true;
    btnNextPlayer.classList.remove("hidden");
    btnNextRound.classList.add("hidden");
    return;
  }

  const ans = (phase === "p1") ? 0 : 1;
  app.game.answerer = ans;

  const level = questionLevel(topicArtist);
  const selfV = rankValueOf(ans, topicArtist);
  const oppV  = rankValueOf(1 - ans, topicArtist);
  const diff  = Math.abs(selfV - oppV);
  const pts   = pointsFor(ans, topicArtist);

  phaseLine.textContent = `${app.players[ans].name} が回答`;
  rankLine.textContent =
    `トピック：${topicArtist.label} / 自分:${rankOf(ans, topicArtist)}(${selfV}) 相手:${rankOf(1-ans, topicArtist)}(${oppV}) 差=${diff} → 正解 +${fmtScore(pts)}点 / 出題:${levelJP(level)}`;

  timerNoteEl.textContent = app.timeLimit > 0 ? `制限時間：${app.timeLimit}s` : "制限時間：なし";

  introArea.innerHTML = `
    <button id="btnReplayIntro" class="btn wide">▶ もう一度聞く（${q.media.seconds}秒）</button>
    <div class="sub tiny" style="margin-top:8px">※回答中でも再生OK</div>
  `;
  $("btnReplayIntro").onclick = async () => {
    const btn = $("btnReplayIntro");
    btn.disabled = true;
    try {
      await playIntro(q.media.previewUrl, q.media.seconds, q.media.startAt || 0);
    } finally {
      btn.disabled = false;
    }
  };

  q.choices.forEach(ch => {
    const b = document.createElement("button");
    b.className = "choiceBtn";
    b.textContent = ch;
    b.onclick = () => answerChoiceIntro(ch);
    choicesEl.appendChild(b);
  });

  btnNextPlayer.disabled = true;
  btnNextRound.disabled = true;
  btnNextPlayer.classList.remove("hidden");
  btnNextRound.classList.add("hidden");

  startTimer(app.timeLimit, () => onTimeoutIntro());
}

function lockChoices() {
  choicesEl.querySelectorAll("button").forEach(b => b.disabled = true);
}

/* ===== 通常問題：タイムアウト/回答 ===== */
function onTimeout() {
  const ans = app.game.answerer;
  app.game.roundResults[ans] = { answered: true, ok: false };

  lockChoices();
  if (introAudio) { introAudio.pause(); introAudio = null; }

  const q = app.game.currentQ;
  resultEl.className = "result bad";
  resultEl.textContent = `⏱ 時間切れ… 正解は「${q.correct}」`;

  if (ans === 0) btnNextPlayer.disabled = false;
  else {
    btnNextPlayer.classList.add("hidden");
    btnNextRound.classList.remove("hidden");
    btnNextRound.disabled = false;
  }
}

function answerChoice(choice) {
  stopTimer();

  const ans = app.game.answerer;
  const q = app.game.currentQ;

  const ok = String(choice) === String(q.correct);
  app.game.roundResults[ans] = { answered: true, ok };

  lockChoices();
  if (introAudio) { introAudio.pause(); introAudio = null; }

  resultEl.className = ok ? "result good" : "result bad";
  resultEl.textContent = ok
    ? `✅ 正解！ 正解は「${q.correct}」`
    : `❌ 不正解… 正解は「${q.correct}」`;

  if (ans === 0) btnNextPlayer.disabled = false;
  else {
    btnNextPlayer.classList.add("hidden");
    btnNextRound.classList.remove("hidden");
    btnNextRound.disabled = false;
  }
}

/* ===== イントロ問題：タイムアウト/回答 ===== */
function onTimeoutIntro() {
  const ans = app.game.answerer;
  app.game.roundResults[ans] = { answered: true, ok: false };

  lockChoices();
  if (introAudio) { introAudio.pause(); introAudio = null; }

  const q = app.game.currentQ;
  resultEl.className = "result bad";
  resultEl.textContent = `⏱ 時間切れ… 正解は「${q.correct}」`;

  if (ans === 0) btnNextPlayer.disabled = false;
  else {
    btnNextPlayer.classList.add("hidden");
    btnNextRound.classList.remove("hidden");
    btnNextRound.disabled = false;
  }
}

function answerChoiceIntro(choice) {
  stopTimer();

  const ans = app.game.answerer;
  const q = app.game.currentQ;

  const ok = String(choice) === String(q.correct);
  app.game.roundResults[ans] = { answered: true, ok };

  lockChoices();
  if (introAudio) { introAudio.pause(); introAudio = null; }

  resultEl.className = ok ? "result good" : "result bad";
  resultEl.textContent = ok
    ? `✅ 正解！ 正解は「${q.correct}」`
    : `❌ 不正解… 正解は「${q.correct}」`;

  if (ans === 0) {
    btnNextPlayer.disabled = false;
  } else {
    btnNextPlayer.classList.add("hidden");
    btnNextRound.classList.remove("hidden");
    btnNextRound.disabled = false;
  }
}

/* ===== 引き継ぎ（P2ネタバレ防止） ===== */
function nextToP2() {
  stopTimer();
  if (introAudio) { introAudio.pause(); introAudio = null; }

  app.game.answerer = 1;
  handoffTitle.textContent = `${app.players[1].name}の番：同じ問題を解く`;
  btnReveal.textContent = "同じ問題を見る";

  handoff.classList.remove("hidden");
  qBox.classList.add("hidden");
}

/* ===== ラウンド加点＋次 ===== */
function applyRoundScoreAndNext() {
  stopTimer();
  if (introAudio) { introAudio.pause(); introAudio = null; }

  const topicArtist = app.game.topicArtist;

  let add0 = 0.0, add1 = 0.0;
  if (app.game.roundResults[0].ok) add0 = pointsFor(0, topicArtist);
  if (app.game.roundResults[1].ok) add1 = pointsFor(1, topicArtist);

  app.game.score[0] += add0;
  app.game.score[1] += add1;

  sbP1Score.textContent = fmtScore(app.game.score[0]);
  sbP2Score.textContent = fmtScore(app.game.score[1]);

  app.game.round++;
  app.game.currentQ = null;
  app.game.topicArtist = null;
  app.game.introPhase = "none";
  btnReveal.textContent = "問題を見る";

  if (app.game.round >= app.totalQ) {
    endGame(`最終加点：${app.players[0].name}+${fmtScore(add0)}, ${app.players[1].name}+${fmtScore(add1)}`);
    return;
  }

  showRoundHandoff();
}

function endGame(reason) {
  stopTimer();
  if (introAudio) { introAudio.pause(); introAudio = null; }

  setActionBarVisible(false);

  const p1 = app.players[0].name;
  const p2 = app.players[1].name;
  const s1 = app.game.score[0];
  const s2 = app.game.score[1];

  let winner = "引き分け";
  if (s1 > s2) winner = `${p1}の勝ち！`;
  if (s2 > s1) winner = `${p2}の勝ち！`;

  finalEl.innerHTML = `
    <p>${escapeHtml(reason || "")}</p>
    <p><strong>${escapeHtml(winner)}</strong></p>
    <div class="list">
      <div class="item"><div><div class="name">${escapeHtml(p1)}</div><div class="sub tiny">スコア</div></div><div style="font-weight:900;font-size:20px">${fmtScore(s1)}</div></div>
      <div class="item"><div><div class="name">${escapeHtml(p2)}</div><div class="sub tiny">スコア</div></div><div style="font-weight:900;font-size:20px">${fmtScore(s2)}</div></div>
    </div>
    <p class="sub">共通アーティスト：${app.common.length} / data.json：${app.dataQuestions.length}問</p>
  `;
  show(doneEl);
}

/* =========================
   Events
========================= */
btnRerollCandidates.onclick = () => rerollCandidates();
btnClearRanksThis10.onclick = () => clearRanksOnlyThis10();
btnClearP2Only.onclick = () => clearP2OnlyAllArtists();
btnClearAllSaved.onclick = () => clearAllSaved();
btnBuildCommon.onclick = () => buildCommon();

btnBackToSetup.onclick = () => { setMsg(commonMsg, ""); show(setupEl); };
btnFetchData.onclick = async () => {
  btnFetchData.disabled = true;
  try { await fetchDataForCommon(); }
  finally { btnFetchData.disabled = false; }
};

btnReveal.onclick = async () => {
  if (!app.game.currentQ) await revealRound();
  else {
    handoff.classList.add("hidden");
    qBox.classList.remove("hidden");

    if (app.game.currentQ.kind === "intro_to_title") {
      if (app.game.answerer === 1 && app.game.introPhase === "p1") app.game.introPhase = "p2";
      renderForAnswerer();
    } else {
      renderForAnswerer();
    }
  }
};

btnNextPlayer.onclick = () => {
  if (app.game.currentQ?.kind === "intro_to_title") {
    if (app.game.answerer === 0) {
      app.game.introPhase = "p2";
      nextToP2();
    }
    return;
  }
  if (app.game.answerer === 0) nextToP2();
};

btnNextRound.onclick = () => applyRoundScoreAndNext();
btnEnd.onclick = () => endGame("途中終了");

btnRestart.onclick = () => {
  setMsg(setupMsg, "");
  setMsg(commonMsg, "");
  show(setupEl);
};

/* =========================
   Init
========================= */
(async function init(){
  show(setupEl);

  const raw = loadCache("mm_globalSelections_v9", {});
  app.globalSelections = new Map(Object.entries(raw).map(([k, v]) => [k, v || {p1Rank:"", p2Rank:""}]));

  readSetupBasics();
  await loadDataQuestions();

  rerollCandidates();
})();
