document.addEventListener('DOMContentLoaded', () => {
    // --- 認証機能 ---
    const loginButton = document.getElementById('login-button');
    const passwordInput = document.getElementById('password-input');
    const authSection = document.getElementById('auth-section');
    const mainContent = document.getElementById('main-content');
    const authMessage = document.getElementById('auth-message');

    // ★★★ ここに合言葉を設定してください ★★★
    const SECRET_PASSWORD = 'travel'; // 仮の合言葉

    loginButton.addEventListener('click', () => {
        if (passwordInput.value === SECRET_PASSWORD) {
            authSection.classList.add('hidden');
            mainContent.classList.remove('hidden');
            // 認証成功後、保存されたデータを読み込む
            loadAllData();
        } else {
            authMessage.textContent = '合言葉ちゃうわ。';
            passwordInput.value = ''; // パスワードをクリア
        }
    });

    // --- 各機能の要素取得 ---
    // 旅程管理
    const itineraryDateInput = document.getElementById('itinerary-date');
    const itineraryTimeInput = document.getElementById('itinerary-time');
    const itineraryEventInput = document.getElementById('itinerary-event');
    const addItineraryButton = document.getElementById('add-itinerary-button');
    const itineraryList = document.getElementById('itinerary-list');

    // 行きたい場所リスト
    const placeNameInput = document.getElementById('place-name');
    const addPlaceButton = document.getElementById('add-place-button');
    const placeList = document.getElementById('place-list');

    // 持ち物リスト
    const itemNameInput = document.getElementById('item-name');
    const addItemButton = document.getElementById('add-item-button');
    const itemList = document.getElementById('item-list');

    // お土産リスト
    const souvenirNameInput = document.getElementById('souvenir-name');
    const addSouvenirButton = document.getElementById('add-souvenir-button');
    const souvenirList = document.getElementById('souvenir-list');

    // 簡易メモ・写真
    const memoTextInput = document.getElementById('memo-text');
    const saveMemoButton = document.getElementById('save-memo-button');
    const photoUploadInput = document.getElementById('photo-upload');
    const photoPreviewDiv = document.getElementById('photo-preview');

    // --- データ保存用キー ---
    const ITINERARY_KEY = 'travelAppItinerary';
    const PLACES_KEY = 'travelAppPlaces';
    const ITEMS_KEY = 'travelAppItems';
    const SOUVENIRS_KEY = 'travelAppSouvenirs';
    const MEMO_KEY = 'travelAppMemo';
    const PHOTOS_KEY = 'travelAppPhotos'; // 写真はURLやData URLを保存

    // --- データ構造を保持する配列 (メモリ上) ---
    let itineraries = [];
    let places = [];
    let items = [];
    let souvenirs = [];
    let photos = []; // Base64エンコードされた画像データを保存する場合

    // --- 汎用的なリストアイテム追加関数 ---
    function createListItem(text, key, isChecked = false, dataId = null) {
        const li = document.createElement('li');
        li.dataset.id = dataId || Date.now(); // 一意のIDを生成

        if (key === ITEMS_KEY || key === SOUVENIRS_KEY) {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = isChecked;
            checkbox.addEventListener('change', () => {
                // チェック状態が変更されたら保存
                const listData = JSON.parse(localStorage.getItem(key)) || [];
                const itemIndex = listData.findIndex(item => item.id == li.dataset.id);
                if (itemIndex > -1) {
                    listData[itemIndex].checked = checkbox.checked;
                    localStorage.setItem(key, JSON.stringify(listData));
                }
            });
            li.appendChild(checkbox);
        }

        const span = document.createElement('span');
        span.textContent = text;
        li.appendChild(span);

        const removeButton = document.createElement('button');
        removeButton.textContent = '削除';
        removeButton.classList.add('remove-button');
        removeButton.addEventListener('click', () => {
            li.remove();
            // localStorageからも削除
            let storedData = JSON.parse(localStorage.getItem(key)) || [];
            storedData = storedData.filter(data => data.id != li.dataset.id);
            localStorage.setItem(key, JSON.stringify(storedData));
        });
        li.appendChild(removeButton);

        return li;
    }

    // --- 旅程管理 ---
    addItineraryButton.addEventListener('click', () => {
        const date = itineraryDateInput.value;
        const time = itineraryTimeInput.value;
        const event = itineraryEventInput.value.trim();

        if (date && time && event) {
            const itineraryItem = {
                id: Date.now(),
                date: date,
                time: time,
                event: event
            };
            itineraries.push(itineraryItem);
            renderItineraries();
            saveData(ITINERARY_KEY, itineraries);

            // 入力欄をクリア
            itineraryDateInput.value = '';
            itineraryTimeInput.value = '';
            itineraryEventInput.value = '';
        } else {
            alert('日付、時間、イベント内容をすべて入力してください。');
        }
    });

    function renderItineraries() {
        itineraryList.innerHTML = ''; // 一度クリア
        // 日付と時間でソート
        const sortedItineraries = [...itineraries].sort((a, b) => {
            const dateTimeA = new Date(`${a.date}T${a.time}`);
            const dateTimeB = new Date(`${b.date}T${b.time}`);
            return dateTimeA - dateTimeB;
        });

        sortedItineraries.forEach(item => {
            const li = createListItem(`${item.date} ${item.time} - ${item.event}`, ITINERARY_KEY, false, item.id);
            itineraryList.appendChild(li);
        });
    }

    // --- 行きたい場所リスト ---
    addPlaceButton.addEventListener('click', () => {
        const placeName = placeNameInput.value.trim();
        if (placeName) {
            const placeItem = { id: Date.now(), name: placeName };
            places.push(placeItem);
            renderPlaces();
            saveData(PLACES_KEY, places);
            placeNameInput.value = '';
        }
    });

    function renderPlaces() {
        placeList.innerHTML = '';
        places.forEach(item => {
            const li = createListItem(item.name, PLACES_KEY, false, item.id);
            // Google Mapsへの簡易リンク（任意）
            const mapLink = document.createElement('a');
            mapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name)}`;
            mapLink.textContent = ' (地図)';
            mapLink.target = '_blank'; // 新しいタブで開く
            li.querySelector('span').appendChild(mapLink); // 場所名のspanに追加
            placeList.appendChild(li);
        });
    }

    // --- 持ち物リスト ---
    addItemButton.addEventListener('click', () => {
        const itemName = itemNameInput.value.trim();
        if (itemName) {
            const item = { id: Date.now(), name: itemName, checked: false };
            items.push(item);
            renderItems();
            saveData(ITEMS_KEY, items);
            itemNameInput.value = '';
        }
    });

    function renderItems() {
        itemList.innerHTML = '';
        items.forEach(item => {
            const li = createListItem(item.name, ITEMS_KEY, item.checked, item.id);
            itemList.appendChild(li);
        });
    }

    // --- お土産リスト ---
    addSouvenirButton.addEventListener('click', () => {
        const souvenirName = souvenirNameInput.value.trim();
        if (souvenirName) {
            const souvenir = { id: Date.now(), name: souvenirName, checked: false };
            souvenirs.push(souvenir);
            renderSouvenirs();
            saveData(SOUVENIRS_KEY, souvenirs);
            souvenirNameInput.value = '';
        }
    });

    function renderSouvenirs() {
        souvenirList.innerHTML = '';
        souvenirs.forEach(souvenir => {
            const li = createListItem(souvenir.name, SOUVENIRS_KEY, souvenir.checked, souvenir.id);
            souvenirList.appendChild(li);
        });
    }

    // --- 簡易メモ ---
    saveMemoButton.addEventListener('click', () => {
        saveData(MEMO_KEY, memoTextInput.value);
        alert('メモを保存しました！');
    });

    // --- 写真共有（プレビューのみ） ---
    photoUploadInput.addEventListener('change', (event) => {
        photoPreviewDiv.innerHTML = ''; // 既存のプレビューをクリア
        const files = event.target.files;

        if (files) {
            // 写真をlocalStorageに保存する場合（簡易的で、大きなファイルには不向き）
            // より堅牢な保存にはIndexedDBを推奨します
            const currentPhotos = [];
            let filesProcessed = 0;

            Array.from(files).forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        photoPreviewDiv.appendChild(img);
                        currentPhotos.push(e.target.result); // Base64データを配列に追加

                        filesProcessed++;
                        if (filesProcessed === files.length) {
                            saveData(PHOTOS_KEY, currentPhotos); // すべてのファイルを処理したら保存
                        }
                    };
                    reader.readAsDataURL(file); // 画像をBase64形式で読み込む
                }
            });
        }
    });

    function renderPhotos() {
        photoPreviewDiv.innerHTML = '';
        photos.forEach(base64Image => {
            const img = document.createElement('img');
            img.src = base64Image;
            photoPreviewDiv.appendChild(img);
        });
    }


    // --- データ保存・読み込み汎用関数 ---
    function saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    function loadData(key, defaultData = []) {
        const storedData = localStorage.getItem(key);
        return storedData ? JSON.parse(storedData) : defaultData;
    }

    function loadAllData() {
        itineraries = loadData(ITINERARY_KEY);
        renderItineraries();

        places = loadData(PLACES_KEY);
        renderPlaces();

        items = loadData(ITEMS_KEY);
        renderItems();

        souvenirs = loadData(SOUVENIRS_KEY);
        renderSouvenirs();

        memoTextInput.value = loadData(MEMO_KEY, ''); // メモは文字列なのでデフォルトは空文字列

        photos = loadData(PHOTOS_KEY, []);
        renderPhotos();
    }
});