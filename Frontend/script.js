let allData = [];
let visibleData = [];

// ================= STATE (Single Source of Truth) =================
const state = {
    product: "",
    quantity: 1,
    price: 0,
    total: 0
};

// ================= BASE =================
const BASE_URL = window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://company-default-website.onrender.com";

// ================= AUTH =================
const token = localStorage.getItem("token");

if (!token) {
    alert("Login first");
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

// ================= LOGOUT =================
logoutBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("token");
        window.location.href = "Login.html";
    }
});

// ================= RENDER (State → UI) =================
function render() {
    productInput.value = state.product;
    quantityInput.value = state.quantity;
    priceInput.value = state.price;
    totalInput.value = state.total;
}

// ================= CALCULATE =================
function calculateTotal() {
    state.total = state.quantity * state.price;
}

// ================= INPUT BINDING (UI → State) =================
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
        alert("Product name is required");
        productInput.focus();
        return false;
    }

    if (state.quantity <= 0) {
        alert("Quantity must be greater than 0");
        quantityInput.focus();
        return false;
    }

    if (state.quantity > 50) {
        alert("Quantity cannot exceed 50 ❌");
        quantityInput.focus();
        return false;
    }

    if (state.price <= 0) {
        alert("Price must be greater than 0");
        priceInput.focus();
        return false;
    }

    return true;
}

// ================= LOAD DATA =================
async function loadData() {
    try {
        const res = await fetch(`${BASE_URL}/entries`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        allData = data; // ⭐ store data

        renderTable(data);

    } catch (error) {
        console.log("Load Error:", error);
    }
}

function renderTable(data, searchTerm = "") {

    let filteredData = data;

    // If searching → filter data
    if (searchTerm) {
        filteredData = data.filter(item =>
            item.product.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    visibleData = filteredData;

    // ❌ No results case
    if (searchTerm && filteredData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="color:red; font-weight:bold;">
                    No results found ❌
                </td>
            </tr>
        `;
        return;
    }

    // ✅ Normal rendering + highlight
    tableBody.innerHTML = filteredData.length
        ? filteredData.map((item, index) => {

            const isMatch = item.product.toLowerCase()
                .includes(searchTerm.toLowerCase());

            return `
                <tr style="${isMatch && searchTerm ? 'background-color: yellow;' : ''}">
                    <td>${index + 1}</td>
                    <td>${escapeHtml(String(item.product))}</td>
                    <td>${escapeHtml(String(item.quantity))}</td>
                    <td>${escapeHtml(String(item.price))}</td>
                    <td>${escapeHtml(String(item.total))}</td>
                    <td>
                        <span class="delete-btn" onclick="deleteEntry(${item.id})">Delete</span>
                    </td>
                </tr>
            `;
        }).join("")
        : `<tr><td colspan="6">No data available</td></tr>`;
}

searchBtn.addEventListener("click", () => {
    const searchTerm = searchInput.value.trim();

    renderTable(allData, searchTerm);
});

searchInput.addEventListener("input", () => {
    const term = searchInput.value.trim();
    renderTable(allData, term);
});

// ================= SHARE / EXPORT TABLE =================
const tableHeaders = ["#", "Product", "Quantity", "Price", "Total"];

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
    return visibleData.map((item, index) => [
        index + 1,
        item.product,
        item.quantity,
        item.price,
        item.total
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

// ================= ADD ENTRY =================
addBtn.addEventListener("click", async () => {

    if (!validateInputs()) return;

    try {
        const response = await fetch(`${BASE_URL}/add-entry`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(state)
        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.message || "Error adding entry ❌");
            return;
        }

        loadData();
        clearFields();

    } catch (error) {
        console.log("Fetch Error:", error);
    }
});

// ================= DELETE =================
async function deleteEntry(id) {
    if (!confirm("Delete this entry?")) return;

    try {
        await fetch(`${BASE_URL}/delete-entry/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });

        loadData();

    } catch (error) {
        console.log("Delete Error:", error);
    }
}

// ================= CLEAR =================
function clearFields() {
    state.product = "";
    state.quantity = 1;
    state.price = 0;
    state.total = 0;

    render();
    productInput.focus();
}

// ================= ENTER NAVIGATION =================

// Product → Quantity
productInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        quantityInput.focus();
    }
});

// Quantity → Price
quantityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        priceInput.focus();
    }
});

// Price → Submit
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
        productInput.focus();
    });
}

// ================= INIT =================
render();
loadData();
