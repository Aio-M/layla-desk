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
                <img src="<span class="math-inline">\{character\.image\_path\}" alt\="</span>{character.name}" class="character-image">
                <div class="character-info">
                    <h3 class="character-name"><span class="math-inline">\{character\.name\}</h3\>
<p class\="character\-meta"\>★</span>{character.rarity} / ${character.element}</p>
                </div>
            `;

            // カードがクリックされた時の処理を追加
            card.addEventListener('click', () => {
                toggleCharacterSelection(character.id, card);
            });

            listElement.appendChild(card);
        });
    } catch (error) {
        console.error('キャラクターデータの読み込みに失敗しました:', error);
        listElement.innerHTML = '<p>データの読み込みに失敗しました。ページを更新してみてください。</p>';
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
