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
            card.innerHTML = `<img src="${character.image_path}" alt="${character.name}" class="character-image"><div class="character-info"><h3 class="character-name">${character.name}</h3><p class="character-meta">★${character.rarity} / ${character.element}</p></div>`;
            card.addEventListener('click', () => toggleCharacterSelection(character.id, card));
            listElement.appendChild(card);
        });
    } catch (error) {
        console.error('キャラクターデータの読み込みに失敗しました:', error);
        listElement.innerHTML = '<p style="color: #ffcdd2;">データの読み込みに失敗しました。</p>';
    }
}

function toggleCharacterSelection(charId, cardElement) {
    cardElement.classList.toggle('selected');
    if (selectedCharacters.includes(charId)) {
        selectedCharacters = selectedCharacters.filter(id => id !== charId);
    } else {
        selectedCharacters.push(charId);
    }
    saveSelection();
}

function saveSelection() {
    localStorage.setItem('laylaDesk_selectedCharacters', JSON.stringify(selectedCharacters));
}

function loadSelection() {
    const saved = localStorage.getItem('laylaDesk_selectedCharacters');
    if (saved) {
        selectedCharacters = JSON.parse(saved);
    }
}

// ===============================
//  育成計画ページ (planning.html)
// ===============================

async function loadPlanningPage() {
    // 1. 選択されたキャラクターIDと現在の所持素材数を読み込む
    loadSelection();
    loadInventory();

    // 2. 必要なデータを取得
    const allCharacters = await fetch('data/characters.json').then(res => res.json());

    // 3. 画面に表示
    displaySelectedCharacters(allCharacters);
    displayRequiredMaterials();
}

function displaySelectedCharacters(allCharacters) {
    const listElement = document.getElementById('selected-characters-list');
    listElement.innerHTML = '';
    
    selectedCharacters.forEach(charId => {
        const charData = allCharacters.find(c => c.id === charId);
        if(charData) {
            const charDisplay = document.createElement('div');
            charDisplay.className = 'mini-char-card';
            charDisplay.innerHTML = `<img src="${charData.image_path}" alt="${charData.name}"><span>${charData.name}</span>`;
            listElement.appendChild(charDisplay);
        }
    });
}

function displayRequiredMaterials() {
    const listElement = document.getElementById('materials-list');
    listElement.innerHTML = '';

    // --- ここが仮の計算ロジックです ---
    const required = {
        'mora': selectedCharacters.length * 50000, // 1キャラ5万モラ
        'hero_wit': selectedCharacters.length * 10,   // 1キャラ大英雄の経験10冊
    };

    const materialNames = {
        'mora': 'モラ',
        'hero_wit': '大英雄の経験'
    };
    // --- 仮のロジックここまで ---

    for (const materialId in required) {
        const totalNeeded = required[materialId];
        if (totalNeeded === 0) continue; // 必要数が0なら表示しない
        
        const currentAmount = materialInventory[materialId] || 0;

        const item = document.createElement('div');
        item.className = 'material-item';
        item.innerHTML = `
            <span class="material-name">${materialNames[materialId]}</span>
            <span class="material-total">必要数: ${totalNeeded.toLocaleString()}</span>
            <div class="material-counter">
                <button class="counter-btn" data-id="${materialId}" data-amount="-1">-</button>
                <span class="current-count" id="count-${materialId}">${currentAmount.toLocaleString()}</span>
                <button class="counter-btn" data-id="${materialId}" data-amount="1">+</button>
            </div>
        `;
        listElement.appendChild(item);
    }

    // ボタンにイベントリスナーを設定
    listElement.querySelectorAll('.counter-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const amount = parseInt(e.target.dataset.amount, 10);
            updateInventory(id, amount);
        });
    });
}

function updateInventory(materialId, change) {
    if (!materialInventory[materialId]) {
        materialInventory[materialId] = 0;
    }
    materialInventory[materialId] += change;
    if(materialInventory[materialId] < 0) materialInventory[materialId] = 0; // マイナスにはしない

    // 画面の表示を更新
    document.getElementById(`count-${materialId}`).textContent = materialInventory[materialId].toLocaleString();
    
    // 変更を保存
    saveInventory();
}

function saveInventory() {
    localStorage.setItem('laylaDesk_inventory', JSON.stringify(materialInventory));
}

function loadInventory() {
    const saved = localStorage.getItem('laylaDesk_inventory');
    if (saved) {
        materialInventory = JSON.parse(saved);
    }
}
