// Cloudflare Workers Script
// 動的OGP対応 - レーティングごとに画像を出し分け

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // OGP画像のマッピング
    const ratingImages = {
      'rainbow': 'https://jaga291.github.io/pachinkas-uranai/images/rainbow.png',
      'gold': 'https://jaga291.github.io/pachinkas-uranai/images/gold.png',
      'silver': 'https://jaga291.github.io/pachinkas-uranai/images/silver.png',
      'red': 'https://jaga291.github.io/pachinkas-uranai/images/red.png',
      'green': 'https://jaga291.github.io/pachinkas-uranai/images/green.png',
      'yellow': 'https://jaga291.github.io/pachinkas-uranai/images/yellow.png',
      'blue': 'https://jaga291.github.io/pachinkas-uranai/images/blue.png',
      'white': 'https://jaga291.github.io/pachinkas-uranai/images/white.png'
    };
    
    // レーティング名のマッピング（日本語）
    const ratingNames = {
      'rainbow': '虹運',
      'gold': '金運',
      'silver': '銀運',
      'red': '赤運',
      'green': '緑運',
      'yellow': '黄運',
      'blue': '青運',
      'white': '白運'
    };
    
    // パラメータからレーティングを取得
    const rating = url.searchParams.get('result');
    
    // GitHub PagesからHTMLを取得
    const githubUrl = 'https://jaga291.github.io/pachinkas-uranai/';
    const response = await fetch(githubUrl);
    let html = await response.text();
    
    // OGPタグを動的に挿入
    if (rating && ratingImages[rating]) {
      const ogpImage = ratingImages[rating];
      const ogpTitle = `今日の運勢は【${ratingNames[rating]}】でした！`;
      const ogpDescription = 'パチンカス占い - あなたの今日の勝負運を占う';
      
      // 既存のOGPタグを削除（あれば）
      html = html.replace(/<meta property="og:.*?".*?>/g, '');
      html = html.replace(/<meta name="twitter:.*?".*?>/g, '');
      
      // 新しいOGPタグを挿入
      const ogpTags = `
    <!-- OGP Tags -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${request.url}">
    <meta property="og:title" content="${ogpTitle}">
    <meta property="og:description" content="${ogpDescription}">
    <meta property="og:image" content="${ogpImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${request.url}">
    <meta name="twitter:title" content="${ogpTitle}">
    <meta name="twitter:description" content="${ogpDescription}">
    <meta name="twitter:image" content="${ogpImage}">`;
      
      // </head>の直前に挿入
      html = html.replace('</head>', `${ogpTags}\n</head>`);
    } else {
      // デフォルトのOGPタグ
      const defaultOgpTags = `
    <!-- OGP Tags -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${request.url}">
    <meta property="og:title" content="パチンカス占い">
    <meta property="og:description" content="あなたの今日の勝負運を占う">
    <meta property="og:image" content="https://jaga291.github.io/pachinkas-uranai/images/TOP.png">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${request.url}">
    <meta name="twitter:title" content="パチンカス占い">
    <meta name="twitter:description" content="あなたの今日の勝負運を占う">
    <meta name="twitter:image" content="https://jaga291.github.io/pachinkas-uranai/images/TOP.png">`;
      
      html = html.replace('</head>', `${defaultOgpTags}\n</head>`);
    }
    
    // レスポンスを返す
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=300', // 5分キャッシュ
      },
    });
  },
};
