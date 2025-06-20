// -- グローバル変数 --
let selectedCharacters = [];
let materialInventory = {};
let allCharacterData = []; // 全キャラクターデータを保持する配列
let currentSortOrder = 'default'; // 現在のソート順

// -- イベントリスナー --
document.addEventListener('DOMContentLoaded', () => {
    // キャラクター選択ページの処理
    if (document.getElementById('character-list')) {
        loadSelection();
        setupSortButtons(); // ソートボタンの準備
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

// ソートボタンのクリックイベントを設定する関数
function setupSortButtons() {
    document.querySelectorAll('.sort-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            currentSortOrder = e.target.dataset.sortBy;
            document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            renderCharacters(); // ソートして再描画
        });
    });
    document.querySelector('.sort-btn[data-sort-by="default"]').classList.add('active');
}

async function loadCharacters() {
    try {
        const response = await fetch('data/characters.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allCharacterData = await response.json();
        renderCharacters(); // データを読み込んだら描画
    } catch (error) {
        console.error('キャラクターデータの読み込みに失敗しました:', error);
        document.getElementById('character-list').innerHTML = '<p style="color: #ffcdd2;">データの読み込みに失敗しました。</p>';
    }
}

function renderCharacters() {
    const listElement = document.getElementById('character-list');
    listElement.innerHTML = '';
    const sortedCharacters = sortCharacters(allCharacterData, currentSortOrder);

    sortedCharacters.forEach(character => {
        const card = document.createElement('div');
        card.className = 'character-card';
        if (selectedCharacters.includes(character.id)) {
            card.classList.add('selected');
        }
        card.title = character.name;
        card.innerHTML = `<img src="${character.image_path}" alt="${character.name}" class="character-image">`;
        card.addEventListener('click', () => toggleCharacterSelection(character.id, card));
        listElement.appendChild(card);
    });
}

function sortCharacters(characters, sortBy) {
    const elementOrder = ["炎", "水", "風", "雷", "草", "氷", "岩"];
    const weaponOrder = ["片手剣", "両手剣", "長柄武器", "弓", "法器"];
    switch (sortBy) {
        case 'element':
            return [...characters].sort((a, b) => elementOrder.indexOf(a.element) - elementOrder.indexOf(b.element));
        case 'weapon':
            return [...characters].sort((a, b) => weaponOrder.indexOf(a.weapon_type) - weaponOrder.indexOf(b.weapon_type));
        default:
            return characters;
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
    loadSelection();
    loadInventory();
    const allCharacters = await fetch('data/characters.json').then(res => res.json());
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
    const required = {
        'mora': selectedCharacters.length * 50000,
        'hero_wit': selectedCharacters.length * 10,
    };
    const materialNames = { 'mora': 'モラ', 'hero_wit': '大英雄の経験' };
    for (const materialId in required) {
        const totalNeeded = required[materialId];
        if (totalNeeded === 0) continue;
        const currentAmount = materialInventory[materialId] || 0;
        const item = document.createElement('div');
        item.className = 'material-item';
        // 以下のinnerHTMLをバッククォート(`)で囲むことが重要です
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
    listElement.querySelectorAll('.counter-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const amount = parseInt(e.target.dataset.amount, 10);
            updateInventory(id, amount);
        });
    });
}

function updateInventory(materialId, change) {
    if (!materialInventory[materialId]) materialInventory[materialId] = 0;
    materialInventory[materialId] += change;
    if(materialInventory[materialId] < 0) materialInventory[materialId] = 0;
    document.getElementById(`count-${materialId}`).textContent = materialInventory[materialId].toLocaleString();
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
