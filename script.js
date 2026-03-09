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
        
        const today = new Date();
        document.getElementById('resultDate').textContent = 
            `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日の運勢`;

        // アニメーション用に少し遅延してから結果表示
        setTimeout(() => {
            // 画面切り替え（TOP画像含むinputSection全体を非表示）
            document.getElementById('inputSection').style.display = 'none';
            document.getElementById('resultContainer').classList.add('show');
            
            // ページトップにスクロール（instant）
            window.scrollTo(0, 0);
        }, 800); // 0.8秒後に結果表示
        
    } catch (error) {
        console.error('エラー:', error);
        errorMsg.innerHTML = `データの取得に失敗しました。<br><br>確認事項:<br>1. Google Apps ScriptのURLが正しく設定されているか<br>2. GASが「全員」にアクセス可能な状態でデプロイされているか<br><br>エラー詳細: ${error.message}`;
        errorMsg.style.display = 'block';
    } finally {
        btn.disabled = false;
        loadingMsg.style.display = 'none';
    }
}

function shareX() {
    const rating = window.currentRating || '';
    const item = document.getElementById('luckyItem').textContent;
    const number = document.getElementById('luckyNumber').textContent;
    const text = `今日の運勢は【${rating}】でした！🌟\nラッキーアイテム: ${item}\nラッキーナンバー: ${number}\n\n#今日の運勢占い`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

function shareLine() {
    const rating = window.currentRating || '';
    const item = document.getElementById('luckyItem').textContent;
    const number = document.getElementById('luckyNumber').textContent;
    const text = `今日の運勢は【${rating}】でした！🌟\nラッキーアイテム: ${item}\nラッキーナンバー: ${number}`;
    const url = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

// スクリーンショットを撮影してシェア
async function shareScreenshot() {
    try {
        const resultContainer = document.getElementById('resultContainer');
        
        // ボタンテキストを変更
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="share-icon">⏳</span> 画像を生成中...';
        btn.disabled = true;
        
        // html2canvasで画像生成
        const canvas = await html2canvas(resultContainer, {
            backgroundColor: '#1a0800',
            scale: 2, // 高解像度
            logging: false,
            useCORS: true,
            allowTaint: true
        });
        
        // Canvasをblobに変換
        canvas.toBlob(async (blob) => {
            const file = new File([blob], 'uranai-result.png', { type: 'image/png' });
            
            // Web Share API対応チェック（主にスマホ）
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: '今日の運勢',
                        text: `今日の運勢は【${window.currentRating}】でした！🌟`
                    });
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        console.error('Share failed:', err);
                        downloadImage(canvas);
                    }
                }
            } else {
                // PC版: 画像をダウンロード
                downloadImage(canvas);
            }
            
            // ボタンを元に戻す
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 'image/png');
        
    } catch (error) {
        console.error('Screenshot error:', error);
        alert('画像の生成に失敗しました。もう一度お試しください。');
        
        // ボタンを元に戻す
        const btn = event.target;
        btn.innerHTML = '<span class="share-icon">📸</span> 結果を画像でシェア';
        btn.disabled = false;
    }
}

// 画像をダウンロード
function downloadImage(canvas) {
    const link = document.createElement('a');
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    link.download = `uranai-${dateStr}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    alert('画像を保存しました！\nダウンロードフォルダから画像をSNSに投稿してください。');
}
