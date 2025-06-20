// -- グローバル変数 --
// 選択されたキャラクター情報を管理する配列（オブジェクト形式に変更）
let selectedCharacters = []; 
let materialInventory = {};
let allCharacterData = [];
let currentSortOrder = 'default';

// -- イベントリスナー --
document.addEventListener('DOMContentLoaded', () => {
    handleActiveNavLinks();
    if (document.getElementById('character-list')) {
        loadSelection();
        setupSortButtons();
        loadCharacters();
    }
    if (document.getElementById('planning-board')) {
        loadPlanningPage();
    }
});

// ===================================
//  キャラクター選択ページ (characters.html)
// ===================================

function setupSortButtons() {
    // ... (この関数は変更なし)
    document.querySelectorAll('.sort-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            currentSortOrder = e.target.dataset.sortBy;
            document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            renderCharacters();
        });
    });
    document.querySelector('.sort-btn[data-sort-by="default"]').classList.add('active');
}

async function loadCharacters() {
    try {
        const response = await fetch('data/characters.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allCharacterData = await response.json();
        renderCharacters();
    } catch (error) {
        console.error('キャラクターデータの読み込みに失敗しました:', error);
        document.getElementById('character-list').innerHTML = '<p style="color: #ffcdd2;">データの読み込みに失敗しました。</p>';
    }
}

// ▼▼▼ renderCharacters関数を大幅に更新 ▼▼▼
function renderCharacters() {
    const listElement = document.getElementById('character-list');
    listElement.innerHTML = '';
    const sortedCharacters = sortCharacters(allCharacterData, currentSortOrder);

    sortedCharacters.forEach(character => {
        const card = document.createElement('div');
        card.className = 'character-card';

        // 選択されているキャラの情報を取得
        const selectionData = selectedCharacters.find(c => c.id === character.id);
        if (selectionData) {
            card.classList.add('selected');
        }

        // 現在と目標レベル（選択されていなければデフォルト値）
        const currentLvl = selectionData ? selectionData.currentLvl : 1;
        const targetLvl = selectionData ? selectionData.targetLvl : 90;

        card.innerHTML = `
            <img src="<span class="math-inline">\{character\.image\_path\}" alt\="</span>{character.name}" class="character-image">
            <div class="character-info">
                <h4 class="character-name"><span class="math-inline">\{character\.name\}</h4\>
