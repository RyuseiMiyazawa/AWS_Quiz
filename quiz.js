// グローバル変数
let quizData;
let currentStage = 0;
let currentQuestion = 0;
let score = 0;
let totalAnswered = 0;
let selectedOption = null;
let answered = false;
let quizFinished = false;
let stageQuestions = [];

// DOM要素
const stageSelection = document.getElementById('stage-selection');
const quizContainer = document.getElementById('quiz-container');
const stageTitle = document.getElementById('stage-title');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const explanation = document.getElementById('explanation');
const nextBtn = document.getElementById('next-btn');
const prevBtn = document.getElementById('prev-btn');
const currentQuestionSpan = document.getElementById('current-question');
const totalQuestionsSpan = document.getElementById('total-questions');
const scoreSpan = document.getElementById('score');
const totalAnsweredSpan = document.getElementById('total-answered');
const resultsModal = document.getElementById('results-modal');
const finalScoreEl = document.getElementById('final-score');
const resultMessageEl = document.getElementById('result-message');

// 問題データを読み込む
async function loadQuizData() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) {
            throw new Error('問題データの読み込みに失敗しました');
        }
        quizData = await response.json();
        setupStageSelectionUI();
    } catch (error) {
        console.error('問題データの読み込みエラー:', error);
        alert('問題データの読み込みに失敗しました。ページを再読み込みしてください。');
    }
}

// ステージ選択UIをセットアップ
function setupStageSelectionUI() {
    const stageGrid = document.getElementById('stage-grid');
    
    // 既存のステージ要素をすべて削除
    stageGrid.innerHTML = '';

    // JSONデータからステージを動的に追加
    Object.keys(quizData.stages).forEach(stageId => {
        const stage = quizData.stages[stageId];
        
        const card = document.createElement('div');
        card.className = 'stage-card';
        card.id = `stage${stageId}`;
        card.dataset.stageId = stageId;

        const title = document.createElement('h3');
        title.textContent = stage.title;

        const difficulty = document.createElement('div');
        difficulty.className = `difficulty ${stage.difficulty}`;
        for (let i = 0; i < 3; i++) {
            const span = document.createElement('span');
            difficulty.appendChild(span);
        }

        const description = document.createElement('p');
        description.textContent = stage.description;

        const playButton = document.createElement('button');
        playButton.textContent = 'プレイ';
        playButton.id = `stage${stageId}-btn`;
        playButton.addEventListener('click', function() {
            startStage(parseInt(stageId));
        });

        card.appendChild(title);
        card.appendChild(difficulty);
        card.appendChild(description);
        card.appendChild(playButton);

        stageGrid.appendChild(card);
    });
}

// ステージを開始する
function startStage(stageId) {
    currentStage = stageId;
    currentQuestion = 0;
    score = 0;
    totalAnswered = 0;
    quizFinished = false;
    
    // 問題データを取得
    stageQuestions = quizData.stages[stageId].questions;
    
    // タイトル更新
    stageTitle.textContent = `AWS 4択クイズ - ${quizData.stages[stageId].title}`;
    
    // トータル問題数更新
    totalQuestionsSpan.textContent = stageQuestions.length;
    
    // スコア初期化
    scoreSpan.textContent = score;
    totalAnsweredSpan.textContent = totalAnswered;
    
    // 最初の問題を読み込み
    loadQuestion();
    
    // クイズ画面表示
    stageSelection.style.display = 'none';
    quizContainer.style.display = 'block';
}

// 問題を読み込む
function loadQuestion() {
    // 現在の問題番号を更新
    currentQuestionSpan.textContent = currentQuestion + 1;
    
    // UIをリセット
    const options = optionsContainer.querySelectorAll('.option');
    options.forEach(option => {
        option.classList.remove('selected', 'correct', 'incorrect');
    });
    explanation.style.display = 'none';
    selectedOption = null;
    answered = false;
    
    // ボタンの状態を更新
    nextBtn.disabled = true;
    prevBtn.disabled = currentQuestion === 0;
    
    // 次へボタンのテキストをリセット
    nextBtn.textContent = '次の質問';
    
    // 現在の問題を取得
    const currentQuizData = stageQuestions[currentQuestion];
    
    // 問題と選択肢を表示
    questionText.textContent = currentQuizData.question;
    
    // 選択肢を生成
    optionsContainer.innerHTML = '';
    currentQuizData.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.textContent = option;
        optionElement.dataset.index = index;
        
        optionElement.addEventListener('click', function() {
            if (answered) return;
            
            // 以前の選択をクリア
            optionsContainer.querySelectorAll('.option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // 新しい選択を記録
            selectedOption = parseInt(this.dataset.index);
            this.classList.add('selected');
            
            // 次へボタンを有効化
            nextBtn.disabled = false;
        });
        
        optionsContainer.appendChild(optionElement);
    });
    
    // 説明をセット（表示はまだしない）
    explanation.textContent = currentQuizData.explanation;
}

// 回答をチェックする
function checkAnswer() {
    const currentQuizData = stageQuestions[currentQuestion];
    const correctAnswerIndex = currentQuizData.answer;
    
    // 正解/不正解を表示
    const options = optionsContainer.querySelectorAll('.option');
    options.forEach((option, index) => {
        if (index === correctAnswerIndex) {
            option.classList.add('correct');
        } else if (index === selectedOption) {
            option.classList.add('incorrect');
        }
    });
    
    // スコアを更新
    if (selectedOption === correctAnswerIndex) {
        score++;
        scoreSpan.textContent = score;
    }
    
    totalAnswered++;
    totalAnsweredSpan.textContent = totalAnswered;
    
    // 説明を表示
    explanation.style.display = 'block';
    
    // 回答済みフラグを設定
    answered = true;
    
    // 最後の問題かつすべて回答済みの場合、クイズ終了フラグを立てる
    if (currentQuestion === stageQuestions.length - 1) {
        quizFinished = true;
        nextBtn.textContent = '結果を見る';
    } else {
        nextBtn.textContent = '次の質問';
    }
}

// 結果を表示
function showResults() {
    // 結果を計算
    const percentage = Math.round((score / stageQuestions.length) * 100);
    finalScoreEl.textContent = `${score} / ${stageQuestions.length} (${percentage}%)`;
    
    // メッセージを設定
    if (percentage >= 80) {
        resultMessageEl.textContent = 'すばらしい結果です！AWSの知識が豊富ですね。';
    } else if (percentage >= 60) {
        resultMessageEl.textContent = '良い結果です。さらに学習を続けましょう。';
    } else {
        resultMessageEl.textContent = 'もう少し学習が必要かもしれません。もう一度挑戦してみましょう。';
    }
    
    // モーダルを表示
    resultsModal.style.display = 'block';
}

// ステージ選択画面を表示
function showStageSelection() {
    quizContainer.style.display = 'none';
    stageSelection.style.display = 'block';
}

// イベントリスナーのセットアップ
function setupEventListeners() {
    // ステージ選択に戻るボタン
    document.getElementById('back-to-stages').addEventListener('click', showStageSelection);
    
    // 次へボタン
    nextBtn.addEventListener('click', function() {
        if (!answered && selectedOption !== null) {
            // 回答を確認
            checkAnswer();
        } else if (quizFinished) {
            // クイズ終了時、結果を表示
            showResults();
        } else {
            // 次の問題へ
            currentQuestion++;
            loadQuestion();
        }
    });
    
    // 前へボタン
    prevBtn.addEventListener('click', function() {
        currentQuestion--;
        loadQuestion();
    });
    
    // 「もう一度挑戦」ボタン
    document.getElementById('restart-stage').addEventListener('click', function() {
        resultsModal.style.display = 'none';
        startStage(currentStage);
    });
    
    // 「ステージ選択に戻る」ボタン
    document.getElementById('return-to-stages').addEventListener('click', function() {
        resultsModal.style.display = 'none';
        showStageSelection();
    });
    
    // モーダル外クリックで閉じる
    window.addEventListener('click', function(event) {
        if (event.target === resultsModal) {
            resultsModal.style.display = 'none';
        }
    });
}

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadQuizData();
});