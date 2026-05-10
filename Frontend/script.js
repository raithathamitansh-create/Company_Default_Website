let allData = [];
let visibleData = [];
let pageData = [];
let sortState = {
    key: "",
    direction: "asc"
};
let currentPage = 1;
let rowsPerPage = 5;
let editingEntryId = null;

// ================= STATE (Single Source of Truth) =================
const state = {
    product: "",
    quantity: 1,
    price: 0,
    total: 0
};

// ================= BASE =================
const BASE_URL = window.APP_CONFIG?.API_BASE_URL || (
    window.location.hostname === "localhost"
        ? "http://localhost:5000"
        : "https://company-default-website.onrender.com"
);

// ================= AUTH =================
const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "Login.html";
}

// ================= ELEMENTS =================
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const productInput = document.getElementById("product");
const quantityInput = document.getElementById("quantity");
const priceInput = document.getElementById("price");
const totalInput = document.getElementById("total");
const addBtn = document.getElementById("addBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const tableBody = document.querySelector("#dataTable tbody");
const logoutBtn = document.getElementById("logoutBtn");
const addIcon = document.getElementById("addIcon");
const exportBtn = document.getElementById("exportBtn");
const shareBtn = document.getElementById("shareBtn");
const whatsappBtn = document.getElementById("whatsappBtn");
const mailBtn = document.getElementById("mailBtn");
const driveBtn = document.getElementById("driveBtn");
const copyBtn = document.getElementById("copyBtn");
const shareStatus = document.getElementById("shareStatus");
const sortProductBtn = document.getElementById("sortProductBtn");
const sortQuantityBtn = document.getElementById("sortQuantityBtn");
const sortPriceBtn = document.getElementById("sortPriceBtn");
const clearSortBtn = document.getElementById("clearSortBtn");
const tableSummary = document.getElementById("tableSummary");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const paginationInfo = document.getElementById("paginationInfo");
const pageSizeSelect = document.getElementById("pageSizeSelect");
const minPriceFilter = document.getElementById("minPriceFilter");
const maxPriceFilter = document.getElementById("maxPriceFilter");
const minQuantityFilter = document.getElementById("minQuantityFilter");
const maxQuantityFilter = document.getElementById("maxQuantityFilter");
const dateFromFilter = document.getElementById("dateFromFilter");
const dateToFilter = document.getElementById("dateToFilter");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const totalProductsStat = document.getElementById("totalProductsStat");
const totalQuantityStat = document.getElementById("totalQuantityStat");
const totalAmountStat = document.getElementById("totalAmountStat");
const highestPriceProductStat = document.getElementById("highestPriceProductStat");
const toast = document.getElementById("toast");
const confirmModal = document.getElementById("confirmModal");
const confirmMessage = document.getElementById("confirmMessage");
const confirmCancelBtn = document.getElementById("confirmCancelBtn");
const confirmOkBtn = document.getElementById("confirmOkBtn");

// ================= FEEDBACK =================
function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

function showConfirm(message) {
    confirmMessage.textContent = message;
    confirmModal.classList.add("open");
    confirmModal.setAttribute("aria-hidden", "false");

    return new Promise(resolve => {
        function close(result) {
            confirmModal.classList.remove("open");
            confirmModal.setAttribute("aria-hidden", "true");
            confirmOkBtn.removeEventListener("click", onConfirm);
            confirmCancelBtn.removeEventListener("click", onCancel);
            resolve(result);
        }

        function onConfirm() {
            close(true);
        }

        function onCancel() {
            close(false);
        }

        confirmOkBtn.addEventListener("click", onConfirm);
        confirmCancelBtn.addEventListener("click", onCancel);
    });
}

// ================= LOGOUT =================
logoutBtn.addEventListener("click", async () => {
    const confirmed = await showConfirm("Are you sure you want to logout?");

    if (confirmed) {
        localStorage.removeItem("token");
        window.location.href = "Login.html";
    }
});

// ================= RENDER (State -> UI) =================
function render() {
    productInput.value = state.product;
    quantityInput.value = state.quantity;
    priceInput.value = state.price;
    totalInput.value = state.total;
}

function calculateTotal() {
    state.total = state.quantity * state.price;
}

productInput.addEventListener("input", () => {
    state.product = productInput.value;
});

quantityInput.addEventListener("input", () => {
    state.quantity = Number(quantityInput.value);
    calculateTotal();
    render();
});

priceInput.addEventListener("input", () => {
    state.price = Number(priceInput.value);
    calculateTotal();
    render();
});

// ================= VALIDATION =================
function validateInputs() {
    if (!state.product.trim()) {
        showToast("Product name is required.");
        productInput.focus();
        return false;
    }

    if (state.product.length > 10) {
        showToast("Product must not exceed 10 characters.");
        productInput.focus();
        return false;
    }

    if (!Number.isInteger(state.quantity) || state.quantity < 1 || state.quantity > 50) {
        showToast("Quantity must be between 1 and 50.");
        quantityInput.focus();
        return false;
    }

    if (state.price <= 0) {
        showToast("Price must be greater than 0.");
        priceInput.focus();
        return false;
    }

    return true;
}

// ================= LOAD DATA =================
function resetPageAndLoad() {
    currentPage = 1;
    applyTableView();
}

async function loadData() {
    tableBody.innerHTML = `<tr><td colspan="7">Loading products...</td></tr>`;

    try {
        const res = await fetch(`${BASE_URL}/entries`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const payload = await res.json();

        if (!res.ok) {
            showToast(payload.message || "Error fetching data.");
            return;
        }

        allData = Array.isArray(payload) ? payload : [];
        applyTableView();

    } catch (error) {
        console.log("Load Error:", error);
        tableBody.innerHTML = `<tr><td colspan="7">Unable to load products.</td></tr>`;
        showToast("Unable to load products.");
    }
}

function getFilteredData() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const minPrice = Number(minPriceFilter.value);
    const maxPrice = Number(maxPriceFilter.value);
    const minQuantity = Number(minQuantityFilter.value);
    const maxQuantity = Number(maxQuantityFilter.value);
    const dateFrom = dateFromFilter.value;
    const dateTo = dateToFilter.value;

    return allData.filter(item => {
        const product = String(item.product || "").toLowerCase();
        const quantity = Number(item.quantity || 0);
        const price = Number(item.price || 0);
        const total = Number(item.total || 0);
        const createdDate = item.created_at ? new Date(item.created_at).toISOString().slice(0, 10) : "";
        const matchesSearch = !searchTerm || [product, quantity, price, total].some(value =>
            String(value).toLowerCase().includes(searchTerm)
        );

        return matchesSearch
            && (!minPriceFilter.value || price >= minPrice)
            && (!maxPriceFilter.value || price <= maxPrice)
            && (!minQuantityFilter.value || quantity >= minQuantity)
            && (!maxQuantityFilter.value || quantity <= maxQuantity)
            && (!dateFrom || createdDate >= dateFrom)
            && (!dateTo || createdDate <= dateTo);
    });
}

function getSortedData(data) {
    if (!sortState.key) return [...data];

    const sortedData = [...data].sort((firstItem, secondItem) => {
        if (sortState.key === "product") {
            return String(firstItem.product).localeCompare(
                String(secondItem.product),
                undefined,
                { sensitivity: "base" }
            );
        }

        return Number(firstItem[sortState.key]) - Number(secondItem[sortState.key]);
    });

    return sortState.direction === "desc" ? sortedData.reverse() : sortedData;
}

function getTotalPages(rowCount) {
    return Math.max(1, Math.ceil(rowCount / rowsPerPage));
}

function getCurrentPageData(data) {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return data.slice(startIndex, startIndex + rowsPerPage);
}

function applyTableView() {
    visibleData = getSortedData(getFilteredData());
    currentPage = Math.min(currentPage, getTotalPages(visibleData.length));
    pageData = getCurrentPageData(visibleData);

    updateDashboard();
    updateSortButtons();
    updateTableSummary();
    updatePagination();
    renderTable();
}

function updateDashboard() {
    const totalQuantity = visibleData.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const totalAmount = visibleData.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const highestPriceProduct = visibleData.reduce((highest, item) => {
        if (!highest || Number(item.price || 0) > Number(highest.price || 0)) return item;
        return highest;
    }, null);

    totalProductsStat.textContent = visibleData.length;
    totalQuantityStat.textContent = totalQuantity;
    totalAmountStat.textContent = totalAmount;
    highestPriceProductStat.textContent = highestPriceProduct?.product || "-";
}

function updateTableSummary() {
    const totalRows = visibleData.length;

    tableSummary.textContent = totalRows
        ? `${totalRows} matching rows`
        : "No rows to show";
}

function updatePagination() {
    const totalPages = getTotalPages(visibleData.length);
    const hasRows = visibleData.length > 0;
    const pageStart = hasRows ? (currentPage - 1) * rowsPerPage + 1 : 0;
    const pageEnd = Math.min(currentPage * rowsPerPage, visibleData.length);

    paginationInfo.textContent = hasRows
        ? `Page ${currentPage} of ${totalPages} | Showing ${pageStart}-${pageEnd} of ${visibleData.length}`
        : "Page 1 of 1 | Showing 0 rows";

    prevPageBtn.disabled = currentPage <= 1 || !hasRows;
    nextPageBtn.disabled = currentPage >= totalPages || !hasRows;
    pageSizeSelect.value = String(rowsPerPage);
}

function getSortLabel(key, ascendingText, descendingText) {
    if (sortState.key !== key) return ascendingText;

    return sortState.direction === "asc" ? descendingText : ascendingText;
}

function updateSortButtons() {
    sortProductBtn.textContent = getSortLabel("product", "Sort Product A-Z", "Sort Product Z-A");
    sortQuantityBtn.textContent = getSortLabel("quantity", "Sort Quantity Low-High", "Sort Quantity High-Low");
    sortPriceBtn.textContent = getSortLabel("price", "Sort Price Low-High", "Sort Price High-Low");

    [sortProductBtn, sortQuantityBtn, sortPriceBtn].forEach(button => {
        button.classList.remove("active-sort");
    });

    if (sortState.key === "product") sortProductBtn.classList.add("active-sort");
    if (sortState.key === "quantity") sortQuantityBtn.classList.add("active-sort");
    if (sortState.key === "price") sortPriceBtn.classList.add("active-sort");
}

function setSort(key) {
    if (sortState.key === key) {
        sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
    } else {
        sortState.key = key;
        sortState.direction = "asc";
    }

    resetPageAndLoad();
}

function clearSort() {
    sortState.key = "";
    sortState.direction = "asc";
    resetPageAndLoad();
}

function formatDate(value) {
    if (!value) return "-";

    return new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function renderTable() {
    if (pageData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7">No products found.</td></tr>`;
        return;
    }

    tableBody.innerHTML = pageData.map((item, index) => {
        const rowNumber = (currentPage - 1) * rowsPerPage + index + 1;

        return `
            <tr>
                <td>${rowNumber}</td>
                <td>${escapeHtml(String(item.product))}</td>
                <td>${escapeHtml(String(item.quantity))}</td>
                <td>${escapeHtml(String(item.price))}</td>
                <td>${escapeHtml(String(item.total))}</td>
                <td>${escapeHtml(formatDate(item.created_at))}</td>
                <td>
                    <span class="edit-btn" onclick="startEdit(${item.id})">Edit</span>
                    <span class="delete-btn" onclick="deleteEntry(${item.id})">Delete</span>
                </td>
            </tr>
        `;
    }).join("");
}

searchBtn.addEventListener("click", resetPageAndLoad);
searchInput.addEventListener("input", resetPageAndLoad);
sortProductBtn.addEventListener("click", () => setSort("product"));
sortQuantityBtn.addEventListener("click", () => setSort("quantity"));
sortPriceBtn.addEventListener("click", () => setSort("price"));
clearSortBtn.addEventListener("click", clearSort);

[minPriceFilter, maxPriceFilter, minQuantityFilter, maxQuantityFilter, dateFromFilter, dateToFilter].forEach(input => {
    input.addEventListener("input", resetPageAndLoad);
});

clearFiltersBtn.addEventListener("click", () => {
    minPriceFilter.value = "";
    maxPriceFilter.value = "";
    minQuantityFilter.value = "";
    maxQuantityFilter.value = "";
    dateFromFilter.value = "";
    dateToFilter.value = "";
    resetPageAndLoad();
});

prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage -= 1;
        applyTableView();
    }
});

nextPageBtn.addEventListener("click", () => {
    if (currentPage < getTotalPages(visibleData.length)) {
        currentPage += 1;
        applyTableView();
    }
});

pageSizeSelect.addEventListener("change", () => {
    rowsPerPage = Number(pageSizeSelect.value);
    resetPageAndLoad();
});

// ================= SHARE / EXPORT TABLE =================
const tableHeaders = ["#", "Product", "Quantity", "Price", "Total", "Date"];

function escapeHtml(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeExcelCell(value) {
    return value
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function getVisibleTableRows() {
    return pageData.map((item, index) => [
        (currentPage - 1) * rowsPerPage + index + 1,
        item.product,
        item.quantity,
        item.price,
        item.total,
        formatDate(item.created_at)
    ]);
}

function showShareStatus(message) {
    shareStatus.textContent = message;

    window.clearTimeout(showShareStatus.timer);
    showShareStatus.timer = window.setTimeout(() => {
        shareStatus.textContent = "";
    }, 3500);
}

function hasShareableRows() {
    if (getVisibleTableRows().length > 0) return true;

    showShareStatus("No table data available to share.");
    return false;
}

function formatTableAsText() {
    const rows = getVisibleTableRows();
    const lines = [
        "Product Table",
        tableHeaders.join(" | "),
        ...rows.map(row => row.join(" | "))
    ];

    return lines.join("\n");
}

function escapeCsvValue(value) {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function formatTableAsCsv() {
    const rows = [tableHeaders, ...getVisibleTableRows()];
    return rows.map(row => row.map(escapeCsvValue).join(",")).join("\n");
}

function createTableFile(type = "csv") {
    if (type === "excel") {
        const rows = [tableHeaders, ...getVisibleTableRows()];
        const tableHtml = rows.map((row, index) => {
            const tagName = index === 0 ? "th" : "td";
            return `<tr>${row.map(cell =>
                `<${tagName}>${escapeExcelCell(cell)}</${tagName}>`
            ).join("")}</tr>`;
        }).join("");

        const workbook = `
            <html>
                <head><meta charset="UTF-8"></head>
                <body>
                    <table>${tableHtml}</table>
                </body>
            </html>
        `;

        return new File([workbook], "product-table.xls", {
            type: "application/vnd.ms-excel"
        });
    }

    return new File([formatTableAsCsv()], "product-table.csv", {
        type: "text/csv"
    });
}

function downloadFile(file) {
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
}

function exportVisibleTableToExcel() {
    if (!hasShareableRows()) return;

    downloadFile(createTableFile("excel"));
    showShareStatus("Excel file downloaded.");
}

async function shareTable() {
    if (!hasShareableRows()) return;

    const file = createTableFile("csv");
    const shareDataWithFile = {
        title: "Product Table",
        text: "Sharing the current product table.",
        files: [file]
    };

    try {
        if (navigator.canShare && navigator.canShare(shareDataWithFile)) {
            await navigator.share(shareDataWithFile);
            showShareStatus("Table shared.");
            return;
        }

        if (navigator.share) {
            await navigator.share({
                title: "Product Table",
                text: formatTableAsText()
            });
            showShareStatus("Table shared.");
            return;
        }

        await copyTableToClipboard();
        showShareStatus("Sharing is not supported here, so the table was copied.");
    } catch (error) {
        if (error.name !== "AbortError") {
            showShareStatus("Unable to open the share menu.");
        }
    }
}

function shareTableToWhatsapp() {
    if (!hasShareableRows()) return;

    const message = encodeURIComponent(formatTableAsText());
    window.open(`https://wa.me/?text=${message}`, "_blank", "noopener");
}

function shareTableByEmail() {
    if (!hasShareableRows()) return;

    const subject = encodeURIComponent("Product Table");
    const body = encodeURIComponent(formatTableAsText());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

function shareTableToDrive() {
    if (!hasShareableRows()) return;

    downloadFile(createTableFile("csv"));
    window.open("https://drive.google.com/drive/my-drive", "_blank", "noopener");
    showShareStatus("CSV downloaded. Upload it in the Drive tab that opened.");
}

async function copyTableToClipboard() {
    if (!hasShareableRows()) return;

    const text = formatTableAsText();

    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
    } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
    }

    showShareStatus("Table copied to clipboard.");
}

exportBtn.addEventListener("click", exportVisibleTableToExcel);
shareBtn.addEventListener("click", shareTable);
whatsappBtn.addEventListener("click", shareTableToWhatsapp);
mailBtn.addEventListener("click", shareTableByEmail);
driveBtn.addEventListener("click", shareTableToDrive);
copyBtn.addEventListener("click", copyTableToClipboard);

// ================= ADD / UPDATE ENTRY =================
addBtn.addEventListener("click", async () => {

    if (!validateInputs()) return;

    try {
        const url = editingEntryId
            ? `${BASE_URL}/update-entry/${editingEntryId}`
            : `${BASE_URL}/add-entry`;
        const method = editingEntryId ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(state)
        });

        const result = await response.json();

        if (!response.ok) {
            showToast(result.message || "Unable to save entry.");
            return;
        }

        showToast(editingEntryId ? "Entry updated." : "Entry added.");
        clearFields();
        loadData();

    } catch (error) {
        console.log("Fetch Error:", error);
        showToast("Unable to save entry.");
    }
});

function startEdit(id) {
    const item = allData.find(entry => Number(entry.id) === Number(id));
    if (!item) return;

    editingEntryId = id;
    state.product = item.product;
    state.quantity = Number(item.quantity);
    state.price = Number(item.price);
    calculateTotal();
    render();
    addBtn.textContent = "Update";
    cancelEditBtn.style.display = "block";
    productInput.focus();
}

cancelEditBtn.addEventListener("click", clearFields);

// ================= DELETE =================
async function deleteEntry(id) {
    const confirmed = await showConfirm("Delete this entry?");
    if (!confirmed) return;

    try {
        const response = await fetch(`${BASE_URL}/delete-entry/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            showToast("Unable to delete entry.");
            return;
        }

        showToast("Entry deleted.");
        loadData();

    } catch (error) {
        console.log("Delete Error:", error);
        showToast("Unable to delete entry.");
    }
}

// ================= CLEAR =================
function clearFields() {
    editingEntryId = null;
    state.product = "";
    state.quantity = 1;
    state.price = 0;
    state.total = 0;

    addBtn.textContent = "Add";
    cancelEditBtn.style.display = "none";
    render();
    productInput.focus();
}

// ================= ENTER NAVIGATION =================
productInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        quantityInput.focus();
    }
});

quantityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        priceInput.focus();
    }
});

priceInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        calculateTotal();
        render();
        addBtn.click();
    }
});

// ================= PLUS ICON =================
if (addIcon) {
    addIcon.addEventListener("click", () => {
        clearFields();
        productInput.focus();
    });
}


// ================= INIT =================
render();
loadData();

// ================= CHATBOT LOGIC =================
const chatbotToggleBtn = document.getElementById("chatbotToggleBtn");
const chatbotWindow = document.getElementById("chatbotWindow") || document.getElementById("chatbot-window");
const closeChatBtn = document.getElementById("closeChatBtn");
const chatbotMessages = document.getElementById("chatbot-messages");
const chatbotInput = document.getElementById("chatbotInput");
const sendChatBtn = document.getElementById("sendChatBtn");
const suggestionBtns = document.querySelectorAll(".suggestion-btn");

const responses = {
    add: "To add a product, use the form in the <b>Enter Details</b> sidebar. Fill in the Product name, Quantity, and Price, then click <b>Add</b>. You can also use the <b>+</b> icon in the top right to clear the form and start fresh.",
    export: "You can export your inventory data to Excel or CSV using the <b>Export Excel</b> button above the table. Other sharing options like WhatsApp, Mail, and Google Drive are also available.",
    filter: "Use the filter inputs above the table to narrow down your inventory by <b>Price</b>, <b>Quantity</b>, or <b>Date Range</b>. The table and statistics will update automatically as you type.",
    sort: "Click the sort buttons above the table to organize your products by <b>Name (A-Z)</b>, <b>Quantity</b>, or <b>Price</b>. Clicking the same button again will reverse the sort order.",
    default: "I'm here to help! You can ask about adding products, exporting data, filtering, or sorting. Or just click one of the suggestions below."
};

function toggleChat() {
    const isOpen = chatbotWindow.classList.toggle("open");
    chatbotWindow.setAttribute("aria-hidden", !isOpen);
}

function addMessage(text, isAssistant = true) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${isAssistant ? "assistant" : "user"}`;
    msgDiv.innerHTML = text;
    chatbotMessages.appendChild(msgDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

function handleBotResponse(question) {
    // Show typing indicator (simple version)
    const typingDiv = document.createElement("div");
    typingDiv.className = "message assistant typing";
    typingDiv.textContent = "...";
    chatbotMessages.appendChild(typingDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

    setTimeout(() => {
        typingDiv.remove();
        const response = responses[question] || responses.default;
        addMessage(response);
    }, 800);
}

chatbotToggleBtn.addEventListener("click", toggleChat);
closeChatBtn.addEventListener("click", toggleChat);

sendChatBtn.addEventListener("click", () => {
    const text = chatbotInput.value.trim().toLowerCase();
    if (!text) return;

    addMessage(chatbotInput.value, false);
    chatbotInput.value = "";

    let matched = "default";
    if (text.includes("add")) matched = "add";
    else if (text.includes("export") || text.includes("excel") || text.includes("share")) matched = "export";
    else if (text.includes("filter") || text.includes("search")) matched = "filter";
    else if (text.includes("sort")) matched = "sort";

    handleBotResponse(matched);
});

chatbotInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendChatBtn.click();
});

suggestionBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        const question = btn.getAttribute("data-question");
        addMessage(btn.textContent, false);
        handleBotResponse(question);
    });
});

