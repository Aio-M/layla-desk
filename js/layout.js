/**
 * 共通のヘッダーを生成し、指定された要素に挿入する関数
 */
function renderHeader() {
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (!headerPlaceholder) return;

    // 現在のページのファイル名を取得 (例: "characters.html")
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // 各リンクの情報を配列で管理
    const navLinks = [
        { href: 'index.html', text: 'ホーム' },
        { href: 'characters.html', text: 'キャラクター' },
        { href: 'weapons.html', text: '武器' }, // ★新しい「武器」リンクを追加
        { href: 'planning.html', text: '育成計画' }
    ];

    // リンクのHTMLを生成
    const linksHtml = navLinks.map(link => `
        <a class="nav-link ${link.href === currentPage ? 'active' : ''}" href="${link.href}">${link.text}</a>
    `).join('');

    // ヘッダー全体のHTML
    const headerHtml = `
        <header class="header">
            <nav class="nav-bar">
                <div class="nav-links">
                     <a class="nav-logo" href="index.html">🌙 Layla Desk</a>
                     ${linksHtml}
                 </div>
             </nav>
        </header>
    `;

    headerPlaceholder.innerHTML = headerHtml;
}
