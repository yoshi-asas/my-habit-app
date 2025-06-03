// initMap関数はGoogle Maps APIが読み込まれたときに呼び出されるグローバル関数である必要があります
// そのため、DOMContentLoadedリスナーの外に定義します。
let map; // 地図オブジェクトをグローバルスコープで保持
let service; // PlacesServiceオブジェクトをグローバルスコープで保持
let autocomplete; // Autocompleteオブジェクトをグローバルスコープで保持

function initMap() {
    // 地図の初期化 (デフォルトは東京駅周辺)
    map = new google.maps.Map(document.getElementById('map-canvas'), {
        center: { lat: 35.681236, lng: 139.767125 }, // 例: 東京駅
        zoom: 12
    });

    // PlacesServiceの初期化
    service = new google.maps.places.PlacesService(map);

    // オートコンプリートの初期化
    const placeNameInput = document.getElementById('place-name'); // 既存の入力欄を使用
    autocomplete = new google.maps.places.Autocomplete(placeNameInput, {
        types: ['geocode', 'establishment'], // ジオコード（住所）と施設（場所）の候補
        strictBounds: false // 地図の表示範囲に厳密に限定しない
    });

    // オートコンプリートで場所が選択されたときのイベントリスナー
    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();

        if (!place.geometry) {
            alert("場所の候補を選択してください。");
            return;
        }

        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(17);
        }

        new google.maps.Marker({
            map: map,
            position: place.geometry.location,
            title: place.name
        });
    });
}


document.addEventListener('DOMContentLoaded', () => {
    // --- 認証機能 ---
    const loginButton = document.getElementById('login-button');
    const passwordInput = document.getElementById('password-input'); // 今回は解答入力欄として使う
    const authSection = document.getElementById('auth-section');
    const mainContent = document.getElementById('main-content');
    const authMessage = document.getElementById('auth-message');
    const quizQuestionElement = document.getElementById('quiz-question'); // クイズの質問を表示する要素

    // ★★★ クイズの問題と解答のペアを設定 ★★★
    // 質問と正解の配列
   const quizzes = [
        { question: "2003年、星野仙一監督の下でリーグ優勝した際の、優勝決定試合の相手チームはどこ？", answer: "広島" },
        { question: "阪神タイガースの春季キャンプ地として、長年使用されている沖縄県の都市はどこ？", answer: "宜野座" },
        { question: "2023年に阪神がアレを決めた日は何月何日？", answer: "9月14日" },
        { question: "伝説のバックスクリーン3連発（1985年）で、最初にホームランを打った選手は誰？", answer: "バース" }
    ];


    let currentQuiz; // 現在表示されているクイズを保持する変数

    // クイズを初期表示する関数
    function displayQuiz() {
        // ランダムにクイズを選択
        const randomIndex = Math.floor(Math.random() * quizzes.length);
        currentQuiz = quizzes[randomIndex];
        quizQuestionElement.textContent = currentQuiz.question;
        passwordInput.value = ''; // 入力欄をクリア
        authMessage.textContent = ''; // エラーメッセージをクリア
    }

    // アプリ起動時にクイズを表示
    displayQuiz();

    loginButton.addEventListener('click', () => {
        const userAnswer = passwordInput.value.trim(); // 回答を取得し、前後の空白を除去

        // 大文字・小文字を区別しない、または全角半角を考慮する場合はここで変換処理を追加
        if (userAnswer === currentQuiz.answer) { // 回答が正解と一致するかチェック
            authSection.classList.add('hidden');
            mainContent.classList.remove('hidden');
            // 認証成功後、保存されたデータを読み込む
            loadAllData();
        } else {
            authMessage.textContent = 'もしかしてにわか？';
            passwordInput.value = ''; // 入力欄をクリア
            // 不正解の場合は別のクイズを出すか、同じクイズを繰り返すか、選択できます。
            // displayQuiz(); // 別のクイズを出す場合
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
    // initMap()内のplaceNameInputと連携させるため、ここではそのまま
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
    let photos = [];

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

            itineraryDateInput.value = '';
            itineraryTimeInput.value = '';
            itineraryEventInput.value = '';
        } else {
            alert('日付、時間、イベント内容をすべて入力してください。');
        }
    });

    function renderItineraries() {
        itineraryList.innerHTML = ''; // 一度クリア
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
            const selectedPlace = autocomplete.getPlace();

            let placeItem;
            if (selectedPlace && selectedPlace.name === placeName) {
                placeItem = {
                    id: Date.now(),
                    name: selectedPlace.name,
                    address: selectedPlace.formatted_address || '',
                    lat: selectedPlace.geometry ? selectedPlace.geometry.location.lat() : null,
                    lng: selectedPlace.geometry ? selectedPlace.geometry.location.lng() : null,
                    place_id: selectedPlace.place_id || ''
                };
            } else {
                placeItem = {
                    id: Date.now(),
                    name: placeName,
                    address: '',
                    lat: null,
                    lng: null,
                    place_id: ''
                };
            }

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

            if (item.lat && item.lng) {
                const mapLink = document.createElement('a');
                mapLink.href = `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}&query_place_id=${item.place_id}`;
                mapLink.textContent = ' (地図を見る)';
                mapLink.target = '_blank';
                li.querySelector('span').appendChild(mapLink);
            } else if (item.name) {
                const mapLink = document.createElement('a');
                mapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name)}`;
                mapLink.textContent = ' (地図検索)';
                mapLink.target = '_blank';
                li.querySelector('span').appendChild(mapLink);
            }

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
            const currentPhotos = [];
            let filesProcessed = 0;

            Array.from(files).forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        photoPreviewDiv.appendChild(img);
                        currentPhotos.push(e.target.result);

                        filesProcessed++;
                        if (filesProcessed === files.length) {
                            saveData(PHOTOS_KEY, currentPhotos);
                        }
                    };
                    reader.readAsDataURL(file);
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

        memoTextInput.value = loadData(MEMO_KEY, '');

        photos = loadData(PHOTOS_KEY, []);
        renderPhotos();
    }
});