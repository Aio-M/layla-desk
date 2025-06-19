// このイベントは、ページのHTMLがすべて読み込まれた後に実行されます
document.addEventListener('DOMContentLoaded', () => {
    // もしページ内に <div id="character-list"> が存在すれば、
    // キャラクターを読み込む関数を実行します
    if (document.getElementById('character-list')) {
        loadCharacters();
    }
});

/**
 * キャラクターデータを読み込んでページに表示する関数
 */
async function loadCharacters() {
    const listElement = document.getElementById('character-list');

    try {
        // data/characters.json ファイルからデータを取得します
        const response = await fetch('data/characters.json');
        const characters = await response.json();

        // 「読み込み中です...」の文字を消去します
        listElement.innerHTML = '';

        // 取得したキャラクターデータの一人ひとりに対して処理を繰り返します
        characters.forEach(character => {
            // 表示するカード（div要素）を新しく作ります
            const card = document.createElement('div');
            card.className = 'character-card'; // CSSを適用するためのクラス名

            // カードの中身となるHTMLを生成します
            card.innerHTML = `
                <img src="${character.image_path}" alt="${character.name}" class="character-image">
                <div class="character-info">
                    <h3 class="character-name">${character.name}</h3>
                    <p class="character-meta">★${character.rarity} / ${character.element} / ${character.weapon_type}</p>
                </div>
            `;

            // ページに完成したカードを追加します
            listElement.appendChild(card);
        });

    } catch (error) {
        // 途中でエラーが起きたら、メッセージを表示します
        console.error('キャラクターデータの読み込みに失敗しました:', error);
        listElement.innerHTML = '<p>データの読み込みに失敗しました。ページを更新してみてください。</p>';
    }
}
