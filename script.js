const mainDisplay = document.getElementById('mainDisplay');
const currentTitle = document.getElementById('currentTitle');
const backBtn = document.getElementById('backBtn');
const createFolderBtn = document.getElementById('createFolderBtn');
const addMusicBtn = document.getElementById('addMusicBtn');
const audioFile = document.getElementById('audioFile');
const audio = document.getElementById('myAudio');
const nowPlaying = document.getElementById('nowPlaying');

let folders = {}; 
let currentFolderName = null; 

// --- IndexedDB ---
const dbName = "MusicAppDB_v2";
const storeName = "musicData";
let db;

const request = indexedDB.open(dbName, 1);
request.onupgradeneeded = (e) => {
    db = e.target.result;
    db.createObjectStore(storeName);
};
request.onsuccess = (e) => {
    db = e.target.result;
    loadFromDB(); 
};

function loadFromDB() {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const getAllRequest = store.openCursor();
    folders = {};
    getAllRequest.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
            folders[cursor.key] = cursor.value;
            cursor.continue();
        } else {
            render(); 
        }
    };
}

function saveToDB(folderName) {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    if (folders[folderName]) {
        store.put(folders[folderName], folderName);
    } else {
        store.delete(folderName);
    }
}

function resetPlayer() {
    audio.pause();
    audio.src = "";
    nowPlaying.textContent = "曲を選択してください";
}

function render() {
    mainDisplay.innerHTML = '';
    
    if (currentFolderName === null) {
        currentTitle.textContent = "Music Player";
        backBtn.style.display = 'none';
        addMusicBtn.style.display = 'none';
        createFolderBtn.style.display = 'inline-block';

        Object.keys(folders).forEach(name => {
            const div = document.createElement('div');
            div.className = 'item';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'item-name';
            nameSpan.textContent = "📁 " + name;
            nameSpan.onclick = () => { currentFolderName = name; render(); };

            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.textContent = "削除"; // 文字にしました
            delBtn.onclick = (e) => {
                e.stopPropagation();
                if(confirm(`フォルダ「${name}」を削除しますか？`)) {
                    resetPlayer();
                    delete folders[name];
                    saveToDB(name); 
                    render();
                }
            };

            div.appendChild(nameSpan);
            div.appendChild(delBtn);
            mainDisplay.appendChild(div);
        });
    } else {
        currentTitle.textContent = `📁 ${currentFolderName}`;
        backBtn.style.display = 'inline-block';
        addMusicBtn.style.display = 'inline-block';
        createFolderBtn.style.display = 'none';

        const songs = folders[currentFolderName];
        songs.forEach((file, index) => {
            const div = document.createElement('div');
            div.className = 'item';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'item-name';
            nameSpan.textContent = "🎵 " + file.name;
            nameSpan.onclick = () => playMusic(file);

            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.textContent = "消去"; // 文字にしました
            delBtn.onclick = (e) => {
                e.stopPropagation();
                if(confirm(`「${file.name}」を削除しますか？`)) {
                    if (nowPlaying.textContent.includes(file.name)) {
                        resetPlayer();
                    }
                    folders[currentFolderName].splice(index, 1);
                    saveToDB(currentFolderName); 
                    render();
                }
            };

            div.appendChild(nameSpan);
            div.appendChild(delBtn);
            mainDisplay.appendChild(div);
        });
    }
}

createFolderBtn.onclick = () => {
    const name = window.prompt("フォルダ名を入力してください");
    if (name && !folders[name]) {
        folders[name] = [];
        saveToDB(name);
        render();
    }
};

addMusicBtn.onclick = () => audioFile.click();
audioFile.onchange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0 && currentFolderName) {
        folders[currentFolderName].push(...files);
        saveToDB(currentFolderName); 
        render();
        audioFile.value = '';
    }
};

backBtn.onclick = () => { currentFolderName = null; render(); };

function playMusic(file) {
    const url = URL.createObjectURL(file);
    audio.src = url;
    audio.play();
    nowPlaying.textContent = `再生中: ${file.name}`;
}
