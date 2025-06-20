// -- グローバル変数 --
let selectedCharacters = []; 
let materialInventory = {};
let allCharacterData = [];
let allAscensionCosts = {};
let currentSortOrder = 'default';
let currentlyEditingCharId = null;
let debounceTimer;

// -- イベントリスナー --
document.addEventListener('DOMContentLoaded', () => {
    handleActiveNavLinks();
    if (document.getElementById('character-list')) {
        loadCharacters().then(() => {
            loadSelection();
            renderCharacters();
        });
        setupSortButtons();
        setupModalEventListeners();
    }
    if (document.getElementById('planning-board')) {
        loadPlanningPage();
    }
});


// ===================================
//  キャラクター選択ページ (characters.html)
// ===================================

function setupModalEventListeners() {
    const overlay = document.getElementById('level-modal-overlay');
    const saveBtn = document.getElementById('modal-save-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const removeBtn = document.getElementById('modal-remove-btn');

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeLevelModal();
    });
    
    saveBtn.addEventListener('click', saveLevelData);
    cancelBtn.addEventListener('click', closeLevelModal);
    removeBtn.addEventListener('click', removeCharacterFromPlan);
}

function openLevelModal(charId) {
    currentlyEditingCharId = charId;
    const charData = allCharacterData.find(c => c.id === charId);
    const selectionData = selectedCharacters.find(c => c.id === charId);

    document.getElementById('modal-char-name').textContent = charData.name;
    document.getElementById('current-lvl-input').value = selectionData ? selectionData.currentLvl : 1;
    document.getElementById('target-lvl-input').value = selectionData ? selectionData.targetLvl : 90;

    document.getElementById('modal-remove-btn').style.display = selectionData ? 'block' : 'none';
    document.getElementById('level-modal-overlay').style.display = 'flex';
}

function closeLevelModal() {
    document.getElementById('level-modal-overlay').style.display = 'none';
    currentlyEditingCharId = null;
}

function saveLevelData() {
    if (!currentlyEditingCharId) return;
    const currentLvl = parseInt(document.getElementById('current-lvl-input').value, 10);
    const targetLvl = parseInt(document.getElementById('target-lvl-input').value, 10);
    const existingIndex = selectedCharacters.findIndex(c => c.id === currentlyEditingCharId);

    if (existingIndex > -1) {
        selectedCharacters[existingIndex].currentLvl = currentLvl;
        selectedCharacters[existingIndex].targetLvl = targetLvl;
    } else {
        selectedCharacters.push({ id: currentlyEditingCharId, currentLvl: currentLvl, targetLvl: targetLvl });
    }
    
    saveSelection();
    renderCharacters();
    closeLevelModal();
}

function removeCharacterFromPlan() {
    if (!currentlyEditingCharId) return;
    if (window.confirm("このキャラクターを計画から削除しますか？")) {
        const existingIndex = selectedCharacters.findIndex(c => c.id === currentlyEditingCharId);
        if (existingIndex > -1) {
            selectedCharacters.splice(existingIndex, 1);
        }
        saveSelection();
        renderCharacters();
        closeLevelModal();
    }
}

function renderCharacters() {
    const listElement = document.getElementById('character-list');
    listElement.innerHTML = '';
    const sortedCharacters = sortCharacters(allCharacterData, currentSortOrder);
    sortedCharacters.forEach(character => {
        const card = document.createElement('div');
        card.className = 'character-card';
        if (selectedCharacters.find(c => c.id === character.id)) {
            card.classList.add('selected');
        }
        card.title = character.name;
        card.innerHTML = `<img src="${character.image_path}" alt="${character.name}" class="character-image"><h4 class="character-name">${character.name}</h4>`;
        card.addEventListener('click', () => openLevelModal(character.id));
        listElement.appendChild(card);
    });
}
    
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
    } catch (error) {
        console.error('キャラクターデータの読み込みに失敗しました:', error);
        document.getElementById('character-list').innerHTML = '<p style="color: #ffcdd2;">データの読み込みに失敗しました。</p>';
    }
}

function sortCharacters(characters, sortBy) {
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
    const planningBoard = document.getElementById('planning-board');
    if (selectedCharacters.length === 0) {
        planningBoard.innerHTML = '<p style="text-align:center;">計画にキャラクターが追加されていません。<br>「キャラクター」ページから育成したいキャラクターを選択してください。</p>';
        return;
    }
    planningBoard.innerHTML = `
        <h2 class="page-title">育成計画</h2>
        <div class="section">
            <h3>育成対象キャラクター</h3>
            <div id="selected-characters-list"></div>
        </div>
        <div class="section">
            <h3>必要素材一覧</h3>
            <div id="materials-list"></div>
        </div>
        <a href="characters.html" class="back-button">キャラクター選択に戻る</a>
    `;

    const [charRes, ascRes] = await Promise.all([
        fetch('data/characters.json'),
        fetch('data/ascension.json')
    ]);
    allCharacterData = await charRes.json();
    allAscensionCosts = await ascRes.json();

    displaySelectedCharacters();
    displayRequiredMaterials();
}

function displaySelectedCharacters() {
    const listElement = document.getElementById('selected-characters-list');
    listElement.innerHTML = '';
    selectedCharacters.forEach(obj => {
        const charData = allCharacterData.find(c => c.id === obj.id);
        if(charData) {
            const item = document.createElement('div');
            item.className = 'plan-char-item';
            // ▼▼▼ この中のボタンに data-type="char-level" を追加 ▼▼▼
            item.innerHTML = `
                <img src="${charData.image_path}" alt="${charData.name}">
                <div class="plan-char-details">
                    <div class="plan-char-info">
                        <span class="plan-char-name">${charData.name}</span>
                        <span class="plan-char-level-display">
                            Lv <span id="current-lvl-display-${charData.id}">${obj.currentLvl}</span> / ${obj.targetLvl}
                        </span>
                    </div>
                    <div class="value-adjuster">
                        <button class="btn-step" data-id="${charData.id}" data-type="char-level" data-amount="-10">--</button>
                        <button class="btn-step" data-id="${charData.id}" data-type="char-level" data-amount="-1">-</button>
                        <input type="range" class="value-slider" id="slider-char-level-${charData.id}"
                               min="1" max="${obj.targetLvl}" value="${obj.currentLvl}" data-id="${charData.id}" data-type="char-level">
                        <button class="btn-step" data-id="${charData.id}" data-type="char-level" data-amount="1">+</button>
                        <button class="btn-step" data-id="${charData.id}" data-type="char-level" data-amount="10">++</button>
                    </div>
                </div>`;
            listElement.appendChild(item);
        }
    });

    listElement.querySelectorAll('.btn-step[data-type="char-level"]').forEach(button => {
        button.addEventListener('click', (e) => {
            updateCharacterLevelOnPlan(e.target.dataset.id, parseInt(e.target.dataset.amount, 10));
        });
    });
    listElement.querySelectorAll('.value-slider[data-type="char-level"]').forEach(slider => {
        slider.addEventListener('input', (e) => {
            updateCharacterLevelOnPlan(e.target.dataset.id, parseInt(e.target.value, 10), true);
        });
    });
}

function displayRequiredMaterials() {
    const listElement = document.getElementById('materials-list');
    listElement.innerHTML = '';
    const totalRequired = calculateTotalMaterials();

    for (const materialId in totalRequired) {
        const totalNeeded = totalRequired[materialId];
        if (totalNeeded === 0) continue;
        
        const materialInfo = allMaterialsData[materialId];
        if (!materialInfo) continue;

        const currentAmount = materialInventory[materialId] || 0;
        const item = document.createElement('div');
        item.className = 'material-item';

        if (materialId === 'mora') {
            item.innerHTML = `
                <img src="${materialInfo.icon}" alt="${materialInfo.name}" class="material-icon">
                <div class="material-info"><div class="material-name">${materialInfo.name}</div></div>
                <div class="mora-display">必要数: ${totalNeeded.toLocaleString()}</div>`;
        } else {
            // ▼▼▼ この中のボタンに data-type="material" を追加 ▼▼▼
            item.innerHTML = `
                <img src="${materialInfo.icon}" alt="${materialInfo.name}" class="material-icon">
                <div class="material-info">
                    <div class="material-name">${materialInfo.name}</div>
                    <div class="material-amount-display">
                        <span id="current-mat-display-${materialId}">${currentAmount.toLocaleString()}</span> / ${totalNeeded.toLocaleString()}
                    </div>
                </div>
                <div class="value-adjuster">
                    <button class="btn-step" data-id="${materialId}" data-type="material" data-amount="-10">--</button>
                    <button class="btn-step" data-id="${materialId}" data-type="material" data-amount="-1">-</button>
                    <input type="range" class="value-slider" id="slider-material-${materialId}"
                           min="0" max="${totalNeeded}" value="${currentAmount}" data-id="${materialId}" data-type="material">
                    <button class="btn-step" data-id="${materialId}" data-type="material" data-amount="1">+</button>
                    <button class="btn-step" data-id="${materialId}" data-type="material" data-amount="10">++</button>
                </div>`;
        }
        listElement.appendChild(item);
    }

    listElement.querySelectorAll('.btn-step[data-type="material"]').forEach(button => {
        button.addEventListener('click', (e) => {
            updateInventory(e.target.dataset.id, parseInt(e.target.dataset.amount, 10));
        });
    });
    listElement.querySelectorAll('.value-slider[data-type="material"]').forEach(slider => {
        slider.addEventListener('input', (e) => {
            updateInventory(e.target.dataset.id, parseInt(e.target.value, 10), true);
        });
    });
}

function calculateTotalMaterials() {
    const total = {};
    const commonMaterialFamilies = {
        'divining_scroll': ['divining_scroll', 'sealed_scroll', 'forbidden_curse_scroll'],
        'fungal_spores': ['fungal_spores', 'luminescent_pollen', 'crystalline_cyst_dust']
    };
    selectedCharacters.forEach(charPlan => {
        const charData = allCharacterData.find(c => c.id === charPlan.id);
        if (!charData || !charData.materials) return;
        const rarityKey = `rarity_${charData.rarity}`;
        if (!allAscensionCosts[rarityKey]) return;
        const ascensionPhases = allAscensionCosts[rarityKey].phases;
        ascensionPhases.forEach(phase => {
            if (charPlan.currentLvl < phase.level && charPlan.targetLvl >= phase.level) {
                for (const matType in phase.cost) {
                    let materialId = '';
                    const amount = phase.cost[matType];
                    if (matType === 'mora') materialId = 'mora';
                    else if (matType === 'boss_material') materialId = charData.materials.boss;
                    else if (matType === 'local_specialty') materialId = charData.materials.local;
                    else if (matType.startsWith('gem_')) materialId = `${charData.materials.gem}_${matType.split('_')[1]}`;
                    else if (matType.startsWith('common_')) {
                        const family = commonMaterialFamilies[charData.materials.common];
                        if (family) materialId = family[parseInt(matType.split('_')[1], 10) - 1];
                    }
                    if (materialId) {
                        if (!total[materialId]) total[materialId] = 0;
                        total[materialId] += amount;
                    }
                }
            }
        });
    });
    return total;
}

function updateCharacterLevelOnPlan(charId, value, isAbsolute = false) {
    const charIndex = selectedCharacters.findIndex(c => c.id === charId);
    if (charIndex > -1) {
        let newLevel = isAbsolute ? value : selectedCharacters[charIndex].currentLvl + value;
        if (newLevel < 1) newLevel = 1;
        if (newLevel > selectedCharacters[charIndex].targetLvl) {
            newLevel = selectedCharacters[charIndex].targetLvl;
        }
        selectedCharacters[charIndex].currentLvl = newLevel;
        saveSelection();
        document.getElementById(`current-lvl-display-${charId}`).textContent = newLevel;
        document.getElementById(`slider-char-level-${charId}`).value = newLevel;
        debounce(displayRequiredMaterials, 300)();
    }
}

function updateInventory(materialId, value, isAbsolute = false) {
    if (!materialInventory[materialId]) materialInventory[materialId] = 0;
    let newValue = isAbsolute ? value : materialInventory[materialId] + value;
    if (newValue < 0) newValue = 0;
    materialInventory[materialId] = newValue;
    saveInventory();
    const countElement = document.getElementById(`current-mat-display-${materialId}`);
    const sliderElement = document.getElementById(`slider-material-${materialId}`);
    if (countElement) countElement.textContent = newValue.toLocaleString();
    if (sliderElement) sliderElement.value = newValue;
}

function debounce(func, delay) {
    return function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(this, arguments), delay);
    };
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

function handleActiveNavLinks() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        }
    });
}
