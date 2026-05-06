let allData = [];

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

    if (state.quantity > 20) {
        alert("Quantity cannot exceed 20 ❌");
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
                    <td>${item.product}</td>
                    <td>${item.quantity}</td>
                    <td>${item.price}</td>
                    <td>${item.total}</td>
                    <td>
                        <span onclick="deleteEntry(${item.id})">❌</span>
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