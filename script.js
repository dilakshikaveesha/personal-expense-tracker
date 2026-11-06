const STORAGE_KEY = "personalExpenseTrackerTransactions";

const form = document.getElementById("transactionForm");
const typeInput = document.getElementById("type");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const filterInput = document.getElementById("filterType");
const searchInput = document.getElementById("searchInput");
const tableBody = document.getElementById("transactionTable");
const formMessage = document.getElementById("formMessage");

let transactions = loadTransactions();

function loadTransactions() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const parsedData = savedData ? JSON.parse(savedData) : [];
    return Array.isArray(parsedData) ? parsedData : [];
  } catch (error) {
    console.error("Could not load saved transactions:", error);
    return [];
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function formatCurrency(amount) {
  return "LKR " + Number(amount).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function updateSummary() {
  const totalIncome = transactions
    .filter(item => item.type === "Income")
    .reduce((total, item) => total + Number(item.amount), 0);

  const totalExpenses = transactions
    .filter(item => item.type === "Expense")
    .reduce((total, item) => total + Number(item.amount), 0);

  const balance = totalIncome - totalExpenses;

  document.getElementById("totalIncome").textContent = formatCurrency(totalIncome);
  document.getElementById("totalExpenses").textContent = formatCurrency(totalExpenses);
  document.getElementById("currentBalance").textContent = formatCurrency(balance);
}

function displayTransactions() {
  const selectedType = filterInput.value;
  const searchTerm = searchInput.value.trim().toLowerCase();

  const filteredTransactions = transactions.filter(item => {
    const matchesType = selectedType === "All" || item.type === selectedType;
    const matchesSearch =
      item.description.toLowerCase().includes(searchTerm) ||
      item.category.toLowerCase().includes(searchTerm);
    return matchesType && matchesSearch;
  });

  tableBody.replaceChildren();

  if (filteredTransactions.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.className = "empty-state";
    cell.textContent = "No transactions found.";
    row.appendChild(cell);
    tableBody.appendChild(row);
    return;
  }

  filteredTransactions
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach(item => {
      const row = document.createElement("tr");

      const dateCell = document.createElement("td");
      dateCell.textContent = item.date;

      const descriptionCell = document.createElement("td");
      descriptionCell.textContent = item.description;

      const typeCell = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = item.type === "Income"
        ? "type-badge type-income"
        : "type-badge type-expense";
      badge.textContent = item.type;
      typeCell.appendChild(badge);

      const categoryCell = document.createElement("td");
      categoryCell.textContent = item.category;

      const amountCell = document.createElement("td");
      amountCell.className = "amount-cell";
      amountCell.textContent =
        (item.type === "Income" ? "+ " : "- ") + formatCurrency(item.amount);

      const actionCell = document.createElement("td");
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "delete-btn";
      deleteButton.textContent = "Delete";
      deleteButton.setAttribute("aria-label", "Delete " + item.description);
      deleteButton.addEventListener("click", () => deleteTransaction(item.id));
      actionCell.appendChild(deleteButton);

      row.append(dateCell, descriptionCell, typeCell, categoryCell, amountCell, actionCell);
      tableBody.appendChild(row);
    });
}

function renderApp() {
  updateSummary();
  displayTransactions();
}

function showMessage(message, messageType) {
  formMessage.textContent = message;
  formMessage.className = "form-message " + messageType;
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const type = typeInput.value;
  const description = descriptionInput.value.trim();
  const amount = Number(amountInput.value);
  const category = categoryInput.value;
  const date = dateInput.value;

  if (!description || !category || !date || !type) {
    showMessage("Please complete all required fields.", "error");
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    showMessage("Please enter an amount greater than zero.", "error");
    amountInput.focus();
    return;
  }

  const transaction = {
    id: (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : String(Date.now()) + Math.random().toString(16).slice(2),
    type,
    description,
    amount,
    category,
    date
  };

  transactions.push(transaction);
  saveTransactions();
  renderApp();

  form.reset();
  dateInput.value = new Date().toISOString().slice(0, 10);
  showMessage("Transaction added successfully!", "success");
});

function deleteTransaction(id) {
  const confirmed = window.confirm("Are you sure you want to delete this transaction?");
  if (!confirmed) return;

  transactions = transactions.filter(item => item.id !== id);
  saveTransactions();
  renderApp();
  showMessage("Transaction deleted successfully.", "success");
}

document.getElementById("clearButton").addEventListener("click", () => {
  formMessage.textContent = "";
  formMessage.className = "form-message";
});

filterInput.addEventListener("change", displayTransactions);
searchInput.addEventListener("input", displayTransactions);

dateInput.value = new Date().toISOString().slice(0, 10);
renderApp();
