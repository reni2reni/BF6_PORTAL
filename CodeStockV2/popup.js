let items = [];
let parentMAX = 4;
let childMAX = 4;
let parents = ["F-A", "F-B", "F-C", "F-D", "F-E", "F-F", "F-G", "F-H"];
let children = [
    ["A-0", "A-1", "A-2", "A-3", "A-4", "A-5", "A-6", "A-7"],
    ["B-0", "B-1", "B-2", "B-3", "B-4", "B-5", "B-6", "B-7"],
    ["C-0", "C-1", "C-2", "C-3", "C-4", "C-5", "C-6", "C-7"],
    ["D-0", "D-1", "D-2", "D-3", "D-4", "D-5", "D-6", "D-7"],
    ["E-0", "E-1", "E-2", "E-3", "E-4", "E-5", "E-6", "E-7"],
    ["F-0", "F-1", "F-2", "F-3", "F-4", "F-5", "F-6", "F-7"],
    ["G-0", "G-1", "G-2", "G-3", "G-4", "G-5", "G-6", "G-7"],
    ["H-0", "H-1", "H-2", "H-3", "H-4", "H-5", "H-6", "H-7"]
];
let currentColor = 0;
let filterColors = new Set([0, 1, 2, 3, 4, 5, 6, 7]);
let palette = [
    "#e74c3c",//0
    "#f39c12",//1
    "#f1c40f",//2
    "#2ecc71",//3
    "#3498db",//4
    "#9b59b6",//5
    "#666",      //6
    "#ffffff" //7
];
let currentParent = 0;
let currentChild = [0, 0, 0, 0, 0, 0, 0, 0];
let filterParent = 0;
let filterChild = [0, 0, 0, 0, 0, 0, 0, 0];
let editId = null;
let dragId = null;
let selectedIds = new Set();
let lastSelected = null;
let autoOpenedForEdit = false; // EDIT自動開閉用フラグ
let editing = false;
let saveTimer = null;
let internalClipboard = [];
let clipboardMode = null;
let cutIds = new Set();

const SAVE_DELAY = 100;
chrome.storage.local.get("SAVE_DELAY", (res) => {
    if (res.SAVE_DELAY !== undefined) {
        SAVE_DELAY = res.SAVE_DELAY;
    }
});
// storageアクセス監視フック
const originalSet = delayedSet;
function saveTabCount() {
    //saveConfig();
}


function delayedSet(data, callback) {

    const lamp =
        document.getElementById("storageLamp");

    if (lamp)
        lamp.style.background = "#ffcc00";

    if (saveTimer)
        clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {

        chrome.storage.local.set(data, () => {

            if (lamp) {

                lamp.style.background = "#ff2222";

                setTimeout(() => {
                    lamp.style.background = "#333";
                }, 200);

            }

            if (callback)
                callback();

        });

        saveTimer = null;

    }, SAVE_DELAY);

}

function renderTabs() {
    // 親タブ
    let p = document.getElementById("parentTabs");
    p.innerHTML = "";
    for (let i = 0; i < parentMAX; i++) {
        let tab = document.createElement("div");
        tab.className = "tab";
        tab.textContent = parents[i]; // フィルターで変更された名前を反映
        if (i === currentParent) tab.classList.add("active");
        tab.onclick = () => {
            currentParent = i;
            renderTabs();  // 切り替え時に再同期
        };
        p.appendChild(tab);
    }
    // 子タブ
    let c = document.getElementById("childTabs");
    c.innerHTML = "";
    for (let i = 0; i < childMAX; i++) {
        let tab = document.createElement("div");
        tab.className = "tab";
        // 入力側タブは常にフィルター側の名前と同期
        tab.textContent = children[currentParent][i] || `Child-${i}`;
        if (i === currentChild[currentParent]) tab.classList.add("active");
        tab.onclick = () => {
            currentChild[currentParent] = i;
            renderTabs();  // 切り替え時に再同期
        };
        c.appendChild(tab);
    }
    renderFilter(); // フィルター側も同期
    renderColorTabs();        //追加
    renderFilterColorTabs();  //追加
}

function renderFilter() {
    let p = document.getElementById("filterParent");
    p.innerHTML = "";
    for (let i = 0; i < parentMAX; i++) {
        let tab = document.createElement("div");
        tab.className = "tab";
        tab.textContent = parents[i];
        if (i === filterParent) tab.classList.add("active");
        tab.onclick = () => {
            filterParent = i;
            currentParent = i;                       // 入力側に反映
            currentChild[i] = filterChild[i] || 0;   // 入力側子タブも反映
            //delayedSet({ filterParent });
            renderFilter();
            renderTabs();   // 入力側タブ更新
            renderList();
        };
        tab.oncontextmenu = (e) => {
            e.preventDefault();
            showPrompt(
                e.clientX,
                e.clientY,
                "Parent folder name",
                parents[i],
                (name) => {
                    if (name && name.trim()) {
                        parents[i] = name.trim();
                        saveConfig();
                        renderFilter();
                        renderTabs();
                    }
                }
            );
        };
        p.appendChild(tab);
    }
    let c = document.getElementById("filterChild");
    c.innerHTML = "";
    for (let i = 0; i < childMAX; i++) {
        let tab = document.createElement("div");
        tab.className = "tab";
        tab.textContent = children[filterParent][i];
        if (i === filterChild[filterParent]) tab.classList.add("active");
        tab.onclick = () => {
            filterChild[filterParent] = i;
            currentChild[filterParent] = i;  // 入力側に反映
            //delayedSet({ filterChild });
            renderFilter();
            renderTabs();   // 入力側タブ更新
            renderList();
        };
        tab.oncontextmenu = (e) => {
            e.preventDefault();
            showPrompt(
                e.clientX,
                e.clientY,
                "Subfolder name",
                children[filterParent][i],
                (name) => {
                    if (name && name.trim()) {
                        children[filterParent][i] = name.trim();
                        saveConfig();
                        renderFilter();
                        renderTabs();
                    }
                }
            );
        };
        c.appendChild(tab);
    }
}
// --- Palette保存用関数 ---
function savePalette() {
    saveConfig();
}
// --- renderColorTabs ---
function renderColorTabs() {
    const box = document.getElementById("colorTabs");
    if (!box) return;
    box.innerHTML = "";
    box.style.display = inputSection.dataset.hidden === "true" ? "none" : "flex";
    box.style.gap = "4px";
    for (let i = 0; i < 8; i++) {
        let b = document.createElement("div");
        b.className = "tab";
        b.style.background = palette[i];
        b.style.width = "24px";
        b.style.height = "16px";
        if (i === currentColor) b.classList.add("active");
        b.onclick = () => {
            currentColor = i;
            renderColorTabs();
        };
        // 右クリックでPicker表示
        b.oncontextmenu = (e) => {
            e.preventDefault();
            const sysPicker = document.createElement("input");
            sysPicker.type = "color";
            sysPicker.value = palette[i];
            sysPicker.style.display = "none";
            document.body.appendChild(sysPicker);
            sysPicker.oninput = () => {
                palette[i] = sysPicker.value;
                b.style.background = palette[i];
                renderList();
            };
            sysPicker.click();
        };
        box.appendChild(b);
    }
}
// --- renderFilterColorTabs ---
function renderFilterColorTabs() {
    const box = document.getElementById("filterColorTabs");
    if (!box) return;
    box.innerHTML = "";
    box.style.display = "flex";
    box.style.gap = "4px";
    let all = document.createElement("div");
    all.className = "tab";
    all.textContent = "ALL";
    all.style.padding = "0 6px";
    all.style.fontSize = "11px";
    all.style.cursor = "pointer";
    if (filterColors.size === 8) all.classList.add("active");
    all.onclick = () => {
        if (filterColors.size === 8)
            filterColors = new Set();
        else
            filterColors = new Set([0, 1, 2, 3, 4, 5, 6, 7]);
        renderFilterColorTabs();
        renderList();
        
    };
    box.appendChild(all);
    for (let i = 0; i < 8; i++) {
        let b = document.createElement("div");
        b.className = "tab";
        b.style.background = palette[i];
        b.style.width = "24px";
        b.style.height = "16px";
        if (filterColors.has(i)) b.classList.add("active");
        b.onclick = () => {
            if (filterColors.has(i)) filterColors.delete(i);
            else filterColors.add(i);
            renderFilterColorTabs();
            renderList();
            
        };
        // 右クリックでPicker表示
        b.oncontextmenu = (e) => {
            e.preventDefault();
            const sysPicker = document.createElement("input");
            sysPicker.type = "color";
            sysPicker.value = palette[i];
            sysPicker.style.display = "none";
            document.body.appendChild(sysPicker);
            sysPicker.oninput = () => {
                palette[i] = sysPicker.value;
                b.style.background = palette[i];
                renderList();
            };
            sysPicker.onchange = () => {
                palette[i] = sysPicker.value;
                renderFilterColorTabs();
                renderColorTabs();
                savePalette(); // ここで必ず保存
                document.body.removeChild(sysPicker);
            };
            sysPicker.click();
        };
        box.appendChild(b);
    }
}

function addItem() {
    let title = document.getElementById("codeTitle").value.trim();
    let body = document.getElementById("codeBody").value;
    if (!title) return;
    if (editId) {
        let item = items.find(i => i.id === editId);
        if (item) {
            item.title = title;
            item.body = body;
            item.parent = currentParent;
            item.child = currentChild[currentParent];
            item.color = currentColor; // ★追加
        }
        editId = null;
    } else {
        items.push({
            id: crypto.randomUUID(),
            title,
            body,
            parent: currentParent,
            child: currentChild[currentParent],
            order: items.length,
            color: currentColor   // ★追加
        });
    }
    document.getElementById("codeTitle").value = "";
    document.getElementById("codeBody").value = "";
    renderList(); save();
}

const cancelBtn = document.getElementById("cancelBtn");

cancelBtn.addEventListener("click", () => {
    // 入力欄クリア
    document.getElementById("codeTitle").value = "";
    document.getElementById("codeBody").value = "";
    // 編集中なら editId をリセット
    editId = null;
    // タブを初期状態に戻す（現在の親子タブ）
    renderTabs();
});
// --- アイテム表示 ---

function renderList() {
    let list = document.getElementById("list");
    list.innerHTML = "";
    let search = document.getElementById("searchBox").value.toLowerCase();
    let filtered = items.filter(item => {
        // 親タブフィルター
        if (item.parent !== filterParent) return false;
        // 子タブフィルター
        if (item.child !== filterChild[filterParent]) return false;
        // カラーが空の場合は全て通す、それ以外はフィルター
        if (filterColors.size > 0 && !filterColors.has(item.color || 0)) return false;
        // 検索文字列
        if (!item.title.toLowerCase().includes(search)) return false;
        return true;
    });
    filtered.sort((a, b) => a.order - b.order);
    for (let item of filtered) {
        let id = String(item.id);
        let div = document.createElement("div");
        div.className = "item";
        div.dataset.id = id;
        if (cutIds.has(id)) {

            div.style.opacity = "0.4";

            div.style.border = "1px dashed #888";

        }
        let drag = document.createElement("button");
        drag.textContent = "≡";
        drag.style.width = "26px";
        drag.style.height = "22px";
        drag.style.cursor = "grab";
        drag.style.userSelect = "none";
        drag.style.border = "1px solid #555";
        drag.style.background = "#2a2a2a";
        drag.style.borderRadius = "4px";
        drag.style.fontSize = "14px";
        drag.style.padding = "0";
        drag.draggable = true;
        if (selectedIds.has(id)) {
            drag.style.background = "#4a7bd4";
            drag.style.color = "white";
        } else {
            drag.style.color = "#aaa";
        }
        drag.onmouseenter = () => {
            if (!selectedIds.has(id))
                drag.style.background = "#3a3a3a";
        };
        drag.onmouseleave = () => {
            if (!selectedIds.has(id))
                drag.style.background = "#2a2a2a";
        };
        let title = document.createElement("div");
        title.className = "itemTitle";
        title.textContent = item.title;
        title.style.borderLeft =
            "6px solid " + palette[item.color || 0];
        title.style.paddingLeft = "6px";
        let buttons = document.createElement("div");
        buttons.style.display = "flex";
        buttons.style.gap = "6px";
        buttons.style.opacity = "0";
        buttons.style.transition = "0.1s";
        let edit = document.createElement("button");
        edit.textContent = "EDIT";
        edit.className = "editBtn";
        let del = document.createElement("button");
        del.textContent = "✕";
        del.className = "delBtn";
        buttons.appendChild(edit);
        buttons.appendChild(del);
        div.appendChild(drag);
        div.appendChild(title);
        div.appendChild(buttons);
        div.onmouseenter = () => buttons.style.opacity = "1";
        div.onmouseleave = () => buttons.style.opacity = "0";
        div.onclick = (e) => {
            if (e.target === drag) return;
            if (e.target === edit) return;
            if (e.target === del) return;
            // コードコピー
            navigator.clipboard.writeText(item.body);
            // COPY OK! 表示
            const msg = document.createElement("span");
            msg.textContent = "COPY OK!";
            msg.style.marginLeft = "8px";
            msg.style.color = "#4a7bd4";
            msg.style.fontSize = "16px";
            msg.style.fontWeight = "bold";
            msg.style.transition = "opacity 0.5s";
            msg.style.opacity = "1";
            // タイトルの横に追加
            title.appendChild(msg);
            // 0.5秒でフェードアウトして削除
            setTimeout(() => {
                msg.style.opacity = "0";
                setTimeout(() => {
                    title.removeChild(msg);
                }, 500);
            }, 500);
        };
        div.oncontextmenu = (e) => {
            e.preventDefault();
            if (!selectedIds.has(id)) {
                selectedIds.clear();
                selectedIds.add(id);
                lastSelected = id;
                renderList();
            }
            showMenu(e, item);
        };
        drag.onclick = (e) => {
            e.stopPropagation();
            let group = filtered.map(i => String(i.id));
            if (e.shiftKey && lastSelected) {
                let a = group.indexOf(lastSelected);
                let b = group.indexOf(id);
                selectedIds.clear();
                let start = Math.min(a, b);
                let end = Math.max(a, b);
                for (let i = start; i <= end; i++)
                    selectedIds.add(group[i]);
            }
            else if (e.ctrlKey) {
                if (selectedIds.has(id))
                    selectedIds.delete(id);
                else
                    selectedIds.add(id);
                lastSelected = id;
            }
            else {
                // すでに選択されていたら解除
                if (selectedIds.has(id)) {
                    selectedIds.delete(id);
                    lastSelected = null;
                }
                else {
                    selectedIds.clear();
                    selectedIds.add(id);
                    lastSelected = id;
                }
            }
            renderList();
        };
        edit.onclick = (e) => {
            e.stopPropagation();
            startEdit(item);  // 新関数を呼ぶ
            document.getElementById("codeTitle").value = item.title;
            document.getElementById("codeBody").value = item.body;
            currentParent = item.parent;
            currentChild[item.parent] = item.child;
            editId = item.id;
            currentColor = item.color || 0;
            renderTabs();
        };
        del.onclick = (e) => {
            e.stopPropagation();
            // このアイテムが選択されていなければ単体削除対象に追加
            if (!selectedIds.has(String(item.id))) {
                selectedIds.clear();
                selectedIds.add(String(item.id));
            }
            // 確認ダイアログ
            showConfirm(
                e.clientX,
                e.clientY,
                "Do you want to delete it?",
                () => {
                    items = items.filter(i =>
                        !selectedIds.has(String(i.id))
                    );
                    selectedIds.clear();
                    lastSelected = null;
                    reorderAll(item.parent, item.child);
                    renderList();
                    save();
                }
            );
            return;
            // 選択中アイテムを削除
            items = items.filter(i =>
                !selectedIds.has(String(i.id))
            );
            selectedIds.clear();
            lastSelected = null;
            reorderAll(item.parent, item.child);
            renderList();
            save();
        };
        drag.ondragstart = () => {
            if (!selectedIds.has(id)) {
                selectedIds.clear();
                selectedIds.add(id);
            }
            document.querySelectorAll(".item").forEach(el => {
                if (selectedIds.has(el.dataset.id))
                    el.classList.add("dragging");
            });
        };
        drag.ondragend = () => {
            document.querySelectorAll(".item").forEach(el => {
                el.classList.remove("dragging");
                el.classList.remove("dragTarget");
            });
        };
        div.ondragover = (e) => {
            e.preventDefault();
            div.classList.add("dragTarget");
        };
        div.ondragleave = () => {
            div.classList.remove("dragTarget");
        };
        div.ondrop = (e) => {
            e.preventDefault();
            document.querySelectorAll(".item").forEach(el => {
                el.classList.remove("dragTarget");
            });
            let group = items.filter(i =>
                i.parent === filterParent &&
                i.child === filterChild[filterParent]
            );
            group.sort((a, b) => a.order - b.order);
            let moving = group.filter(i =>
                selectedIds.has(String(i.id))
            );
            if (moving.length === 0) return;
            if (selectedIds.has(id)) return;
            let targetIndex = group.findIndex(i =>
                String(i.id) === id
            );
            let targetItem = group[targetIndex];
            let removedBefore = moving.filter(i =>
                i.order < targetItem.order
            ).length;
            targetIndex -= removedBefore;
            let remain = group.filter(i =>
                !selectedIds.has(String(i.id))
            );
            remain.splice(targetIndex, 0, ...moving);
            for (let i = 0; i < remain.length; i++) {
                remain[i].order = i;
            }
            selectedIds.clear();
            lastSelected = null;
            renderList();
            save();
        };
        list.appendChild(div);
    }
    let endDrop = document.createElement("div");

    endDrop.style.height = "14px";

    endDrop.style.marginTop = "2px";
    
    // ★ここに追加
    endDrop.oncontextmenu = (e) => {

        e.preventDefault();

        showMenu(e, null);

    };

    endDrop.ondragover = (e) => {
        e.preventDefault();
        endDrop.style.borderTop = "2px solid #4a7bd4";
    };
    endDrop.ondragleave = () => {
        endDrop.style.borderTop = "none";
    };
    endDrop.ondrop = (e) => {
        e.preventDefault();
        endDrop.style.borderTop = "none";
        let group = items.filter(i =>
            i.parent === filterParent &&
            i.child === filterChild[filterParent]
        );
        group.sort((a, b) => a.order - b.order);
        let moving = group.filter(i =>
            selectedIds.has(String(i.id))
        );
        let remain = group.filter(i =>
            !selectedIds.has(String(i.id))
        );
        remain.push(...moving);
        for (let i = 0; i < remain.length; i++) {
            remain[i].order = i;
        }
        selectedIds.clear();
        lastSelected = null;
        renderList();
        save();
    };
    list.appendChild(endDrop);
}

function reorderAll(parent, child) {
    let group = items.filter(i =>
        i.parent === parent &&
        i.child === child
    );
    group.sort((a, b) => a.order - b.order);
    for (let i = 0; i < group.length; i++) {
        group[i].order = i;
    }
}

function reorder() {
    let group = items.filter(i =>
        i.parent === filterParent &&
        i.child === filterChild[filterParent]
    );
    group.sort((a, b) => a.order - b.order);
    for (let i = 0; i < group.length; i++) {
        group[i].order = i;
    }
}

function showPrompt(x, y, text, value, yes) {
    const old = document.getElementById("uiPrompt");
    if (old) old.remove();
    const list = document.getElementById("list");
    const rect = list.getBoundingClientRect();
    const box = document.createElement("div");
    box.id = "uiPrompt";
    box.style.position = "fixed";
    box.style.left = (rect.left + 10) + "px";
    box.style.top = y + "px";
    box.style.background = "#1e1e1e";
    box.style.border = "1px solid #444";
    box.style.borderRadius = "6px";
    box.style.padding = "10px";
    box.style.zIndex = 10000;
    box.style.color = "#ddd";
    box.style.fontSize = "12px";
    box.style.boxShadow = "0 4px 14px rgba(0,0,0,0.6)";
    const t = document.createElement("div");
    t.textContent = text;
    t.style.marginBottom = "6px";
    const input = document.createElement("input");
    input.value = value;
    input.style.width = "160px";
    input.style.background = "#2a2a2a";
    input.style.border = "1px solid #555";
    input.style.color = "#ddd";
    input.style.padding = "4px";
    input.style.borderRadius = "4px";
    input.style.marginBottom = "8px";
    const ok = document.createElement("button");
    ok.textContent = "OK";
    const cancel = document.createElement("button");
    cancel.textContent = "Cancel";
    [ok, cancel].forEach(b => {
        b.style.background = "#2d2d2d";
        b.style.border = "1px solid #555";
        b.style.color = "#ddd";
        b.style.padding = "4px 12px";
        b.style.marginRight = "6px";
        b.style.borderRadius = "4px";
        b.style.cursor = "pointer";
        b.onmouseenter = () => {
            b.style.background = "#3a3a3a";
        };
        b.onmouseleave = () => {
            b.style.background = "#2d2d2d";
        };
    });
    ok.onclick = () => {
        yes(input.value);
        box.remove();
    };
    cancel.onclick = () => {
        box.remove();
    };
    box.appendChild(t);
    box.appendChild(input);
    box.appendChild(ok);
    box.appendChild(cancel);
    document.body.appendChild(box);
    input.focus();
}

function showConfirm(x, y, text, yes) {
    const old = document.getElementById("uiConfirm");
    if (old) old.remove();
    const list = document.getElementById("list");
    const rect = list.getBoundingClientRect();
    const box = document.createElement("div");
    box.id = "uiConfirm";
    box.style.position = "fixed";
    box.style.left = (rect.right - 180) + "px";
    box.style.top = y + "px";
    box.style.background = "#1e1e1e";
    box.style.border = "1px solid #444";
    box.style.borderRadius = "6px";
    box.style.padding = "10px";
    box.style.zIndex = 10000;
    box.style.color = "#ddd";
    box.style.fontSize = "12px";
    box.style.boxShadow = "0 4px 14px rgba(0,0,0,0.6)";
    const t = document.createElement("div");
    t.textContent = text;
    t.style.marginBottom = "10px";
    const ok = document.createElement("button");
    ok.textContent = "OK";
    const cancel = document.createElement("button");
    cancel.textContent = "Cancel";
    [ok, cancel].forEach(b => {
        b.style.background = "#2d2d2d";
        b.style.border = "1px solid #555";
        b.style.color = "#ddd";
        b.style.padding = "4px 12px";
        b.style.marginRight = "6px";
        b.style.borderRadius = "4px";
        b.style.cursor = "pointer";
        b.onmouseenter = () => {
            b.style.background = "#3a3a3a";
        };
        b.onmouseleave = () => {
            b.style.background = "#2d2d2d";
        };
    });

    ok.onclick = () => {
        yes();
        box.remove();
    };
    cancel.onclick = () => {
        box.remove();
    };
    box.appendChild(t);
    box.appendChild(ok);
    box.appendChild(cancel);
    document.body.appendChild(box);
}

function saveItems() {
    delayedSet({ items }, () => {
        updateStorageInfo();

        const lamp =
            document.getElementById("storageLamp");

        if (!lamp) return;

        lamp.style.background = "#ff2222";

        setTimeout(() => {
            lamp.style.background = "#333";
        }, 200);
    });
}

function saveConfig() {
    delayedSet({
        parents,
        children,
        palette
    });
}

function saveUI() {
    // UI状態は保存停止中
}

function save() {
    delayedSet({ items }, () => {
        saveItems();
        const lamp =
            document.getElementById("storageLamp");
        lamp.style.background = "#ff2222";
        setTimeout(() => {
            lamp.style.background = "#333";
        }, 200);
    });

}

function showMenu(e, item) {
    const old = document.getElementById("popupMenu");
    if (old)
        old.remove();
    const menu = document.createElement("div");
    menu.id = "popupMenu";
    menu.style.position = "fixed";
    // 基本座標
    let left = e.clientX;
    let top = e.clientY;

    // ★画面右端・下端チェック
    const menuWidth = 140; // メニュー幅の想定
    const menuHeight = 200; // メニュー高さの想定
    if (left + menuWidth > window.innerWidth) left = window.innerWidth - menuWidth - 5;
    if (top + menuHeight > window.innerHeight) top = window.innerHeight - menuHeight - 5;

    menu.style.left = e.clientX + "px";
    menu.style.top = e.clientY + "px";
    menu.style.background = "#2a2a2a";
    menu.style.border = "1px solid #555";
    menu.style.zIndex = 9999;
    function add(name, fn) {
        const b = document.createElement("div");
        b.textContent = name;
        b.style.cursor = "pointer";
        b.style.padding = "6px 20px";
        b.onmouseenter = () => {
            b.style.background = "#3a3a3a";
        };
        b.onmouseleave = () => {
            b.style.background = "";
        };
        b.onclick = () => {
            fn();
            selectedIds.clear();
            lastSelected = null;
            renderList();
            menu.remove();
        };
        menu.appendChild(b);
    }
    add("Copy", () => {

        internalClipboard = items
            .filter(i => selectedIds.has(String(i.id)))
            .map(i => ({ ...i }));

        clipboardMode = "copy";

        cutIds.clear(); // ★追加

    });
    add("Cut", () => {

        internalClipboard = items
            .filter(i => selectedIds.has(String(i.id)));

        clipboardMode = "cut";

        // ★追加（暗転用）
        cutIds = new Set(
            internalClipboard.map(i => String(i.id))
        );

    });
    add("Paste", () => {

        pasteItems(item);
    });
    document.body.appendChild(menu);
    document.addEventListener("click", () => {
        if (menu)
            menu.remove();
    }, { once: true });
}

function pasteItems(target) {
    if (internalClipboard.length === 0)
        return;
    let group = items.filter(i =>
        i.parent === filterParent &&
        i.child === filterChild[filterParent]
    );
    group.sort((a, b) => a.order - b.order);

    // ★ここ修正開始
    let index;

    if (target) {

        index = group.findIndex(i =>
            String(i.id) === String(target.id)
        );

        if (index === -1)
            index = group.length;

    }
    else {

        // 空リストまたは末尾
        index = group.length;

    }
    if (index === -1)
        index = group.length;
    let insert = [];
    if (clipboardMode === "copy") {
        insert = internalClipboard.map(i => ({
            id: crypto.randomUUID(),
            title: i.title,
            body: i.body,
            parent: filterParent,
            child: filterChild[filterParent],
            order: 0,
            color: i.color
        }));
        items.push(...insert);
    }
    else {

        insert = internalClipboard;

        // ★追加（これだけ）
        insert.forEach(i => {

            i.parent = filterParent;

            i.child = filterChild[filterParent];

        });

    }
    // 一旦groupから移動対象除外
    let remain = group.filter(i =>
        !insert.includes(i)
    );
    // 挿入
    remain.splice(index, 0, ...insert);
    // order振り直し
    for (let i = 0; i < remain.length; i++) {
        let item = items.find(x => x.id === remain[i].id);
        if (item)
            item.order = i;
    }
    // CUTなら削除済みgroup外はそのまま
    if (clipboardMode === "cut") {

        internalClipboard = [];

        selectedIds.clear();

        cutIds.clear(); // ★追加

        clipboardMode = null;

    }
    renderList();
    save();
}
// --- load() で palette 読み込む ---
function load() {
    chrome.storage.local.get(
        ["items", "parents", "children", "palette"],
        (res) => {
            if (res.items) items = res.items;
            if (res.parents) parents = res.parents;
            if (res.children) children = res.children;
            
            
            if (res.palette) palette = res.palette;
            if (res.filterColors) filterColors = new Set(res.filterColors);
            // ← ここ重要: currentParent / currentChild を storage に合わせる
            currentParent = filterParent;
            for (let i = 0; i < children.length; i++) {
                currentChild[i] = filterChild[i] !== undefined ? filterChild[i] : 0;
            }
            renderTabs();
            renderFilter();
            renderColorTabs();
            renderFilterColorTabs();
            renderList();
            // 入力部の開閉状態
            const hidden = res.inputHidden === true;
            inputSection.dataset.hidden = hidden ? "true" : "false";
            parentTabs.style.display = hidden ? "none" : "flex";
            childTabs.style.display = hidden ? "none" : "flex";
            document.getElementById("colorTabs").style.display = hidden ? "none" : "flex";
            Array.from(inputSection.children).forEach((el) => {
                if (el !== toggleInputBtn) el.style.display = hidden ? "none" : "block";
            });
            toggleInputBtn.textContent = hidden ? "≡ OPEN ≡" : "≡ CLOSE ≡";
        }
    );
    updateStorageInfo();
    document.getElementById("parentSize").textContent = parentMAX;
    document.getElementById("childSize").textContent = childMAX;
}

function updateStorageInfo() {
    chrome.storage.local.getBytesInUse(null, (bytes) => {
        const kb = (bytes / 1024).toFixed(2);
        const totalKB = 5120;
        // 数値表示
        const sizeEl = document.getElementById("storageSize");
        if (sizeEl) sizeEl.textContent = `${kb} KB / ${totalKB} KB`;
        // バー表示
        const bar = document.getElementById("storageBar");
        if (bar) {
            const percent = Math.min(100, (bytes / (totalKB * 1024)) * 100);
            bar.style.width = percent + "%";
        }
    });
}
// --- 入力部の開閉 ---
const toggleInputBtn = document.getElementById("toggleInput");
const inputSection = document.getElementById("inputSection");
const parentTabs = document.getElementById("parentTabs");
const childTabs = document.getElementById("childTabs");
// --- 入力部の開閉 ---
toggleInputBtn.addEventListener("click", () => {
    const hidden = inputSection.dataset.hidden === "true";
    if (hidden) {
        // 表示
        parentTabs.style.display = "flex";
        childTabs.style.display = "flex";
        document.getElementById("colorTabs").style.display = "flex";
        Array.from(inputSection.children).forEach(el => {
            if (el !== toggleInputBtn) el.style.display = "block";
        });
        inputSection.dataset.hidden = "false";
        toggleInputBtn.textContent = "≡ CLOSE ≡";
        // 手動操作なので保存
        delayedSet({ inputHidden: false });

    } else {
        // 非表示
        parentTabs.style.display = "none";
        childTabs.style.display = "none";
        document.getElementById("colorTabs").style.display = "none";
        Array.from(inputSection.children).forEach(el => {
            if (el !== toggleInputBtn) el.style.display = "none";
        });
        inputSection.dataset.hidden = "true";
        toggleInputBtn.textContent = "≡ OPEN ≡";
        // 手動操作なので保存
        delayedSet({ inputHidden: true });
    }
});

// --- startEdit 修正 ---
function startEdit(item) {
    document.getElementById("codeTitle").value = item.title;
    document.getElementById("codeBody").value = item.body;
    currentParent = item.parent;
    currentChild[item.parent] = item.child;
    editId = item.id;
    currentColor = item.color || 0;
    renderTabs();
    renderColorTabs();
    // 入力部が閉じていたら自動で開く（保存はしない）
    const hidden = inputSection.dataset.hidden === "true";
    if (hidden) {
        parentTabs.style.display = "flex";
        childTabs.style.display = "flex";
        document.getElementById("colorTabs").style.display = "flex";
        Array.from(inputSection.children).forEach(el => {
            if (el !== toggleInputBtn) el.style.display = "block";
        });
        inputSection.dataset.hidden = "false";
        toggleInputBtn.textContent = "≡ CLOSE ≡";

        autoOpenedForEdit = true; // 自動フラグだけ設定
    } else {
        autoOpenedForEdit = false;
    }
}

// --- finishEdit 修正 ---
function finishEdit() {
    if (autoOpenedForEdit) {
        // 自動で開いた場合は閉じるだけ、保存しない
        parentTabs.style.display = "none";
        childTabs.style.display = "none";
        document.getElementById("colorTabs").style.display = "none";
        Array.from(inputSection.children).forEach(el => {
            if (el !== toggleInputBtn) el.style.display = "none";
        });
        inputSection.dataset.hidden = "true";
        toggleInputBtn.textContent = "≡ OPEN ≡";
        autoOpenedForEdit = false;
    }
    editId = null;
    document.getElementById("codeTitle").value = "";
    document.getElementById("codeBody").value = "";
    renderTabs();
}
document.addEventListener("DOMContentLoaded", () => {
    const inputSection = document.getElementById("inputSection");
    const listSection = document.getElementById("list");
    const inputCloseBtn = document.getElementById("toggleInput");
        load(); // 親子タブ数読み込み後にレンダリング
    if (!inputSection || !listSection || !inputCloseBtn) return;
});
// --- 親タブ増減 ---
document.getElementById("parentPlus").onclick = () => {
    if (parentMAX < 8) {
        parentMAX++;
        document.getElementById("parentSize").textContent = parentMAX;
        renderTabs();
        renderFilter();
        saveTabCount(); // 保存
    }
};
document.getElementById("parentMinus").onclick = () => {
    if (parentMAX > 2) {
        parentMAX--;
        document.getElementById("parentSize").textContent = parentMAX;
        renderTabs();
        renderFilter();
        saveTabCount(); // 保存
    }
};
// --- 子タブ増減 ---
document.getElementById("childPlus").onclick = () => {
    if (childMAX < 8) {
        childMAX++;
        document.getElementById("childSize").textContent = childMAX;
        renderTabs();
        renderFilter();
        saveTabCount(); // 保存
    }
};
document.getElementById("childMinus").onclick = () => {
    if (childMAX > 2) {
        childMAX--;
        document.getElementById("childSize").textContent = childMAX;
        renderTabs();
        renderFilter();
        saveTabCount(); // 保存
    }
};
const codeBody = document.getElementById("codeBody");
const codeTitle = document.getElementById("codeTitle");
// コード貼り付け時に type をタイトル欄にセット（空欄の場合のみ）
codeBody.addEventListener("paste", (e) => {
    const clipboardData = (e.clipboardData || window.clipboardData).getData('text');
    // 既にタイトル欄に入力があれば何もしない
    if (codeTitle.value.trim() !== "") return;
    try {
        const data = JSON.parse(clipboardData);
        if (data.type) {
            codeTitle.value = data.type;
        }
    } catch (err) {
        // JSON でなければ何もしない
    }
});
// すべての入力欄とクリアボタンを取得
const inputs = [
    { field: document.getElementById("codeTitle"), btn: document.getElementById("clearCodeTitle") },
    { field: document.getElementById("codeBody"), btn: document.getElementById("clearCodeBody") },
    { field: document.getElementById("searchBox"), btn: document.getElementById("clearSearchBox") }
];
// 各入力欄に input イベントを設定
inputs.forEach(({ field, btn }) => {
    const updateBtn = () => {
        if (field.value.trim() === "") {
            btn.style.display = "none";  // 空なら非表示
        } else {
            btn.style.display = "inline"; // 入力ありなら表示
        }
    };
    // ★これ追加（クリア機能）
    btn.addEventListener("click", () => {
        field.value = "";
        field.focus();
        updateBtn();
        // searchBoxだけリスト再描画
        if (field.id === "searchBox") {
            renderList();
        }
    });
    // 初期状態チェック
    updateBtn();
    // 入力が変わったらボタン表示を更新
    field.addEventListener("input", updateBtn);
});
document.getElementById("addBtn").addEventListener("click", () => {
    addItem();        // 既存処理
    finishEdit();     // 自動閉じ判定
});
document.getElementById("cancelBtn").addEventListener("click", () => {
    finishEdit();     // 自動閉じ判定
});
renderTabs(); load();
document.getElementById("openWindow").addEventListener("click", () => {
    chrome.windows.create({
        url: "popup.html",
        type: "popup",
        width: 400,
        height: 650,
        left: screen.availWidth - 500,
        top: Math.round(screen.availHeight / 2 - 400)
    });

    window.close();

    // 現在タブ取得してsidepanel閉じる
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

        if (tabs.length > 0) {

            chrome.sidePanel.setOptions({
                tabId: tabs[0].id,
                enabled: false
            });

        }

    });

    window.close();
});
// --- ボタンイベント ---
document.getElementById("addBtn").addEventListener("click", addItem);
document.getElementById("searchBox").addEventListener("input", renderList);
document.getElementById("exportBtn").addEventListener("click", () => {
    const data = {
        items: items,
        config: {
            parents: parents,
            children: children,
            filterParent: filterParent,
            filterChild: filterChild,
            palette: palette // ← ここ追加
        }
    };
    const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: "application/json" }
    );
    const a = document.createElement("a");
    const now = new Date();
    const name =
        now.getFullYear() +
        "-" + String(now.getMonth() + 1).padStart(2, "0") +
        "-" + String(now.getDate()).padStart(2, "0") +
        "_" + String(now.getHours()).padStart(2, "0") +
        "-" + String(now.getMinutes()).padStart(2, "0") +
        "-" + String(now.getSeconds()).padStart(2, "0");
    a.href = URL.createObjectURL(blob);
    a.download = "CodeStock_" + name + ".json";
    a.click();
});
document.getElementById("importBtn").addEventListener("click", () => {
    document.getElementById("importFile").click();
});
document.getElementById("importFile").addEventListener("change", (e) => {
    if (!confirm("The data will be overwritten. Do you want to continue?")) return;
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            // --- items 読み込み ---
            if (data.items) {
                items = data.items;
                items.forEach(i => {
                    if (i.color === undefined) i.color = 0;
                });
            }
            // --- config 読み込み ---
            if (data.config) {
                if (data.config.filterParent !== undefined) filterParent = data.config.filterParent;
                if (data.config.filterChild) filterChild = data.config.filterChild;
                if (data.config.parents) parents = data.config.parents;
                if (data.config.children) children = data.config.children;
                if (data.config.palette) palette = data.config.palette; // ← 追加
            }
            // --- currentParent / currentChild を storage 値に合わせる ---
            currentParent = filterParent;
            for (let i = 0; i < children.length; i++) {
                currentChild[i] = filterChild[i] !== undefined ? filterChild[i] : 0;
            }
            // --- UI 再描画 ---
            renderTabs();
            renderFilter();
            renderColorTabs();
            renderFilterColorTabs();
            renderList();
            // --- 保存は delayedSet を通す ---
            delayedSet({
                items,
                parents,
                children,
                palette
            });
            alert("IMPORT OK");
        } catch {
            alert("Loading failed");
        }
    };
    reader.readAsText(file);
});