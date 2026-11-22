const STORAGE_KEY = "odoc-demo-state";
const BRIDGE_KEY = "hanziflow.gameBridge";
const SITE_CONFIG = {
  domain: "hanzi.qisoul.com",
  brand: "QiSoul",
  coursePath: "https://qisoul.com/calligraphy",
  writingCoachPath: "/",
  supportEmail: "hello@qisoul.com",
};

const APP_DATA = {
  characterPoolSize: 0,
  colors: ["#f4c95d", "#ffb86b", "#ff9f68", "#ffd36e", "#f7c762", "#ffc187"],
  characters: [],
  wordRecipes: [],
  sentenceRecipes: [],
  idiomRecipes: [],
  cities: [],
  demoProfiles: {
    starter: {
      userName: "Mia",
      cityCode: "la",
      streakDays: 3,
      displayUnlockedTotal: 7,
      unlockedCharacterIds: ["ren", "ri", "hao", "xin", "shan", "shui", "zhong"],
      checkinsToday: false,
      customSentence: "",
      detailsOpen: false,
    },
    traveler: {
      userName: "Noah",
      cityCode: "seattle",
      streakDays: 14,
      displayUnlockedTotal: 38,
      unlockedCharacterIds: ["zhong", "wen", "ren", "ri", "yue", "shan", "shui", "xue", "hao", "you", "tian", "xia", "tong", "guang", "ping", "an"],
      checkinsToday: false,
      customSentence: "",
      detailsOpen: true,
    },
    collector: {
      userName: "Luna",
      cityCode: "london",
      streakDays: 51,
      displayUnlockedTotal: 128,
      unlockedCharacterIds: [
        "zhong",
        "wen",
        "ren",
        "ri",
        "yue",
        "shan",
        "shui",
        "huo",
        "xin",
        "xue",
        "xi",
        "hao",
        "you",
        "tian",
        "xia",
        "tong",
        "guang",
        "ping",
        "an",
        "tai",
      ],
      checkinsToday: true,
      customSentence: "好友学中文",
      detailsOpen: true,
    },
  },
  leaderboard: {
    cities: [
      { name: "Los Angeles", lights: 145 },
      { name: "Seattle", lights: 133 },
      { name: "London", lights: 171 },
      { name: "Paris", lights: 128 },
      { name: "Berlin", lights: 118 },
    ],
    global: [
      { name: "Luna", lights: 128 },
      { name: "Ethan", lights: 116 },
      { name: "Maya", lights: 104 },
      { name: "Oliver", lights: 99 },
      { name: "Ava", lights: 93 },
    ],
    friends: [
      { name: "Nora", lights: 22 },
      { name: "Leo", lights: 18 },
      { name: "Chloe", lights: 15 },
      { name: "Finn", lights: 11 },
    ],
  },
};

async function loadAppData() {
  const characterSource = "./data/characters.merged.json";
  const [characters, words, sentences, idioms, cities] = await Promise.all([
    fetch(characterSource).then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load ${characterSource}`);
      }
      return response.json();
    }),
    fetch("./data/words.json").then((response) => response.json()),
    fetch("./data/sentences.json").then((response) => response.json()),
    fetch("./data/idioms.json").then((response) => response.json()),
    fetch("./data/cities.json").then((response) => response.json()),
  ]);

  APP_DATA.characters = characters;
  APP_DATA.wordRecipes = words;
  APP_DATA.sentenceRecipes = sentences;
  APP_DATA.idiomRecipes = idioms;
  APP_DATA.cities = cities;
  APP_DATA.characterPoolSize = characters.length;
}

let state = loadState();

const ui = {
  heroCharacter: document.querySelector("#hero-character"),
  heroMeaning: document.querySelector("#hero-meaning"),
  heroTotal: document.querySelector("#hero-total"),
  heroCity: document.querySelector("#hero-city"),
  dailyStatus: document.querySelector("#daily-status"),
  characterLamp: document.querySelector("#character-lamp"),
  characterSymbol: document.querySelector("#character-symbol"),
  characterPinyin: document.querySelector("#character-pinyin"),
  characterTone: document.querySelector("#character-tone"),
  characterMeaning: document.querySelector("#character-meaning"),
  characterExample: document.querySelector("#character-example"),
  characterMnemonic: document.querySelector("#character-mnemonic"),
  strokeSteps: document.querySelector("#stroke-steps"),
  ladderProgress: document.querySelector("#ladder-progress"),
  mapSummary: document.querySelector("#map-summary"),
  mapPoints: document.querySelector("#map-points"),
  cityRegion: document.querySelector("#city-region"),
  todayColor: document.querySelector("#today-color"),
  colorCaption: document.querySelector("#color-caption"),
  cityFeedList: document.querySelector("#city-feed-list"),
  collectionSummary: document.querySelector("#collection-summary"),
  characterGrid: document.querySelector("#character-grid"),
  wordGrid: document.querySelector("#word-grid"),
  sentenceGrid: document.querySelector("#sentence-grid"),
  idiomGrid: document.querySelector("#idiom-grid"),
  cityBoard: document.querySelector("#city-board"),
  globalBoard: document.querySelector("#global-board"),
  friendsBoard: document.querySelector("#friends-board"),
  sentenceLockStatus: document.querySelector("#sentence-lock-status"),
  builderPool: document.querySelector("#builder-pool"),
  sentencePreview: document.querySelector("#sentence-preview"),
  detailsStage: document.querySelector("#details-stage"),
  reviewTrainer: document.querySelector("#review-trainer"),
  trainerStatus: document.querySelector("#trainer-status"),
  listenButton: document.querySelector("#listen-button"),
  lessonTarget: document.querySelector("#lesson-target"),
  lessonPrompt: document.querySelector("#lesson-prompt"),
  answerPool: document.querySelector("#answer-pool"),
  shareCard: document.querySelector("#share-card"),
  copyInvite: document.querySelector("#copy-invite"),
  shareNote: document.querySelector("#share-note"),
  inviteNote: document.querySelector("#invite-note"),
  inviteStatus: document.querySelector("#invite-status"),
  circleBlock: document.querySelector("#circle-block"),
  circleCount: document.querySelector("#circle-count"),
  circleList: document.querySelector("#circle-list"),
  circleSummary: document.querySelector("#circle-summary"),
  libraryStatus: document.querySelector("#library-status"),
};

const buttons = {
  startLearning: document.querySelector("#start-learning"),
  completeCheckin: document.querySelector("#complete-checkin"),
  resetProgress: document.querySelector("#reset-progress"),
  clearSentence: document.querySelector("#clear-sentence"),
  videoApiNote: document.querySelector("#video-api-note"),
  toggleDetails: document.querySelector("#toggle-details"),
  exitLearning: document.querySelector("#exit-learning"),
  practiceWriting: document.querySelector("#practice-writing"),
  profilePills: Array.from(document.querySelectorAll(".profile-pill")),
};

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createProfileState("starter");
    }
    return hydrateState(JSON.parse(raw));
  } catch (error) {
    return createProfileState("starter");
  }
}

function saveState() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function readBridge() {
  try {
    const raw = window.localStorage.getItem(BRIDGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
}

function writeBridge(patch) {
  const bridge = readBridge();
  const next = { ...bridge, ...patch, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(BRIDGE_KEY, JSON.stringify(next));
}

function syncCompletedTodayFromBridge() {
  const bridge = readBridge();
  if (!bridge.completedAt || !bridge.char) return;
  const today = getTodayCharacter();
  if (bridge.char === today.hanzi && bridge.completedAt.slice(0, 10) === getLocalDateKey()) {
    if (!state.checkinsToday) {
      state.checkinsToday = true;
      state.checkinDate = getLocalDateKey();
      ensureTodayCharacterInCollection();
      saveState();
    }
  }
}

function createProfileState(profileKey) {
  const profile = APP_DATA.demoProfiles[profileKey];
  const todayKey = getLocalDateKey();
  return {
    profileKey,
    userName: profile.userName,
    cityCode: profile.cityCode,
    streakDays: profile.streakDays,
    displayUnlockedTotal: profile.displayUnlockedTotal,
    unlockedCharacterIds: [...profile.unlockedCharacterIds],
    learnedToday: false,
    checkinsToday: profile.checkinsToday && todayKey === getLocalDateKey(),
    checkinDate: profile.checkinsToday ? todayKey : null,
    lastStudyDate: profile.checkinsToday ? todayKey : null,
    customSentence: profile.customSentence,
    focusedCityCode: profile.cityCode,
    learnedSessionStarted: false,
    lessonStep: "idle",
    trainerAttempts: 0,
    trainerCorrect: false,
    detailsOpen: profile.detailsOpen,
    inviteJoined: false,
    inviteJoinDate: null,
  };
}

function hydrateState(rawState) {
  const profile = APP_DATA.demoProfiles[rawState.profileKey] || APP_DATA.demoProfiles.starter;
  const todayKey = getLocalDateKey();
  const fallback = createProfileState(rawState.profileKey || "starter");
  const merged = {
    ...fallback,
    ...rawState,
    profileKey: profile.profileKey,
    userName: rawState.userName || profile.userName,
    cityCode: rawState.cityCode || profile.cityCode,
    unlockedCharacterIds: Array.isArray(rawState.unlockedCharacterIds)
      ? rawState.unlockedCharacterIds
      : fallback.unlockedCharacterIds,
    displayUnlockedTotal: Number.isFinite(Number(rawState.displayUnlockedTotal))
      ? Number(rawState.displayUnlockedTotal)
      : fallback.displayUnlockedTotal,
    streakDays: Number.isFinite(Number(rawState.streakDays))
      ? Number(rawState.streakDays)
      : fallback.streakDays,
    checkinsToday: rawState.checkinDate === todayKey,
    checkinDate: rawState.checkinDate || null,
    lastStudyDate: rawState.lastStudyDate || null,
    learnedSessionStarted: Boolean(rawState.learnedSessionStarted),
    lessonStep: rawState.lessonStep || "idle",
    trainerAttempts: Number(rawState.trainerAttempts) || 0,
    trainerCorrect: Boolean(rawState.trainerCorrect),
    inviteJoined: Boolean(rawState.inviteJoined),
    inviteJoinDate: rawState.inviteJoinDate || null,
  };

  // 修复旧的“今天已打卡”状态；新的一天自动复位。
  if (rawState.checkinsToday && !rawState.checkinDate) {
    merged.checkinDate = todayKey;
    merged.lastStudyDate = todayKey;
    merged.checkinsToday = true;
  } else if (rawState.checkinsToday && rawState.checkinDate !== todayKey) {
    merged.checkinsToday = false;
  }

  return merged;
}

function getTodayIndex() {
  const now = new Date();
  const start = new Date("2026-01-01T00:00:00Z");
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return ((diff % APP_DATA.characters.length) + APP_DATA.characters.length) % APP_DATA.characters.length;
}

function getLocalDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysToDateKey(dateKey, days) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getTodayCharacter() {
  return APP_DATA.characters[getTodayIndex()];
}

function getTodayColor() {
  return APP_DATA.colors[getTodayIndex() % APP_DATA.colors.length];
}

function getCityByCode(code) {
  return APP_DATA.cities.find((city) => city.code === code) || APP_DATA.cities[0];
}

function getUnlockedCharacters() {
  return APP_DATA.characters.filter((character) => state.unlockedCharacterIds.includes(character.id));
}

function isRecipeUnlocked(recipe) {
  return recipe.required.every((id) => state.unlockedCharacterIds.includes(id));
}

function getUnlockedRecipes(recipes) {
  return recipes.filter(isRecipeUnlocked);
}

function ensureTodayCharacterInCollection() {
  const today = getTodayCharacter();
  if (!state.unlockedCharacterIds.includes(today.id)) {
    state.unlockedCharacterIds.push(today.id);
    state.displayUnlockedTotal = Math.min(APP_DATA.characterPoolSize, state.displayUnlockedTotal + 1);
  }
}

function setProfile(profileKey) {
  state = createProfileState(profileKey);
  saveState();
  renderApp();
}

function updateProfileButtons() {
  buttons.profilePills.forEach((button) => {
    button.classList.toggle("active", button.dataset.profile === state.profileKey);
  });
}

function renderHero(todayCharacter, city) {
  ui.heroCharacter.textContent = todayCharacter.hanzi;
  ui.heroMeaning.textContent = todayCharacter.meaning;
  ui.heroTotal.textContent = `${state.displayUnlockedTotal} / ${APP_DATA.characterPoolSize}`;
  ui.heroCity.textContent = city.name;
  ui.cityRegion.textContent = city.region;
  document.title = `One Day One Character | ${SITE_CONFIG.domain}`;
}

function renderDailyCard(todayCharacter) {
  ui.characterSymbol.textContent = todayCharacter.hanzi;
  ui.characterPinyin.textContent = todayCharacter.pinyin;
  ui.characterTone.textContent = todayCharacter.tone || todayCharacter.pinyin;
  ui.characterMeaning.textContent = todayCharacter.meaning;
  ui.characterExample.textContent = todayCharacter.example;
  ui.characterMnemonic.textContent = todayCharacter.mnemonic || "";
  ui.strokeSteps.innerHTML = todayCharacter.strokeHint
    .map((step) => `<li>${step}</li>`)
    .join("");

  const lessonDone = state.checkinsToday;
  const lessonActive = state.lessonStep !== "idle" && !lessonDone;
  const reviewReady = state.lessonStep === "reviewing" && state.trainerCorrect;
  ui.dailyStatus.textContent = lessonDone
    ? "Today is already lit"
    : state.lessonStep === "reviewing" && !state.trainerCorrect
      ? "Lesson in progress"
      : reviewReady
        ? "Review complete — light your city"
        : "Not checked in yet";

  ui.characterLamp.style.boxShadow = lessonDone
    ? `0 0 0 1px rgba(214, 171, 63, 0.32), 0 0 72px ${getTodayColor()}55`
    : "none";

  const canCheckin = !lessonDone && state.trainerCorrect;
  buttons.completeCheckin.disabled = !canCheckin;
  buttons.completeCheckin.textContent = lessonDone
    ? "City already glowing today"
    : canCheckin
      ? "Finish and light my city"
      : state.lessonStep === "idle"
        ? "Learn first, then light your city"
        : "Finish the review to light your city";

  buttons.startLearning.textContent = lessonActive ? "Continue lesson" : "Learn today's character";
  buttons.startLearning.classList.toggle("is-hidden", lessonDone || reviewReady);
  buttons.exitLearning.classList.toggle("is-hidden", !(state.lessonStep === "reviewing" && !state.trainerCorrect));

  const hasCoachData = todayCharacter?.hasStrokeData;
  if (ui.practiceWriting) {
    const coachUrl = `${SITE_CONFIG.writingCoachPath}/practice/${encodeURIComponent(todayCharacter?.hanzi || "")}`;
    ui.practiceWriting.href = hasCoachData ? coachUrl : "#";
    ui.practiceWriting.classList.toggle("is-hidden", !hasCoachData);
    ui.practiceWriting.title = hasCoachData
      ? "Open the handwriting coach for this character"
      : "Stroke data is not available for this character yet";
  }

  ui.reviewTrainer.classList.toggle("is-hidden", state.lessonStep !== "reviewing");
  renderReviewTrainer(todayCharacter);
}

function getMeaningOptions(todayCharacter) {
  const options = [todayCharacter.meaning];
  for (let index = 0; options.length < 3; index += 1) {
    const candidate = APP_DATA.characters[(getTodayIndex() + 5 + index * 4) % APP_DATA.characters.length];
    if (!options.includes(candidate.meaning)) {
      options.push(candidate.meaning);
    }
  }

  return options
    .map((meaning) => ({ meaning, id: `${meaning}-${Math.random()}` }))
    .sort(() => Math.random() - 0.5);
}

function renderReviewTrainer(todayCharacter) {
  if (!ui.reviewTrainer) {
    return;
  }

  ui.trainerStatus.textContent = state.trainerCorrect
    ? "Correct — ready to light your city"
    : state.trainerAttempts > 0
      ? "Not quite — try again"
      : "Listen and choose";

  ui.lessonTarget.textContent = todayCharacter.hanzi;
  ui.lessonPrompt.textContent = "Which meaning matches this character?";

  ui.answerPool.innerHTML = getMeaningOptions(todayCharacter)
    .map(
      (option, index) => `
        <button class="answer-chip ${state.trainerCorrect ? "is-disabled" : ""}" data-meaning="${option.meaning}">
          <span>${String.fromCharCode(65 + index)}</span>
          ${option.meaning}
        </button>
      `,
    )
    .join("");

  ui.answerPool.querySelectorAll(".answer-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      if (state.trainerCorrect) {
        return;
      }
      state.trainerAttempts += 1;
      if (chip.dataset.meaning === todayCharacter.meaning) {
        state.trainerCorrect = true;
        state.lessonStep = "reviewing";
        state.learnedSessionStarted = true;
        saveState();
        renderApp();
        return;
      }
      saveState();
      renderReviewTrainer(todayCharacter);
    });
  });
}

function resetLessonProgress() {
  state.lessonStep = "idle";
  state.trainerAttempts = 0;
  state.trainerCorrect = false;
}

function startLesson() {
  if (state.checkinsToday) {
    return;
  }
  state.learnedSessionStarted = true;
  state.lessonStep = "reviewing";
  state.trainerAttempts = 0;
  state.trainerCorrect = false;
  saveState();
  renderApp();
  ui.reviewTrainer?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function speakCharacter(character) {
  if (!("speechSynthesis" in window)) {
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(character.hanzi);
  utterance.lang = "zh-CN";
  utterance.rate = 0.82;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function getShareText() {
  const character = getTodayCharacter();
  const city = getCityByCode(state.cityCode);
  const streakDays = Math.max(0, Number(state.streakDays) || 0);
  return `Today I lit “${character.hanzi}” (${character.tone}). ${character.meaning}. ${city.name} is glowing. ${streakDays}-day streak.`;
}

function getInviteUrl() {
  const url = new URL(window.location.href);
  url.hash = "invite";
  return url.toString();
}

function showInviteNote(message) {
  ui.inviteNote.classList.remove("is-hidden");
  ui.inviteStatus.textContent = message;
}

function getInviteSource() {
  return window.location.hash.replace("#", "");
}

function markInviteJoined() {
  if (getInviteSource() === "invite" && !state.inviteJoined) {
    state.inviteJoined = true;
    state.inviteJoinDate = getLocalDateKey();
    saveState();
  }
}

function renderInviteState() {
  const today = getTodayCharacter();
  const hasJoined = Boolean(state.inviteJoined);

  if (getInviteSource() === "invite" && !hasJoined) {
    showInviteNote(`You joined from an invite. Learn today's “${today.hanzi}” to keep the circle glowing.`);
  } else if (hasJoined) {
    showInviteNote(`You are in a study circle. Today's shared character is “${today.hanzi}”.`);
  } else {
    ui.inviteNote.classList.add("is-hidden");
  }

  renderCircleState();
}

function getCircleMembers() {
  const seedMembers = [
    { id: "nora", name: "Nora", city: "Berlin", checkedToday: true, streak: 6 },
    { id: "leo", name: "Leo", city: "Singapore", checkedToday: false, streak: 3 },
  ];

  const circleMembers = state.inviteJoined
    ? [{ id: "you", name: `${state.userName} (you)`, city: getCityByCode(state.cityCode).name, checkedToday: state.checkinsToday, streak: state.streakDays }, ...seedMembers]
    : seedMembers;

  return circleMembers;
}

function renderCircleState() {
  const members = getCircleMembers();
  const checkedToday = members.filter((member) => member.checkedToday).length;
  const total = members.length;

  ui.circleCount.textContent = `${total} in circle · ${checkedToday} lit today`;
  ui.circleList.innerHTML = members
    .map(
      (member) => `
        <li class="circle-member ${member.checkedToday ? "checked" : ""}">
          <span class="circle-dot"></span>
          <div>
            <strong>${member.name}</strong>
            <span>${member.city} · ${member.streak}-day streak</span>
          </div>
        </li>
      `,
    )
    .join("");

  ui.circleSummary.textContent = state.inviteJoined
    ? `Your circle keeps a small, shared glow.`
    : `Copy an invite to start a small circle.`;
}

function renderLibraryStatus() {
  const characters = APP_DATA.characters.length;
  const words = APP_DATA.wordRecipes.length;
  const sentences = APP_DATA.sentenceRecipes.length;
  const idioms = APP_DATA.idiomRecipes.length;
  const cities = APP_DATA.cities.length;
  ui.libraryStatus.textContent = `${characters} hanzi · ${words} words · ${sentences} lines · ${idioms} idioms · ${cities} cities`;
}

async function shareToday() {
  const shareText = getShareText();
  const shareUrl = window.location.href;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "One Day One Character",
        text: shareText,
        url: shareUrl,
      });
      ui.shareNote.textContent = "Shared. One more glow in the world.";
      showInviteNote("Share completed. Your circle will see today's glow.");
      return;
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }
    }
  }

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  window.open(twitterUrl, "_blank", "noopener,noreferrer");
  ui.shareNote.textContent = "Opening a share card in a new tab.";
  showInviteNote("Share card is open. Copy the invite link to bring a friend.");
}

async function copyInviteLink() {
  const inviteUrl = getInviteUrl();
  try {
    await navigator.clipboard.writeText(inviteUrl);
    ui.shareNote.textContent = "Invite link copied. Send it to your study circle.";
    showInviteNote("Invite link copied. When they join, your circle grows.");
  } catch (error) {
    ui.shareNote.textContent = inviteUrl;
    showInviteNote("Invite link is ready to share.");
  }
}

function renderLadder() {
  const unlockedWords = getUnlockedRecipes(APP_DATA.wordRecipes).length;
  const unlockedSentences = getUnlockedRecipes(APP_DATA.sentenceRecipes).length;
  const unlockedIdioms = getUnlockedRecipes(APP_DATA.idiomRecipes).length;
  const sentenceStudioReady = state.displayUnlockedTotal >= 100;
  const streakDays = Math.max(0, Number(state.streakDays) || 0);

  const steps = [
    {
      label: "Today",
      value: state.checkinsToday ? `${streakDays}-day streak lit` : "Not checked in yet",
      active: state.checkinsToday,
    },
    {
      label: "Character lamp",
      value: `${state.displayUnlockedTotal} lit`,
      active: state.displayUnlockedTotal > 0,
    },
    {
      label: "Words auto-lit",
      value: `${unlockedWords} unlocked`,
      active: unlockedWords > 0,
    },
    {
      label: "Short lines",
      value: `${unlockedSentences} unlocked`,
      active: unlockedSentences > 0,
    },
    {
      label: "Idioms",
      value: `${unlockedIdioms} unlocked`,
      active: unlockedIdioms > 0,
    },
    {
      label: "Sentence studio",
      value: sentenceStudioReady ? "open" : `${100 - state.displayUnlockedTotal} to go`,
      active: sentenceStudioReady,
    },
  ];

  ui.ladderProgress.innerHTML = steps
    .map(
      (step) => `
        <div class="ladder-step ${step.active ? "active" : ""}">
          <span>${step.label}</span>
          <strong>${step.value}</strong>
        </div>
      `,
    )
    .join("");
}

function getMapPointsData() {
  const todayCharacter = getTodayCharacter();
  const todayColor = getTodayColor();
  const sameCharacterCities = APP_DATA.cities
    .filter((_, index) => index % 2 === getTodayIndex() % 2)
    .map((city) => ({
      ...city,
      color: todayColor,
      learners: 4 + ((getTodayIndex() + city.x) % 7),
      active: true,
    }));

  const userCity = getCityByCode(state.cityCode);

  const merged = APP_DATA.cities.map((city) => {
    const matched = sameCharacterCities.find((point) => point.code === city.code);
    if (matched) {
      return matched;
    }
    return {
      ...city,
      color: "#8c9198",
      learners: 1 + ((city.y + getTodayIndex()) % 3),
      active: false,
    };
  });

  const userPoint = merged.find((city) => city.code === userCity.code);
  if (userPoint && state.checkinsToday) {
    userPoint.active = true;
    userPoint.color = todayColor;
    userPoint.learners += 3;
  }

  return {
    character: todayCharacter,
    points: merged,
    activeCount: merged.filter((point) => point.active).length,
  };
}

function renderMap() {
  const todayColor = getTodayColor();
  const mapData = getMapPointsData();
  ui.mapSummary.textContent = `${mapData.activeCount} cities lighting up today`;
  ui.todayColor.style.background = todayColor;
  ui.colorCaption.textContent = `Shared by learners studying "${mapData.character.hanzi}" today`;

  ui.mapPoints.innerHTML = mapData.points
    .map(
      (point) => `
        <button
          class="map-point"
          data-city="${point.code}"
          title="${point.name}: ${point.learners} learners"
          style="left:${point.x}%; top:${point.y}%; color:${point.color}; opacity:${point.active ? 1 : 0.45};"
          aria-label="${point.name}, ${point.learners} learners"
        ></button>
      `,
    )
    .join("");

  const activeCities = mapData.points
    .filter((point) => point.active)
    .sort((a, b) => b.learners - a.learners)
    .slice(0, 5);

  ui.cityFeedList.innerHTML = activeCities
    .map((point) => `<li><strong>${point.name}</strong> · ${point.learners} learners · ${point.region}</li>`)
    .join("");

  // TODO: backend integration - 这里未来接入真实地图打点与同城学习者分布 API
  ui.mapPoints.querySelectorAll(".map-point").forEach((pointButton) => {
    pointButton.addEventListener("click", () => {
      const focusedCity = getCityByCode(pointButton.dataset.city);
      ui.heroCity.textContent = focusedCity.name;
      ui.cityRegion.textContent = focusedCity.region;
    });
  });
}

function renderCollection() {
  const unlockedWords = getUnlockedRecipes(APP_DATA.wordRecipes);
  const unlockedSentences = getUnlockedRecipes(APP_DATA.sentenceRecipes);
  const unlockedIdioms = getUnlockedRecipes(APP_DATA.idiomRecipes);
  const totalLit = state.displayUnlockedTotal + unlockedWords.length + unlockedSentences.length + unlockedIdioms.length;
  ui.collectionSummary.textContent = `${totalLit} lights across all layers`;

  ui.characterGrid.innerHTML = APP_DATA.characters
    .map(
      (character) => `
        <div class="light-tile ${state.unlockedCharacterIds.includes(character.id) ? "unlocked" : ""}" title="${character.hanzi} · ${character.meaning}">
          ${character.hanzi}
        </div>
      `,
    )
    .join("");

  renderRecipeGrid(ui.wordGrid, APP_DATA.wordRecipes);
  renderRecipeGrid(ui.sentenceGrid, APP_DATA.sentenceRecipes);
  renderRecipeGrid(ui.idiomGrid, APP_DATA.idiomRecipes);
}

function renderRecipeGrid(container, recipes) {
  container.innerHTML = recipes
    .map((recipe) => {
      const unlocked = isRecipeUnlocked(recipe);
      return `
        <article class="unlock-card ${unlocked ? "unlocked" : ""}">
          <strong>${recipe.text}</strong>
          <span>${recipe.meaning}</span>
        </article>
      `;
    })
    .join("");
}

function renderLeaderboards(city) {
  const cityBoard = [...APP_DATA.leaderboard.cities];
  const globalBoard = [...APP_DATA.leaderboard.global];
  const friendsBoard = [...APP_DATA.leaderboard.friends];

  upsertBoardItem(cityBoard, city.name, state.displayUnlockedTotal);
  upsertBoardItem(globalBoard, state.userName, state.displayUnlockedTotal);
  upsertBoardItem(friendsBoard, `${state.userName} (you)`, state.displayUnlockedTotal);

  ui.cityBoard.innerHTML = cityBoard
    .sort((a, b) => b.lights - a.lights)
    .slice(0, 5)
    .map((item) => `<li><strong>${item.name}</strong> ${item.lights} lights</li>`)
    .join("");

  ui.globalBoard.innerHTML = globalBoard
    .sort((a, b) => b.lights - a.lights)
    .slice(0, 5)
    .map((item) => `<li><strong>${item.name}</strong> ${item.lights} lights</li>`)
    .join("");

  ui.friendsBoard.innerHTML = friendsBoard
    .sort((a, b) => b.lights - a.lights)
    .slice(0, 5)
    .map((item) => `<li><strong>${item.name}</strong> ${item.lights} lights</li>`)
    .join("");
}

function upsertBoardItem(board, name, lights) {
  const existing = board.find((entry) => entry.name === name);
  if (existing) {
    existing.lights = lights;
    return;
  }
  board.push({ name, lights });
}

function renderSentenceStudio() {
  const unlocked = state.displayUnlockedTotal >= 100;
  ui.sentenceLockStatus.textContent = unlocked ? "Unlocked" : `Locked · ${100 - state.displayUnlockedTotal} more`;

  const characters = getUnlockedCharacters();
  ui.builderPool.innerHTML = characters
    .map(
      (character) => `
        <button class="builder-char" data-char="${character.hanzi}" ${unlocked ? "" : "disabled"}>
          ${character.hanzi}
        </button>
      `,
    )
    .join("");

  ui.sentencePreview.textContent = unlocked
    ? state.customSentence || "Tap characters to build a simple Chinese line."
    : "Collect 100 characters to build your own Chinese sentence.";

  // TODO: backend integration - 这里未来接入用户造句云存储与审核能力
  ui.builderPool.querySelectorAll(".builder-char").forEach((button) => {
    button.addEventListener("click", () => {
      if (!unlocked) {
        return;
      }
      state.customSentence += button.dataset.char;
      saveState();
      renderSentenceStudio();
    });
  });
}

function renderDetailsVisibility() {
  const isOpen = state.detailsOpen;
  ui.detailsStage.classList.toggle("is-collapsed", !isOpen);
  buttons.toggleDetails.textContent = isOpen ? "Hide deeper progress" : "Open deeper progress";
}

function renderApp() {
  syncCompletedTodayFromBridge();
  const todayCharacter = getTodayCharacter();
  const city = getCityByCode(state.cityCode);

  updateProfileButtons();
  renderLibraryStatus();
  renderHero(todayCharacter, city);
  renderDailyCard(todayCharacter);
  renderInviteState();
  renderLadder();
  renderMap();
  renderCollection();
  renderLeaderboards(city);
  renderSentenceStudio();
  renderDetailsVisibility();
}

function attachEvents() {
  buttons.startLearning.addEventListener("click", () => {
    startLesson();
  });

  buttons.exitLearning.addEventListener("click", () => {
    resetLessonProgress();
    state.learnedSessionStarted = false;
    saveState();
    renderApp();
  });

  ui.listenButton.addEventListener("click", () => {
    speakCharacter(getTodayCharacter());
  });

  ui.shareCard.addEventListener("click", () => {
    shareToday();
  });

  ui.copyInvite.addEventListener("click", () => {
    copyInviteLink();
  });

  buttons.completeCheckin.addEventListener("click", () => {
    if (state.checkinsToday || !state.trainerCorrect) {
      return;
    }
    ensureTodayCharacterInCollection();
    state.learnedSessionStarted = false;
    state.learnedToday = true;
    state.checkinsToday = true;
    state.checkinDate = getLocalDateKey();
    const previousStudyDate = state.lastStudyDate;
    state.lastStudyDate = getLocalDateKey();

    if (!previousStudyDate) {
      state.streakDays = 1;
    } else if (previousStudyDate === getLocalDateKey()) {
      // 同日重复点击不重复加分。
    } else if (previousStudyDate === addDaysToDateKey(getLocalDateKey(), -1)) {
      state.streakDays += 1;
    } else {
      state.streakDays = 1;
    }

    resetLessonProgress();
    state.detailsOpen = true;
    saveState();
    renderApp();
  });

  buttons.resetProgress.addEventListener("click", () => {
    setProfile("starter");
  });

  buttons.clearSentence.addEventListener("click", () => {
    state.customSentence = "";
    saveState();
    renderSentenceStudio();
  });

  buttons.videoApiNote.addEventListener("click", () => {
    // TODO: backend integration - 这里未来接入书法演示 GIF/视频生成服务
    window.alert(
      `Reserved API on ${SITE_CONFIG.domain}: generate stroke-order GIF / MP4 here for premium calligraphy lessons.`,
    );
  });

  ui.practiceWriting?.addEventListener("click", (event) => {
    const today = getTodayCharacter();
    if (!today?.hasStrokeData) {
      event.preventDefault();
      window.alert(
        `Practice writing for "${today?.hanzi || ""}" is not available yet. Stroke-order data will be added before launch.`,
      );
    }
  });

  buttons.profilePills.forEach((button) => {
    button.addEventListener("click", () => {
      setProfile(button.dataset.profile);
    });
  });

  buttons.toggleDetails.addEventListener("click", () => {
    state.detailsOpen = !state.detailsOpen;
    saveState();
    renderDetailsVisibility();
  });

  document.querySelector(".link-button").addEventListener("click", (event) => {
    event.preventDefault();
    // TODO: backend integration - 这里未来接入课程系统跳转与转化追踪链接
    window.alert(
      `Reserved course entry: future learners on ${SITE_CONFIG.domain} will jump to ${SITE_CONFIG.coursePath}.`,
    );
  });
}

async function bootApp() {
  await loadAppData();
  state = loadState();
  attachEvents();
  markInviteJoined();
  renderApp();
}

bootApp();
