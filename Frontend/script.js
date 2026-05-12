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
let selectedIds = new Set();
let categoryChart = null;
let stockChart = null;
let activeCategory = "All";

// ================= STATE (Single Source of Truth) =================
const state = {
    product: "",
    quantity: 1,
    price: 0,
    total: 0,
    category: "General",
    image_url: "",
    currency: "INR"
};

const currencyConfig = {
    INR: { symbol: "₹", locale: "en-IN" },
    USD: { symbol: "$", locale: "en-US" },
    EUR: { symbol: "€", locale: "de-DE" },
    GBP: { symbol: "£", locale: "en-GB" }
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
const categorySelect = document.getElementById("categorySelect");
const imageUrlInput = document.getElementById("imageUrl");
const currencySelect = document.getElementById("currencySelect");
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
const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
const selectAllCheckbox = document.getElementById("selectAll");
const themeToggle = document.getElementById("themeToggle");
const importBtn = document.getElementById("importBtn");
const csvFileInput = document.getElementById("csvFileInput");
const showHistoryBtn = document.getElementById("showHistoryBtn");
const historyModal = document.getElementById("historyModal");
const historyList = document.getElementById("historyList");
const closeHistoryBtn = document.getElementById("closeHistoryBtn");
const categoryTabsContainer = document.getElementById("categoryTabs");
const voiceBtn = document.getElementById("voiceBtn");
const deleteAccountBtn = document.getElementById("deleteAccountBtn");
const startTourBtn = document.getElementById("startTourBtn");
const topCategoryPulse = document.getElementById("topCategoryPulse");
const restockPulse = document.getElementById("restockPulse");
const healthPulse = document.getElementById("healthPulse");
const toggleFiltersBtn = document.getElementById("toggleFiltersBtn");
const filterPanel = document.getElementById("filterPanel");


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

// ================= THEME =================
function initTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
    themeToggle.textContent = theme === "dark" ? "🌙" : "☀️";
}

themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);
    updateCharts(); // Refresh charts to match theme
});

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
    categorySelect.value = state.category;
    imageUrlInput.value = state.image_url;
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

categorySelect.addEventListener("change", () => {
    state.category = categorySelect.value;
});

imageUrlInput.addEventListener("input", () => {
    state.image_url = imageUrlInput.value;
});

currencySelect.addEventListener("change", () => {
    state.currency = currencySelect.value;
    applyTableView();
});

function formatCurrency(amount) {
    const config = currencyConfig[state.currency];
    return new Intl.NumberFormat(config.locale, {
        style: "currency",
        currency: state.currency,
        minimumFractionDigits: 0
    }).format(amount);
}

// ================= VALIDATION =================
function validateInputs() {
    if (!state.product.trim()) {
        showToast("Product name is required.");
        productInput.focus();
        return false;
    }

    if (!Number.isInteger(state.quantity) || state.quantity < 1 || state.quantity > 1000) {
        showToast("Quantity must be between 1 and 1000.");
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
        renderTabs();
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
        // Tab Filter
        const matchesCategoryTab = activeCategory === "All" || (item.category || "General") === activeCategory;
        if (!matchesCategoryTab) return false;

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
    updateDeleteButtonState();
    updateCharts();
    updatePulseCards();
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
    totalAmountStat.textContent = formatCurrency(totalAmount);
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

// ================= CHARTS =================
function updateCharts() {
    if (!window.Chart) return;

    const ctxCategory = document.getElementById("categoryValueChart");
    const ctxStock = document.getElementById("stockLevelChart");

    if (!ctxCategory || !ctxStock) return;

    // Prepare Data for Category Chart
    const categories = [...new Set(visibleData.map(item => item.category || "General"))];
    const categoryValues = categories.map(cat => {
        return visibleData
            .filter(item => (item.category || "General") === cat)
            .reduce((sum, item) => sum + Number(item.total), 0);
    });

    // Prepare Data for Stock Chart (Grouped by Category)
    const categoriesStock = [...new Set(visibleData.map(item => item.category || "General"))];
    const categoryStockQuantities = categoriesStock.map(cat => {
        return visibleData
            .filter(item => (item.category || "General") === cat)
            .reduce((sum, item) => sum + Number(item.quantity), 0);
    });

    const theme = document.documentElement.getAttribute("data-theme") || "dark";
    const textColor = theme === "dark" ? "#94a3b8" : "#64748b";
    const gridColor = theme === "dark" ? "rgba(148, 163, 184, 0.1)" : "rgba(100, 116, 139, 0.1)";

    // Category Value Chart
    if (categoryChart) categoryChart.destroy();
    categoryChart = new Chart(ctxCategory, {
        type: "doughnut",
        data: {
            labels: categories,
            datasets: [{
                data: categoryValues,
                backgroundColor: [
                    "#38bdf8", "#818cf8", "#fb7185", "#34d399", "#fbbf24", "#a78bfa"
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "bottom", labels: { color: textColor } }
            }
        }
    });

    // Stock Level Chart (Now by Category)
    if (stockChart) stockChart.destroy();
    stockChart = new Chart(ctxStock, {
        type: "bar",
        data: {
            labels: categoriesStock,
            datasets: [{
                label: "Total Quantity",
                data: categoryStockQuantities,
                backgroundColor: "#38bdf8",
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: textColor }, grid: { display: false } },
                y: { ticks: { color: textColor }, grid: { color: gridColor } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// ================= PULSE CARDS =================
function updatePulseCards() {
    if (allData.length === 0) {
        topCategoryPulse.textContent = "-";
        restockPulse.textContent = "0";
        healthPulse.textContent = "100%";
        return;
    }

    // Top Category
    const categoryCounts = {};
    allData.forEach(item => {
        const cat = item.category || "General";
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    const topCat = Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b);
    topCategoryPulse.textContent = topCat;

    // Restock Needed
    const lowStockCount = allData.filter(item => Number(item.quantity) < 5).length;
    restockPulse.textContent = lowStockCount;
    restockPulse.className = lowStockCount > 0 ? "value critical" : "value";

    // Health
    const healthyCount = allData.filter(item => Number(item.quantity) >= 5).length;
    const healthPerc = Math.round((healthyCount / allData.length) * 100);
    healthPulse.textContent = `${healthPerc}%`;
}

// ================= VOICE SEARCH =================
function startVoiceSearch() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showToast("Voice recognition not supported in this browser.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => {
        voiceBtn.classList.add("recording");
        showToast("Listening...");
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        searchInput.value = transcript;
        showToast(`Searching for: ${transcript}`);
        resetPageAndLoad();
    };

    recognition.onerror = () => {
        showToast("Voice search failed.");
        voiceBtn.classList.remove("recording");
    };

    recognition.onend = () => {
        voiceBtn.classList.remove("recording");
    };

    recognition.start();
}

voiceBtn.addEventListener("click", startVoiceSearch);

// ================= TOUR =================
function startTour() {
    introJs().setOptions({
        steps: [
            {
                title: 'Welcome!',
                intro: 'Welcome to your Advanced Inventory System. Let me show you around! 👋'
            },
            {
                element: document.querySelector('.sidebar'),
                intro: 'Use this sidebar to add products, search, and manage your account.',
                position: 'right'
            },
            {
                element: document.querySelector('.pulse-cards'),
                intro: 'These cards give you an instant health check of your stock levels.',
                position: 'bottom'
            },
            {
                element: document.querySelector('.category-tabs'),
                intro: 'Switch between these tabs to organize your products by category.',
                position: 'bottom'
            },
            {
                element: document.querySelector('.analytics-section'),
                intro: 'Keep an eye on these charts for deep insights into your inventory value.',
                position: 'top'
            }
        ],
        showProgress: true,
        showBullets: false
    }).start();
}

startTourBtn.addEventListener("click", startTour);

// ================= DELETE ACCOUNT =================
async function deleteAccount() {
    const confirmed = await showConfirm("⚠️ WARNING: This will permanently delete your account and ALL your data. This action cannot be undone! Are you absolutely sure?");
    if (!confirmed) return;

    const finalConfirm = await showConfirm("REALLY SURE? This is your last chance.");
    if (!finalConfirm) return;

    try {
        const res = await fetch(`${BASE_URL}/delete-account`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });

        const result = await res.json();
        if (res.ok) {
            showToast("Account deleted successfully. Goodbye!");
            localStorage.clear();
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);
        } else {
            showToast(result.message || "Failed to delete account.");
        }
    } catch (error) {
        showToast("Error deleting account.");
    }
}

deleteAccountBtn.addEventListener("click", deleteAccount);

function renderTabs() {
    if (!categoryTabsContainer) return;

    const categories = ["All", ...new Set(allData.map(item => item.category || "General"))];

    categoryTabsContainer.innerHTML = categories.map(cat => `
        <button class="tab-btn ${activeCategory === cat ? 'active' : ''}" onclick="setCategoryTab('${cat}')">
            ${cat}
        </button>
    `).join("");
}

window.setCategoryTab = (cat) => {
    activeCategory = cat;
    currentPage = 1;
    renderTabs();
    applyTableView();
};

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
        const isSelected = selectedIds.has(item.id);
        const quantity = Number(item.quantity);
        let stockClass = "";
        if (quantity === 0) stockClass = "critical-stock-row";
        else if (quantity < 5) stockClass = "low-stock-row";

        const thumbHtml = item.image_url
            ? `<img src="${escapeHtml(item.image_url)}" class="product-thumb" alt="">`
            : "";

        return `
            <tr class="${isSelected ? "selected-row" : ""} ${stockClass}">
                <td>
                    <input type="checkbox" class="row-checkbox" data-id="${item.id}" ${isSelected ? "checked" : ""} onclick="toggleSelectRow(${item.id})">
                </td>
                <td>${rowNumber}</td>
                <td>${thumbHtml}${escapeHtml(String(item.product))}</td>
                <td>${escapeHtml(String(item.category || "General"))}</td>
                <td>${escapeHtml(String(item.quantity))}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${formatCurrency(item.total)}</td>
                <td>${escapeHtml(formatDate(item.created_at))}</td>
                <td>
                    <span class="edit-btn" onclick="startEdit(${item.id})">Edit</span>
                    <span class="delete-btn" onclick="deleteEntry(${item.id})">Delete</span>
                </td>
            </tr>
        `;
    }).join("");
}

function toggleSelectRow(id) {
    if (selectedIds.has(id)) {
        selectedIds.delete(id);
    } else {
        selectedIds.add(id);
    }
    applyTableView();
}

function updateDeleteButtonState() {
    deleteSelectedBtn.disabled = selectedIds.size === 0;

    // Update select all checkbox state
    if (pageData.length > 0) {
        const allPageIdsSelected = pageData.every(item => selectedIds.has(item.id));
        selectAllCheckbox.checked = allPageIdsSelected;
    } else {
        selectAllCheckbox.checked = false;
    }
}

selectAllCheckbox.addEventListener("change", () => {
    if (selectAllCheckbox.checked) {
        pageData.forEach(item => selectedIds.add(item.id));
    } else {
        pageData.forEach(item => selectedIds.delete(item.id));
    }
    applyTableView();
});

async function deleteSelected() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const confirmed = await showConfirm(`Are you sure you want to delete ${ids.length} selected items?`);
    if (!confirmed) return;

    try {
        const response = await fetch(`${BASE_URL}/delete-multiple`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ ids })
        });

        const result = await response.json();

        if (!response.ok) {
            showToast(result.message || "Unable to delete items.");
            return;
        }

        showToast(result.message);
        selectedIds.clear();
        loadData();

    } catch (error) {
        console.log("Bulk Delete Error:", error);
        showToast("Unable to delete items.");
    }
}

deleteSelectedBtn.addEventListener("click", deleteSelected);


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
    state.category = item.category || "General";
    state.image_url = item.image_url || "";
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
    state.category = "General";
    state.image_url = "";
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

// ================= IMPORT =================
importBtn.addEventListener("click", () => csvFileInput.click());

csvFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        const text = event.target.result;
        const items = parseCsv(text);

        if (items.length === 0) {
            showToast("No valid items found in CSV.");
            return;
        }

        const confirmed = await showConfirm(`Import ${items.length} items from CSV?`);
        if (!confirmed) return;

        try {
            const res = await fetch(`${BASE_URL}/import-entries`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ items })
            });

            const result = await res.json();
            showToast(result.message);
            loadData();
        } catch (error) {
            showToast("Import failed.");
        }
    };
    reader.readAsText(file);
});

function parseCsv(text) {
    const lines = text.split("\n");
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());

    return lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
            const values = line.split(",").map(v => v.trim());
            const item = {};
            headers.forEach((h, i) => {
                item[h] = values[i];
            });
            return item;
        })
        .filter(item => item.product); // Must have at least product name
}

// ================= HISTORY =================
showHistoryBtn.addEventListener("click", async () => {
    historyModal.classList.add("open");
    historyModal.setAttribute("aria-hidden", "false");
    historyList.innerHTML = "<p>Loading history...</p>";

    try {
        const res = await fetch(`${BASE_URL}/logs`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const logs = await res.json();

        if (logs.length === 0) {
            historyList.innerHTML = "<p>No history found.</p>";
            return;
        }

        historyList.innerHTML = logs.map(log => `
            <div class="history-item">
                <span class="time">${new Date(log.created_at).toLocaleString()}</span>
                <span class="action">${log.action}</span>
                <span class="details">${log.details}</span>
            </div>
        `).join("");

    } catch (error) {
        historyList.innerHTML = "<p>Error loading history.</p>";
    }
});

closeHistoryBtn.addEventListener("click", () => {
    historyModal.classList.remove("open");
    historyModal.setAttribute("aria-hidden", "true");
});

// ================= FILTER TOGGLE =================
toggleFiltersBtn.addEventListener("click", () => {
    filterPanel.classList.toggle("hidden");
    toggleFiltersBtn.classList.toggle("active");
});

// ================= INIT =================
initTheme();
render();
loadData();
