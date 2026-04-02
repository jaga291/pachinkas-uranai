// ★★★ ここにGoogle Apps ScriptのデプロイURLを設定してください ★★★
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbx7uUPYzpaznx6MlXNuiQ9BvarR3RUXwAN2VbZrULN0IcXVUOvBsnZGn6Dx0ufZ0O97FQ/exec';

// シード生成関数（同じ日に同じ結果を返す）
function generateSeed(birthday, bloodType) {
    const today = new Date().toDateString();
    const seedString = `${today}-${birthday}-${bloodType}`;
    let hash = 0;
    for (let i = 0; i < seedString.length; i++) {
        const char = seedString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

// シード付き疑似乱数生成器
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }
    
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
    
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
    
    choice(array) {
        return array[this.nextInt(0, array.length - 1)];
    }
    
    // 確率に基づいてレーティングを選択
    weightedRatingChoice() {
        const rand = this.next() * 100; // 0-100の乱数
        
        // 累積確率で判定
        // 虹: 0-2   (2%)
        // 金: 2-7   (5%)
        // 銀: 7-15  (8%)
        // 赤: 15-30 (15%)
        // 緑: 30-46 (16%)
        // 黄: 46-63 (17%)
        // 青: 63-81 (18%)
        // 白: 81-100 (19%)
        
        if (rand < 2) {
            return '虹';
        } else if (rand < 7) {
            return '金';
        } else if (rand < 15) {
            return '銀';
        } else if (rand < 30) {
            return '赤';
        } else if (rand < 46) {
            return '緑';
        } else if (rand < 63) {
            return '黄';
        } else if (rand < 81) {
            return '青';
        } else {
            return '白';
        }
    }
}

// Google Apps Scriptからデータを取得
async function fetchSheetData() {
    try {
        const response = await fetch(GAS_API_URL);
        if (!response.ok) {
            throw new Error('データの取得に失敗しました');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('GAS取得エラー:', error);
        throw error;
    }
}

// レーティングに応じたアイコンと色・画像を取得
function getRatingDisplay(rating) {
    const displays = {
        '虹': { icon: '🌈', class: 'rating-rainbow', img: 'images/rainbow.png' },
        '金': { icon: '🥇', class: 'rating-gold',    img: 'images/gold.png'    },
        '銀': { icon: '🥈', class: 'rating-silver',  img: 'images/silver.png'  },
        '赤': { icon: '🔴', class: 'rating-red',     img: 'images/red.png'     },
        '緑': { icon: '🟢', class: 'rating-green',   img: 'images/green.png'   },
        '黄': { icon: '🟡', class: 'rating-yellow',  img: 'images/yellow.png'  },
        '青': { icon: '🔵', class: 'rating-blue',    img: 'images/blue.png'    },
        '白': { icon: '⚪', class: 'rating-white',   img: 'images/white.png'   },
    };
    return displays[rating] || displays['白'];
}

async function calculateFortune() {
    const year = document.getElementById('birthdayYear').value;
    const month = document.getElementById('birthdayMonth').value;
    const day = document.getElementById('birthdayDay').value;
    const bloodType = document.getElementById('bloodType').value;

    if (!year || !month || !day || !bloodType) {
        alert('誕生日と血液型をすべて入力してください');
        return;
    }

    // パラメータをクリア（新しい占いの場合）
    if (window.location.search) {
        window.history.replaceState({}, '', window.location.pathname);
    }

    // 日付の妥当性チェック
    const birthDate = new Date(year, month - 1, day);
    if (birthDate.getMonth() !== parseInt(month) - 1 || birthDate.getDate() !== parseInt(day)) {
        alert('正しい日付を入力してください');
        return;
    }

    // YYYY-MM-DD形式の誕生日文字列を作成
    const birthday = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // ボタンを無効化してローディング表示
    const btn = document.getElementById('fortuneBtn');
    const loadingMsg = document.getElementById('loadingMessage');
    const errorMsg = document.getElementById('errorMessage');
    
    btn.disabled = true;
    loadingMsg.style.display = 'block';
    errorMsg.style.display = 'none';

    try {
        // Google Apps Scriptからデータ取得
        const sheetData = await fetchSheetData();
        
        if (!sheetData.ratings || sheetData.ratings.length === 0) {
            throw new Error('スプレッドシートのデータが空です');
        }

        // シード生成
        const seed = generateSeed(birthday, bloodType);
        const random = new SeededRandom(seed);

        // ランダム選択（レーティングのみ確率重み付け）
        const rating = random.weightedRatingChoice(); // 確率に基づいて選択
        const message = random.choice(sheetData.messages);
        const item = sheetData.items.length > 0 ? random.choice(sheetData.items) : 'ラッキーアイテム';
        const color = sheetData.colors.length > 0 ? random.choice(sheetData.colors) : 'ラッキーカラー';
        const luckyNumber = random.nextInt(0, 9); // 0～9に変更

        // レーティング表示を取得
        const ratingDisplay = getRatingDisplay(rating);

        // 結果を表示
        document.getElementById('ratingImage').src = ratingDisplay.img;
        document.getElementById('ratingImage').alt = rating;
        
        document.getElementById('fortuneMessage').textContent = message;
        document.getElementById('luckyItem').textContent = item;
        document.getElementById('luckyColor').textContent = color;
        document.getElementById('luckyNumber').textContent = luckyNumber;
        
        // シェア用にグローバル変数へ保存
        window.currentRating = rating;
        
        // レーティングに応じたURLパラメータを生成
        const ratingMap = {
            '虹': 'rainbow',
            '金': 'gold',
            '銀': 'silver',
            '赤': 'red',
            '緑': 'green',
            '黄': 'yellow',
            '青': 'blue',
            '白': 'white'
        };
        
        const ratingParam = ratingMap[rating] || 'white';
        
        // 結果データをsessionStorageに保存（リロード後も使用できるように）
        const resultData = {
            rating: rating,
            ratingIcon: ratingDisplay.icon,
            ratingClass: ratingDisplay.class,
            ratingImage: ratingDisplay.img,
            message: message,
            item: item,
            color: color,
            luckyNumber: luckyNumber,
            date: `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日の運勢`
        };
        sessionStorage.setItem('fortuneResult', JSON.stringify(resultData));
        
        // パラメータ付きURLにリダイレクト（OGPを正しく読み込むため）
        const newUrl = `${window.location.pathname}?result=${ratingParam}`;
        window.location.href = newUrl;
        
    } catch (error) {
        console.error('エラー:', error);
        errorMsg.innerHTML = `データの取得に失敗しました。<br><br>確認事項:<br>1. Google Apps ScriptのURLが正しく設定されているか<br>2. GASが「全員」にアクセス可能な状態でデプロイされているか<br><br>エラー詳細: ${error.message}`;
        errorMsg.style.display = 'block';
    } finally {
        btn.disabled = false;
        loadingMsg.style.display = 'none';
    }
}


// 結果URLをシェア（OGP対応）
async function shareScreenshot() {
    const btn = document.querySelector('.share-btn.screenshot');
    const originalHTML = btn.innerHTML;
    
    try {
        btn.innerHTML = '<span class="share-icon">⏳</span> 準備中...';
        btn.disabled = true;
        
        // 現在のURL（既にパラメータ付き）を使用
        const shareUrl = window.location.href;
        const rating = window.currentRating || '';
        const shareTitle = `今日の運勢は【${rating}運】でした！`;
        const shareText = `今日の運勢は【${rating}運】でした！🌟\nラッキーアイテム: ${document.getElementById('luckyItem').textContent}\nラッキーナンバー: ${document.getElementById('luckyNumber').textContent}`;
        
        // Web Share API対応チェック
        if (navigator.share) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl
                });
                console.log('Share successful');
            } catch (err) {
                if (err.name === 'AbortError') {
                    console.log('Share cancelled by user');
                } else {
                    console.error('Share error:', err);
                    // エラー時はURLをコピー
                    copyToClipboard(shareUrl);
                }
            }
        } else {
            // Web Share API非対応の場合、URLをコピー
            copyToClipboard(shareUrl);
        }
        
    } catch (error) {
        console.error('Share error:', error);
        alert('シェアに失敗しました。😢\n\nもう一度お試しください。');
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
}

// URLをクリップボードにコピー
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            alert('📋 URLをコピーしました！\n\nSNSに貼り付けてシェアしてください。\n\n画像付きで投稿されます✨');
        }).catch(err => {
            console.error('Clipboard error:', err);
            showUrlPrompt(text);
        });
    } else {
        showUrlPrompt(text);
    }
}

// URL表示プロンプト（クリップボード非対応の場合）
function showUrlPrompt(text) {
    prompt('URLをコピーしてください:', text);
}

// ページ読み込み時：結果データがあれば表示
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const resultParam = urlParams.get('result');
    
    // 結果パラメータがあり、sessionStorageに結果データがある場合
    if (resultParam && sessionStorage.getItem('fortuneResult')) {
        const resultData = JSON.parse(sessionStorage.getItem('fortuneResult'));
        
        // 結果を表示
        document.getElementById('ratingImage').src = resultData.ratingImage;
        document.getElementById('ratingImage').alt = resultData.rating;
        document.getElementById('fortuneMessage').textContent = resultData.message;
        document.getElementById('luckyItem').textContent = resultData.item;
        document.getElementById('luckyColor').textContent = resultData.color;
        document.getElementById('luckyNumber').textContent = resultData.luckyNumber;
        document.getElementById('resultDate').textContent = resultData.date;
        
        // グローバル変数に保存
        window.currentRating = resultData.rating;
        
        // 入力画面を非表示、結果画面を表示
        document.getElementById('inputSection').style.display = 'none';
        document.getElementById('resultContainer').classList.add('show');
        
        // sessionStorageをクリア（再読み込み時に再表示されないように）
        sessionStorage.removeItem('fortuneResult');
    } else if (resultParam && !sessionStorage.getItem('fortuneResult')) {
        // パラメータはあるがsessionStorageにデータがない場合（シェアリンクから来た場合）
        // パラメータをクリアして入力画面を表示
        window.history.replaceState({}, '', window.location.pathname);
    }
});
