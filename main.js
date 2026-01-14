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
const sbWrap = $("scoreHUD");
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
const btnNext = $("btnNext");
const btnEnd = $("btnEnd");

/* ===== Done UI ===== */
const finalEl = $("final");
const btnRestart = $("btnRestart");

/* ===== Constants ===== */
const RANK_VALUE = { A: 1, B: 2, C: 3, D: 4 };
const RANKS = ["", "A", "B", "C", "D"];

const RANK_LABELS = {
  "": "未選択",
  A: "A（ほぼすべて）",
  B: "B（30曲～）",
  C: "C（15曲～30曲）",
  D: "D（5曲～10曲）",
};

const DIFF_SET_HARD = new Set(["A", "B"]);
const DIFF_SET_EASY = new Set(["C", "D"]);
const DIFF_ALLOWED = new Set(["easy", "normal", "hard"]);

/* =========================
   Candidate sources
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
  players: [],
  totalQ: 12,
  introLen: 5,
  timeLimit: 10,
  quizMode: "mix", // intro_only / mix

  candidates: [],
  selectionsThis10: new Map(),
  globalSelections: new Map(), // artist -> {ranks:[...]}
  common: [],

  itunesByArtist: new Map(),
  albumTracksById: new Map(),

  dataQuestions: [],

  game: {
    round: 0,
    answerer: 0,
    score: [],
    usedSig: new Set(),
    currentQ: null,
    topicArtist: null,
    roundResults: [],
    introPhase: "none", // "none" | "play" | "answer"
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
  return (s || "")
    .toLowerCase()
    .replace(/\s+/g,"")
    .replace(/[・･’'".\-‐-–—_]/g,"")
    .normalize("NFKC");
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
   Players (dynamic 2-6)
========================= */
function rebuildPlayerInputs(defaultNames = []) {
  const n = clamp(parseInt($("playerCount").value, 10) || 2, 2, 6);
  $("playerCount").value = String(n);

  const area = $("playerInputs");
  area.innerHTML = "";

  for (let i = 0; i < n; i++) {
    const wrap = document.createElement("div");
    wrap.className = "small";
    wrap.innerHTML = `
      <label>プレイヤー${i+1} 名前</label>
      <input class="input" data-player-index="${i}" value="${escapeHtml(defaultNames[i] || `P${i+1}`)}" />
    `;
    area.appendChild(wrap);
  }
}

function readSetupBasics() {
  const n = clamp(parseInt($("playerCount").value, 10) || 2, 2, 6);

  const nameInputs = [...document.querySelectorAll("#playerInputs input[data-player-index]")];
  const names = nameInputs.slice(0, n).map((x, i) => (x.value || "").trim() || `P${i+1}`);

  app.players = names.map(name => ({ name }));
  app.game.score = Array.from({ length: n }, () => 0.0);

  saveCache("mm_players_v1", { count: n, names });

  app.totalQ = clamp(parseInt($("totalQ").value, 10) || 12, 3, 50);
  app.quizMode = $("quizMode")?.value || "mix";
  app.introLen = clamp(parseInt($("introLen")?.value ?? 5, 10) || 5, 1, 15);
  app.timeLimit = clamp(parseInt($("timeLimit")?.value ?? 10, 10) || 0, 0, 120);

  renderScoreboard();
}

/* =========================
   Scoreboard UI
========================= */
function renderScoreboard() {
  sbWrap.innerHTML = "";
  app.players.forEach((p, idx) => {
    const card = document.createElement("div");
    card.className = "scoreMini";
    card.innerHTML = `
      <div class="miniName">${escapeHtml(p.name)}</div>
      <div class="miniScore" id="sbScore_${idx}">${fmtScore(app.game.score?.[idx] ?? 0)}</div>
    `;
    sbWrap.appendChild(card);
  });
}

function updateScoreboard() {
  app.players.forEach((_, idx) => {
    const el = $(`sbScore_${idx}`);
    if (el) el.textContent = fmtScore(app.game.score[idx] || 0);
  });
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
  const n = app.players.length;
  for (const artist of app.candidates) {
    const saved = app.globalSelections.get(artist) || { ranks: Array.from({ length: n }, () => "") };
    const ranks = Array.from({ length: n }, (_, i) => saved.ranks?.[i] || "");
    app.selectionsThis10.set(artist, { ranks });
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
  app.globalSelections.set(artist, { ranks: [...next.ranks] });
  saveCache("mm_globalSelections_v10", Object.fromEntries(app.globalSelections.entries()));
}

function renderRankGrid(artist, curRanks, onChangeRank) {
  const grid = document.createElement("div");
  grid.className = "rankGrid";

  app.players.forEach((p, i) => {
    const cell = document.createElement("div");
    cell.className = "rankCell";

    const lab = document.createElement("label");
    lab.textContent = p.name;

    const sel = makeRankSelect(curRanks[i] || "", (v) => onChangeRank(i, v));

    cell.appendChild(lab);
    cell.appendChild(sel);
    grid.appendChild(cell);
  });

  return grid;
}

function renderCandidateCards() {
  candidateCards.innerHTML = "";

  app.candidates.forEach((artist, idx) => {
    const n = app.players.length;
    const cur = app.selectionsThis10.get(artist) || { ranks: Array.from({ length: n }, () => "") };

    const wrap = document.createElement("div");
    wrap.className = "cardRow";

    const top = document.createElement("div");
    top.className = "cardTop";
    top.innerHTML = `
      <div class="artistName">${escapeHtml(artist)}</div>
      <div class="badgeMini">候補 ${idx+1}/10</div>
    `;
    wrap.appendChild(top);

    const grid = renderRankGrid(artist, cur.ranks, (playerIndex, v) => {
      const now = app.selectionsThis10.get(artist) || { ranks: Array.from({ length: n }, () => "") };
      const nextRanks = [...now.ranks];
      nextRanks[playerIndex] = v;
      app.selectionsThis10.set(artist, { ranks: nextRanks });
      setGlobalSelection(artist, { ranks: nextRanks });
      renderSavedCards();
    });
    wrap.appendChild(grid);

    candidateCards.appendChild(wrap);
  });

  setMsg(setupMsg, "候補10個を更新。登録済みは下に残り続けます。");
}

function renderSavedCards() {
  savedCards.innerHTML = "";

  const entries = [...app.globalSelections.entries()]
    .filter(([_, v]) => Array.isArray(v?.ranks) && v.ranks.some(x => x))
    .sort((a, b) => a[0].localeCompare(b[0], "ja"));

  const n = app.players.length;
  const commonCount = entries.filter(([_, v]) => (v?.ranks?.length >= n && v.ranks.slice(0, n).every(Boolean))).length;
  savedSummary.textContent = `登録済み：${entries.length}件 / 共通（全員選択）：${commonCount}件`;

  entries.forEach(([artist, v], idx) => {
    const ranks = Array.from({ length: n }, (_, i) => v?.ranks?.[i] || "");

    const wrap = document.createElement("div");
    wrap.className = "cardRow";

    const top = document.createElement("div");
    top.className = "cardTop";
    top.innerHTML = `
      <div class="artistName">${escapeHtml(artist)}</div>
      <div class="badgeMini">#${idx+1}</div>
    `;
    wrap.appendChild(top);

    const grid = renderRankGrid(artist, ranks, (playerIndex, nv) => {
      const nextRanks = [...ranks];
      nextRanks[playerIndex] = nv;
      setGlobalSelection(artist, { ranks: nextRanks });
      if (app.selectionsThis10.has(artist)) app.selectionsThis10.set(artist, { ranks: [...nextRanks] });
      renderCandidateCards();
      renderSavedCards();
    });
    wrap.appendChild(grid);

    savedCards.appendChild(wrap);
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
  const n = app.players.length;
  for (const artist of app.candidates) {
    const next = { ranks: Array.from({ length: n }, () => "") };
    setGlobalSelection(artist, next);
    app.selectionsThis10.set(artist, { ranks: [...next.ranks] });
  }
  renderCandidateCards();
  renderSavedCards();
  setMsg(setupMsg, "この10個の選択だけリセットしました。");
}

/* 互換：2人目だけ削除（人数が2以上なら動く） */
function clearP2OnlyAllArtists() {
  const n = app.players.length;
  if (n < 2) return;

  for (const [artist, v] of app.globalSelections.entries()) {
    const ranks = Array.from({ length: n }, (_, i) => v?.ranks?.[i] || "");
    ranks[1] = "";
    setGlobalSelection(artist, { ranks });
    if (app.selectionsThis10.has(artist)) app.selectionsThis10.set(artist, { ranks: [...ranks] });
  }
  renderCandidateCards();
  renderSavedCards();
  setMsg(setupMsg, "2人目（プレイヤー2）だけ履歴（ランク）を全アーティストで削除しました。");
}

function clearAllSaved() {
  app.globalSelections.clear();
  saveCache("mm_globalSelections_v10", {});
  renderCandidateCards();
  renderSavedCards();
  setMsg(setupMsg, "登録済みを全消去しました。");
}

/* =========================
   Build common (全員がランク付けしたもの)
========================= */
function buildCommon() {
  readSetupBasics();

  const n = app.players.length;
  const common = [];
  for (const [artist, v] of app.globalSelections.entries()) {
    const ranks = Array.from({ length: n }, (_, i) => v?.ranks?.[i] || "");
    if (ranks.every(Boolean)) common.push({ label: artist, ranks });
  }

  if (common.length < 1) {
    setMsg(setupMsg, "共通アーティストが0件です。全員が同じアーティストにランクを付けたら開始できます。");
    return;
  }

  app.common = common;
  renderCommonList();
  show(commonEl);
}

function renderCommonList() {
  commonListEl.innerHTML = "";

  app.common
    .slice()
    .sort((a, b) => a.label.localeCompare(b.label, "ja"))
    .forEach(a => {
      const div = document.createElement("div");
      div.className = "item";
      const ranksText = a.ranks.map((r, i) => `${app.players[i].name}:${r}`).join(" / ");
      div.innerHTML = `
        <div>
          <div class="name">${escapeHtml(a.label)}</div>
          <div class="sub tiny">${escapeHtml(ranksText)}</div>
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
  return topicArtist.ranks[playerIndex] || "";
}
function rankValueOf(playerIndex, topicArtist) {
  const r = rankOf(playerIndex, topicArtist);
  return RANK_VALUE[r] ?? 1;
}

function questionLevel(topicArtist) {
  const ranks = topicArtist.ranks || [];
  const allHard = ranks.length && ranks.every(r => DIFF_SET_HARD.has(r));
  const allEasy = ranks.length && ranks.every(r => DIFF_SET_EASY.has(r));
  if (allHard) return "hard";
  if (allEasy) return "easy";
  return "normal";
}
function levelJP(level){
  return level === "hard" ? "hard（マイナー寄り）" : level === "easy" ? "easy（有名寄り）" : "normal";
}

/* ★多人数スコア：正解した人だけ
   最高ランク（値が小さい）= +1
   それ以外 = +1 + (自分 - 最高ランク)/3
*/
function pointsFor(playerIndex, topicArtist) {
  const n = app.players.length;
  const vals = Array.from({ length: n }, (_, i) => rankValueOf(i, topicArtist));
  const best = Math.min(...vals);
  const self = vals[playerIndex];
  const diff = Math.max(0, self - best);
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

function makeQ_introToTitle(topicArtist) {
  const pack = app.itunesByArtist.get(topicArtist.label);
  if (!pack) return null;

  const level = questionLevel(topicArtist);
  const pool = selectTrackPool(pack, level);
  if (pool.length < 4) return null;

  const track = pickRandom(pool);
  const correct = track.name;

  const distractorPool = pool.map(t => t.name).filter(n => n && n !== correct);
  const uniq = [...new Set(distractorPool)];
  if (uniq.length < 3) return null;

  const distractors = shuffle(uniq).slice(0, 3);
  const randomStart = (level === "hard");
  const seconds = app.introLen;
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
      ? ["intro_to_title", "intro_to_title", "intro_to_title"]
      : shuffle(["intro_to_title","cover_album_to_title","data_json","intro_to_title"]);

    let q = null;

    for (const t of types) {
      if (t === "data_json") q = makeQ_fromDataJson(topicArtist);
      if (t === "intro_to_title") q = makeQ_introToTitle(topicArtist);
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
  readSetupBasics();

  app.game.round = 0;
  app.game.answerer = 0;
  app.game.score = Array.from({ length: app.players.length }, () => 0.0);
  app.game.usedSig = new Set();
  app.game.currentQ = null;
  app.game.topicArtist = null;
  app.game.roundResults = Array.from({ length: app.players.length }, () => ({ answered:false, ok:false }));
  app.game.introPhase = "none";

  renderScoreboard();
  updateScoreboard();

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
  qMeta.textContent = `全${app.totalQ}ラウンド / モード：${app.quizMode === "intro_only" ? "イントロのみ" : "ミックス"} / 人数：${app.players.length}`;

  handoffTitle.textContent = `Round ${app.game.round + 1}：画面を隠して開始`;
  btnReveal.textContent = "問題を見る";

  handoff.classList.remove("hidden");
  qBox.classList.add("hidden");

  btnNext.disabled = true;
  btnNext.textContent = "次へ";
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
  app.game.roundResults = Array.from({ length: app.players.length }, () => ({ answered:false, ok:false }));

  app.game.introPhase = (app.game.currentQ.kind === "intro_to_title") ? "play" : "none";
  app.game.answerer = 0;

  renderForAnswerer();
}

function showHandoffFor(playerIndex) {
  stopTimer();
  if (introAudio) { introAudio.pause(); introAudio = null; }

  handoffTitle.textContent = `${app.players[playerIndex].name} の番：画面を隠して開始`;
  btnReveal.textContent = "問題を見る";
  handoff.classList.remove("hidden");
  qBox.classList.add("hidden");
  btnNext.disabled = true;
}

function renderForAnswerer() {
  const q = app.game.currentQ;
  const topicArtist = app.game.topicArtist;
  if (!q || !topicArtist) return;

  if (q.kind === "intro_to_title") {
    return renderIntroPhases(topicArtist, q);
  }

  const ans = app.game.answerer;

  if (introAudio) { introAudio.pause(); introAudio = null; }

  turnBadge.textContent = `Round ${app.game.round + 1}`;
  qMeta.textContent = `同じ問題を全員が順番に回答`;

  qText.textContent = q.promptText;

  qMedia.classList.add("hidden");
  qMedia.innerHTML = "";
  if (q.media?.type === "img" && q.media.url) {
    qMedia.classList.remove("hidden");
    qMedia.innerHTML = `<img src="${q.media.url}" alt="${escapeHtml(q.media.alt || "image")}" />`;
  }

  const level = questionLevel(topicArtist);
  const selfV = rankValueOf(ans, topicArtist);
  const bestV = Math.min(...topicArtist.ranks.map((_, i) => rankValueOf(i, topicArtist)));
  const diff  = Math.max(0, selfV - bestV);
  const pts   = pointsFor(ans, topicArtist);

  phaseLine.textContent = `${app.players[ans].name} が回答`;
  rankLine.textContent =
    `トピック：${topicArtist.label} / 自分:${rankOf(ans, topicArtist)}(${selfV}) / 最高:${bestV} / 差=${diff} → 正解 +${fmtScore(pts)}点 / 出題:${levelJP(level)}`;

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

  btnNext.disabled = true;
  btnNext.textContent = (ans === app.players.length - 1) ? "次のラウンド" : "次の人へ";

  startTimer(app.timeLimit, () => onTimeout());
}

/* ===== イントロ：再生→全員回答 ===== */
function renderIntroPhases(topicArtist, q) {
  const phase = app.game.introPhase;

  turnBadge.textContent = `Round ${app.game.round + 1}`;
  qMeta.textContent = `イントロ問題：再生 → 全員が順番に回答`;

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
      app.game.introPhase = "answer";
      app.game.answerer = 0;
      showHandoffFor(0);
    };

    btnNext.disabled = true;
    btnNext.textContent = "次へ";
    return;
  }

  const ans = app.game.answerer;

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

  const level = questionLevel(topicArtist);
  const selfV = rankValueOf(ans, topicArtist);
  const bestV = Math.min(...topicArtist.ranks.map((_, i) => rankValueOf(i, topicArtist)));
  const diff  = Math.max(0, selfV - bestV);
  const pts   = pointsFor(ans, topicArtist);

  phaseLine.textContent = `${app.players[ans].name} が回答`;
  rankLine.textContent =
    `トピック：${topicArtist.label} / 自分:${rankOf(ans, topicArtist)}(${selfV}) / 最高:${bestV} / 差=${diff} → 正解 +${fmtScore(pts)}点 / 出題:${levelJP(level)}`;

  q.choices.forEach(ch => {
    const b = document.createElement("button");
    b.className = "choiceBtn";
    b.textContent = ch;
    b.onclick = () => answerChoice(ch);
    choicesEl.appendChild(b);
  });

  btnNext.disabled = true;
  btnNext.textContent = (ans === app.players.length - 1) ? "次のラウンド" : "次の人へ";

  startTimer(app.timeLimit, () => onTimeout());
}

function lockChoices() {
  choicesEl.querySelectorAll("button").forEach(b => b.disabled = true);
}

function onTimeout() {
  const ans = app.game.answerer;
  app.game.roundResults[ans] = { answered: true, ok: false };

  lockChoices();
  if (introAudio) { introAudio.pause(); introAudio = null; }

  const q = app.game.currentQ;
  resultEl.className = "result bad";
  resultEl.textContent = `⏱ 時間切れ… 正解は「${q.correct}」`;

  btnNext.disabled = false;
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

  btnNext.disabled = false;
}

function advanceAfterAnswer() {
  stopTimer();
  if (introAudio) { introAudio.pause(); introAudio = null; }

  const n = app.players.length;
  const cur = app.game.answerer;

  if (cur < n - 1) {
    app.game.answerer = cur + 1;
    showHandoffFor(app.game.answerer);
  } else {
    applyRoundScoreAndNext();
  }
}

function applyRoundScoreAndNext() {
  stopTimer();
  if (introAudio) { introAudio.pause(); introAudio = null; }

  const topicArtist = app.game.topicArtist;
  const n = app.players.length;

  const adds = Array.from({ length: n }, (_, i) =>
    (app.game.roundResults[i].ok ? pointsFor(i, topicArtist) : 0.0)
  );

  for (let i = 0; i < n; i++) app.game.score[i] += adds[i];

  updateScoreboard();

  app.game.round++;
  app.game.currentQ = null;
  app.game.topicArtist = null;

  app.game.introPhase = "none";
  app.game.answerer = 0;

  if (app.game.round >= app.totalQ) {
    const reason = `最終加点：${adds.map((x,i)=>`${app.players[i].name}+${fmtScore(x)}`).join(", ")}`;
    endGame(reason);
    return;
  }

  showRoundHandoff();
}

function endGame(reason) {
  stopTimer();
  if (introAudio) { introAudio.pause(); introAudio = null; }

  setActionBarVisible(false);

  const scores = app.game.score.map(x => Number(x || 0));
  const max = Math.max(...scores);
  const winners = scores
    .map((s,i) => ({ s, i }))
    .filter(x => x.s === max)
    .map(x => app.players[x.i].name);

  const winnerText = winners.length === 1 ? `${winners[0]}の勝ち！` : `引き分け（${winners.join(" / ")}）`;

  finalEl.innerHTML = `
    <p>${escapeHtml(reason || "")}</p>
    <p><strong>${escapeHtml(winnerText)}</strong></p>
    <div class="list">
      ${app.players.map((p,i)=>`
        <div class="item">
          <div>
            <div class="name">${escapeHtml(p.name)}</div>
            <div class="sub tiny">スコア</div>
          </div>
          <div style="font-weight:900;font-size:20px">${fmtScore(scores[i])}</div>
        </div>
      `).join("")}
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
  if (!app.game.currentQ) {
    await revealRound();
    return;
  }
  handoff.classList.add("hidden");
  qBox.classList.remove("hidden");
  renderForAnswerer();
};

btnNext.onclick = () => advanceAfterAnswer();
btnEnd.onclick = () => endGame("途中終了");

btnRestart.onclick = () => {
  setMsg(setupMsg, "");
  show(setupEl);
  setActionBarVisible(false);
};

$("playerCount").addEventListener("change", () => {
  const ps = loadCache("mm_players_v1", { count: 2, names: [] });
  rebuildPlayerInputs(ps.names);
  readSetupBasics();

  const saved = loadCache("mm_globalSelections_v10", {});
  app.globalSelections = new Map(Object.entries(saved));
  const n = app.players.length;

  for (const [artist, v] of app.globalSelections.entries()) {
    const ranks = Array.from({ length: n }, (_, i) => v?.ranks?.[i] || "");
    app.globalSelections.set(artist, { ranks });
  }
  saveCache("mm_globalSelections_v10", Object.fromEntries(app.globalSelections.entries()));

  ensureSelectionsThis10();
  renderCandidateCards();
  renderSavedCards();
});

/* =========================
   Init / Hydrate
========================= */
function hydrateFromCache() {
  const ps = loadCache("mm_players_v1", { count: 2, names: [] });
  $("playerCount").value = String(clamp(ps.count || 2, 2, 6));
  rebuildPlayerInputs(ps.names || []);
  readSetupBasics();

  const saved = loadCache("mm_globalSelections_v10", {});
  const rawMap = new Map(Object.entries(saved));

  app.globalSelections = new Map();
  const n = app.players.length;

  for (const [artist, v] of rawMap.entries()) {
    if (!v || !Array.isArray(v.ranks)) {
      app.globalSelections.set(artist, { ranks: Array.from({ length: n }, () => "") });
      continue;
    }
    const ranks = Array.from({ length: n }, (_, i) => v.ranks[i] || "");
    app.globalSelections.set(artist, { ranks });
  }
  saveCache("mm_globalSelections_v10", Object.fromEntries(app.globalSelections.entries()));

  app.candidates = generateCandidates10();
  ensureSelectionsThis10();
  renderCandidateCards();
  renderSavedCards();
}

(async function init() {
  await loadDataQuestions();
  hydrateFromCache();
})();
