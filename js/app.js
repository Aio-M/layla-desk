// -- グローバル変数 --
let selectedCharacters = [];
let selectedWeapons = []; // ★追加：選択された武器を管理
let materialInventory = {};
let allCharacterData = [];
let allWeaponData = []; // ★追加：全武器データを保持
let allAscensionCosts = {};
let allWeaponAscensionCosts = {}; // ★追加：武器の突破コスト
let allLevelCosts = {};
let allWeaponLevelCosts = {}; // ★追加：武器のレベル経験値
let allTalentCosts = {};
let currentSortOrder = 'default';
let currentlyEditingId = null; 

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
    loadWeaponSelection(); // ★武器の選択状況も読み込む
    loadInventory();
    
    const planningBoard = document.getElementById('planning-board');
    if (!planningBoard) return;
    
    // ★キャラクターも武器も選択されていない場合にメッセージ表示
    if (selectedCharacters.length === 0 && selectedWeapons.length === 0) {
        planningBoard.innerHTML = '<p style="text-align:center;">計画にキャラクターや武器が追加されていません。<br>「キャラクター」または「武器」ページから育成したいものを選択してください。</p>';
        return;
    }

    try {
        // ★ Promise.all に武器関連のJSONを追加
        const [
            charRes, weaponRes, ascRes, weaponAscRes, 
            levelRes, weaponLevelRes, talentRes
        ] = await Promise.all([
            fetch('data/characters.json'),
            fetch('data/weapons.json'), // ★武器データ
            fetch('data/ascension.json'),
            fetch('data/weapon_ascension.json'), // ★武器突破データ
            fetch('data/level_costs.json'),
            fetch('data/weapon_exp.json'), // ★武器経験値データ
            fetch('data/talent_costs.json')
        ]);

        if (!charRes.ok || !weaponRes.ok || !ascRes.ok || !weaponAscRes.ok || !levelRes.ok || !weaponLevelRes.ok || !talentRes.ok) {
            throw new Error('データベースファイルの一部が読み込めませんでした。');
        }

        allCharacterData = await charRes.json();
        allWeaponData = await weaponRes.json();
        allAscensionCosts = await ascRes.json();
        allWeaponAscensionCosts = await weaponAscRes.json();
        allLevelCosts = await levelRes.json();
        allWeaponLevelCosts = await weaponLevelRes.json();
        allTalentCosts = await talentRes.json();

        displaySelectedCharacters();
        displaySelectedWeapons(); // ★武器表示関数を呼び出す
        displayRequiredMaterials();

    } catch (error) {
        console.error("計画ページの読み込みに失敗しました:", error);
        planningBoard.innerHTML = `<p style="text-align:center; color: #ffcdd2;">計画の読み込みに失敗しました。<br>データファイルに文法エラーがないか確認してください。</p>`;
    }
}

function displaySelectedCharacters() {
    const listElement = document.getElementById('selected-characters-list');
    listElement.innerHTML = '';
    if (selectedCharacters.length === 0) {
        listElement.innerHTML = '<p class="no-item-message">キャラクターが選択されていません。</p>';
        return;
    }
    selectedCharacters.forEach(obj => {
        const charData = allCharacterData.find(c => c.id === obj.id);
        if (charData) {
            const item = document.createElement('div');
            item.className = 'plan-char-item';
            item.innerHTML = `
                <img src="${charData.image_path}" alt="${charData.name}">
                <div class="plan-char-details">
                    <div class="plan-char-info">
                        <span class="plan-char-name">${charData.name}</span>
                        <span class="plan-char-level-display">
                            Lv <span id="current-lvl-display-char-${charData.id}">${obj.currentLvl}</span> / ${obj.targetLvl}
                        </span>
                    </div>
                </div>
                <button class="edit-btn" data-id="${charData.id}" data-type="character">編集</button>
            `;
            listElement.appendChild(item);
        }
    });
    // ★編集ボタンのイベントリスナー
    listElement.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (e) => {
             openModal(e.target.dataset.id, e.target.dataset.type);
        });
    });
}

// ★★★ ここから新しい関数 ★★★
function displaySelectedWeapons() {
    const listElement = document.getElementById('selected-weapons-list');
    listElement.innerHTML = '';
     if (selectedWeapons.length === 0) {
        listElement.innerHTML = '<p class="no-item-message">武器が選択されていません。</p>';
        return;
    }
    selectedWeapons.forEach(obj => {
        const weaponData = allWeaponData.find(w => w.id === obj.id);
        if (weaponData) {
            const item = document.createElement('div');
            // ★キャラクターと同じスタイルを流用
            item.className = 'plan-char-item';
            item.innerHTML = `
                <img src="images/weapons/${weaponData.id}.webp" alt="${weaponData.name}" class="material-icon">
                <div class="plan-char-details">
                    <div class="plan-char-info">
                        <span class="plan-char-name">${weaponData.name}</span>
                        <span class="plan-char-level-display">
                            Lv <span id="current-lvl-display-weapon-${weaponData.id}">${obj.currentLvl}</span> / ${obj.targetLvl}
                        </span>
                    </div>
                </div>
                <button class="edit-btn" data-id="${weaponData.id}" data-type="weapon">編集</button>
            `;
            listElement.appendChild(item);
        }
    });
    // ★編集ボタンのイベントリスナー
    listElement.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            openModal(e.target.dataset.id, e.target.dataset.type);
        });
    });
}
// ★★★ ここまで新しい関数 ★★★

function displayRequiredMaterials() {
    const listElement = document.getElementById('materials-list');
    listElement.innerHTML = '';
    const totalRequired = calculateTotalMaterials();

    const sortedMaterialIds = Object.keys(totalRequired).sort((a, b) => {
        if (a === 'mora') return -1;
        if (b === 'mora') return 1;
        const nameA = allMaterialsData[a]?.name || a;
        const nameB = allMaterialsData[b]?.name || b;
        return nameA.localeCompare(nameB);
    });

    for (const materialId of sortedMaterialIds) {
        if (totalRequired[materialId] <= 0) continue;
        const materialInfo = allMaterialsData[materialId];
        if (!materialInfo) {
            console.warn(`警告: ${materialId} の情報が materials.js に見つかりません。`);
            continue;
        }
        const currentAmount = materialInventory[materialId] || 0;
        const remaining = totalRequired[materialId] - currentAmount;

        const item = document.createElement('div');
        item.className = 'material-item';
        if (remaining <= 0) {
            item.classList.add('completed');
        }
        
        // ★★★ スライダー形式のHTMLに戻す ★★★
        item.innerHTML = `
            <img src="${materialInfo.icon}" alt="${materialInfo.name}" class="material-icon">
            <div class="material-info">
                <div class="material-name">${materialInfo.name}</div>
                <div class="material-amount-display">
                    <span id="current-mat-display-${materialId}">${currentAmount.toLocaleString()}</span> / ${totalRequired[materialId].toLocaleString()}
                    <span class="remaining-amount">(残り: ${Math.max(0, remaining).toLocaleString()})</span>
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
        listElement.appendChild(item);
    }

    // イベントリスナーもスライダーに対応させる
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
    
    // ===== ▼▼▼ キャラクターの素材計算 (既存のロジック) ▼▼▼ =====
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
        // ▼▼▼ デバッグ用 ▼▼▼
        console.log(`【武器計算開始】: ${weaponData.name}`);
        // ▲▲▲ デバッグ用 ▲▲▲
        const expData = allLevelCosts.character_exp;
        const targetExp = expData.find(e => e.level === charPlan.targetLvl)?.exp || 0;
        const currentExp = expData.find(e => e.level === charPlan.currentLvl)?.exp || 0;
        const requiredExp = targetExp - currentExp;
        if (requiredExp > 0) {
            total.mora += Math.ceil(requiredExp * allLevelCosts.mora_per_exp);
            if (!total.hero_wit) total.hero_wit = 0;
            total.hero_wit += Math.ceil(requiredExp / allLevelCosts.exp_books.hero_wit);
        }

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

    // ===== ★★★ ここから武器の素材計算ロジックを追加 ★★★ =====
    const weaponDomainFamilies = {
        'decarabian': ['tile_of_decarabians_tower', 'debris_of_decarabians_city', 'fragment_of_decarabians_epic', 'scattered_piece_of_decarabians_dream'],
        'dandelion_gladiator': ['fetters_of_the_dandelion_gladiator', 'chains_of_the_dandelion_gladiator', 'shackles_of_the_dandelion_gladiator', 'dream_of_the_dandelion_gladiator']
    };
     const weaponEliteFamilies = {
        'horn': ['heavy_horn', 'black_bronze_horn', 'black_crystal_horn']
    };
    const weaponCommonFamilies = { // キャラと共通の可能性もある
        'scroll': ['divining_scroll', 'sealed_scroll', 'forbidden_curse_scroll']
    };

    selectedWeapons.forEach(weaponPlan => {
        const weaponData = allWeaponData.find(w => w.id === weaponPlan.id);
        if(!weaponData) return;

        // レベルアップコスト (経験値)
        const expData = allWeaponLevelCosts.exp_levels;
        const targetExp = expData.find(e => e.level === weaponPlan.targetLvl)?.exp || 0;
        const currentExp = expData.find(e => e.level === weaponPlan.currentLvl)?.exp || 0;
        const requiredExp = targetExp - currentExp;
        if(requiredExp > 0){
            total.mora += Math.ceil(requiredExp * allWeaponLevelCosts.mora_per_exp);
            if (!total.mystic_enhancement_ore) total.mystic_enhancement_ore = 0;
            total.mystic_enhancement_ore += Math.ceil(requiredExp / allWeaponLevelCosts.mystic_ore_exp);
        }

        // レベル突破コスト
        if (weaponData.materials) {
            const ascPhases = allWeaponAscensionCosts[`rarity_${weaponData.rarity}`]?.phases || [];
            ascPhases.forEach(p => {
                if (weaponPlan.currentLvl < p.level && weaponPlan.targetLvl >= p.level) {
                     for (const matType in p.cost) {
                        let materialId = '';
                        const amount = p.cost[matType];
                        if (matType === 'mora') { total.mora += amount; }
                        else {
                            if (matType.startsWith('domain_')) {
                                const family = weaponDomainFamilies[weaponData.materials.domain];
                                const index = parseInt(matType.split('_')[1], 10) - 2;
                                if(family && family[index]) materialId = family[index];
                            } else if (matType.startsWith('elite_')) {
                                const family = weaponEliteFamilies[weaponData.materials.elite];
                                const index = parseInt(matType.split('_')[1], 10) - 1;
                                if(family && family[index]) materialId = family[index];
                            } else if (matType.startsWith('common_')) {
                                const family = weaponCommonFamilies[weaponData.materials.common];
                                const index = parseInt(matType.split('_')[1], 10) - 1;
                                 if(family && family[index]) materialId = family[index];
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
    });
    
    return total;
}

// リアルタイム再計算のロジック
function updateInventory(materialId, value, isAbsolute = false) {
    const totalRequired = calculateTotalMaterials()[materialId] || 0;
    if (!materialInventory[materialId]) materialInventory[materialId] = 0;

    let newValue = isAbsolute ? value : materialInventory[materialId] + value;
    
    // 値が0未満または必要数を超えないように丸める
    if (newValue < 0) newValue = 0;
    if (newValue > totalRequired) newValue = totalRequired;
    
    materialInventory[materialId] = newValue;
    saveInventory();

    // 画面の表示を更新
    const countElement = document.getElementById(`current-mat-display-${materialId}`);
    const sliderElement = document.getElementById(`slider-material-${materialId}`);
    
    if (countElement) countElement.textContent = newValue.toLocaleString();
    if (sliderElement) sliderElement.value = newValue;

    // 残り数の表示も更新
    const remaining = totalRequired - newValue;
    const remainingEl = sliderElement.closest('.material-item').querySelector('.remaining-amount');
    if(remainingEl) remainingEl.textContent = `(残り: ${Math.max(0, remaining).toLocaleString()})`;

    // 必要数を満たしたら 'completed' クラスを付け外しする
    const itemEl = sliderElement.closest('.material-item');
    if (itemEl) {
        if (remaining <= 0) {
            itemEl.classList.add('completed');
        } else {
            itemEl.classList.remove('completed');
        }
    }
}

let debounceTimer;
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
// ★キャラクター選択を保存
function saveSelection() {
    localStorage.setItem('laylaDesk_selectedCharacters', JSON.stringify(selectedCharacters));
}
// ★キャラクター選択を読み込み
function loadSelection() {
    const saved = localStorage.getItem('laylaDesk_selectedCharacters');
    if (saved) {
        try {
            selectedCharacters = JSON.parse(saved);
        } catch(e) { selectedCharacters = []; }
    }
}
