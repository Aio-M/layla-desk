// -- グローバル変数 --
let selectedCharacters = [];
let materialInventory = {}; // 所持素材数を管理するオブジェクト

// -- イベントリスナー --
document.addEventListener('DOMContentLoaded', () => {
    // キャラクター選択ページの処理
    if (document.getElementById('character-list')) {
        loadSelection();
        loadCharacters();
    }

    // 育成計画ページの処理
    if (document.getElementById('planning-board')) {
        loadPlanningPage();
    }
});


// ===================================
//  キャラクター選択ページ (characters.html)
// ===================================

async function loadCharacters() {
    const listElement = document.getElementById('character-list');
    try {
        const response = await fetch('data/characters.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const characters = await response.json();
        listElement.innerHTML = '';

        characters.forEach(character => {
            const card = document.createElement('div');
            card.className = 'character-card';
            if (selectedCharacters.includes(character.id)) {
                card.classList.add('selected');
            }
            card.innerHTML = `<img src="<span class="math-inline">\{character\.image\_path\}" alt\="</span>{character.name}" class="character-image"><div class="character-info"><h3 class="character-name"><span class="math-inline">\{character\.name\}</h3\><p class\="character\-meta"\>★</span>{character.rarity} / ${character.element}</p></div>`;
            card.addEventListener('click', () => toggleCharacterSelection(character.id, card));
            listElement.appendChild(card);
        });
    } catch (error) {
        console.error('キャラクターデータの読み込みに失敗しました:', error);
        listElement.innerHTML = '<p style="color: #ffcdd2;">データの読み込みに失敗しました。</p>';
    }
}

function toggleCharacterSelection(charId, card
