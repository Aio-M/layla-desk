// -- グローバル変数 --
let selectedCharacters = []; 
let materialInventory = {};
let allCharacterData = [];
let allAscensionCosts = {};
let allLevelCosts = {};
let allTalentCosts = {};
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

    for (let i = 1; i <= 3; i++) {
        document.getElementById(`talent${i}-current-input`).value = selectionData ? (selectionData[`talent${i}_current`] || 1) : 1;
        document.getElementById(`talent${i}-target-input`).value = selectionData ? (selectionData[`talent${i}_target`] || 1) : 1;
    }

    document.getElementById('modal-remove-btn').style.display = selectionData ? 'block' : 'none';
    document.getElementById('level-modal-overlay').style.display = 'flex';
}

function closeLevelModal() {
    document.getElementById('level-modal-overlay').style.display = 'none';
    currentlyEditingCharId = null;
}

function saveLevelData() {
    if (!currentlyEditingCharId) return;
    const newSelection = {
        id: currentlyEditingCharId,
        currentLvl: parseInt(document.getElementById('current-lvl-input').value, 10),
        targetLvl: parseInt(document.getElementById('target-lvl-input').value, 10),
        talent1_current: parseInt(document.getElementById('talent1-current-input').value, 10),
        talent1_target: parseInt(document.getElementById('talent1-target-input').value, 10),
        talent2_current: parseInt(document.getElementById('talent2-current-input').value, 10),
        talent2_target: parseInt(document.getElementById('talent2-target-input').value, 10),
        talent3_current: parseInt(document.getElementById('talent3-current-input').value, 10),
        talent3_target: parseInt(document.getElementById('talent3-target-input').value, 10),
    };

    const existingIndex = selectedCharacters.findIndex(c => c.id === currentlyEditingCharId);
    if (existingIndex > -1) {
        selectedCharacters[existingIndex] = newSelection;
    } else {
        selectedCharacters.push(newSelection);
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
    if (!listElement) return;
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
    const sortControls = document.querySelector('.sort-controls');
    if (!sortControls) return;
    sortControls.querySelectorAll('.sort-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            currentSortOrder = e.target.dataset.sortBy;
            document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            renderCharacters();
        });
    });
    sortControls.querySelector('.sort-btn[data-sort-by="default"]').classList.add('active');
}

async function loadCharacters() {
    try {
        const response = await fetch('data/characters.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allCharacterData = await response.json();
    } catch (error) {
        console.error('キャラクターデータの読み込みに失敗しました:', error);
        const listElement = document.getElementById('character-list');
        if (listElement) {
            listElement.innerHTML = '<p style="color: #ffcdd2;">データの読み込みに失敗しました。</p>';
        }
    }
}

function sortCharacters(characters, sortBy) {
    const elementOrder = ["炎", "水", "風", "雷", "草", "氷", "岩", "無"];
    const weaponOrder = ["片手剣", "両手剣", "長柄武器", "弓", "法器", "拳"];
    const charsCopy = [...characters];
    switch (sortBy) {
        case 'element':
            return charsCopy.sort((a, b) => elementOrder.indexOf(a.element) - elementOrder.indexOf(b.element));
        case 'weapon':
            return charsCopy.sort((a, b) => weaponOrder.indexOf(a.weapon_type) - weaponOrder.indexOf(b.weapon_type));
        default:
            return charsCopy;
    }
}

function saveSelection() {
    localStorage.setItem('laylaDesk_selectedCharacters', JSON.stringify(selectedCharacters));
}

function loadSelection() {
    const saved = localStorage.getItem('laylaDesk_selectedCharacters');
    if (saved) {
        try {
            selectedCharacters = JSON.parse(saved);
        } catch(e) {
            console.error("保存された選択データの読み込みに失敗しました:", e);
            selectedCharacters = [];
        }
    }
}

// ===============================
//  育成計画ページ (planning.html)
// ===============================

async function loadPlanningPage() {
    loadSelection();
    loadInventory();
    const planningBoard = document.getElementById('planning-board');
    if (!planningBoard) return;
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

    try {
        const [charRes, ascRes, levelRes, talentRes] = await Promise.all([
            fetch('data/characters.json'),
            fetch('data/ascension.json'),
            fetch('data/level_costs.json'),
            fetch('data/talent_costs.json')
        ]);

        if (!charRes.ok || !ascRes.ok || !levelRes.ok || !talentRes.ok) {
            throw new Error('データベースファイルの一部が読み込めませんでした。');
        }

        allCharacterData = await charRes.json();
        allAscensionCosts = await ascRes.json();
        allLevelCosts = await levelRes.json();
        allTalentCosts = await talentRes.json();

        displaySelectedCharacters();
        displayRequiredMaterials();
    } catch (error) {
        console.error("計画ページの読み込みに失敗しました:", error);
        planningBoard.innerHTML = `<p style="text-align:center; color: #ffcdd2;">計画の読み込みに失敗しました。<br>データファイルに文法エラーがないか確認してください。</p>`;
    }
}

function displaySelectedCharacters() {
    const listElement = document.getElementById('selected-characters-list');
    listElement.innerHTML = '';
    selectedCharacters.forEach(obj => {
        const charData = allCharacterData.find(c => c.id === obj.id);
        if (charData) {
            const item = document.createElement('div');
            item.className = 'plan-char-item';
            // ▼▼▼ この中のボタンとスライダーを再実装 ▼▼▼
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
                </div>
                <button class="delete-char-btn" data-id="${charData.id}">×</button>
            `;
            listElement.appendChild(item);
        }
    });

    listElement.querySelectorAll('.delete-char-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            if (window.confirm("このキャラクターを計画から削除しますか？")) {
                selectedCharacters = selectedCharacters.filter(c => c.id !== e.target.dataset.id);
                saveSelection();
                loadPlanningPage();
            }
        });
    });
    
    // ▼▼▼ キャラクターレベルのボタンとスライダーのイベントリスナーを再実装 ▼▼▼
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
        if (totalRequired[materialId] <= 0) continue;
        const materialInfo = allMaterialsData[materialId];
        if (!materialInfo) {
             console.error(`警告: ${materialId} の情報が materials.js に見つかりません。`);
             continue;
        }
        const currentAmount = materialInventory[materialId] || 0;
        const item = document.createElement('div');
        item.className = 'material-item';
        if (materialId === 'mora') {
            item.innerHTML = `
                <img src="${materialInfo.icon}" alt="${materialInfo.name}" class="material-icon">
                <div class="material-info"><div class="material-name">${materialInfo.name}</div></div>
                <div class="mora-display">必要数: ${totalRequired[materialId].toLocaleString()}</div>`;
        } else {
            // ▼▼▼ 素材のボタンとスライダーを再実装 ▼▼▼
            item.innerHTML = `
                <img src="${materialInfo.icon}" alt="${materialInfo.name}" class="material-icon">
                <div class="material-info">
                    <div class="material-name">${materialInfo.name}</div>
                    <div class="material-amount-display">
                        <span id="current-mat-display-${materialId}">${currentAmount.toLocaleString()}</span> / ${totalRequired[materialId].toLocaleString()}
                    </div>
                </div>
                <div class="value-adjuster">
                    <button class="btn-step" data-id="${materialId}" data-type="material" data-amount="-10">--</button>
                    <button class="btn-step" data-id="${materialId}" data-type="material" data-amount="-1">-</button>
                    <input type="range" class="value-slider" id="slider-material-${materialId}"
                           min="0" max="${totalRequired[materialId]}" value="${currentAmount}" data-id="${materialId}" data-type="material">
                    <button class="btn-step" data-id="${materialId}" data-type="material" data-amount="1">+</button>
                    <button class="btn-step" data-id="${materialId}" data-type="material" data-amount="10">++</button>
                </div>`;
        }
        listElement.appendChild(item);
    }

    // ▼▼▼ 素材のボタンとスライダーのイベントリスナーを再実装 ▼▼▼
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
    const total = { mora: 0 };
    const commonMaterialFamilies = {
        'divining_scroll': ['divining_scroll', 'sealed_scroll', 'forbidden_curse_scroll'],
        'fungal_spores': ['fungal_spores', 'luminescent_pollen', 'crystalline_cyst_dust']
    };
    const talentBookFamilies = {
        'ingenuity': ['teachings_of_ingenuity', 'guide_to_ingenuity', 'philosophies_of_ingenuity']
    };

    selectedCharacters.forEach(charPlan => {
        const charData = allCharacterData.find(c => c.id === charPlan.id);
        if (!charData) return;

        // レベルアップコスト
        const expData = allLevelCosts.character_exp;
        const targetExp = expData.find(e => e.level === charPlan.targetLvl)?.exp || 0;
        const currentExp = expData.find(e => e.level === charPlan.currentLvl)?.exp || 0;
        const requiredExp = targetExp - currentExp;
        if (requiredExp > 0) {
            total.mora += Math.ceil(requiredExp * allLevelCosts.mora_per_exp);
            if (!total.hero_wit) total.hero_wit = 0;
            total.hero_wit += Math.ceil(requiredExp / allLevelCosts.exp_books.hero_wit);
        }

        // レベル突破コスト
        if (charData.materials) {
            const ascPhases = allAscensionCosts[`rarity_${charData.rarity}`]?.phases || [];
            ascPhases.forEach(p => {
                if (charPlan.currentLvl < p.level && charPlan.targetLvl >= p.level) {
                    for (const matType in p.cost) {
                        let materialId = '';
                        const amount = p.cost[matType];
                        if (matType === 'mora') { total.mora += amount; }
                        else {
                            if (matType === 'boss_material') materialId = charData.materials.boss;
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
                }
            });
        }

        // 天賦レベルアップコスト
        if (charData.materials) {
            const talentLevels = allTalentCosts.levels;
            for (let i = 1; i <= 3; i++) {
                const currentTalent = charPlan[`talent${i}_current`] || 1;
                const targetTalent = charPlan[`talent${i}_target`] || 1;
                for (let lv = currentTalent; lv < targetTalent; lv++) {
                    const phase = talentLevels.find(p => p.level === lv + 1);
                    if (!phase) continue;
                    for (const matType in phase.cost) {
                        let materialId = '';
                        const amount = phase.cost[matType];
                        if (matType === 'mora') { total.mora += amount; }
                        else {
                            if (matType === 'weekly_boss') materialId = charData.materials.weekly_boss;
                            else if (matType === 'crown') materialId = 'crown_of_insight';
                            else if (matType.startsWith('book_')) {
                                const family = talentBookFamilies[charData.materials.talent_book];
                                if (family) materialId = family[parseInt(matType.split('_')[1], 10) - 2];
                            } else if (matType.startsWith('common_')) {
                                const family = commonMaterialFamilies[charData.materials.common];
                                if (family) materialId = family[parseInt(matType.split('_')[1], 10) - 1];
                            }
                            if (materialId) {
                                if (!total[materialId]) total[materialId] = 0;
                                total[materialId] += amount;
                            }
                        }
                    }
                }
            }
        }
    });
    return total;
}

// ▼▼▼ リアルタイム再計算のロジックを再実装 ▼▼▼
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
        try {
            materialInventory = JSON.parse(saved);
        } catch(e) {
            console.error("保存された所持数データの読み込みに失敗しました:", e);
            materialInventory = {};
        }
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
