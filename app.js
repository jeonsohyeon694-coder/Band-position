/* ============================================================
   [JAVASCRIPT] 핵심 로직, 상태 관리, 밸런스 판별 알고리즘
   ============================================================ */

/* ------------------------------------------------------------
   1. 상태 데이터 (User Answers State)
   ------------------------------------------------------------ */
const userState = {
  band: null,        // '청량청춘', '하드록', '인디낭만', '사랑감성', '반항펑크', '몽환적'
  q1: null,          // 'A' | 'B'
  q2: null,          // 'A' | 'B'
  q3: null,          // 'A' | 'B'
  q4: null           // 'A' | 'B'
};

/* ------------------------------------------------------------
   2. Web Audio API를 활용한 가벼운 햅틱 사운드 (외부 의존성 없음)
   ------------------------------------------------------------ */
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playBeep(freq = 440, type = 'sine', duration = 0.12) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // 무음 환경 폴백
  }
}

/* ------------------------------------------------------------
   3. 네비게이션 & 화면 전환
   ------------------------------------------------------------ */
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function goToHomeScreen() {
  playBeep(350);
  showScreen('home-screen');
}

function goToInputScreen() {
  playBeep(520);
  showScreen('input-screen');
  updateProgress();
}

/* ------------------------------------------------------------
   4. 입력 인터랙션 핸들러
   ------------------------------------------------------------ */
// 밴드 선택
function selectBand(element, bandKey) {
  playBeep(480);
  userState.band = bandKey;

  // 시각적 선택 처리
  const cards = document.querySelectorAll('.band-option-card');
  cards.forEach(card => card.classList.remove('selected'));
  element.classList.add('selected');

  const cardBand = document.getElementById('card-band');
  if (cardBand) {
    cardBand.classList.remove('shake');
    cardBand.classList.add('completed');
  }

  updateProgress();
}

// 밸런스 게임 선택 (step: 1~4, choice: 'A' | 'B')
function selectBalance(step, choice, button) {
  playBeep(choice === 'A' ? 550 : 440);
  userState['q' + step] = choice;

  const parentWrap = button.parentElement;
  parentWrap.querySelectorAll('.balance-option-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
  button.classList.add('selected');

  const quizCard = document.getElementById('card-q' + step);
  if (quizCard) {
    quizCard.classList.remove('shake');
    quizCard.classList.add('completed');
  }

  updateProgress();
}

// 진행도 바 업데이트
function updateProgress() {
  let count = 0;
  if (userState.band) count++;
  if (userState.q1) count++;
  if (userState.q2) count++;
  if (userState.q3) count++;
  if (userState.q4) count++;

  const fill = document.getElementById('progress-fill');
  const text = document.getElementById('progress-text');
  const percent = (count / 5) * 100;
  if (fill) fill.style.width = percent + '%';
  if (text) text.innerText = `${count} / 5 선택`;
}

// 토스트 안내창 띄우기
let toastTimeout = null;
function showToast(msg, icon = '⚠️') {
  const toast = document.getElementById('toast-notice');
  const toastMsg = document.getElementById('toast-message');
  const toastIcon = document.getElementById('toast-icon');
  
  if (!toast || !toastMsg || !toastIcon) return;

  toastMsg.innerText = msg;
  toastIcon.innerText = icon;
  toast.classList.add('show');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

/* ------------------------------------------------------------
   5. 유효성 검사 및 결과 판별 로직
   ------------------------------------------------------------ */
function handleSubmit() {
  // 1. 미입력 항목 유효성 체크
  if (!userState.band) {
    showToast('좋아하는 밴드 분위기를 선택해주세요!', '🎸');
    highlightUnanswered('card-band');
    return;
  }
  if (!userState.q1) {
    showToast('밸런스 1단계(스트레스 해소법)를 선택해주세요!', '🎤');
    highlightUnanswered('card-q1');
    return;
  }
  if (!userState.q2) {
    showToast('밸런스 2단계(음악 취향)를 선택해주세요!', '🌊');
    highlightUnanswered('card-q2');
    return;
  }
  if (!userState.q3) {
    showToast('밸런스 3단계(악기 사운드)를 선택해주세요!', '⚡');
    highlightUnanswered('card-q3');
    return;
  }
  if (!userState.q4) {
    showToast('밸런스 4단계(사람들과 있을 때 모습)를 선택해주세요!', '👑');
    highlightUnanswered('card-q4');
    return;
  }

  // 모든 항목 입력 완료 시 연출 실행
  playBeep(650, 'triangle', 0.2);
  runLoadingAndCalculate();
}

function highlightUnanswered(cardId) {
  playBeep(220, 'sawtooth', 0.15);
  const targetCard = document.getElementById(cardId);
  if (targetCard) {
    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    targetCard.classList.remove('shake');
    void targetCard.offsetWidth; // reflow 트리거
    targetCard.classList.add('shake');
  }
}

/* ------------------------------------------------------------
   6. 포지션 결정 룰 매핑 데이터
   ------------------------------------------------------------
   요구사항:
   AAAA / ABAA / BAAA / BBAA ⇒ 기타
   AAAB / AABB / BAAB       ⇒ 드럼
   AABA / ABBA / BABA       ⇒ 보컬
   ABAB / ABBB / BBAB       ⇒ 베이스
   BABB / BBBA / BBBB       ⇒ 건반
*/
function getRecommendedPosition(combo) {
  const mapping = {
    'AAAA': '기타',
    'ABAA': '기타',
    'BAAA': '기타',
    'BBAA': '기타',
    
    'AAAB': '드럼',
    'AABB': '드럼',
    'BAAB': '드럼',

    'AABA': '보컬',
    'ABBA': '보컬',
    'BABA': '보컬',

    'ABAB': '베이스',
    'ABBB': '베이스',
    'BBAB': '베이스',

    'BABB': '건반',
    'BBBA': '건반',
    'BBBB': '건반'
  };

  return mapping[combo] || '기타';
}

/* ------------------------------------------------------------
   7. 밴드별 수식어 키워드 및 이모티콘 매핑
   ------------------------------------------------------------
   - 데이식스, 루시, 엔플라잉 선택 → ‘청량하게 청춘을 울리는 (포지션)’
   - YB, 실리카겔 선택 → ‘강렬한 락스타 (포지션)’
   - 검정치마, 넬 선택 → ‘낭만적인 인디 (포지션)’
   - 10CM, 잔나비 선택 → ‘사랑가득한 감성적 (포지션)’
   - 노브레인, 크라잉넛 선택 → ‘자유로운 반항적 (포지션)’
   - 쏜애플, 혁오 선택 → ‘몽환적인 분위기의 (포지션)’
*/
const bandKeywords = {
  '청량청춘': {
    prefix: '청량하게 청춘을 울리는',
    startEmoji: '🍀',
    endEmoji: '😎',
    bandName: '데이식스, 루시, 엔플라잉 (청량, 청춘)',
    theme: 'theme-guitar'
  },
  '하드록': {
    prefix: '강렬한 락스타',
    startEmoji: '🔥',
    endEmoji: '⚡',
    bandName: 'YB, 실리카겔 (강렬함, 하드 록)',
    theme: 'theme-drum'
  },
  '인디낭만': {
    prefix: '낭만적인 인디',
    startEmoji: '🍷',
    endEmoji: '📻',
    bandName: '검정치마, 넬 (인디, 낭만)',
    theme: 'theme-vocal'
  },
  '사랑감성': {
    prefix: '사랑가득한 감성적',
    startEmoji: '💖',
    endEmoji: '🌸',
    bandName: '10CM, 잔나비 (사랑, 감성)',
    theme: 'theme-keyboard'
  },
  '반항펑크': {
    prefix: '자유로운 반항적',
    startEmoji: '🎸',
    endEmoji: '🤘',
    bandName: '노브레인, 크라잉넛 (반항, 펑크)',
    theme: 'theme-bass'
  },
  '몽환적': {
    prefix: '몽환적인 분위기의',
    startEmoji: '☪️',
    endEmoji: '😌',
    bandName: '쏜애플, 혁오 (몽환적)',
    theme: 'theme-keyboard'
  }
};

/* ------------------------------------------------------------
   8. 포지션별 기본 메타데이터 (아이콘, 영문명, 태그, 궁합)
   ------------------------------------------------------------
   궁합 요구사항:
   - 기타: 보컬, 건반
   - 보컬: 기타, 건반
   - 베이스: 드럼, 기타
   - 드럼: 베이스, 기타
   - 건반: 보컬, 기타
*/
const positionMeta = {
  '기타': {
    enName: '기타 (Guitarist)',
    emoji: '🎸',
    tags: ['#무대위_히어로', '#화려한_솔로', '#사운드의_꽃'],
    themeClass: 'theme-guitar',
    bgColor: '#FFF5EB',
    glowColor: '#FB8500',
    chemistry: [
      { name: '보컬', emoji: '🎤', desc: '관객의 시선을 사로잡는 최강의 멜로디 파트너!' },
      { name: '건반', emoji: '🎹', desc: '풍성한 코드 화음으로 솔로를 돋보이게 해줘요!' }
    ]
  },
  '드럼': {
    enName: '드럼 (Drummer)',
    emoji: '🥁',
    tags: ['#밴드의_심장', '#파워풀_비트', '#무대_지휘자'],
    themeClass: 'theme-drum',
    bgColor: '#FFEBEB',
    glowColor: '#FF5A5F',
    chemistry: [
      { name: '베이스', emoji: '🎸', desc: '둘이 뭉치면 빈틈없는 완벽한 리듬 세션 완성!' },
      { name: '기타', emoji: '🎸', desc: '폭발적인 드럼 비트 위에 얹어지는 통쾌한 리프!' }
    ]
  },
  '보컬': {
    enName: '보컬 (Vocalist)',
    emoji: '🎤',
    tags: ['#밴드의_얼굴', '#감성_전달자', '#카리스마_프론트'],
    themeClass: 'theme-vocal',
    bgColor: '#F5EEFF',
    glowColor: '#7848F4',
    chemistry: [
      { name: '기타', emoji: '🎸', desc: '목소리와 절묘하게 어우러지는 환상의 멜로디!' },
      { name: '건반', emoji: '🎹', desc: '감미로운 음색을 가장 돋보이게 받쳐주는 건반!' }
    ]
  },
  '베이스': {
    enName: '베이스 (Bassist)',
    emoji: '🎸',
    tags: ['#묵직한_그루브', '#든든한_기둥', '#숨은_심장'],
    themeClass: 'theme-bass',
    bgColor: '#EDF2FF',
    glowColor: '#3A64F8',
    chemistry: [
      { name: '드럼', emoji: '🥁', desc: '심장을 쿵쿵 울리는 환상적인 리듬 호흡!' },
      { name: '기타', emoji: '🎸', desc: '중저음을 든든하게 받쳐 멜로디를 극대화해요!' }
    ]
  },
  '건반': {
    enName: '건반 (Keyboardist)',
    emoji: '🎹',
    tags: ['#감성_장인', '#사운드_마법사', '#화음의_마에스트로'],
    themeClass: 'theme-keyboard',
    bgColor: '#E6FAF5',
    glowColor: '#06D6A0',
    chemistry: [
      { name: '보컬', emoji: '🎤', desc: '목소리에 촉촉한 감수성을 입혀주는 영혼의 단짝!' },
      { name: '기타', emoji: '🎸', desc: '서로 다른 음색으로 곡의 스펙트럼을 넓혀요!' }
    ]
  }
};

/* ------------------------------------------------------------
   9. 30가지 조합 맞춤형 추천 이유 멘트 (밴드 분위기 x 5개 포지션)
   ------------------------------------------------------------ */
const reasonMatrix = {
  '청량청춘': {
    '기타': {
      quote: "당신은 청량하게 청춘을 울리는 기타 포지션이 어울립니다! 시원한 기타 사운드와 적극적인 무대 서비스로 관객들을 사로잡는 모습이 매력적입니다!🌊",
      detail: "스트레스를 날려버리는 시원시원한 드라이브 사운드와 푸른 하늘처럼 맑은 리프로 밴드 전체에 벅차오르는 청춘의 에너지를 불어넣는 주인공입니다!✨"
    },
    '드럼': {
      quote: "당신은 청량하게 청춘을 울리는 드럼 포지션이 어울립니다! 쏟아지는 여름 소나기처럼 경쾌하고 벅찬 비트로 모두의 심장을 뛰게 만듭니다!🥁",
      detail: "신나고 파워풀한 리듬을 든든하게 지탱하며, 무대 위 모든 멤버들이 지치지 않고 마음껏 뛰어놀 수 있도록 만드는 밴드의 든든한 심장입니다!💙"
    },
    '보컬': {
      quote: "당신은 청량하게 청춘을 울리는 보컬 포지션이 어울립니다! 맑고 시원하게 뻗어나가는 청량한 고음으로 지친 사람들에게 청춘의 위로를 선물합니다!🎤",
      detail: "무대 앞에서 사람들의 시선을 한몸에 받으며 푸른 에너지를 발산하는 당신! 청량 밴드의 찬란한 메시지를 가장 생생하게 전달할 적임자입니다!🍀"
    },
    '베이스': {
      quote: "당신은 청량하게 청춘을 울리는 베이스 포지션이 어울립니다! 푸른 파도처럼 넘실거리는 청량한 그루브로 밴드 사운드에 탄탄한 입체감을 더해줍니다!🌊",
      detail: "과하지 않으면서도 곡 전체의 중심을 부드럽게 감싸 안는 당신의 조율 능력 덕분에 밴드의 청량한 에너지가 더욱 안정감 있게 울려 퍼집니다!🎸"
    },
    '건반': {
      quote: "당신은 청량하게 청춘을 울리는 건반 포지션이 어울립니다! 햇살처럼 반짝이는 건반 아르페지오로 청춘의 찬란한 순간을 동화처럼 그려냅니다!🎹",
      detail: "또로롱 울려 퍼지는 영롱한 피아노와 신스 사운드가 곡의 청량감을 극대화하며, 듣는 이의 마음에 설렘과 푸른 여운을 가득 채워줍니다!✨"
    }
  },
  '하드록': {
    '기타': {
      quote: "당신은 강렬한 락스타 기타 포지션이 어울립니다! 불꽃 튀는 파워풀한 디스토션 리프와 폭발적인 솔로로 무대를 완전히 압도하는 카리스마가 넘칩니다!⚡",
      detail: "스트레스를 단숨에 날려버리는 헤비한 사운드와 독보적인 존재감으로 관객들의 혼을 쏙 빼놓는 진정한 록 스피릿의 화신입니다!🔥"
    },
    '드럼': {
      quote: "당신은 강렬한 락스타 드럼 포지션이 어울립니다! 심장을 요동치게 만드는 천둥 같은 더블베이스와 폭풍 타격으로 온 공연장을 뒤흔듭니다!🥁",
      detail: "폭발적인 에너지를 한 점의 망설임 없이 쏟아내며 하드록 사운드의 뼈대를 장악하는 당신이야말로 밴드의 진정한 파워하우스입니다!💥"
    },
    '보컬': {
      quote: "당신은 강렬한 락스타 보컬 포지션이 어울립니다! 온몸을 관통하는 거친 샤우팅과 폭발적인 성량으로 모든 관객을 광란으로 몰아넣는 프론트맨입니다!🔥",
      detail: "시선을 사로잡는 무대 매너와 지치지 않는 록스타 아우라로 관객의 심장을 단숨에 쥐락펴락하는 독보적인 존재감을 뿜어냅니다!🤘"
    },
    '베이스': {
      quote: "당신은 강렬한 락스타 베이스 포지션이 어울립니다! 지축을 흔드는 묵직하고 그로울링 넘치는 로우 사운드로 하드록의 어두운 중량감을 완성합니다!🎸",
      detail: "거친 사운드 속에서도 밴드의 중심이 흔들리지 않도록 단단히 틀어쥐며 헤비한 리프의 심연을 지배하는 든든한 록의 수호신입니다!⚡"
    },
    '건반': {
      quote: "당신은 강렬한 락스타 건반 포지션이 어울립니다! 사이키델릭한 오르간과 웅장한 신시사이저 사운드로 록 음악의 드라마틱한 공간감을 창조합니다!🎹",
      detail: "헤비한 기타와 드럼의 거센 폭풍 속에서도 입체적이고 날카로운 텍스처를 얹어내며 무대를 예술적 경지로 끌어올리는 사운드 연금술사입니다!✨"
    }
  },
  '인디낭만': {
    '기타': {
      quote: "당신은 낭만적인 인디 기타 포지션이 어울립니다! 나직하게 속삭이는 빈티지 클린톤과 아련한 아르페지오로 한 편의 시 같은 여운을 남깁니다!📻",
      detail: "과한 기교 대신 곡의 분위기를 섬세하게 조율하는 당신의 감각은, 늦은 밤 혼자만의 방에서 듣고 싶은 깊은 감수성을 완성합니다!🍷"
    },
    '드럼': {
      quote: "당신은 낭만적인 인디 드럼 포지션이 어울립니다! 귓가에 조용히 스며드는 섬세한 브러시 터치와 절제된 비트로 곡의 서정적인 숨결을 살려냅니다!🥁",
      detail: "화려하게 드러나지 않아도 곡의 무드를 완벽하게 지탱하는 깊이 있는 리듬감으로 듣는 이들의 감정을 부드럽게 토닥여줍니다!🌙"
    },
    '보컬': {
      quote: "당신은 낭만적인 인디 보컬 포지션이 어울립니다! 귓가에 나직하게 읊조리는 몽환적이고 독보적인 음색으로 사람들의 숨은 감성을 두드립니다!🎤",
      detail: "혼자만의 사색과 깊은 생각을 아름다운 멜로디로 빚어내는 당신의 목소리는 인디 음악 특유의 쓸쓸하면서도 따스한 낭만을 극대화합니다!🕯️"
    },
    '베이스': {
      quote: "당신은 낭만적인 인디 베이스 포지션이 어울립니다! 새벽 안개처럼 은은하게 깔리는 웜톤의 핑거링으로 곡 전체에 포근한 안정감을 불어넣습니다!🎸",
      detail: "드러나지 않는 곳에서 멤버들의 사운드를 따뜻하게 챙기고 조율하는 당신의 세심한 면모가 음악 속 깊은 울림으로 드러납니다!☕"
    },
    '건반': {
      quote: "당신은 낭만적인 인디 건반 포지션이 어울립니다! 빗방울이 유리창을 두드리듯 서정적인 피아노 멜로디로 아련하고 짙은 감성을 완성합니다!🎹",
      detail: "차분하게 생각을 정리하는 감성적인 순간마다 당신의 건반 소리가 흐른다면, 평범한 일상도 영화 속 명장면처럼 낭만적으로 바뀝니다!🍷"
    }
  },
  '사랑감성': {
    '기타': {
      quote: "당신은 사랑가득한 감성적 기타 포지션이 어울립니다! 살랑살랑 기분 좋은 어쿠스틱 스트로크와 핑거스타일로 듣는 이의 마음을 설레게 만듭니다!🌸",
      detail: "따스한 햇살처럼 포근하고 다정한 멜로디로 주변 사람들의 기분을 단숨에 무장해제시키는 사랑스러운 매력의 소유자입니다!💖"
    },
    '드럼': {
      quote: "당신은 사랑가득한 감성적 드럼 포지션이 어울립니다! 콩닥콩닥 설레는 심장박동을 닮은 기분 좋은 스윙 리듬으로 달콤한 멜로디를 경쾌하게 이끕니다!🥁",
      detail: "사람들의 마음을 다정하게 감싸는 부드러운 터치와 통통 튀는 그루브로 사랑 노래의 설렘 지수를 두 배로 끌어올리는 재주꾼입니다!🧸"
    },
    '보컬': {
      quote: "당신은 사랑가득한 감성적 보컬 포지션이 어울립니다! 꿀을 바른 듯 달콤하고 귓가에 사르르 녹아내리는 음색으로 듣는 이들을 사로잡는 사랑둥이입니다!🎤",
      detail: "사람들과의 교감을 소중히 여기며 노래 한 소절마다 진심 어린 감정을 듬뿍 담아내는 당신은 언제나 사랑받는 무대의 주인공입니다!💖"
    },
    '베이스': {
      quote: "당신은 사랑가득한 감성적 베이스 포지션이 어울립니다! 둥둥 울리는 말랑말랑한 베이스라인으로 달콤한 사랑 노래의 포근한 요람을 만들어줍니다!🎸",
      detail: "주변을 세심하게 챙기고 배려하는 당신의 다정한 성격처럼, 튀지 않으면서도 음악 전체에 따뜻한 온기를 선물하는 보물 같은 포지션입니다!🌸"
    },
    '건반': {
      quote: "당신은 사랑가득한 감성적 건반 포지션이 어울립니다! 방울방울 피어나는 로맨틱한 건반 멜로디로 듣는 이들의 연애 세포를 깨우는 멜로디 장인입니다!🎹",
      detail: "풍성하고 감미로운 화음으로 사랑의 설렘과 아기자기한 감정을 예쁘게 엮어내는 당신은 밴드에서 가장 로맨틱한 감성술사입니다!✨"
    }
  },
  '반항펑크': {
    '기타': {
      quote: "당신은 자유로운 반항적 기타 포지션이 어울립니다! 거칠 것 없이 긁어내리는 빠른 펑크 스트로크로 세상의 모든 답답함을 단숨에 찢어버립니다!🛹",
      detail: "자유분방한 에너지와 거침없는 무대 액션으로 온 공연장을 점프하게 만드는 당신은 진정한 스트리트 펑크의 야생마입니다!🤘"
    },
    '드럼': {
      quote: "당신은 자유로운 반항적 드럼 포지션이 어울립니다! 쉴 틈 없이 질주하는 쾌속 2비트로 관객들의 심장을 광속으로 달리게 만드는 에너지 폭격기입니다!🥁",
      detail: "복잡한 생각은 모두 던져버리고 직관적인 타격감으로 무대를 뒤집어놓는 당신의 파워풀한 질주 본능은 펑크록의 심장 그 자체입니다!💥"
    },
    '보컬': {
      quote: "당신은 자유로운 반항적 보컬 포지션이 어울립니다! 속이 뻥 뚫리는 사이다 샤우팅과 솔직담백한 악동 에너지로 온 관객을 하나로 묶어냅니다!🎤",
      detail: "눈치 보지 않고 하고 싶은 말을 시원하게 질러대는 카리스마로 무대 위를 자유롭게 뒹구는 최고의 분위기 메이커입니다!🎸"
    },
    '베이스': {
      quote: "당신은 자유로운 반항적 베이스 포지션이 어울립니다! 날카로운 피크로 인정사정없이 긁어내는 앙칼진 베이스라인으로 펑크록의 야성미를 완성합니다!🎸",
      detail: "겉으로는 거칠고 쿨해 보이지만 밴드의 뼈대를 묵묵히 쥐고 달리는 반전 매력으로 무대 뒤 든든한 버팀목이 되어줍니다!⚡"
    },
    '건반': {
      quote: "당신은 자유로운 반항적 건반 포지션이 어울립니다! 통통 튀는 신나는 스카 오프비트 건반으로 모두가 미친 듯이 춤추게 만드는 유쾌한 악동입니다!🎹",
      detail: "펑크와 록의 틀을 깨부수며 예상치 못한 곳에서 신나는 건반 리듬을 꽂아 넣는 당신의 재기발랄함이 무대를 더욱 풍성하게 만듭니다!🛹"
    }
  },
  '몽환적': {
    '기타': {
      quote: "당신은 몽환적인 분위기의 기타 포지션이 어울립니다! 공간을 몽롱하게 채우는 슈게이징 리버브와 신비로운 톤으로 미지의 세계를 탐험하게 만듭니다!☪️",
      detail: "복잡하고 오묘한 내면의 사색을 몽환적인 사운드스케이프로 펼쳐내어 관객들을 깊은 음악적 최면 속으로 이끄는 예술가입니다!🌌"
    },
    '드럼': {
      quote: "당신은 몽환적인 분위기의 드럼 포지션이 어울립니다! 예측 불허의 신비로운 폴리리듬과 변박으로 꿈속을 걷는 듯 아슬아슬한 긴장감을 연출합니다!🥁",
      detail: "조용히 생각을 정리하면서도 내면의 번뜩이는 감각을 비트에 실어 보내는 당신은 몽환 밴드의 독보적인 리듬 조율사입니다!🌙"
    },
    '보컬': {
      quote: "당신은 몽환적인 분위기의 보컬 포지션이 어울립니다! 허공에 번지는 신비로운 음색과 공간감 넘치는 호흡으로 듣는 이를 꿈결 같은 황홀경으로 인도합니다!🎤",
      detail: "말로는 다 전할 수 없는 깊은 내면의 정서를 매혹적인 보이스로 빚어내어 한번 들으면 절대 잊을 수 없는 마성의 매력을 뽐냅니다!☪️"
    },
    '베이스': {
      quote: "당신은 몽환적인 분위기의 베이스 포지션이 어울립니다! 심연의 바다 밑바닥에서 은은히 울려 퍼지는 중저음으로 몽환적인 사운드의 우주를 엽니다!🔮",
      detail: "모두가 몽상에 빠져 부유할 때 보이지 않는 심연에서 중심을 단단히 붙잡아주는 당신은 신비로운 밴드의 진정한 영혼입니다!🌌"
    },
    '건반': {
      quote: "당신은 몽환적인 분위기의 건반 포지션이 어울립니다! 안개 낀 새벽 호수를 걷는 듯한 몽환적인 신스 패드로 신비롭고 아득한 꿈의 세계를 수놓습니다!🎹",
      detail: "깊고 잔잔한 사운드를 좋아하는 당신의 감성과 조용한 내면의 결이 만나 비현실적일 만큼 아름답고 매혹적인 선율을 완성합니다!😌"
    }
  }
};

/* ------------------------------------------------------------
   10. 로딩 연출 및 결과 생성 실행
   ------------------------------------------------------------ */
function runLoadingAndCalculate() {
  showScreen('loading-screen');

  // 로딩 텍스트 인터랙션
  const statusText = document.getElementById('loading-status-text');
  const messages = [
    "악기 튜닝 중... 🎸",
    "음악 DNA 믹싱 중... 🎧",
    "환상의 밴드 케미 분석 중... 🥁",
    "결과 티켓 발행 중... ✨"
  ];
  let step = 0;
  const interval = setInterval(() => {
    step++;
    if (step < messages.length && statusText) {
      statusText.innerText = messages[step];
    }
  }, 350);

  // 1.3초 후 결과 화면으로 전환
  setTimeout(() => {
    clearInterval(interval);
    calculateAndRenderResult();
    showScreen('result-screen');
    playFanfare();
  }, 1400);
}

// 결과 팡파레 효과음
function playFanfare() {
  const notes = [523, 659, 784, 1046];
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      playBeep(freq, 'triangle', 0.25);
    }, idx * 120);
  });
}

/* ------------------------------------------------------------
   11. 결과 렌더링 함수
   ------------------------------------------------------------ */
function calculateAndRenderResult() {
  // 1. 밸런스 4단계 조합 코드 계산 (예: 'AAAA', 'BABA' 등)
  const combo = `${userState.q1}${userState.q2}${userState.q3}${userState.q4}`;
  const position = getRecommendedPosition(combo);

  // 2. 밴드 키워드 정보 가져오기
  const bandInfo = bandKeywords[userState.band] || bandKeywords['청량청춘'];
  const meta = positionMeta[position];

  // 3. 메인 타이틀 조합 (예: 🍀청량하게 청춘을 울리는 기타😎)
  const fullPhrase = `${bandInfo.startEmoji}${bandInfo.prefix} ${position}${bandInfo.endEmoji}`;
  
  const heroTitleEl = document.getElementById('result-hero-title');
  if (heroTitleEl) {
    heroTitleEl.innerHTML = `
      당신에게 어울리는 포지션은
      <span class="title-highlight">${fullPhrase}</span>
    `;
  }

  // 4. 포지션 메인 카드 갱신
  const posArtBox = document.getElementById('position-art-box');
  const posArtEmoji = document.getElementById('position-art-emoji');
  const posRoleName = document.getElementById('position-role-name');
  const posKeywords = document.getElementById('position-keywords');
  const posCardGlow = document.getElementById('position-card-glow');

  if (posArtBox) posArtBox.style.backgroundColor = meta.bgColor;
  if (posArtEmoji) posArtEmoji.innerText = meta.emoji;
  if (posRoleName) posRoleName.innerText = meta.enName;
  if (posCardGlow) posCardGlow.style.backgroundColor = meta.glowColor;

  // 태그 렌더링
  if (posKeywords) {
    posKeywords.innerHTML = meta.tags.map(t => `<span class="position-pill-tag">${t}</span>`).join('');
  }

  // 5. 추천 이유 멘트 갱신
  const reasonObj = reasonMatrix[userState.band][position];
  const reasonQuoteEl = document.getElementById('recommend-reason-text');
  const reasonDetailEl = document.getElementById('recommend-detail-desc');
  if (reasonQuoteEl) reasonQuoteEl.innerText = reasonObj.quote;
  if (reasonDetailEl) reasonDetailEl.innerText = reasonObj.detail;

  // 6. 찰떡궁합 포지션 갱신
  const chemGrid = document.getElementById('chemistry-grid');
  if (chemGrid) {
    chemGrid.innerHTML = meta.chemistry.map(c => `
      <div class="chemistry-card">
        <div class="chemistry-icon">${c.emoji}</div>
        <div class="chemistry-name">${c.name}</div>
        <div class="chemistry-desc">${c.desc}</div>
      </div>
    `).join('');
  }

  // 7. DNA 성향표 갱신
  const traitBand = document.getElementById('trait-band');
  const traitQ1 = document.getElementById('trait-q1');
  const traitQ2 = document.getElementById('trait-q2');
  const traitQ3 = document.getElementById('trait-q3');
  const traitQ4 = document.getElementById('trait-q4');

  if (traitBand) traitBand.innerText = bandInfo.bandName;
  if (traitQ1) traitQ1.innerText = userState.q1 === 'A' ? '에너지 분출형 (코인노래방)' : '내면 사색형 (혼자만의 공간)';
  if (traitQ2) traitQ2.innerText = userState.q2 === 'A' ? '청량 & 시원한 음악' : '편안 & 감성적인 음악';
  if (traitQ3) traitQ3.innerText = userState.q3 === 'A' ? '강렬한 록 사운드' : '깊고 잔잔한 사운드';
  if (traitQ4) traitQ4.innerText = userState.q4 === 'A' ? '분위기 메이커 (스타성)' : '세심한 정리왕 (서포터)';
}

/* ------------------------------------------------------------
   12. 다시하기 및 공유하기 기능
   ------------------------------------------------------------ */
function resetAndRestart() {
  playBeep(440);
  
  // 상태 초기화
  userState.band = null;
  userState.q1 = null;
  userState.q2 = null;
  userState.q3 = null;
  userState.q4 = null;

  // UI 선택 해제
  document.querySelectorAll('.band-option-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.balance-option-btn').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('.quiz-card').forEach(q => {
    q.classList.remove('completed', 'shake');
  });

  updateProgress();
  goToHomeScreen();
}

function copyResultShare() {
  playBeep(600);
  const combo = `${userState.q1}${userState.q2}${userState.q3}${userState.q4}`;
  const position = getRecommendedPosition(combo);
  const bandInfo = bandKeywords[userState.band];
  const fullPhrase = `${bandInfo.startEmoji}${bandInfo.prefix} ${position}${bandInfo.endEmoji}`;
  const quote = reasonMatrix[userState.band][position].quote;

  const shareText = `[내가 밴드 멤버가 된다면?]\n\n나의 추천 밴드 포지션은?\n👉 ${fullPhrase}\n\n"${quote}"\n\n너도 어울리는 밴드 포지션을 찾아봐! 🎸🥁🎤`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(shareText).then(() => {
      showToast('결과가 클립보드에 복사되었어요! 🎉', '📋');
    }).catch(() => {
      fallbackCopyText(shareText);
    });
  } else {
    fallbackCopyText(shareText);
  }
}

function fallbackCopyText(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.top = "0";
  textArea.style.left = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    showToast('결과가 클립보드에 복사되었어요! 🎉', '📋');
  } catch (err) {
    showToast('클립보드 복사에 실패했습니다.', '⚠️');
  }
  document.body.removeChild(textArea);
}
