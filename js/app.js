// -- グローバル変数 --
// 選択されたキャラクターのIDを保存する配列
let selectedCharacters = [];

// -- イベントリスナー --
// ページのHTMLがすべて読み込まれた後に実行
document.addEventListener('DOMContentLoaded', () => {
    // もしページ内に <div id="character-list"> が存在すれば、キャラクターページ用の処理を実行
    if (document.getElementById('character-list')) {
        loadSelection(); // 保存された選択状態を読み込む
        loadCharacters(); // キャラクターリストを表示する
    }
});


// -- 関数 --

/**
 * キャラクターデータを読み込んでページに表示する関数
 */
async function loadCharacters() {
    const listElement = document.getElementById('character-list');
    try {
        const response = await fetch('data/characters.json');
        // ネットワークエラーのチェック
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const characters = await response.json();
        listElement.innerHTML = ''; // 「読み込み中」を消去

        characters.forEach(character => {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.dataset.charId = character.id; // カードにキャラクターIDを保存

            // もしこのキャラクターが既に選択されていたら、selectedクラスを付ける
            if (selectedCharacters.includes(character.id)) {
                card.classList.add('selected');
            }
            
            card.innerHTML = `
                <img src="${character.image_path}" alt="${character.name}" class="character-image">
                <div class="character-info">
                    <h3 class="character-name">${character.name}</h3>
                    <p class="character-meta">★${character.rarity} / ${character.element}</p>
                </div>
            `;

            // カードがクリックされた時の処理を追加
            card.addEventListener('click', () => {
                toggleCharacterSelection(character.id, card);
            });

            listElement.appendChild(card);
        });
    } catch (error) {
        // 途中でエラーが起きたら、メッセージを表示します
        console.error('キャラクターデータの読み込み、または処理に失敗しました:', error);
        listElement.innerHTML = '<p style="color: #ffcdd2;">データの読み込みに失敗しました。ファイルパスやJSONファイルの形式を確認してください。</p>';
    }
}

/**
 * キャラクターの選択状態を切り替える関数
 * @param {string} charId - キャラクターのID
 * @param {HTMLElement} cardElement - クリックされたカードのHTML要素
 */
function toggleCharacterSelection(charId, cardElement) {
    cardElement.classList.toggle('selected'); // selectedクラスの付け外し

    if (selectedCharacters.includes(charId)) {
        // もし既に選択されていたら、配列から削除
        selectedCharacters = selectedCharacters.filter(id => id !== charId);
    } else {
        // もし選択されていなかったら、配列に追加
        selectedCharacters.push(charId);
    }
    saveSelection(); // 変更をブラウザに保存
}

/**
 * 選択状態をブラウザのLocalStorageに保存する関数
 */
function saveSelection() {
    // 配列をJSON文字列に変換して保存
    localStorage.setItem('laylaDesk_selectedCharacters', JSON.stringify(selectedCharacters));
}

/**
 * LocalStorageから選択状態を読み込む関数
 */
function loadSelection() {
    const savedSelection = localStorage.getItem('laylaDesk_selectedCharacters');
    if (savedSelection) {
        // JSON文字列を配列に戻して変数に格納
        selectedCharacters = JSON.parse(savedSelection);
    }
}
