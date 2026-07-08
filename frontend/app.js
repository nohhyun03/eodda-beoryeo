function getApiBase() {
  if (typeof window === 'undefined' || !window.location) {
    return 'http://127.0.0.1:8000/api';
  }

  const { protocol, hostname } = window.location;

  if (!hostname || protocol === 'file:') {
    return 'http://127.0.0.1:8000/api';
  }

  return `${protocol}//${hostname}:8000/api`;
}

const API_BASE = getApiBase();
const ANALYZE_URL = `${API_BASE}/analyze`;
const HISTORY_URL = `${API_BASE}/history`;
const DEVICE_TOKEN_KEY = 'zgg_device_token';
const ANALYZE_TIMEOUT_MS = 50000;

const quizBank = [
  { q: '영수증은 종이류로 분리수거해야 한다.', a: 'X', explain: '영수증은 감열지(화학약품 처리)로 만들어져 재활용이 불가능하므로 종량제 봉투에 버려야 합니다.' },
  { q: '컵라면 용기는 깨끗이 씻으면 스티로폼으로 버려도 된다.', a: 'X', explain: '깨끗이 씻더라도 국물 얼룩(붉은 자국)이 남아있다면 일반 쓰레기로 버려야 합니다.' },
  { q: '칫솔은 플라스틱으로 분리수거해야 한다.', a: 'X', explain: '칫솔은 칫솔대(플라스틱)와 모(나일론 등)가 섞인 복합재질이므로 종량제 봉투에 버려야 합니다.' },
  { q: '코팅된 종이 전단지는 일반 쓰레기로 버려야 한다.', a: 'O', explain: '비닐 등으로 코팅된 종이는 재활용 과정에서 녹지 않으므로 일반 쓰레기로 배출해야 합니다.' },
  { q: '유리병의 철/플라스틱 뚜껑은 분리해서 버려야 한다.', a: 'O', explain: '재질이 다른 뚜껑은 반드시 병과 분리하여 각각의 재질에 맞게 배출해야 합니다.' },
  { q: '깨진 유리는 유리병 수거함에 넣어야 한다.', a: 'X', explain: '깨진 유리는 재활용이 불가능하며, 수거 작업자가 다칠 수 있으므로 신문지로 싸서 종량제 봉투(또는 특수 마대)에 버려야 합니다.' },
  { q: '치킨 상자 속 기름 묻은 종이는 종이류로 버린다.', a: 'X', explain: '기름이나 음식물로 심하게 오염된 종이는 재활용할 수 없어 일반 쓰레기로 배출합니다.' },
  { q: '사용한 마스크는 플라스틱(부직포)이므로 재활용이 가능하다.', a: 'X', explain: '오염 및 감염의 우려가 있으며, 철사 등 복합재질이 섞여 있어 반드시 종량제 봉투에 버려야 합니다.' },
  { q: '아이스팩의 내용물(고흡수성 수지)은 하수구에 버려도 된다.', a: 'X', explain: '미세 플라스틱의 일종으로 수질 오염의 원인이 되므로, 자르지 말고 통째로 종량제 봉투에 버리거나 전용 수거함에 넣어야 합니다.' },
  { q: '투명 페트병은 라벨을 떼고 찌그러뜨린 뒤 뚜껑을 닫아 버린다.', a: 'O', explain: '내부 공기를 빼서 부피를 줄이고, 뚜껑(PE/PP 재질)을 닫아도 재활용 공정에서 분리 가능합니다.' },
  { q: '택배 상자의 택배 송장과 테이프는 모두 제거 후 버려야 한다.', a: 'O', explain: '종이와 다른 재질이므로 완벽하게 제거한 뒤 종이류만 접어서 배출해야 합니다.' },
  { q: '보온보냉팩(은박 포장재)은 비닐류로 분리수거한다.', a: 'X', explain: '알루미늄과 비닐이 합쳐진 복합재질로 재활용이 어려워 일반 쓰레기로 배출하는 것이 원칙입니다.' },
  { q: '나무젓가락과 이쑤시개는 일반 쓰레기로 버린다.', a: 'O', explain: '나무 재질이라도 음식물이 묻어있고 재활용되는 목재가 아니므로 종량제 봉투에 버려야 합니다.' },
  { q: 'CD나 DVD는 플라스틱으로 분리수거한다.', a: 'O', explain: '폴리카보네이트 재질의 플라스틱이므로 플라스틱류로 배출합니다. (단, 케이스와 분리)' },
  { q: '스프링 노트는 스프링을 제거하지 않고 종이류로 버린다.', a: 'X', explain: '반드시 철 또는 플라스틱 스프링을 분리한 후 종이류로 배출해야 합니다.' },
  { q: '다 마신 알약 포장재(PTP 팩)는 플라스틱이다.', a: 'X', explain: '플라스틱과 알루미늄 호일이 결합된 복합재질이므로 일반 쓰레기로 버려야 합니다.' },
  { q: '사용한 물티슈는 종이류에 버려도 된다.', a: 'X', explain: '물티슈는 종이가 아닌 합성섬유(부직포)이므로 반드시 일반 쓰레기로 버려야 합니다.' },
  { q: '비닐랩(크린랩)은 비닐류로 분리수거한다.', a: 'O', explain: '음식물이 묻지 않은 깨끗한 랩(PVC/PE 재질)은 뭉치지 않게 펴서 비닐류로 배출합니다.' },
  { q: '과일망(스펀지)은 스티로폼 수거함에 버려야 한다.', a: 'X', explain: '사과나 배 등을 싸는 과일망은 스티로폼과 재질이 다르며 보통 일반 쓰레기로 배출합니다.' },
  { q: '크레파스, 색연필은 일반 쓰레기로 버린다.', a: 'O', explain: '왁스 등 혼합 재질이므로 재활용이 불가능하여 종량제 봉투에 버려야 합니다.' },
  { q: '양파망, 마늘망은 비닐류로 분리수거한다.', a: 'O', explain: '합성수지(플라스틱) 재질로 만들어져 있으므로 비닐류로 묶어서 배출할 수 있습니다.' },
  { q: '화장품 유리병 중 불투명한 색상 병은 일반 쓰레기이다.', a: 'X', explain: '화장품 유리병도 내용물을 비우고 깨끗이 씻으면 유리류로 배출 가능합니다. (도자기/사기 재질 제외)' },
  { q: '조개껍데기나 게 껍데기는 음식물 쓰레기이다.', a: 'X', explain: '동물이 먹을 수 없는 단단한 껍데기와 뼈다귀는 모두 일반 쓰레기(종량제 봉투)로 버려야 합니다.' },
  { q: '양파, 마늘, 대파의 뿌리와 껍질은 음식물 쓰레기이다.', a: 'X', explain: '가축의 사료로 쓰기 어려운 채소의 매운 껍질과 뿌리는 일반 쓰레기로 버립니다.' },
  { q: '과일 씨앗(복숭아, 살구 등)은 일반 쓰레기이다.', a: 'O', explain: '크고 단단한 씨앗은 분쇄기 고장의 원인이 되며 동물이 먹을 수 없어 일반 쓰레기입니다.' },
  { q: '사용하고 남은 폐식용유는 싱크대에 부어 버린다.', a: 'X', explain: '수질 오염과 배관 막힘의 원인이 되므로, 전용 폐유 수거함에 버리거나 휴지로 닦아 일반 쓰레기로 버려야 합니다.' },
  { q: '형광등은 깨서 유리 수거함에 넣어야 한다.', a: 'X', explain: '형광등 내부에는 유해물질(수은)이 있으므로 절대 깨지 말고 전용 수거함에 안전하게 넣어야 합니다.' },
  { q: '건전지는 쓰레기통에 그냥 버려도 된다.', a: 'X', explain: '중금속 오염과 화재 위험이 있으므로 반드시 폐건전지 전용 수거함에 분리 배출해야 합니다.' },
  { q: '안 입는 옷이나 가방은 의류수거함에 넣는다.', a: 'O', explain: '솜이불, 캐리어 등을 제외한 일반 의류, 신발, 가방 등은 의류수거함에 배출 가능합니다.' },
  { q: '장난감(로봇, 자동차 등)은 플라스틱으로 분리수거한다.', a: 'X', explain: '모터, 나사 등 여러 재질이 복잡하게 섞여 있어 분해가 불가능하다면 대형폐기물이나 일반 쓰레기로 버려야 합니다.' },
];

const QUIZ_ROUND_SIZE = 5;
const QUIZ_ANSWER_MAP = {
  O: true,
  X: false,
};

const screens = {
  home: document.getElementById('screen-home'),
  loading: document.getElementById('screen-loading'),
  result: document.getElementById('screen-result'),
  history: document.getElementById('screen-history'),
  quiz: document.getElementById('screen-quiz'),
};

const navTabs = Array.from(document.querySelectorAll('.nav-tab'));
const fileInput = document.getElementById('trash-file');
const btnRescan = document.getElementById('btn-rescan');
const btnResultDone = document.getElementById('btn-result-done');
const btnResultFavorite = document.getElementById('btn-result-favorite');
const resultFavoriteIcon = document.getElementById('result-favorite-icon');
const resultItemName = document.getElementById('result-item-name');
const resultCategoryBadge = document.getElementById('result-category-badge');
const resultSteps = document.getElementById('result-steps');
const resultWarningWrap = document.getElementById('result-warning-wrap');
const resultWarning = document.getElementById('result-warning');

const historyLevelEl = document.getElementById('history-mastery-level');
const historyDescEl = document.getElementById('history-mastery-desc');
const historyTotalEl = document.getElementById('history-total-scans');
const historyProgressBar = document.getElementById('history-progress-bar');
const historyProgressText = document.getElementById('history-progress-text');
const historyMasteryCard = document.getElementById('history-mastery-card');
const historyRecordsCard = document.getElementById('history-records-card');
const historyScreen = document.getElementById('screen-history');
const historyList = document.getElementById('history-list');
const historyEmpty = document.getElementById('history-empty');
const historyFilterAll = document.getElementById('history-filter-all');
const historyFilterFavorite = document.getElementById('history-filter-favorite');

const quizProgressEl = document.getElementById('quiz-progress');
const quizScoreEl = document.getElementById('quiz-score');
const quizComboEl = document.getElementById('quiz-combo');
const quizQuestionEl = document.getElementById('quiz-question');
const quizFeedbackEl = document.getElementById('quiz-feedback');
const quizBtnO = document.getElementById('quiz-btn-o');
const quizBtnX = document.getElementById('quiz-btn-x');
const quizBtnNext = document.getElementById('quiz-btn-next');
const quizResultEl = document.getElementById('quiz-result');
const quizResultMessage = document.getElementById('quiz-result-message');
const quizBtnRetry = document.getElementById('quiz-btn-retry');

const toastContainer = document.getElementById('toast-container');

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic', 'heif', 'avif']);

const appState = {
  deviceToken: ensureDeviceToken(),
  currentScreen: 'home',
  currentHistoryId: null,
  currentHistoryFavorite: false,
  historyRecords: [],
  totalScans: 0,
  currentQuizQuestions: [],
  quizIndex: 0,
  quizLocked: false,
  quizScore: 0,
  quizCombo: 0,
  historyFilter: 'all',
};

function ensureDeviceToken() {
  const storedToken = localStorage.getItem(DEVICE_TOKEN_KEY);
  if (storedToken) {
    return storedToken;
  }

  const generatedToken = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  localStorage.setItem(DEVICE_TOKEN_KEY, generatedToken);
  return generatedToken;
}

function showScreen(screenName) {
  Object.values(screens).forEach((screen) => {
    screen.classList.add('hidden');
  });

  const targetScreen = screens[screenName] || screens.home;
  targetScreen.classList.remove('hidden');
  appState.currentScreen = screenName;

  navTabs.forEach((tab) => {
    const isActive = tab.dataset.screen === screenName;
    tab.classList.toggle('bg-slate-900', isActive);
    tab.classList.toggle('text-white', isActive);
    tab.classList.toggle('shadow-lg', isActive);
    tab.classList.toggle('shadow-slate-900/15', isActive);
    tab.classList.toggle('text-slate-500', !isActive);
  });
}

function shuffleArray(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function initQuiz() {
  appState.currentQuizQuestions = shuffleArray(quizBank).slice(0, QUIZ_ROUND_SIZE);
  appState.quizIndex = 0;
  appState.quizLocked = false;
  appState.quizScore = 0;
  appState.quizCombo = 0;
}

function resetResultView() {
  resultItemName.textContent = '-';
  resultCategoryBadge.textContent = '-';
  resultCategoryBadge.className = 'inline-flex items-center rounded-full px-3 py-1 text-sm font-bold';
  resultSteps.innerHTML = '';
  resultWarning.textContent = '';
  resultWarningWrap.classList.add('hidden');
  setResultFavoriteState(false);
}

function setResultFavoriteState(isFavorite) {
  appState.currentHistoryFavorite = Boolean(isFavorite);
  if (!btnResultFavorite || !resultFavoriteIcon) {
    return;
  }

  if (appState.currentHistoryFavorite) {
    resultFavoriteIcon.className = 'fa-solid fa-star text-lg';
    btnResultFavorite.classList.remove('border-amber-200', 'bg-amber-50', 'text-amber-500');
    btnResultFavorite.classList.add('border-amber-400', 'bg-amber-400', 'text-white');
  } else {
    resultFavoriteIcon.className = 'fa-regular fa-star text-lg';
    btnResultFavorite.classList.add('border-amber-200', 'bg-amber-50', 'text-amber-500');
    btnResultFavorite.classList.remove('border-amber-400', 'bg-amber-400', 'text-white');
  }
}

function showToast(message, type = 'error') {
  if (!toastContainer) {
    return;
  }

  const toast = document.createElement('div');
  const isError = type === 'error';
  const styles = isError
    ? 'border-rose-200 bg-rose-50 text-rose-900 shadow-rose-500/10'
    : 'border-emerald-200 bg-emerald-50 text-emerald-900 shadow-emerald-500/10';

  toast.className = `animate-toastIn pointer-events-auto mb-3 flex w-full max-w-md items-start gap-3 rounded-2xl border px-4 py-4 shadow-lg ${styles}`;

  const iconWrap = document.createElement('div');
  iconWrap.className = `mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isError ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`;

  const icon = document.createElement('i');
  icon.className = `fa-solid ${isError ? 'fa-circle-exclamation' : 'fa-circle-check'}`;
  iconWrap.appendChild(icon);

  const content = document.createElement('div');
  content.className = 'min-w-0 flex-1';

  const title = document.createElement('p');
  title.className = 'text-sm font-bold';
  title.textContent = isError ? '오류' : '안내';

  const description = document.createElement('p');
  description.className = 'mt-1 text-sm leading-6';
  description.textContent = message;

  content.append(title, description);

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'ml-2 text-sm font-bold opacity-60 transition hover:opacity-100';
  closeButton.setAttribute('aria-label', '토스트 닫기');
  closeButton.innerHTML = '<i class="fa-solid fa-xmark"></i>';

  const removeToast = () => {
    toast.remove();
  };

  closeButton.addEventListener('click', removeToast);
  toast.append(iconWrap, content, closeButton);
  toastContainer.appendChild(toast);

  window.setTimeout(() => {
    removeToast();
  }, 3200);
}

function getCategoryBadgeClass(category) {
  const normalized = String(category || '').toLowerCase();

  if (normalized.includes('플라스틱') || normalized.includes('plastic')) {
    return 'bg-cyan-100 text-cyan-800 ring-1 ring-cyan-200';
  }

  if (normalized.includes('캔') || normalized.includes('metal') || normalized.includes('철')) {
    return 'bg-slate-200 text-slate-800 ring-1 ring-slate-300';
  }

  if (normalized.includes('유리')) {
    return 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200';
  }

  if (normalized.includes('종이')) {
    return 'bg-amber-100 text-amber-800 ring-1 ring-amber-200';
  }

  if (normalized.includes('일반') || normalized.includes('음식') || normalized.includes('혼합')) {
    return 'bg-rose-100 text-rose-800 ring-1 ring-rose-200';
  }

  return 'bg-violet-100 text-violet-800 ring-1 ring-violet-200';
}

function getFileExtension(fileName) {
  const parts = String(fileName || '').toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
}

function validateSelectedFile(file) {
  if (!file) {
    return '파일을 선택해 주세요.';
  }

  if (!file.type || !file.type.startsWith('image/')) {
    return '이미지 파일만 업로드할 수 있습니다.';
  }

  const extension = getFileExtension(file.name);
  if (extension && !ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
    return '지원하지 않는 이미지 형식입니다. JPG, PNG, GIF, WEBP 파일을 사용해 주세요.';
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return '파일 크기는 5MB 이하만 업로드할 수 있습니다.';
  }

  return null;
}

function renderResult(data) {
  resultItemName.textContent = data.itemName || '-';
  resultCategoryBadge.textContent = data.category || '-';
  resultCategoryBadge.className = `inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${getCategoryBadgeClass(data.category)}`;

  resultSteps.innerHTML = '';
  (data.steps || []).forEach((step, index) => {
    const li = document.createElement('li');
    li.className = 'box-border flex max-w-full gap-3 rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700';

    const stepNumber = document.createElement('div');
    stepNumber.className = 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white';
    stepNumber.textContent = String(index + 1);

    const stepText = document.createElement('p');
    stepText.className = 'min-w-0 flex-1 break-words pt-0.5';
    stepText.textContent = String(step);

    li.append(stepNumber, stepText);
    resultSteps.appendChild(li);
  });

  if (data.warning && String(data.warning).trim()) {
    resultWarning.textContent = data.warning;
    resultWarningWrap.classList.remove('hidden');
  } else {
    resultWarning.textContent = '';
    resultWarningWrap.classList.add('hidden');
  }

  setResultFavoriteState(Boolean(data.isFavorite));
}

async function analyzeSelectedFile(file) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('device_token', appState.deviceToken);

  const abortController = new AbortController();
  const timeoutId = window.setTimeout(() => {
    abortController.abort();
  }, ANALYZE_TIMEOUT_MS);

  try {
    const response = await fetch(ANALYZE_URL, {
      method: 'POST',
      body: formData,
      signal: abortController.signal,
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch (error) {
      throw new Error('서버 응답을 읽는 데 실패했습니다.');
    }

    if (!response.ok) {
      throw new Error(payload?.detail || '분석 중 오류가 발생했습니다.');
    }

    if (!payload || payload.status !== 'success') {
      throw new Error('분석 결과를 가져오지 못했습니다.');
    }

    return payload.data;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('분석 시간이 초과되었습니다.');
    }

    if (error instanceof TypeError) {
      throw new Error('네트워크 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function normalizeHistoryRecord(record) {
  return {
    id: record.id,
    itemName: record.itemName ?? record.item_name ?? '-',
    category: record.category ?? '-',
    steps: record.steps ?? record.guide_steps ?? [],
    warning: record.warning ?? null,
    isFavorite: Boolean(record.isFavorite ?? record.is_favorite ?? false),
    createdAt: record.createdAt ?? record.created_at ?? null,
  };
}

function formatDateTime(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getMasteryState(totalScans) {
  if (totalScans <= 0) {
    return {
      level: '씨앗',
      description: '첫 스캔을 기다리고 있어요. 작은 시작이 큰 학습이 됩니다.',
      progress: 0,
      progressText: '0 / 1',
    };
  }

  if (totalScans <= 5) {
    const progress = Math.min(100, ((totalScans - 1) / 4) * 100);
    return {
      level: '씨앗',
      description: '분리배출을 막 배우기 시작한 단계예요.',
      progress,
      progressText: `${totalScans} / 5`,
    };
  }

  if (totalScans <= 15) {
    const progress = Math.min(100, ((totalScans - 6) / 9) * 100);
    return {
      level: '새싹',
      description: '기본 분리배출 습관이 자라나고 있어요.',
      progress,
      progressText: `${totalScans} / 15`,
    };
  }

  if (totalScans <= 30) {
    const progress = Math.min(100, ((totalScans - 16) / 14) * 100);
    return {
      level: '나무',
      description: '자주 헷갈리는 품목도 제법 익숙해졌어요.',
      progress,
      progressText: `${totalScans} / 30`,
    };
  }

  if (totalScans <= 60) {
    const progress = Math.min(100, ((totalScans - 31) / 29) * 100);
    return {
      level: '숲',
      description: '주변 사람에게도 알려줄 수 있는 수준이에요.',
      progress,
      progressText: `${totalScans} / 60`,
    };
  }

  return {
    level: '지구 지킴이',
    description: '분리배출 마스터 레벨에 도달했어요.',
    progress: 100,
    progressText: `${totalScans}회 이상`,
  };
}

function renderMastery(totalScans) {
  const masteryState = getMasteryState(totalScans);
  historyLevelEl.textContent = masteryState.level;
  historyDescEl.textContent = masteryState.description;
  historyTotalEl.textContent = String(totalScans);
  historyProgressBar.style.width = `${masteryState.progress}%`;
  historyProgressText.textContent = masteryState.progressText;
}

function renderHistoryList(records) {
  historyList.innerHTML = '';

  const filteredRecords = appState.historyFilter === 'favorite'
    ? records.filter((record) => record.isFavorite)
    : records;

  if (!filteredRecords.length) {
    historyEmpty.classList.remove('hidden');
    historyEmpty.textContent = appState.historyFilter === 'favorite'
      ? '즐겨찾기한 기록이 아직 없어요. 별 버튼으로 보관해 보세요.'
      : '아직 기록이 없어요. 홈 탭에서 사진을 찍어 학습 기록을 쌓아보세요.';
    return;
  }

  historyEmpty.classList.add('hidden');

  filteredRecords.forEach((record) => {
    const card = document.createElement('article');
    card.className = `group w-full min-w-0 rounded-[1.5rem] border px-3 py-3 text-left shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] ${record.isFavorite ? 'border-amber-300 bg-amber-50/80' : 'border-slate-100 bg-white'}`;
    card.dataset.recordId = String(record.id);

    const header = document.createElement('div');
    header.className = 'flex min-w-0 items-center gap-3';

    const titleBlock = document.createElement('div');
    const title = document.createElement('p');
    title.className = 'max-w-full truncate text-sm font-extrabold text-slate-900';
    title.textContent = record.itemName;

    const meta = document.createElement('div');
    meta.className = 'mt-1 flex flex-wrap items-center gap-2';

    const categoryBadge = document.createElement('span');
    categoryBadge.className = `inline-flex max-w-full shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${getCategoryBadgeClass(record.category)}`;
    categoryBadge.textContent = record.category;

    const timeText = document.createElement('span');
    timeText.className = 'max-w-full text-[11px] text-slate-400';
    timeText.textContent = formatDateTime(record.createdAt);

    meta.append(categoryBadge, timeText);
    titleBlock.append(title, meta);

    titleBlock.className = 'min-w-0 flex-1';

    const actionRow = document.createElement('div');
    actionRow.className = 'ml-auto flex shrink-0 flex-nowrap items-center gap-2';

    const starButton = document.createElement('button');
    starButton.type = 'button';
    starButton.className = `flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${record.isFavorite ? 'bg-amber-400 text-white shadow-lg shadow-amber-200/40' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`;
    starButton.dataset.action = 'toggle-favorite';
    starButton.dataset.historyId = String(record.id);
    starButton.dataset.favorite = record.isFavorite ? '1' : '0';
    starButton.setAttribute('aria-label', `${record.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'} ${record.itemName}`);
    starButton.innerHTML = record.isFavorite ? '<i class="fa-solid fa-star text-sm"></i>' : '<i class="fa-regular fa-star text-sm"></i>';

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100';
    deleteButton.dataset.action = 'delete-history';
    deleteButton.dataset.historyId = String(record.id);
    deleteButton.setAttribute('aria-label', `${record.itemName} 기록 삭제`);
    deleteButton.innerHTML = '<i class="fa-solid fa-trash-can text-xs"></i>';

    actionRow.append(starButton, deleteButton);

    header.append(titleBlock, actionRow);

    const detail = document.createElement('div');
    detail.className = 'box-border mt-2 hidden max-h-72 max-w-full overflow-y-auto rounded-[1.2rem] bg-slate-50 px-3 py-3';

    const stepsTitle = document.createElement('p');
    stepsTitle.className = 'break-words text-xs font-bold text-slate-900';
    stepsTitle.textContent = '배출 방법';

    const stepsList = document.createElement('ol');
    stepsList.className = 'mt-2 space-y-2';

    (record.steps || []).forEach((step, index) => {
      const stepItem = document.createElement('li');
      stepItem.className = 'box-border flex max-w-full gap-2 rounded-2xl bg-white px-3 py-2 text-sm leading-5 text-slate-700 shadow-sm';

      const stepNumber = document.createElement('div');
      stepNumber.className = 'flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white';
      stepNumber.textContent = String(index + 1);

      const stepText = document.createElement('p');
      stepText.className = 'min-w-0 flex-1 break-words';
      stepText.textContent = String(step);

      stepItem.append(stepNumber, stepText);
      stepsList.appendChild(stepItem);
    });

    detail.append(stepsTitle, stepsList);

    if (record.warning) {
      const warningBox = document.createElement('div');
      warningBox.className = 'mt-2 box-border max-w-full break-words rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900 shadow-sm';
      warningBox.textContent = `주의: ${record.warning}`;
      detail.appendChild(warningBox);
    }

    card.append(header, detail);
    card.addEventListener('click', (event) => {
      if (event.target.closest('[data-action="toggle-favorite"]')) {
        return;
      }

      if (event.target.closest('[data-action="delete-history"]')) {
        return;
      }
      detail.classList.toggle('hidden');
    });

    historyList.appendChild(card);
  });
}

function setHistoryAccordionState(mode) {
  if (!historyScreen) {
    return;
  }

  historyScreen.classList.toggle('screen-history-records-hover', mode === 'records');
  historyScreen.classList.toggle('screen-history-mastery-hover', mode === 'mastery');
}

function updateHistoryFilterUI() {
  const isAll = appState.historyFilter === 'all';
  historyFilterAll.className = isAll
    ? 'rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-900 shadow-sm'
    : 'rounded-xl px-3 py-2 text-sm font-bold text-slate-500';
  historyFilterFavorite.className = !isAll
    ? 'rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-900 shadow-sm'
    : 'rounded-xl px-3 py-2 text-sm font-bold text-slate-500';
}

function applyFavoriteStateToRecord(recordId, nextFavoriteState) {
  appState.historyRecords = appState.historyRecords.map((record) => {
    if (record.id === recordId) {
      return { ...record, isFavorite: nextFavoriteState };
    }
    return record;
  });

  if (appState.currentHistoryId === recordId) {
    setResultFavoriteState(nextFavoriteState);
  }
}

function removeHistoryRecordFromState(recordId) {
  appState.historyRecords = appState.historyRecords.filter((record) => record.id !== recordId);

  if (appState.currentHistoryId === recordId) {
    appState.currentHistoryId = null;
    resetResultView();
  }
}

async function deleteHistoryRecord(historyId) {
  try {
    const response = await fetch(`${HISTORY_URL}/${historyId}`, {
      method: 'DELETE',
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.detail || '기록 삭제에 실패했습니다.');
    }

    if (!payload || payload.status !== 'success') {
      throw new Error('기록 삭제에 실패했습니다.');
    }

    removeHistoryRecordFromState(historyId);
    showToast('기록을 삭제했어요.', 'success');

    await loadHistory();
  } catch (error) {
    showToast(error instanceof Error ? error.message : '기록 삭제 중 오류가 발생했습니다.', 'error');
  }
}

async function loadHistory() {
  try {
    const response = await fetch(`${HISTORY_URL}?device_token=${encodeURIComponent(appState.deviceToken)}`);
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.detail || '기록을 불러오지 못했습니다.');
    }

    if (!payload || payload.status !== 'success') {
      throw new Error('기록을 불러오지 못했습니다.');
    }

    const data = payload.data || {};
    appState.totalScans = data.total_scans ?? data.totalScans ?? 0;
    appState.historyRecords = (data.records || []).map(normalizeHistoryRecord);

    renderMastery(appState.totalScans);
    renderHistoryList(appState.historyRecords);
    updateHistoryFilterUI();
  } catch (error) {
    showToast(error instanceof Error ? error.message : '기록을 불러오는 중 오류가 발생했습니다.', 'error');
    renderMastery(0);
    renderHistoryList([]);
    updateHistoryFilterUI();
  }
}

function renderQuiz() {
  if (!appState.currentQuizQuestions.length) {
    initQuiz();
  }

  if (appState.quizIndex >= appState.currentQuizQuestions.length) {
    quizProgressEl.textContent = `완료 ${appState.currentQuizQuestions.length}/${appState.currentQuizQuestions.length}`;
    quizScoreEl.textContent = `점수 ${appState.quizScore}점`;
    quizComboEl.textContent = `콤보 ${appState.quizCombo}`;
    quizQuestionEl.textContent = '퀴즈를 모두 완료했습니다!';
    quizQuestionEl.className = 'mt-5 break-words text-2xl font-extrabold leading-tight text-slate-900';
    quizFeedbackEl.classList.add('hidden');
    quizBtnO.classList.add('hidden');
    quizBtnX.classList.add('hidden');
    quizBtnNext.classList.add('hidden');
    quizResultEl.classList.remove('hidden');
    quizResultMessage.textContent = `수고하셨습니다! 당신의 점수는 ${appState.quizScore}점입니다.`;
    return;
  }

  const currentQuiz = appState.currentQuizQuestions[appState.quizIndex];
  quizProgressEl.textContent = `문제 ${appState.quizIndex + 1}/${appState.currentQuizQuestions.length}`;
  quizScoreEl.textContent = `점수 ${appState.quizScore}점`;
  quizComboEl.textContent = `콤보 ${appState.quizCombo}`;
  quizQuestionEl.textContent = currentQuiz.q;
  quizQuestionEl.className = 'mt-5 break-words text-2xl font-extrabold leading-tight text-slate-900';
  quizFeedbackEl.classList.add('hidden');
  quizFeedbackEl.textContent = '';
  quizFeedbackEl.className = 'mt-5 hidden box-border max-w-full rounded-2xl border px-4 py-4 text-sm leading-6 break-words';
  quizBtnNext.classList.add('hidden');
  quizBtnO.classList.remove('hidden');
  quizBtnX.classList.remove('hidden');
  quizBtnO.disabled = false;
  quizBtnX.disabled = false;
  quizResultEl.classList.add('hidden');
  appState.quizLocked = false;
}

function showQuizFeedback(isCorrect, explanation) {
  quizFeedbackEl.classList.remove('hidden');
  quizFeedbackEl.className = `mt-5 box-border max-w-full rounded-2xl border px-4 py-4 text-sm leading-6 break-words ${isCorrect ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-900'}`;
  quizFeedbackEl.textContent = `${isCorrect ? '정답!' : '아쉬워요.'} ${explanation}`;
  quizBtnNext.classList.remove('hidden');
}

function answerQuiz(selectedAnswer) {
  if (appState.quizLocked) {
    return;
  }

  const currentQuiz = appState.currentQuizQuestions[appState.quizIndex];
  const expectedAnswer = QUIZ_ANSWER_MAP[currentQuiz.a];
  const isCorrect = selectedAnswer === expectedAnswer;
  appState.quizLocked = true;
  quizBtnO.disabled = true;
  quizBtnX.disabled = true;

  if (isCorrect) {
    appState.quizScore += 10;
    appState.quizCombo += 1;
  } else {
    appState.quizCombo = 0;
  }

  quizScoreEl.textContent = `점수 ${appState.quizScore}점`;
  quizComboEl.textContent = `콤보 ${appState.quizCombo}`;

  showToast(isCorrect ? '정답입니다!' : '틀렸어요. 다시 기억해 보세요.', isCorrect ? 'success' : 'error');
  showQuizFeedback(isCorrect, currentQuiz.explain);
}

function nextQuiz() {
  appState.quizIndex += 1;
  renderQuiz();
}

function restartQuiz() {
  initQuiz();
  quizBtnO.classList.remove('hidden');
  quizBtnX.classList.remove('hidden');
  renderQuiz();
}

async function toggleResultFavorite() {
  if (!appState.currentHistoryId) {
    showToast('분석을 먼저 완료한 뒤 즐겨찾기를 설정할 수 있어요.', 'error');
    return;
  }

  try {
    const response = await fetch(`${HISTORY_URL}/${appState.currentHistoryId}/favorite`, {
      method: 'PATCH',
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.detail || '즐겨찾기 변경에 실패했습니다.');
    }

    if (!payload || payload.status !== 'success') {
      throw new Error('즐겨찾기 변경에 실패했습니다.');
    }

    const nextFavoriteState = Boolean(payload.data?.isFavorite);
    setResultFavoriteState(nextFavoriteState);
    applyFavoriteStateToRecord(appState.currentHistoryId, nextFavoriteState);

    if (appState.currentScreen === 'history') {
      renderHistoryList(appState.historyRecords);
      updateHistoryFilterUI();
    }

    showToast(nextFavoriteState ? '즐겨찾기에 추가했어요.' : '즐겨찾기에서 해제했어요.', 'success');

    if (appState.currentScreen === 'history') {
      await loadHistory();
    }
  } catch (error) {
    showToast(error instanceof Error ? error.message : '즐겨찾기 처리 중 오류가 발생했습니다.', 'error');
  }
}

async function toggleHistoryFavorite(historyId) {
  try {
    const response = await fetch(`${HISTORY_URL}/${historyId}/favorite`, {
      method: 'PATCH',
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.detail || '즐겨찾기 변경에 실패했습니다.');
    }

    if (!payload || payload.status !== 'success') {
      throw new Error('즐겨찾기 변경에 실패했습니다.');
    }

    const nextFavoriteState = Boolean(payload.data?.isFavorite);
    applyFavoriteStateToRecord(historyId, nextFavoriteState);

    if (appState.currentScreen === 'history') {
      renderHistoryList(appState.historyRecords);
      updateHistoryFilterUI();
    }

    showToast(nextFavoriteState ? '즐겨찾기에 추가했어요.' : '즐겨찾기에서 해제했어요.', 'success');
  } catch (error) {
    showToast(error instanceof Error ? error.message : '즐겨찾기 처리 중 오류가 발생했습니다.', 'error');
  }
}

function updateResultWithAnalysis(data) {
  appState.currentHistoryId = data.history_id ?? null;
  setResultFavoriteState(Boolean(data.isFavorite));
  renderResult(data);
}

navTabs.forEach((tab) => {
  tab.addEventListener('click', async () => {
    const targetScreen = tab.dataset.screen;

    if (targetScreen === 'history') {
      showScreen('history');
      await loadHistory();
      return;
    }

    if (targetScreen === 'quiz') {
      initQuiz();
      renderQuiz();
      showScreen('quiz');
      return;
    }

    showScreen('home');
  });
});

fileInput.addEventListener('change', async (event) => {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  const validationError = validateSelectedFile(file);
  if (validationError) {
    showToast(validationError, 'error');
    fileInput.value = '';
    showScreen('home');
    return;
  }

  showScreen('loading');

  try {
    const data = await analyzeSelectedFile(file);
    updateResultWithAnalysis(data);
    showScreen('result');
  } catch (error) {
    showToast(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.', 'error');
    resetResultView();
    showScreen('home');
  } finally {
    fileInput.value = '';
  }
});

btnRescan.addEventListener('click', () => {
  resetResultView();
  appState.currentHistoryId = null;
  fileInput.value = '';
  showScreen('home');
});

btnResultDone.addEventListener('click', () => {
  resetResultView();
  appState.currentHistoryId = null;
  fileInput.value = '';
  showScreen('home');
});

btnResultFavorite.addEventListener('click', toggleResultFavorite);
quizBtnO.addEventListener('click', () => answerQuiz(true));
quizBtnX.addEventListener('click', () => answerQuiz(false));
quizBtnNext.addEventListener('click', nextQuiz);
historyList.addEventListener('click', (event) => {
  const favoriteButton = event.target.closest('[data-action="toggle-favorite"]');
  const deleteButton = event.target.closest('[data-action="delete-history"]');

  if (!favoriteButton && !deleteButton) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  if (deleteButton) {
    const historyId = Number(deleteButton.dataset.historyId);
    if (!Number.isNaN(historyId) && window.confirm('이 기록을 삭제할까요?')) {
      deleteHistoryRecord(historyId);
    }
    return;
  }

  const historyId = Number(favoriteButton.dataset.historyId);
  if (!Number.isNaN(historyId)) {
    toggleHistoryFavorite(historyId);
  }
});

resetResultView();
initQuiz();
renderQuiz();
showScreen('home');

historyFilterAll.addEventListener('click', () => {
  appState.historyFilter = 'all';
  updateHistoryFilterUI();
  renderHistoryList(appState.historyRecords);
});

historyFilterFavorite.addEventListener('click', () => {
  appState.historyFilter = 'favorite';
  updateHistoryFilterUI();
  renderHistoryList(appState.historyRecords);
});

if (historyRecordsCard) {
  historyRecordsCard.addEventListener('mouseenter', () => {
    setHistoryAccordionState('records');
  });

  historyRecordsCard.addEventListener('mouseleave', () => {
    if (!historyMasteryCard || !historyMasteryCard.matches(':hover')) {
      setHistoryAccordionState(null);
    }
  });
}

if (historyMasteryCard) {
  historyMasteryCard.addEventListener('mouseenter', () => {
    setHistoryAccordionState('mastery');
  });

  historyMasteryCard.addEventListener('mouseleave', () => {
    if (!historyRecordsCard || !historyRecordsCard.matches(':hover')) {
      setHistoryAccordionState(null);
    }
  });
}

if (historyScreen) {
  historyScreen.addEventListener('mouseleave', () => {
    setHistoryAccordionState(null);
  });
}

quizBtnRetry.addEventListener('click', restartQuiz);