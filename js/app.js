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
            <img src="${character.image_path}" alt="${character.name}" class="character-image">
            <div class="character-info">
                <h4 class="character-name">${character.name}</h4>
                <div class="level-inputs">
                    <label>現在</label>
                    <input type="number" value="${currentLvl}" onchange="updateCharacterLevel('${character.id}', 'currentLvl', this.value)">
                    <label>目標</label>
                    <input type="number" value="${targetLvl}" onchange="updateCharacterLevel('${character.id}', 'targetLvl', this.value)">
                </div>
            </div>
        `;
        // カード本体のクリックイベント
        card.addEventListener('click', (e) => {
            // input要素をクリックした場合は、選択イベントを発生させない
            if (e.target.tagName.toLowerCase() === 'input') return;
            toggleCharacterSelection(character.id, card);
        });
        listElement.appendChild(card);
    });
}

function sortCharacters(characters, sortBy) {
    // ユーザーのテストデータ「無」「拳」もソート順に追加
    const elementOrder = ["炎", "水", "風", "雷", "草", "氷", "岩", "無"];
    const weaponOrder = ["片手剣", "両手剣", "長柄武器", "弓", "法器", "拳"];
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
    const isSelected = cardElement.classList.toggle('selected');
    const existingIndex = selectedCharacters.findIndex(c => c.id === charId);

    if (isSelected && existingIndex === -1) {
        // 新しく選択された場合
        selectedCharacters.push({ id: charId, currentLvl: 1, targetLvl: 90 });
    } else if (!isSelected && existingIndex > -1) {
        // 選択解除された場合
        selectedCharacters.splice(existingIndex, 1);
    }
    saveSelection();
    renderCharacters(); // レベル入力欄の表示を更新するために再描画
}

function updateCharacterLevel(charId, type, value) {
    const selection = selectedCharacters.find(c => c.id === charId);
    if (selection) {
        selection[type] = parseInt(value, 10);
        saveSelection();
    }
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
    selectedCharacters.forEach(obj => {
        const charData = allCharacters.find(c => c.id === obj.id);
        if(charData) {
            const charDisplay = document.createElement('div');
            charDisplay.className = 'mini-char-card';
            // レベル情報も表示（例）
            charDisplay.innerHTML = `<img src="${charData.image_path}" alt="${charData.name}"><span>${charData.name} Lv${obj.currentLvl}→${obj.targetLvl}</span>`;
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

// ===============================
//  共通機能 (Common Functions)
// ===============================
function handleActiveNavLinks() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        }
    });
}
