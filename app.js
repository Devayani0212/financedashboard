const STORAGE_KEY = "financeDashboardData-v1";

const state = {
  role: "viewer",
  darkMode: false,
  filterText: "",
  filterType: "all",
  sortMode: "date_desc",
  editId: null,
  transactions: [
    { id: 1, date: "2026-03-28", description: "Salary", category: "Income", type: "income", amount: 5000 },
    { id: 2, date: "2026-03-25", description: "Rent", category: "Housing", type: "expense", amount: 1400 },
    { id: 3, date: "2026-03-23", description: "Groceries", category: "Food", type: "expense", amount: 210 },
    { id: 4, date: "2026-03-22", description: "Freelance", category: "Income", type: "income", amount: 650 },
    { id: 5, date: "2026-03-21", description: "Gym membership", category: "Health", type: "expense", amount: 59 },
    { id: 6, date: "2026-02-20", description: "Utility bills", category: "Utilities", type: "expense", amount: 230 },
    { id: 7, date: "2026-01-15", description: "Subscription", category: "Entertainment", type: "expense", amount: 19.99 }
  ]
};

const refs = {
  roleSelect: document.getElementById("roleSelect"),
  darkModeToggle: document.getElementById("darkModeToggle"),
  searchInput: document.getElementById("searchInput"),
  typeFilter: document.getElementById("typeFilter"),
  sortSelect: document.getElementById("sortSelect"),
  summaryCards: document.getElementById("summaryCards"),
  balanceTrend: document.getElementById("balanceTrend"),
  categoryBars: document.getElementById("categoryBars"),
  insightsList: document.getElementById("insightsList"),
  transactionsTableWrap: document.getElementById("transactionsTableWrap"),
  adminForm: document.getElementById("adminForm"),
  txnForm: document.getElementById("txnForm"),
  txnDate: document.getElementById("txnDate"),
  txnDesc: document.getElementById("txnDesc"),
  txnAmount: document.getElementById("txnAmount"),
  txnCategory: document.getElementById("txnCategory"),
  txnType: document.getElementById("txnType"),
  txnSubmitBtn: document.getElementById("txnSubmitBtn"),
  txnCancelBtn: document.getElementById("txnCancelBtn")
};

function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.transactions)) {
      state.transactions = parsed.transactions;
    }
    if (parsed.role) state.role = parsed.role;
    if (typeof parsed.darkMode === "boolean") state.darkMode = parsed.darkMode;
  } catch (e) {
    console.warn("Invalid storage data", e);
  }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    transactions: state.transactions,
    role: state.role,
    darkMode: state.darkMode
  }));
}

function formatCurrency(value) {
  return new Intl.NumberFormat(undefined, {
    style: "currency", currency: "USD", maximumFractionDigits: 2
  }).format(value);
}

function getSummary() {
  const income = state.transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = state.transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  return {
    totalBalance: income - expenses,
    income,
    expenses,
    transactionCount: state.transactions.length
  };
}

function getFilteredTransactions() {
  const text = state.filterText.toLowerCase().trim();
  const txns = state.transactions.filter((t) => {
    const matchType = state.filterType === "all" || t.type === state.filterType;
    const matchText = !text || t.description.toLowerCase().includes(text) || t.category.toLowerCase().includes(text);
    return matchType && matchText;
  });

  const sorted = txns.slice().sort((a, b) => {
    switch (state.sortMode) {
      case "date_asc": return new Date(a.date) - new Date(b.date);
      case "date_desc": return new Date(b.date) - new Date(a.date);
      case "amount_asc": return a.amount - b.amount;
      case "amount_desc": return b.amount - a.amount;
      default: return 0;
    }
  });

  return sorted;
}

function getInsights() {
  if (state.transactions.length === 0) return ["No data to show insights"];

  const totalsByCategory = state.transactions.reduce((acc, txn) => {
    if (!acc[txn.category]) acc[txn.category] = 0;
    acc[txn.category] += txn.type === "expense" ? txn.amount : 0;
    return acc;
  }, {});

  const highestCategory = Object.keys(totalsByCategory).reduce((best, key) => {
    return totalsByCategory[key] > (totalsByCategory[best] || 0) ? key : best;
  }, "");

  const monthly = state.transactions.reduce((acc, txn) => {
    const monthKey = txn.date.slice(0, 7);
    if (!acc[monthKey]) acc[monthKey] = { income: 0, expense: 0 };
    acc[monthKey][txn.type] += txn.amount;
    return acc;
  }, {});

  const monthKeys = Object.keys(monthly).sort();
  const current = monthKeys[monthKeys.length - 1];
  const previous = monthKeys[monthKeys.length - 2] || current;
  const incomeChange = monthly[previous] ? monthly[current].income - monthly[previous].income : 0;
  const expenseChange = monthly[previous] ? monthly[current].expense - monthly[previous].expense : 0;

  const net = getSummary().totalBalance;

  return [
    `Highest spending category: ${highestCategory || "N/A"}`,
    `Monthly income change: ${incomeChange >= 0 ? "+" : ""}${formatCurrency(incomeChange)}`,
    `Monthly expense change: ${expenseChange >= 0 ? "+" : ""}${formatCurrency(expenseChange)}`,
    `Current net balance: ${formatCurrency(net)}`
  ];
}

function buildSummaryCards() {
  const summary = getSummary();
  refs.summaryCards.innerHTML = "";
  const cards = [
    { title: "Total Balance", value: formatCurrency(summary.totalBalance), class: "" },
    { title: "Income", value: formatCurrency(summary.income), class: "status-income" },
    { title: "Expenses", value: formatCurrency(summary.expenses), class: "status-expense" },
    { title: "Transactions", value: summary.transactionCount, class: "" }
  ];

  cards.forEach((c) => {
    const node = document.createElement("article");
    node.className = "card";
    node.innerHTML = `<h3>${c.title}</h3><p class="${c.class}">${c.value}</p>`;
    refs.summaryCards.appendChild(node);
  });
}

function renderBalanceTrend() {
  const sorted = [...state.transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  if (!sorted.length) {
    refs.balanceTrend.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="var(--subtext)">No data</text>';
    return;
  }
  const baseDate = new Date(sorted[0].date).getTime();
  const points = [];
  let balance = 0;

  sorted.forEach((txn) => {
    balance += txn.type === "income" ? txn.amount : -txn.amount;
    const x = ((new Date(txn.date).getTime() - baseDate) / (1000 * 60 * 60 * 24)) * 15;
    points.push({ x, y: balance });
  });

  const minY = Math.min(...points.map(p => p.y), 0);
  const maxY = Math.max(...points.map(p => p.y), 1);
  const height = 100;

  const pathPoints = points.map(p => {
    const px = 20 + (p.x / (Math.max(1, points[points.length - 1].x)) * 360);
    const py = height - ((p.y - minY) / (maxY - minY)) * 80 - 10;
    return `${px},${py}`;
  }).join(" ");

  refs.balanceTrend.innerHTML = `
    <polyline points="${pathPoints}" fill="none" stroke="var(--accent)" stroke-width="2" />
    ${points.map((p, idx) => {
      const px = 20 + (p.x / (Math.max(1, points[points.length - 1].x)) * 360);
      const py = height - ((p.y - minY) / (maxY - minY)) * 80 - 10;
      return `<circle cx="${px}" cy="${py}" r="3" fill="var(--accent)" />`;
    }).join("")}
  `;
}

function renderCategoryBreakdown() {
  const expenses = state.transactions.filter(t => t.type === "expense");
  const totals = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});
  refs.categoryBars.innerHTML = "";

  const totalExpense = Object.values(totals).reduce((a, i) => a + i, 0);
  if (!totalExpense) {
    refs.categoryBars.innerHTML = '<p style="color: var(--subtext)">No expenses yet</p>';
    return;
  }

  Object.entries(totals).sort(([,a],[,b]) => b-a).forEach(([cat, value]) => {
    const row = document.createElement("div");
    row.className = "bar-row";
    const pct = totalExpense > 0 ? Math.round((value / totalExpense) * 100) : 0;
    row.innerHTML = `
      <span class="bar-label">${cat}</span>
      <div class="bar-fill" style="width:${Math.max(8, pct)}%"></div>
      <span>${pct}%</span>
    `;
    refs.categoryBars.appendChild(row);
  });
}

function renderInsights() {
  refs.insightsList.innerHTML = "";
  getInsights().forEach((ins) => {
    const li = document.createElement("li");
    li.textContent = ins;
    refs.insightsList.appendChild(li);
  });
}

function renderTransactions() {
  const data = getFilteredTransactions();
  if (!data.length) {
    refs.transactionsTableWrap.innerHTML = "<p style='color: var(--subtext); padding: 8px;'>No matching transactions</p>";
    return;
  }

  const table = document.createElement("table");
  table.innerHTML = `
    <thead><tr>
      <th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Amount</th><th>Actions</th>
    </tr></thead>
    <tbody>${data.map((t) => `
      <tr>
        <td>${t.date}</td>
        <td>${t.description}</td>
        <td>${t.category}</td>
        <td class="status-${t.type}">${t.type}</td>
        <td>${formatCurrency(t.amount)}</td>
        <td>${state.role === "admin" ? `<button data-id="${t.id}" class="edit-btn">Edit</button><button data-id="${t.id}" class="delete-btn">Delete</button>` : "—"}</td>
      </tr>`).join("")}</tbody>
  `;
  refs.transactionsTableWrap.innerHTML = "";
  refs.transactionsTableWrap.appendChild(table);

  if (state.role === "admin") {
    refs.transactionsTableWrap.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        startEditTransaction(id);
      });
    });
    refs.transactionsTableWrap.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        deleteTransaction(id);
      });
    });
  }
}

function updateUi() {
  document.body.classList.toggle("dark", state.darkMode);
  refs.roleSelect.value = state.role;
  refs.darkModeToggle.checked = state.darkMode;
  refs.typeFilter.value = state.filterType;
  refs.sortSelect.value = state.sortMode;

  buildSummaryCards();
  renderBalanceTrend();
  renderCategoryBreakdown();
  renderInsights();
  renderTransactions();

  refs.adminForm.classList.toggle("hidden", state.role !== "admin");
}

function addTransaction(txn) {
  const id = Date.now();
  state.transactions.push({ id, ...txn });
  saveToStorage();
  updateUi();
}

function updateTransaction(id, updated) {
  const idx = state.transactions.findIndex((t) => t.id === id);
  if (idx >= 0) {
    state.transactions[idx] = { id, ...updated };
    state.editId = null;
    saveToStorage();
    updateUi();
  }
}

function deleteTransaction(id) {
  if (!confirm("Remove transaction?")) return;
  state.transactions = state.transactions.filter((t) => t.id !== id);
  saveToStorage();
  updateUi();
}

function startEditTransaction(id) {
  const transaction = state.transactions.find((t) => t.id === id);
  if (!transaction) return;
  state.editId = id;
  refs.txnDate.value = transaction.date;
  refs.txnDesc.value = transaction.description;
  refs.txnAmount.value = transaction.amount;
  refs.txnCategory.value = transaction.category;
  refs.txnType.value = transaction.type;
  refs.txnSubmitBtn.textContent = "Update";
}

refs.roleSelect.addEventListener("change", (e) => {
  state.role = e.target.value;
  saveToStorage();
  updateUi();
});

refs.darkModeToggle.addEventListener("change", (e) => {
  state.darkMode = e.target.checked;
  saveToStorage();
  updateUi();
});

refs.searchInput.addEventListener("input", (e) => {
  state.filterText = e.target.value;
  renderTransactions();
});

refs.typeFilter.addEventListener("change", (e) => {
  state.filterType = e.target.value;
  renderTransactions();
});

refs.sortSelect.addEventListener("change", (e) => {
  state.sortMode = e.target.value;
  renderTransactions();
});

refs.txnCancelBtn.addEventListener("click", () => {
  state.editId = null;
  refs.txnForm.reset();
  refs.txnSubmitBtn.textContent = "Save";
});

refs.txnForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (state.role !== "admin") return;

  const txn = {
    date: refs.txnDate.value,
    description: refs.txnDesc.value.trim(),
    amount: Number(refs.txnAmount.value),
    category: refs.txnCategory.value.trim() || "Uncategorized",
    type: refs.txnType.value
  };

  if (!txn.date || !txn.description || Number.isNaN(txn.amount)) return;

  if (state.editId) {
    updateTransaction(state.editId, txn);
    refs.txnSubmitBtn.textContent = "Save";
  } else {
    addTransaction(txn);
  }

  refs.txnForm.reset();
});

loadFromStorage();
updateUi();
