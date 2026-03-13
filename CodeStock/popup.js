const DISPLAY_GROUPS = 8;
const DISPLAY_ITEMS_PER_GROUP = 8;

const nameInput = document.getElementById("nameInput");
const codeInput = document.getElementById("codeInput");
const saveBtn = document.getElementById("saveBtn");
const itemList = document.getElementById("itemList");
const colorPicker = document.getElementById("colorPicker");
const parentPicker = document.getElementById("parentPicker");
const filterColors = document.getElementById("filterColors");
const parentFilter = document.getElementById("parentFilter");
const searchBox = document.getElementById("searchBox");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
const toggleInputBtn = document.getElementById("toggleInputBtn");
const inputArea = document.getElementById("inputArea");
const paletteExportBtn = document.getElementById("paletteExportBtn");
const paletteImportBtn = document.getElementById("paletteImportBtn");
const paletteImportFile = document.getElementById("paletteImportFile");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const clearNameBtn = document.getElementById("clearNameBtn");
const clearCodeBtn = document.getElementById("clearCodeBtn");
const horizontalScrollAreas = ["parentPicker", "colorPicker", "parentFilter", "filterColors"];
const detachBtn = document.getElementById("detachBtn");

const baseGroupColors = [
    "#e74c3c", "#e67e22", "#f1c40f", "#2ecc71",
    "#3498db", "#9b59b6", "#fd79a8", "#ecf0f1"
];

let colors = [];
let colorLabels = [];

for (let g = 0; g < 8; g++) {
    for (let i = 0; i < 16; i++) {
        colors.push(baseGroupColors[g]);
        colorLabels.push(`${g + 1}-${i + 1}`);
    }
}

let parentLabels = Array(8).fill().map((_, i) => `Group ${i + 1}`);
const defaultColors = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#1abc9c", "#00cec9", "#3498db", "#6c5ce7", "#9b59b6", "#fd79a8", "#636e72", "#ecf0f1"];
defaultColors.forEach((c, i) => colors[i] = c);

let items = [];
let history = [];
let redoStack = [];
const MAX_HISTORY = 10;

let selectedColorIdx = 0;
let currentParentIdx = 0;
let filterParentIdx = 0;
let activeColors = new Set();
let searchText = "";
let editIndex = null;
let dragIndex = null;
let autoCloseInput = false;
let wasManuallyOpened = false;
let wasInputOriginallyHidden = false;
let saveTimer = null;

let SAVE_DELAY = 2000; 
let filterMode = 'S';  

document.addEventListener("DOMContentLoaded", init);

function init() {
    chrome.storage.local.get(
        {
            palette: null, items: [], labels: null, parentLabels: null,
            currentParentIdx: 0, filterParentIdx: 0,
            activeColors: [],
            filterMode: 'S',
            inputAreaHidden: false,
            saveDelay: 2000
        },
        data => {
            if (data.palette && data.palette.length === 128) colors = data.palette;
            if (data.labels && data.labels.length === 128) colorLabels = data.labels;
            if (data.parentLabels) parentLabels = data.parentLabels;

            currentParentIdx = data.currentParentIdx || 0;
            filterParentIdx = data.filterParentIdx || 0;
            activeColors = new Set(data.activeColors || []);
            filterMode = data.filterMode || 'S';
            SAVE_DELAY = data.saveDelay || 2000;
            items = data.items || [];
            inputArea.style.display = data.inputAreaHidden ? "none" : "block";

            refreshUI();
            updateStorageInfo();
            updateModeUI();
        }
    );

    const allSelectBtn = document.getElementById("allSelectBtn");
    if (allSelectBtn) {
        allSelectBtn.onclick = toggleAllColors;
    }
    const modeBtn = document.getElementById("modeS") || document.getElementById("modeToggle");
    if (modeBtn) {
        modeBtn.onclick = () => {
            filterMode = (filterMode === 'S') ? 'M' : 'S';
            if (filterMode === 'S') activeColors.clear();
            updateModeUI();
            applyFilter();
            saveStorageDebounced();
        };
    }
    function toggleAllColors() {
        const start = filterParentIdx * 16;
        const end = start + DISPLAY_ITEMS_PER_GROUP;
        let allActive = true;
        for (let i = start; i < end; i++) {
            if (!activeColors.has(i)) {
                allActive = false;
                break;
            }
        }

        if (allActive) {
            for (let i = start; i < end; i++) {
                activeColors.delete(i);
            }
        } else {
           if (filterMode === 'S') {
                filterMode = 'M';
                updateModeUI();
            }
            for (let i = start; i < end; i++) {
                activeColors.add(i);
            }
        }

        saveStorageDebounced();
        createFilterColors();
        applyFilter();
    }

    searchBox.addEventListener("input", () => {
        searchText = searchBox.value.toLowerCase();
        clearSearchBtn.style.display = searchText ? "block" : "none";
        applyFilter();
    });

    saveBtn.onclick = saveItem;
    undoBtn.onclick = undo;
    redoBtn.onclick = redo;
    toggleInputBtn.onclick = () => {
        const isHidden = inputArea.style.display === "none";
        const nextState = isHidden ? "block" : "none";
        inputArea.style.display = nextState;
        autoCloseInput = false;
        wasManuallyOpened = (nextState === "block");
        saveStorageDebounced();
    };


    exportBtn.onclick = exportData;
    importBtn.onclick = () => importFile.click();
    importFile.onchange = importData;
    clearSearchBtn.onclick = () => {
        searchBox.value = "";
        searchText = "";
        clearSearchBtn.style.display = "none";
        searchBox.focus();
        applyFilter();
    };

    horizontalScrollAreas.forEach(id => {
        const area = document.getElementById(id);
        if (area) {
            area.addEventListener("wheel", (e) => {
                if (e.deltaY !== 0) {
                    e.preventDefault();
                    area.scrollLeft += e.deltaY;
                }
            }, { passive: false });
        }
    });

    detachBtn.onclick = () => {
        const url = chrome.runtime.getURL("popup.html");
        const winWidth = Math.round(420);
        const winHeight = 650;
        const leftPos = Math.round(screen.availWidth - winWidth);
        const topPos = Math.round((screen.availHeight - winHeight) / 2);
        chrome.windows.create({
            url: url,
            type: "popup",
            width: winWidth,
            height: winHeight,
            left: leftPos - 20,
            top: topPos,
            focused: true
        });
        window.close();
    };

    nameInput.addEventListener("input", () => {
        clearNameBtn.style.display =
            nameInput.value ? "block" : "none";
        updateInputColorPreview();
    });
    clearNameBtn.onclick = () => {
        nameInput.value = "";
        clearNameBtn.style.display = "none";
        updateInputColorPreview();
        nameInput.focus();
    };
    codeInput.addEventListener("input", () => clearCodeBtn.style.display = codeInput.value ? "block" : "none");
    clearCodeBtn.onclick = () => { codeInput.value = ""; clearCodeBtn.style.display = "none"; codeInput.focus(); };
}

function showTooltip(e, text, dot) {
    clearAllTooltips();
    const tooltip = document.createElement("div");
    tooltip.className = "custom-tooltip";
    tooltip.textContent = text;
    const rect = dot.getBoundingClientRect();
    const isRightSide = rect.left > window.innerWidth / 2;
    tooltip.style.cssText = `
        position: fixed; top: ${rect.top - 30}px; left: ${rect.left + 10}px;
        background: #111; color: #fff; font-size: 14px; padding: 4px 8px;
        border-radius: 4px; z-index: 9999; white-space: nowrap; pointer-events: none;
        transform: translateX(${isRightSide ? '-100%' : '0%'});
    `;
    document.body.appendChild(tooltip);
    return tooltip;
}

function clearAllTooltips() {
    document.querySelectorAll(".custom-tooltip").forEach(t => t.remove());
}

function createColorPicker() {
    parentPicker.innerHTML = "";
    colorPicker.innerHTML = "";
    for (let i = 0; i < DISPLAY_GROUPS; i++) {
        const pDot = document.createElement("div");
        pDot.className = "parent-dot" + (i === currentParentIdx ? " active" : "");
        pDot.style.background = colors[i * 16];

        pDot.onclick = () => {
            currentParentIdx = i;
            createColorPicker();
        };
        pDot.oncontextmenu = (e) => {
            e.preventDefault();
            openColorPickerAt(e, i * 16, pDot);
        };
        parentPicker.appendChild(pDot);
    }

    const start = currentParentIdx * 16;
    for (let i = start; i < start + DISPLAY_ITEMS_PER_GROUP; i++) {
        const dot = document.createElement("div");
        dot.className = "color-dot" + (i === selectedColorIdx ? " active" : "");
        dot.style.background = colors[i];

        dot.onclick = () => {
            selectedColorIdx = i;
            document.querySelectorAll("#colorPicker .color-dot").forEach(d => d.classList.remove("active"));
            dot.classList.add("active");
            updateInputColorPreview();
        };
        dot.oncontextmenu = (e) => {
            e.preventDefault();
            openColorPickerAt(e, i, dot);
        };
        colorPicker.appendChild(dot);
    }

    for (let i = 0; i < DISPLAY_GROUPS; i++) {
        const pDot = document.createElement("div");
        pDot.className = "parent-dot" + (i === filterParentIdx ? " active" : "");
        pDot.style.background = colors[i * 16];
        pDot.onclick = () => {
            filterParentIdx = i;
            activeColors.clear();
            saveStorageDebounced();
            createFilterColors();
            applyFilter();
        };

        pDot.oncontextmenu = (e) => {
            e.preventDefault();
            const res = prompt("Group Name:", parentLabels[i]);
            if (res !== null) {
                parentLabels[i] = res;
                createFilterColors(); 
                saveStorageDebounced();
            }
        };

        let tooltip;
        pDot.onmouseenter = () => tooltip = showTooltip(null, parentLabels[i], pDot);
        pDot.onmouseleave = () => tooltip?.remove();

        parentFilter.appendChild(pDot);
    }
}

function openColorPickerAt(e, targetIdx, targetElement) {
    let picker = document.getElementById("hiddenColorPicker");
    if (!picker) {
        picker = document.createElement("input");
        picker.type = "color";
        picker.id = "hiddenColorPicker";
        picker.style.cssText =
            "position:absolute;width:30px;height:30px;z-index:9999;";
        document.body.appendChild(picker);
    }
    const x =
        e.clientX +
        window.scrollX;

    const y =
        e.clientY +
        window.scrollY;
    const rect =
    targetElement.getBoundingClientRect();

    picker.style.top =
        (e.pageY + 15) + "px";

    picker.style.left =
        (e.pageX - 10) + "px";

    picker.value = colors[targetIdx];
    picker.oninput = (ev) => {
        colors[targetIdx] = ev.target.value;
        targetElement.style.background = ev.target.value;
    };
    picker.onchange = () => {
        recordHistory();
        refreshUI();
        saveStorageDebounced();
    };
    requestAnimationFrame(
        () => picker.click()
    );
}

function createFilterColors() {
    parentFilter.innerHTML = "";
    filterColors.innerHTML = "";
    for (let i = 0; i < DISPLAY_GROUPS; i++) {
        const pDot = document.createElement("div");
        pDot.className = "parent-dot" + (i === filterParentIdx ? " active" : "");
        pDot.style.background = colors[i * 16];

        pDot.onclick = () => {
            filterParentIdx = i;
            activeColors.clear();
            saveStorageDebounced();
            createFilterColors();
            applyFilter();
        };

        pDot.oncontextmenu = (e) => {
            e.preventDefault();
            const res = prompt("Group Name:", parentLabels[i]);
            if (res !== null) {
                parentLabels[i] = res;
                createFilterColors(); 
                saveStorageDebounced();
            }
        };

        let tooltip;
        pDot.onmouseenter = () => tooltip = showTooltip(null, parentLabels[i], pDot);
        pDot.onmouseleave = () => tooltip?.remove();

        parentFilter.appendChild(pDot);
    }

    const startFilter = filterParentIdx * 16;
    for (let i = startFilter; i < startFilter + DISPLAY_ITEMS_PER_GROUP; i++) {
        const dot = document.createElement("div");
        dot.className = "filter-dot" + (activeColors.has(i) ? " active" : "");
        dot.style.background = colors[i];

        dot.onclick = () => {

    if (filterMode === 'S') {
        // シングル選択
        if (activeColors.has(i)) {
            activeColors.clear();
        } else {
            activeColors.clear();
            activeColors.add(i);
        }
    } else {
        // マルチ選択
        if (activeColors.has(i))
            activeColors.delete(i);
        else
            activeColors.add(i);
    }

    createFilterColors();
    applyFilter();
    saveStorageDebounced();
};

        dot.oncontextmenu = (e) => {
            e.preventDefault();
            const res = prompt("Color Name:", colorLabels[i]);
            if (res !== null) {
                colorLabels[i] = res;
                createFilterColors();
                saveStorageDebounced();
            }
        };

        let tooltip;
        dot.onmouseenter = () => tooltip = showTooltip(null, colorLabels[i], dot);
        dot.onmouseleave = () => tooltip?.remove();

        filterColors.appendChild(dot);
    }
}

function updateModeUI() {
    const modeBtn = document.getElementById("modeS") || document.getElementById("modeToggle");
    if (modeBtn) {
        modeBtn.textContent = filterMode; 
        modeBtn.style.background = (filterMode === 'S') ? "#0984e3" : "#2ecc71";
    }
}

function saveItem() {
    const name = nameInput.value.trim();
    const code = codeInput.value.trim();
    if (!name) return;
    recordHistory();
    const item = { name, code, colorIdx: selectedColorIdx };
    if (editIndex !== null) {

        items[editIndex] = item;
        editIndex = null;

    } else {

        let insertIndex = -1;

        for (let i = items.length - 1; i >= 0; i--) {
            if (items[i].colorIdx === selectedColorIdx) {
                insertIndex = i + 1;
                break;
            }
        }

        if (insertIndex === -1)
            items.push(item);
        else
            items.splice(insertIndex, 0, item);
    }
    saveAllToStorage();
    nameInput.value = "";
    codeInput.value = "";
    updateInputColorPreview();
    nameInput.value = ""; codeInput.value = "";
    clearNameBtn.style.display = "none"; clearCodeBtn.style.display = "none";
    if (autoCloseInput) inputArea.style.display = "none";
    autoCloseInput = false;

    applyFilter();
    saveStorageDebounced();
    wasManuallyOpened = false;
}

function applyFilter() {
    let list = items.map((data, originalIdx) => ({ ...data, originalIdx }));
    const groupStart = filterParentIdx * 16;
    const groupEnd = groupStart + 15;
    list = list.filter(i => i.colorIdx >= groupStart && i.colorIdx <= groupEnd);
    if (activeColors.size > 0) {
        list = list.filter(i => activeColors.has(i.colorIdx));
    }
    if (searchText) {
        list = list.filter(i => i.name.toLowerCase().includes(searchText));
    }
    renderList(list);
}

function renderList(list) {
    itemList.innerHTML = "";
    list.forEach((itemData) => {
        const item = document.createElement("div");
        item.className = "item";
        item.draggable = true;
        const color = document.createElement("div");
        color.className = "item-color drag-handle";
        color.style.background = colors[itemData.colorIdx];
        const name = document.createElement("div");
        name.className = "item-name";
        name.textContent = itemData.name;
        name.onclick = async () => {
            await navigator.clipboard.writeText(itemData.code);
            item.classList.add("copied");
            setTimeout(() => item.classList.remove("copied"), 500);
        };
        const buttons = document.createElement("div");
        buttons.className = "item-buttons";
        const edit = document.createElement("button"); edit.textContent = "EDIT";
        const del = document.createElement("button"); del.textContent = "X";
        edit.onclick = () => {

            wasInputOriginallyHidden = (inputArea.style.display === "none");

            nameInput.value = itemData.name;
            codeInput.value = itemData.code;
            selectedColorIdx = itemData.colorIdx;
            currentParentIdx = Math.floor(selectedColorIdx / 16);
            editIndex = itemData.originalIdx;
            inputArea.style.display = "block";
            autoCloseInput = wasInputOriginallyHidden;
            refreshUI();
            updateInputColorPreview();
        };
        del.onclick = () => {
            recordHistory();
            items.splice(itemData.originalIdx, 1);
            applyFilter();
            saveStorageDebounced();
        };
        buttons.append(edit, del);
        item.append(color, name, buttons);
        itemList.appendChild(item);
        item.addEventListener("dragstart", () => { dragIndex = itemData.originalIdx; item.classList.add("dragging"); });
        item.addEventListener("dragend", () => {
            document.querySelectorAll(".item").forEach(i => {
                i.classList.remove("dragging");
                i.classList.remove("drag-over");
            });
        });
        item.addEventListener("dragover", e => {
            e.preventDefault();
            if (dragIndex !== itemData.originalIdx) item.classList.add("drag-over");
        });
        item.addEventListener("dragleave", () => { item.classList.remove("drag-over"); });
        item.addEventListener("drop", e => {
            e.preventDefault();
            item.classList.remove("drag-over");
            if (dragIndex === itemData.originalIdx || dragIndex === null) return;
            recordHistory();
            const moved = items.splice(dragIndex, 1)[0];
            items.splice(itemData.originalIdx, 0, moved);
            dragIndex = null;
            saveAllToStorage(); applyFilter();
        });
    });
}

function refreshUI() {
    createColorPicker();
    createFilterColors();
    applyFilter();
    updateUndoRedoButtons();
}

function saveAllToStorage() {
    chrome.storage.local.set({
        items,
        palette: colors,
        labels: colorLabels,
        parentLabels: parentLabels,
        filterMode: filterMode 
    });
    updateStorageInfo();
}

function recordHistory() {
    history.push({ items: JSON.parse(JSON.stringify(items)), palette: [...colors] });
    if (history.length > MAX_HISTORY) history.shift();
    redoStack = [];
    updateUndoRedoButtons();
}

function undo() {
    if (history.length === 0) return;
    redoStack.push({ items: JSON.parse(JSON.stringify(items)), palette: [...colors] });
    const prev = history.pop();
    items = prev.items; colors = prev.palette;
    refreshUI();
    saveStorageDebounced();
}

function redo() {
    if (redoStack.length === 0) return;
    history.push({ items: JSON.parse(JSON.stringify(items)), palette: [...colors] });
    const next = redoStack.pop();
    items = next.items; colors = next.palette;
    refreshUI();
    saveStorageDebounced();
}

function updateUndoRedoButtons() {
    undoBtn.disabled = history.length === 0;
    redoBtn.disabled = redoStack.length === 0;
}

function updateStorageInfo() {
    chrome.storage.local.getBytesInUse(null, (bytes) => {
        const percent = (bytes / (5 * 1024 * 1024)) * 100;
        const bar = document.getElementById("storageBar");
        if (bar) bar.style.width = Math.min(percent, 100) + "%";
        document.getElementById("storageText").textContent = `${(bytes / 1024).toFixed(1)} KB / 5120 KB`;
    });
}

function exportData() {
    const data = JSON.stringify({ items, colors, colorLabels, parentLabels }, null, 2);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    a.download = "codestocker_full.json";
    a.click();
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);
            if (Array.isArray(data)) items = data;
            else { items = data.items; colors = data.colors; colorLabels = data.colorLabels; parentLabels = data.parentLabels; }
            saveAllToStorage(); refreshUI();
            alert("Success");
        } catch (err) { alert("Failed"); }
    };
    reader.readAsText(file);
}

document.getElementById("cancelBtn").addEventListener("click", () => {
    nameInput.value = "";
    codeInput.value = "";
    clearNameBtn.style.display = "none";
    clearCodeBtn.style.display = "none";
    editIndex = null;
    if (autoCloseInput) {
        inputArea.style.display = "none";
    }
    autoCloseInput = false;

    updateInputColorPreview();
});

paletteExportBtn.onclick = () => {
    const data = { colors, colorLabels, parentLabels };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: "application/json" }));
    a.download = "color_palette_128.pal";
    a.click();
};

paletteImportBtn.onclick = () => paletteImportFile.click();
paletteImportFile.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);
            colors = data.colors; colorLabels = data.colorLabels; parentLabels = data.parentLabels;
            saveAllToStorage(); refreshUI();
        } catch (err) { alert("Invalid .pal"); }
    };
    reader.readAsText(file);
};

function saveStorageDebounced() {
    updateSaveIndicator('waiting');
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        saveImmediately();
    }, SAVE_DELAY);
}

function saveImmediately() {
    updateSaveIndicator('saving');

    const data = {
        items,
        palette: colors,
        labels: colorLabels,
        parentLabels: parentLabels,
        filterMode,
        currentParentIdx,
        filterParentIdx,
        activeColors: Array.from(activeColors),
        inputAreaHidden: (inputArea.style.display === "none"),
        saveDelay: SAVE_DELAY
    };

    chrome.storage.local.set(data, () => {
        updateStorageInfo();
        updateSaveIndicator('done');
        saveTimer = null;
    });
}

function updateSaveIndicator(status) {
    const dot = document.getElementById("saveDot");
    const label = document.getElementById("saveLabel");
    if (!dot || !label) return;

    switch (status) {
        case 'waiting':
            dot.style.background = "#f1c40f";
            label.textContent = "WAITING";
            label.style.color = "#f1c40f";
            break;
        case 'saving':
            dot.style.background = "#e74c3c";
            label.textContent = "SAVING";
            label.style.color = "#e74c3c";
            break;
        case 'done':
            dot.style.background = "#2ecc71";
            label.textContent = "SAVED";
            label.style.color = "#2ecc71";
            setTimeout(() => {
                if (!saveTimer) {
                    dot.style.background = "#444";
                    label.textContent = "READY";
                    label.style.color = "#666";
                }
            }, 2000);
            break;
    }
}
function saveAllToStorage() {
    saveStorageDebounced();
}
function updateInputColorPreview() {
    const preview = document.getElementById("selectedColorPreview");
    if (!preview) return;

    if (!nameInput.value.trim() && editIndex === null) {
        preview.style.background = "transparent";
        preview.style.borderColor = "#555";
    } else {
        preview.style.background = colors[selectedColorIdx];
        preview.style.borderColor = "#eee"; 
    }
}
window.addEventListener("beforeunload", () => {
    if (saveTimer) {
        clearTimeout(saveTimer);
        saveImmediately();
    }
});
const saveDot = document.getElementById("saveDot");
const saveLabel = document.getElementById("saveLabel");

function changeSaveDelay() {

    const res = prompt(
        "Save delay (ms)",
        SAVE_DELAY
    );

    if (res === null) return;

    const num = parseInt(res);

    if (isNaN(num) || num < 0) {
        alert("Invalid number");
        return;
    }

    SAVE_DELAY = num;

    chrome.storage.local.set({
        saveDelay: SAVE_DELAY
    });

    updateSaveIndicator('done');

}

if (saveDot)
    saveDot.onclick = changeSaveDelay;

if (saveLabel)
    saveLabel.onclick = changeSaveDelay;