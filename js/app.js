// -- グローバル変数 --
let selectedCharacters = [];
let selectedWeapons = []; // ★追加：選択された武器を管理
let materialInventory = {};
let allCharacterData = [];
let allWeaponData = []; // ★追加：全武器データを保持
let allAscensionCosts = {};
let allLevelCosts = {};
let allTalentCosts = {};
let currentSortOrder = 'default';
let currentlyEditingId = null; // ★汎用的なID変数に変更

// -- イベントリスナー --
document.addEventListener('DOMContentLoaded', () => {
    renderHeader();
    if (document.getElementById('character-list')) {
        loadCharacters().then(() => {
            loadSelection();
            renderCharacters();
        });
        setupSortButtons('character');
        setupModalEventListeners('character');
    }
    // ★武器ページの処理を追加
    if (document.getElementById('weapon-list')) {
        loadWeapons().then(() => {
            loadWeaponSelection();
            renderWeapons();
        });
        setupSortButtons('weapon');
        setupModalEventListeners('weapon');
    }
    if (document.getElementById('planning-board')) {
        loadPlanningPage();
    }
});


// ===================================
//  武器選択ページ (weapons.html)
// ===================================

async function loadWeapons() {
    try {
        const response = await fetch('data/weapons.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allWeaponData = await response.json();
    } catch (error) {
        console.error('武器データの読み込みに失敗しました:', error);
        document.getElementById('weapon-list').innerHTML = '<p style="color: #ffcdd2;">データの読み込みに失敗しました。</p>';
    }
}

function renderWeapons() {
    const listElement = document.getElementById('weapon-list');
    if (!listElement) return;
    listElement.innerHTML = '';
    const sortedWeapons = sortItems(allWeaponData, currentSortOrder);
    sortedWeapons.forEach(weapon => {
        const card = document.createElement('div');
        card.className = 'weapon-card';
        if (selectedWeapons.find(w => w.id === weapon.id)) {
            card.classList.add('selected');
        }
        card.title = weapon.name;
        // ★画像のパスは仮。後で修正
        card.innerHTML = `
            <img src="images/weapons/${weapon.id}.webp" alt="${weapon.name}" class="weapon-image" onerror="this.style.display='none'">
            <div class="rarity-stars">${'★'.repeat(weapon.rarity)}</div>
            <h4 class="weapon-name">${weapon.name}</h4>
        `;
        card.addEventListener('click', () => openModal(weapon.id, 'weapon'));
        listElement.appendChild(card);
    });
}

function loadWeaponSelection() {
    const saved = localStorage.getItem('laylaDesk_selectedWeapons');
    if (saved) {
        try {
            selectedWeapons = JSON.parse(saved);
        } catch(e) { selectedWeapons = []; }
    }
}

function saveWeaponSelection() {
    localStorage.setItem('laylaDesk_selectedWeapons', JSON.stringify(selectedWeapons));
}

// ===================================
//  キャラクター選択ページ (流用・変更)
// ===================================

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

function renderCharacters() {
    const listElement = document.getElementById('character-list');
    if (!listElement) return;
    listElement.innerHTML = '';
    const sortedCharacters = sortItems(allCharacterData, currentSortOrder);
    sortedCharacters.forEach(character => {
        const card = document.createElement('div');
        // ★クラス名を変更してスタイルを共通化
        card.className = 'character-card';
        if (selectedCharacters.find(c => c.id === character.id)) {
            card.classList.add('selected');
        }
        card.title = character.name;
        card.innerHTML = `<img src="${character.image_path}" alt="${character.name}" class="character-image"><h4 class="character-name">${character.name}</h4>`;
        card.addEventListener('click', () => openModal(character.id, 'character'));
        listElement.appendChild(card);
    });
}

// ===================================
//  共通のモーダル・ソート・保存処理
// ===================================

function setupSortButtons(type) {
    const controls = document.querySelector('.sort-controls');
    if(!controls) return;
    controls.querySelectorAll('.sort-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            currentSortOrder = e.target.dataset.sortBy;
            controls.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            if (type === 'character') renderCharacters();
            if (type === 'weapon') renderWeapons();
        });
    });
    controls.querySelector('.sort-btn[data-sort-by="default"]').classList.add('active');
}

function sortItems(items, sortBy) {
    const itemsCopy = [...items];
    switch (sortBy) {
        case 'element':
            return itemsCopy.sort((a, b) => (allCharacterData.find(d=>d.id===a.id)?.element || '').localeCompare(allCharacterData.find(d=>d.id===b.id)?.element || ''));
        case 'weapon_type': // キャラクター用
             return itemsCopy.sort((a, b) => (a.weapon_type || '').localeCompare(b.weapon_type || ''));
        case 'type': // 武器用
             return itemsCopy.sort((a, b) => (a.type || '').localeCompare(b.type || ''));
        case 'rarity':
            return itemsCopy.sort((a, b) => (b.rarity || 0) - (a.rarity || 0));
        default:
            return itemsCopy;
    }
}


function setupModalEventListeners(type) {
    const overlay = document.getElementById(`${type}-modal-overlay`);
    if (!overlay) return;
    const saveBtn = document.getElementById(`modal-save-${type}-btn`);
    const cancelBtn = document.getElementById(`modal-cancel-${type}-btn`);
    const removeBtn = document.getElementById(`modal-remove-${type}-btn`);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal(type);
    });
    saveBtn.addEventListener('click', () => saveDataFromModal(type));
    cancelBtn.addEventListener('click', () => closeModal(type));
    removeBtn.addEventListener('click', () => removeFromPlan(type));
}


function openModal(id, type) {
    currentlyEditingId = id;
    const data = (type === 'character') ? allCharacterData : allWeaponData;
    const selectionArray = (type === 'character') ? selectedCharacters : selectedWeapons;
    
    const itemData = data.find(item => item.id === id);
    const selectionData = selectionArray.find(item => item.id === id);

    const modalName = document.getElementById(`modal-${type}-name`);
    const currentLvlInput = document.getElementById(`${type}-current-lvl-input`);
    const targetLvlInput = document.getElementById(`${type}-target-lvl-input`);
    const removeBtn = document.getElementById(`modal-remove-${type}-btn`);
    const overlay = document.getElementById(`${type}-modal-overlay`);
    
    modalName.textContent = itemData.name;
    currentLvlInput.value = selectionData ? selectionData.currentLvl : 1;
    targetLvlInput.value = selectionData ? selectionData.targetLvl : 90;

    if(type === 'character'){
        for (let i = 1; i <= 3; i++) {
            document.getElementById(`talent${i}-current-input`).value = selectionData ? (selectionData[`talent${i}_current`] || 1) : 1;
            document.getElementById(`talent${i}-target-input`).value = selectionData ? (selectionData[`talent${i}_target`] || 1) : 1;
        }
    }

    removeBtn.style.display = selectionData ? 'block' : 'none';
    overlay.style.display = 'flex';
}


function closeModal(type) {
    document.getElementById(`${type}-modal-overlay`).style.display = 'none';
    currentlyEditingId = null;
}

function saveDataFromModal(type) {
    if (!currentlyEditingId) return;
    
    const selectionArray = (type === 'character') ? selectedCharacters : selectedWeapons;
    const renderFunc = (type === 'character') ? renderCharacters : renderWeapons;
    const saveFunc = (type === 'character') ? saveSelection : saveWeaponSelection;

    let newSelection = {
        id: currentlyEditingId,
        currentLvl: parseInt(document.getElementById(`${type}-current-lvl-input`).value, 10),
        targetLvl: parseInt(document.getElementById(`${type}-target-lvl-input`).value, 10),
    };

    if(type === 'character'){
        Object.assign(newSelection, {
            talent1_current: parseInt(document.getElementById('talent1-current-input').value, 10),
            talent1_target: parseInt(document.getElementById('talent1-target-input').value, 10),
            talent2_current: parseInt(document.getElementById('talent2-current-input').value, 10),
            talent2_target: parseInt(document.getElementById('talent2-target-input').value, 10),
            talent3_current: parseInt(document.getElementById('talent3-current-input').value, 10),
            talent3_target: parseInt(document.getElementById('talent3-target-input').value, 10),
        });
    }

    const existingIndex = selectionArray.findIndex(item => item.id === currentlyEditingId);
    if (existingIndex > -1) {
        selectionArray[existingIndex] = newSelection;
    } else {
        selectionArray.push(newSelection);
    }
    
    saveFunc();
    renderFunc();
    closeModal(type);
}

function removeFromPlan(type) {
    if (!currentlyEditingId) return;

    const selectionArray = (type === 'character') ? selectedCharacters : selectedWeapons;
    const renderFunc = (type === 'character') ? renderCharacters : renderWeapons;
    const saveFunc = (type === 'character') ? saveSelection : saveWeaponSelection;

    if (window.confirm(`この${type === 'character' ? 'キャラクター' : '武器'}を計画から削除しますか？`)) {
        const existingIndex = selectionArray.findIndex(item => item.id === currentlyEditingId);
        if (existingIndex > -1) {
            selectionArray.splice(existingIndex, 1);
        }
        saveFunc();
        renderFunc();
        closeModal(type);
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
