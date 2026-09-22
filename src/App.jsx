import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const DEFAULT_CATEGORIES = [
  "Auto",
  "Home",
  "I.O.U",
  "Entertainment",
  "Grocery",
  "Personal",
];

const EMPTY_TRANSACTION = {
  id: null,
  amount: "",
  category: "Grocery",
  description: "",
  date: new Date().toISOString().slice(0, 10),
  recurring: false,
};

const EMPTY_INCOME = {
  id: null,
  amount: "",
  source: "",
  date: new Date().toISOString().slice(0, 10),
  recurring: false,
};

const EMPTY_BUDGET = {
  id: null,
  name: "",
  category: "Grocery",
  limit: "",
  description: "",
};

const EMPTY_DEBT = {
  id: null,
  name: "",
  startingBalance: "",
  payments: [],
};

const EMPTY_GOAL = {
  id: null,
  name: "",
  targetAmount: "",
  contributions: [],
};

const EMPTY_BILL = {
  id: null,
  name: "",
  category: "Grocery",
  amount: "",
  dueDay: "",
  payments: [],
};

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function money(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount || 0));
}

function makeId() {
  return crypto.randomUUID();
}

function getMonthLabel(month) {
  return new Date(`${month}-01T12:00:00`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function getShortMonthLabel(month) {
  return new Date(`${month}-01T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
  });
}

function getPastMonths(endMonth, count) {
  const [year, monthNum] = endMonth.split("-").map(Number);
  const months = [];

  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(year, monthNum - 1 - i, 1);
    months.push(date.toISOString().slice(0, 7));
  }

  return months;
}

function monthFromDate(date) {
  return date.slice(0, 7);
}

function dateForSelectedMonth(month) {
  return `${month}-01`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);

  const [transactions, setTransactions] = useState(() => {
    return JSON.parse(localStorage.getItem("brightBudgetTransactions") || "[]");
  });

  const [income, setIncome] = useState(() => {
    return JSON.parse(localStorage.getItem("brightBudgetIncome") || "[]");
  });

  const [budgets, setBudgets] = useState(() => {
    return JSON.parse(localStorage.getItem("brightBudgetBudgets") || "[]");
  });

  const [customCategories, setCustomCategories] = useState(() => {
    return JSON.parse(localStorage.getItem("brightBudgetCategories") || "[]");
  });

  const [hiddenCategories, setHiddenCategories] = useState(() => {
    return JSON.parse(
      localStorage.getItem("brightBudgetHiddenCategories") || "[]"
    );
  });

  const [debts, setDebts] = useState(() => {
    return JSON.parse(localStorage.getItem("brightBudgetDebts") || "[]");
  });

  const [transactionForm, setTransactionForm] = useState(EMPTY_TRANSACTION);
  const [incomeForm, setIncomeForm] = useState(EMPTY_INCOME);
  const [budgetForm, setBudgetForm] = useState(EMPTY_BUDGET);
  const [debtForm, setDebtForm] = useState(EMPTY_DEBT);

  const [paymentForm, setPaymentForm] = useState({
    debtId: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const [goals, setGoals] = useState(() => {
    return JSON.parse(localStorage.getItem("brightBudgetGoals") || "[]");
  });

  const [goalForm, setGoalForm] = useState(EMPTY_GOAL);

  const [contributionForm, setContributionForm] = useState({
    goalId: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const [recurringBills, setRecurringBills] = useState(() => {
    return JSON.parse(
      localStorage.getItem("brightBudgetRecurringBills") || "[]"
    );
  });

  const [billForm, setBillForm] = useState(EMPTY_BILL);

  const [newCategory, setNewCategory] = useState("");
  const fileInputRef = useRef(null);
  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactionFilterCategory, setTransactionFilterCategory] =
    useState("All");
  const [lastDeleted, setLastDeleted] = useState(null);
  const undoTimeoutRef = useRef(null);

  const categories = [...DEFAULT_CATEGORIES, ...customCategories].filter(
    (category) => !hiddenCategories.includes(category)
  );

  useEffect(() => {
    localStorage.setItem(
      "brightBudgetTransactions",
      JSON.stringify(transactions)
    );
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("brightBudgetIncome", JSON.stringify(income));
  }, [income]);

  useEffect(() => {
    localStorage.setItem("brightBudgetBudgets", JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem(
      "brightBudgetCategories",
      JSON.stringify(customCategories)
    );
  }, [customCategories]);

  useEffect(() => {
    localStorage.setItem(
      "brightBudgetHiddenCategories",
      JSON.stringify(hiddenCategories)
    );
  }, [hiddenCategories]);

  useEffect(() => {
    localStorage.setItem("brightBudgetDebts", JSON.stringify(debts));
  }, [debts]);

  useEffect(() => {
    localStorage.setItem("brightBudgetGoals", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem(
      "brightBudgetRecurringBills",
      JSON.stringify(recurringBills)
    );
  }, [recurringBills]);

  const monthIncome = useMemo(() => {
    return income.filter((item) => monthFromDate(item.date) === selectedMonth);
  }, [income, selectedMonth]);

  const monthTransactions = useMemo(() => {
    return transactions.filter(
      (item) => monthFromDate(item.date) === selectedMonth
    );
  }, [transactions, selectedMonth]);

  const visibleTransactions = useMemo(() => {
    const query = transactionSearch.trim().toLowerCase();

    return monthTransactions.filter((item) => {
      const matchesCategory =
        transactionFilterCategory === "All" ||
        item.category === transactionFilterCategory;

      const matchesQuery =
        !query ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);

      return matchesCategory && matchesQuery;
    });
  }, [monthTransactions, transactionSearch, transactionFilterCategory]);

  const totalIncome = monthIncome.reduce(
    (total, item) => total + Number(item.amount),
    0
  );

  const totalExpenses = monthTransactions.reduce(
    (total, item) => total + Number(item.amount),
    0
  );

  const balance = totalIncome - totalExpenses;

  const categoryTotals = useMemo(() => {
    return categories.reduce((totals, category) => {
      totals[category] = monthTransactions
        .filter((item) => item.category === category)
        .reduce((sum, item) => sum + Number(item.amount), 0);

      return totals;
    }, {});
  }, [categories, monthTransactions]);

  const overBudgetItems = useMemo(() => {
    return budgets
      .map((budget) => {
        const spent = categoryTotals[budget.category] || 0;
        const over = spent - Number(budget.limit);

        return { ...budget, spent, over };
      })
      .filter((budget) => budget.over > 0);
  }, [budgets, categoryTotals]);

  const trendMonths = useMemo(
    () => getPastMonths(selectedMonth, 6),
    [selectedMonth]
  );

  const trendData = useMemo(() => {
    return trendMonths.map((month) => {
      const monthIncomeTotal = income
        .filter((item) => monthFromDate(item.date) === month)
        .reduce((sum, item) => sum + Number(item.amount), 0);

      const monthExpenseTotal = transactions
        .filter((item) => monthFromDate(item.date) === month)
        .reduce((sum, item) => sum + Number(item.amount), 0);

      return {
        month,
        label: getShortMonthLabel(month),
        income: monthIncomeTotal,
        expenses: monthExpenseTotal,
      };
    });
  }, [trendMonths, income, transactions]);

  const trendMax = Math.max(
    1,
    ...trendData.map((item) => Math.max(item.income, item.expenses))
  );

  const billsSummary = useMemo(() => {
    const unpaid = recurringBills.filter(
      (bill) => !getBillPaymentForMonth(bill, selectedMonth)
    );

    const paid = recurringBills.filter((bill) =>
      getBillPaymentForMonth(bill, selectedMonth)
    );

    const unpaidTotal = unpaid.reduce(
      (sum, bill) => sum + Number(bill.amount),
      0
    );

    const paidTotal = paid.reduce(
      (sum, bill) => sum + Number(bill.amount),
      0
    );

    return { unpaid, paid, unpaidTotal, paidTotal };
  }, [recurringBills, selectedMonth]);

  const totalGoalsSaved = useMemo(
    () => goals.reduce((sum, goal) => sum + getTotalSaved(goal), 0),
    [goals]
  );

  const totalDebtRemaining = useMemo(
    () => debts.reduce((sum, debt) => sum + getRemainingDebt(debt), 0),
    [debts]
  );

  const netPosition = totalGoalsSaved - totalDebtRemaining;

  const recurringIncomeSeries = useMemo(() => {
    const map = new Map();

    income
      .filter((item) => item.recurring)
      .forEach((item) => {
        const existing = map.get(item.source);

        if (!existing || item.date > existing.date) {
          map.set(item.source, item);
        }
      });

    return Array.from(map.values());
  }, [income]);

  const recurringExpenseSeries = useMemo(() => {
    const map = new Map();

    transactions
      .filter((item) => item.recurring)
      .forEach((item) => {
        const key = `${item.category}|${item.description}`;
        const existing = map.get(key);

        if (!existing || item.date > existing.date) {
          map.set(key, item);
        }
      });

    return Array.from(map.values());
  }, [transactions]);

  function changeMonth(direction) {
    const [year, month] = selectedMonth.split("-").map(Number);
    const nextDate = new Date(year, month - 1 + direction, 1);

    setSelectedMonth(nextDate.toISOString().slice(0, 7));
  }

  function saveTransaction(event) {
    event.preventDefault();

    const item = {
      ...transactionForm,
      id: transactionForm.id || makeId(),
      amount: Number(transactionForm.amount),
    };

    if (!item.amount || item.amount <= 0) return;

    setTransactions((current) =>
      transactionForm.id
        ? current.map((entry) => (entry.id === item.id ? item : entry))
        : [...current, item]
    );

    setTransactionForm({
      ...EMPTY_TRANSACTION,
      category: categories[0] || "Grocery",
      date: dateForSelectedMonth(selectedMonth),
    });
  }

  function saveIncome(event) {
    event.preventDefault();

    const item = {
      ...incomeForm,
      id: incomeForm.id || makeId(),
      amount: Number(incomeForm.amount),
    };

    if (!item.amount || item.amount <= 0) return;

    setIncome((current) =>
      incomeForm.id
        ? current.map((entry) => (entry.id === item.id ? item : entry))
        : [...current, item]
    );

    setIncomeForm({
      ...EMPTY_INCOME,
      date: dateForSelectedMonth(selectedMonth),
    });
  }

  function saveBudget(event) {
    event.preventDefault();

    const item = {
      ...budgetForm,
      id: budgetForm.id || makeId(),
      limit: Number(budgetForm.limit),
      description: budgetForm.description.trim(),
    };

    if (!item.limit || item.limit <= 0) return;

    setBudgets((current) =>
      budgetForm.id
        ? current.map((entry) => (entry.id === item.id ? item : entry))
        : [...current, item]
    );

    setBudgetForm({
      ...EMPTY_BUDGET,
      category: categories[0] || "Grocery",
    });
  }

  function deleteCategory(category) {
    if (categories.length <= 1) {
      window.alert("You need to keep at least one category.");
      return;
    }

    const inUse =
      transactions.some((item) => item.category === category) ||
      budgets.some((item) => item.category === category);

    const message = inUse
      ? `"${category}" is used by existing expenses or budgets. It'll disappear from the picker, but past entries will still show "${category}". Continue?`
      : `Remove "${category}" from your category list?`;

    if (!window.confirm(message)) return;

    setHiddenCategories((current) => [...current, category]);
  }

  function renameCategory(oldName) {
    const input = window.prompt(`Rename "${oldName}" to:`, oldName);

    if (!input) return;

    const newName = input.trim();

    if (!newName || newName === oldName) return;

    if (categories.includes(newName)) {
      window.alert(`"${newName}" already exists.`);
      return;
    }

    if (customCategories.includes(oldName)) {
      setCustomCategories((current) =>
        current.map((category) => (category === oldName ? newName : category))
      );
    } else {
      setHiddenCategories((current) => [...current, oldName]);
      setCustomCategories((current) => [...current, newName]);
    }

    setTransactions((current) =>
      current.map((item) =>
        item.category === oldName ? { ...item, category: newName } : item
      )
    );

    setBudgets((current) =>
      current.map((item) =>
        item.category === oldName ? { ...item, category: newName } : item
      )
    );

    setRecurringBills((current) =>
      current.map((item) =>
        item.category === oldName ? { ...item, category: newName } : item
      )
    );
  }

  function addCategory(event) {
    event.preventDefault();

    const cleanedName = newCategory.trim();

    if (!cleanedName || categories.includes(cleanedName)) return;

    setCustomCategories((current) => [...current, cleanedName]);
    setNewCategory("");

    setTransactionForm((current) => ({
      ...current,
      category: cleanedName,
    }));

    setBudgetForm((current) => ({
      ...current,
      category: cleanedName,
    }));
  }

  function scheduleUndo(entry) {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    setLastDeleted(entry);

    undoTimeoutRef.current = setTimeout(() => {
      setLastDeleted(null);
    }, 6000);
  }

  function undoDelete() {
    if (!lastDeleted) return;

    const { type, payload } = lastDeleted;

    if (type === "transaction") {
      setTransactions((current) => [...current, payload]);
    }

    if (type === "income") {
      setIncome((current) => [...current, payload]);
    }

    if (type === "budget") {
      setBudgets((current) => [...current, payload]);
    }

    if (type === "debt") {
      setDebts((current) => [...current, payload]);
    }

    if (type === "debtPayment") {
      setDebts((current) =>
        current.map((debt) =>
          debt.id === payload.debtId
            ? { ...debt, payments: [...debt.payments, payload.payment] }
            : debt
        )
      );
    }

    if (type === "goal") {
      setGoals((current) => [...current, payload]);
    }

    if (type === "goalContribution") {
      setGoals((current) =>
        current.map((goal) =>
          goal.id === payload.goalId
            ? {
                ...goal,
                contributions: [...goal.contributions, payload.contribution],
              }
            : goal
        )
      );
    }

    if (type === "bill") {
      setRecurringBills((current) => [...current, payload]);
    }

    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    setLastDeleted(null);
  }

  function deleteTransaction(id) {
    const item = transactions.find((entry) => entry.id === id);

    setTransactions((current) => current.filter((entry) => entry.id !== id));
    scheduleUndo({ type: "transaction", payload: item });
  }

  function deleteIncome(id) {
    const item = income.find((entry) => entry.id === id);

    setIncome((current) => current.filter((entry) => entry.id !== id));
    scheduleUndo({ type: "income", payload: item });
  }

  function deleteBudget(id) {
    const item = budgets.find((entry) => entry.id === id);

    setBudgets((current) => current.filter((entry) => entry.id !== id));
    scheduleUndo({ type: "budget", payload: item });
  }

  function copyRecurringToMonth() {
    const recurringIncome = income.filter((item) => item.recurring);
    const recurringExpenses = transactions.filter((item) => item.recurring);

    const copiedIncome = recurringIncome
      .filter((item) => monthFromDate(item.date) !== selectedMonth)
      .map((item) => ({
        ...item,
        id: makeId(),
        date: `${selectedMonth}-${item.date.slice(8, 10)}`,
      }));

    const copiedExpenses = recurringExpenses
      .filter((item) => monthFromDate(item.date) !== selectedMonth)
      .map((item) => ({
        ...item,
        id: makeId(),
        date: `${selectedMonth}-${item.date.slice(8, 10)}`,
      }));

    setIncome((current) => [...current, ...copiedIncome]);
    setTransactions((current) => [...current, ...copiedExpenses]);
  }

  function stopRecurringIncome(source) {
    setIncome((current) =>
      current.map((item) =>
        item.source === source ? { ...item, recurring: false } : item
      )
    );
  }

  function stopRecurringExpense(category, description) {
    setTransactions((current) =>
      current.map((item) =>
        item.category === category && item.description === description
          ? { ...item, recurring: false }
          : item
      )
    );
  }

  function saveDebt(event) {
    event.preventDefault();

    const item = {
      id: debtForm.id || makeId(),
      name: debtForm.name.trim(),
      startingBalance: Number(debtForm.startingBalance),
      payments: debtForm.payments || [],
    };

    if (!item.name || !item.startingBalance || item.startingBalance <= 0) {
      return;
    }

    setDebts((current) =>
      debtForm.id
        ? current.map((debt) => (debt.id === item.id ? item : debt))
        : [...current, item]
    );

    setDebtForm(EMPTY_DEBT);
  }

  function addDebtPayment(event) {
    event.preventDefault();

    const amount = Number(paymentForm.amount);

    if (!paymentForm.debtId || !amount || amount <= 0) return;

    setDebts((current) =>
      current.map((debt) => {
        if (debt.id !== paymentForm.debtId) return debt;

        const remainingBalance = getRemainingDebt(debt);

        if (amount > remainingBalance) {
          window.alert(
            `That payment is more than the remaining balance of ${money(
              remainingBalance
            )}.`
          );
          return debt;
        }

        return {
          ...debt,
          payments: [
            ...debt.payments,
            {
              id: makeId(),
              amount,
              date: paymentForm.date,
            },
          ],
        };
      })
    );

    setPaymentForm({
      debtId: "",
      amount: "",
      date: dateForSelectedMonth(selectedMonth),
    });
  }

  function deleteDebt(id) {
    const debt = debts.find((entry) => entry.id === id);

    setDebts((current) => current.filter((entry) => entry.id !== id));
    scheduleUndo({ type: "debt", payload: debt });
  }

  function deleteDebtPayment(debtId, paymentId) {
    const debt = debts.find((entry) => entry.id === debtId);
    const payment = debt?.payments.find((entry) => entry.id === paymentId);

    setDebts((current) =>
      current.map((entry) =>
        entry.id === debtId
          ? {
              ...entry,
              payments: entry.payments.filter(
                (item) => item.id !== paymentId
              ),
            }
          : entry
      )
    );

    scheduleUndo({ type: "debtPayment", payload: { debtId, payment } });
  }

  function getTotalPaid(debt) {
    return debt.payments.reduce(
      (total, payment) => total + Number(payment.amount),
      0
    );
  }

  function getRemainingDebt(debt) {
    return Math.max(
      Number(debt.startingBalance) - getTotalPaid(debt),
      0
    );
  }

  function exportData() {
    const payload = {
      transactions,
      income,
      budgets,
      customCategories,
      debts,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `brightbudget-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    link.click();
    URL.revokeObjectURL(url);
  }

  function exportCSV() {
    const rows = [["Type", "Date", "Category", "Description", "Amount"]];

    transactions
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((item) => {
        rows.push([
          "Expense",
          item.date,
          item.category,
          item.description,
          item.amount,
        ]);
      });

    income
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((item) => {
        rows.push(["Income", item.date, item.source, "", item.amount]);
      });

    const csvContent = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `brightbudget-transactions-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    link.click();
    URL.revokeObjectURL(url);
  }

  function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);

        const hasExpectedShape =
          Array.isArray(data.transactions) &&
          Array.isArray(data.income) &&
          Array.isArray(data.budgets) &&
          Array.isArray(data.debts);

        if (!hasExpectedShape) {
          window.alert("That file doesn't look like a BrightBudget backup.");
          return;
        }

        if (
          !window.confirm(
            "This will replace all current data with the backup. Continue?"
          )
        ) {
          return;
        }

        setTransactions(data.transactions);
        setIncome(data.income);
        setBudgets(data.budgets);
        setCustomCategories(data.customCategories || []);
        setDebts(data.debts);
      } catch (error) {
        window.alert(
          "Couldn't read that file. Make sure it's a valid BrightBudget export."
        );
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  }

  function saveGoal(event) {
    event.preventDefault();

    const item = {
      id: goalForm.id || makeId(),
      name: goalForm.name.trim(),
      targetAmount: Number(goalForm.targetAmount),
      contributions: goalForm.contributions || [],
    };

    if (!item.name || !item.targetAmount || item.targetAmount <= 0) {
      return;
    }

    setGoals((current) =>
      goalForm.id
        ? current.map((goal) => (goal.id === item.id ? item : goal))
        : [...current, item]
    );

    setGoalForm(EMPTY_GOAL);
  }

  function addGoalContribution(event) {
    event.preventDefault();

    const amount = Number(contributionForm.amount);

    if (!contributionForm.goalId || !amount || amount <= 0) return;

    setGoals((current) =>
      current.map((goal) => {
        if (goal.id !== contributionForm.goalId) return goal;

        return {
          ...goal,
          contributions: [
            ...goal.contributions,
            {
              id: makeId(),
              amount,
              date: contributionForm.date,
            },
          ],
        };
      })
    );

    setContributionForm({
      goalId: "",
      amount: "",
      date: dateForSelectedMonth(selectedMonth),
    });
  }

  function deleteGoal(id) {
    const goal = goals.find((entry) => entry.id === id);

    setGoals((current) => current.filter((entry) => entry.id !== id));
    scheduleUndo({ type: "goal", payload: goal });
  }

  function deleteGoalContribution(goalId, contributionId) {
    const goal = goals.find((entry) => entry.id === goalId);
    const contribution = goal?.contributions.find(
      (entry) => entry.id === contributionId
    );

    setGoals((current) =>
      current.map((entry) =>
        entry.id === goalId
          ? {
              ...entry,
              contributions: entry.contributions.filter(
                (item) => item.id !== contributionId
              ),
            }
          : entry
      )
    );

    scheduleUndo({
      type: "goalContribution",
      payload: { goalId, contribution },
    });
  }

  function getTotalSaved(goal) {
    return goal.contributions.reduce(
      (total, contribution) => total + Number(contribution.amount),
      0
    );
  }

  function getGoalRemaining(goal) {
    return Math.max(Number(goal.targetAmount) - getTotalSaved(goal), 0);
  }

  function saveBill(event) {
    event.preventDefault();

    const item = {
      id: billForm.id || makeId(),
      name: billForm.name.trim(),
      category: billForm.category,
      amount: Number(billForm.amount),
      dueDay: billForm.dueDay ? Number(billForm.dueDay) : null,
      payments: billForm.payments || [],
    };

    if (!item.name || !item.amount || item.amount <= 0) return;

    setRecurringBills((current) =>
      billForm.id
        ? current.map((bill) => (bill.id === item.id ? item : bill))
        : [...current, item]
    );

    setBillForm(EMPTY_BILL);
  }

  function deleteBill(id) {
    const bill = recurringBills.find((entry) => entry.id === id);

    setRecurringBills((current) => current.filter((entry) => entry.id !== id));
    scheduleUndo({ type: "bill", payload: bill });
  }

  function getBillPaymentForMonth(bill, month) {
    return bill.payments.find((payment) => payment.month === month);
  }

  function getDueDateLabel(bill, month) {
    if (!bill.dueDay) return null;

    const [year, monthNum] = month.split("-").map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const day = Math.min(Number(bill.dueDay), daysInMonth);
    const date = new Date(year, monthNum - 1, day);

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function markBillPaid(billId) {
    const bill = recurringBills.find((entry) => entry.id === billId);
    if (!bill) return;

    if (getBillPaymentForMonth(bill, selectedMonth)) return;

    const transactionId = makeId();

    setTransactions((current) => [
      ...current,
      {
        id: transactionId,
        amount: bill.amount,
        category: bill.category,
        description: bill.name,
        date: dateForSelectedMonth(selectedMonth),
        recurring: false,
      },
    ]);

    setRecurringBills((current) =>
      current.map((entry) =>
        entry.id === billId
          ? {
              ...entry,
              payments: [
                ...entry.payments,
                {
                  id: makeId(),
                  month: selectedMonth,
                  date: dateForSelectedMonth(selectedMonth),
                  transactionId,
                },
              ],
            }
          : entry
      )
    );
  }

  function markBillUnpaid(billId) {
    const bill = recurringBills.find((entry) => entry.id === billId);
    if (!bill) return;

    const payment = getBillPaymentForMonth(bill, selectedMonth);
    if (!payment) return;

    setTransactions((current) =>
      current.filter((item) => item.id !== payment.transactionId)
    );

    setRecurringBills((current) =>
      current.map((entry) =>
        entry.id === billId
          ? {
              ...entry,
              payments: entry.payments.filter((p) => p.id !== payment.id),
            }
          : entry
      )
    );
  }

  const navItems = [
    "Dashboard",
    "Income",
    "Transactions",
    "Budgets",
    "Debts",
    "Goals",
    "Bills",
  ];

  return (
    <div className="app-shell">
      {lastDeleted && (
        <div className="undo-toast">
          <span>Deleted.</span>
          <button className="text-button" onClick={undoDelete}>
            Undo
          </button>
        </div>
      )}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">✦</div>

          <div>
            <h1>BrightBudget</h1>
            <p>Money made simple</p>
          </div>
        </div>

        <nav>
          {navItems.map((item) => (
            <button
              key={item}
              className={
                activeTab === item ? "nav-button active" : "nav-button"
              }
              onClick={() => setActiveTab(item)}
            >
              {item === "Dashboard" && "▦ "}
              {item === "Income" && "↗ "}
              {item === "Transactions" && "↘ "}
              {item === "Budgets" && "◉ "}
              {item === "Debts" && "◌ "}
              {item === "Goals" && "★ "}
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-actions">
          <button className="text-button" onClick={exportData}>
            ⬇ Export backup
          </button>

          <button className="text-button" onClick={exportCSV}>
            ⬇ Export CSV
          </button>

          <button
            className="text-button"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            ⬆ Import backup
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            hidden
            onChange={importData}
          />
        </div>

        <div className="sidebar-note">
          <span>☁</span>
          Your information is saved locally in this browser.
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR FINANCES</p>
            <h2>{activeTab}</h2>
          </div>

          <div className="month-controls">
            <button onClick={() => changeMonth(-1)} aria-label="Previous month">
              ←
            </button>

            <input
              aria-label="Select month"
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            />

            <button onClick={() => changeMonth(1)} aria-label="Next month">
              →
            </button>
          </div>
        </header>

        {activeTab === "Dashboard" && (
          <>
            <section className="hero-card">
              <div>
                <p>Available balance for {getMonthLabel(selectedMonth)}</p>
                <h3>{money(balance)}</h3>
                <span>
                  {money(totalIncome)} income · {money(totalExpenses)} spent
                </span>
              </div>

              <div className="hero-orb">✦</div>
            </section>

            {overBudgetItems.length > 0 && (
              <section className="overspend-banner">
                <span className="overspend-banner-icon">⚠</span>
                <div>
                  <strong>
                    {overBudgetItems.length === 1
                      ? "1 budget is over its limit"
                      : `${overBudgetItems.length} budgets are over their limits`}
                  </strong>
                  <p>
                    {overBudgetItems
                      .map(
                        (budget) =>
                          `${budget.name || budget.category} (+${money(budget.over)})`
                      )
                      .join(", ")}
                  </p>
                </div>
              </section>
            )}

            {recurringBills.length > 0 && (
              <section className="bills-banner">
                <div>
                  <p className="eyebrow">
                    {getMonthLabel(selectedMonth).toUpperCase()}
                  </p>
                  <strong>
                    {billsSummary.unpaid.length === 0
                      ? "All bills paid for this month 🎉"
                      : `${billsSummary.unpaid.length} bill${
                          billsSummary.unpaid.length === 1 ? "" : "s"
                        } still due (${money(billsSummary.unpaidTotal)})`}
                  </strong>
                  <p>
                    {money(billsSummary.paidTotal)} paid so far ·{" "}
                    {money(billsSummary.unpaidTotal)} remaining
                  </p>
                </div>

                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setActiveTab("Bills")}
                >
                  View bills
                </button>
              </section>
            )}

            <section className="stat-grid">
              <article className="stat-card mint">
                <span>↗</span>
                <p>Total income</p>
                <h4>{money(totalIncome)}</h4>
              </article>

              <article className="stat-card coral">
                <span>↘</span>
                <p>Total expenses</p>
                <h4>{money(totalExpenses)}</h4>
              </article>

              <article className="stat-card yellow">
                <span>◎</span>
                <p>Budget remaining</p>
                <h4>
                  {money(
                    budgets.reduce(
                      (sum, budget) => sum + Number(budget.limit),
                      0
                    ) - totalExpenses
                  )}
                </h4>
              </article>
            </section>

            <section className="two-column">
              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">SPENDING</p>
                    <h3>By category</h3>
                  </div>

                  <button
                    className="text-button"
                    onClick={() => setActiveTab("Transactions")}
                  >
                    View expenses
                  </button>
                </div>

                <div className="category-list">
                  {categories.map((category) => {
                    const spent = categoryTotals[category] || 0;
                    const budget = budgets.find(
                      (item) => item.category === category
                    );

                    const isOverBudget =
                      budget && spent > Number(budget.limit);

                    const percent = budget
                      ? Math.min(
                          (spent / Number(budget.limit)) * 100,
                          100
                        )
                      : 0;

                    return (
                      <div className="category-row" key={category}>
                        <div className="category-row-top">
                          <span>{category}</span>
                          <strong className={isOverBudget ? "text-over" : undefined}>
                            {money(spent)}
                          </strong>
                        </div>

                        <div className="progress-track">
                          <div
                            className={
                              isOverBudget
                                ? "progress-fill over"
                                : "progress-fill"
                            }
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        {isOverBudget && (
                          <span className="over-budget">
                            {money(spent - Number(budget.limit))} over budget
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </article>

              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">QUICK ACTION</p>
                    <h3>Recurring entries</h3>
                  </div>
                </div>

                <div className="recurring-list">
                  {recurringIncomeSeries.length === 0 &&
                  recurringExpenseSeries.length === 0 ? (
                    <p className="empty-state">
                      No recurring income or expenses set up yet.
                    </p>
                  ) : (
                    <>
                      {recurringIncomeSeries.map((item) => (
                        <div
                          className="recurring-row"
                          key={`income-${item.source}`}
                        >
                          <div>
                            <strong>{item.source}</strong>
                            <span>{money(item.amount)} · Income</span>
                          </div>

                          <button
                            className="text-button"
                            onClick={() => stopRecurringIncome(item.source)}
                          >
                            Stop
                          </button>
                        </div>
                      ))}

                      {recurringExpenseSeries.map((item) => (
                        <div
                          className="recurring-row"
                          key={`expense-${item.category}-${item.description}`}
                        >
                          <div>
                            <strong>{item.description || item.category}</strong>
                            <span>
                              {money(item.amount)} · {item.category}
                            </span>
                          </div>

                          <button
                            className="text-button"
                            onClick={() =>
                              stopRecurringExpense(
                                item.category,
                                item.description
                              )
                            }
                          >
                            Stop
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <p className="muted">
                  Copy all recurring income and expenses into{" "}
                  {getMonthLabel(selectedMonth)}.
                </p>

                <button
                  className="primary-button"
                  onClick={copyRecurringToMonth}
                >
                  Copy recurring entries
                </button>

                <p className="small-note">
                  Review copied entries afterward to avoid duplicates.
                </p>
              </article>
            </section>

            <section className="panel trend-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">LAST 6 MONTHS</p>
                  <h3>Income vs. expenses</h3>
                </div>

                <div className="trend-legend">
                  <span className="legend-item">
                    <span className="legend-dot income" /> Income
                  </span>
                  <span className="legend-item">
                    <span className="legend-dot expense" /> Expenses
                  </span>
                </div>
              </div>

              <div className="trend-chart">
                {trendData.map((item) => (
                  <div className="trend-column" key={item.month}>
                    <div className="trend-bars">
                      <div
                        className="trend-bar income"
                        style={{
                          height: `${(item.income / trendMax) * 100}%`,
                        }}
                        title={`Income: ${money(item.income)}`}
                      />
                      <div
                        className="trend-bar expense"
                        style={{
                          height: `${(item.expenses / trendMax) * 100}%`,
                        }}
                        title={`Expenses: ${money(item.expenses)}`}
                      />
                    </div>

                    <span className="trend-label">{item.label}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="stat-grid">
              <article className="stat-card mint">
                <span>★</span>
                <p>Total saved (goals)</p>
                <h4>{money(totalGoalsSaved)}</h4>
              </article>

              <article className="stat-card coral">
                <span>◌</span>
                <p>Total debt remaining</p>
                <h4>{money(totalDebtRemaining)}</h4>
              </article>

              <article className={`stat-card ${netPosition >= 0 ? "mint" : "coral"}`}>
                <span>{netPosition >= 0 ? "↗" : "↘"}</span>
                <p>Net position</p>
                <h4>{money(netPosition)}</h4>
              </article>
            </section>
          </>
        )}

        {activeTab === "Income" && (
          <section className="tab-layout">
            <article className="panel form-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">MONEY IN</p>
                  <h3>{incomeForm.id ? "Edit income" : "Add income"}</h3>
                </div>
              </div>

              <form onSubmit={saveIncome}>
                <label>
                  Income source
                  <input
                    required
                    placeholder="Paycheck, casino winnings, freelance work..."
                    value={incomeForm.source}
                    onChange={(event) =>
                      setIncomeForm({
                        ...incomeForm,
                        source: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Amount
                  <input
                    required
                    min="0.01"
                    step="0.01"
                    type="number"
                    placeholder="500.00"
                    value={incomeForm.amount}
                    onChange={(event) =>
                      setIncomeForm({
                        ...incomeForm,
                        amount: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Date
                  <input
                    required
                    type="date"
                    value={incomeForm.date}
                    onChange={(event) =>
                      setIncomeForm({
                        ...incomeForm,
                        date: event.target.value,
                      })
                    }
                  />
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={incomeForm.recurring}
                    onChange={(event) =>
                      setIncomeForm({
                        ...incomeForm,
                        recurring: event.target.checked,
                      })
                    }
                  />
                  Repeat this income monthly
                </label>

                <div className="button-row">
                  <button className="primary-button" type="submit">
                    {incomeForm.id ? "Save changes" : "Add income"}
                  </button>

                  {incomeForm.id && (
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() =>
                        setIncomeForm({
                          ...EMPTY_INCOME,
                          date: dateForSelectedMonth(selectedMonth),
                        })
                      }
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">
                    {getMonthLabel(selectedMonth).toUpperCase()}
                  </p>
                  <h3>Income history</h3>
                </div>

                <span className="pill green">{money(totalIncome)}</span>
              </div>

              <div className="records">
                {monthIncome.length === 0 ? (
                  <p className="empty-state">
                    No income recorded this month yet.
                  </p>
                ) : (
                  monthIncome
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((item) => (
                      <div className="record-row income-row" key={item.id}>
                        <div className="record-icon">↗</div>

                        <div className="record-details">
                          <strong>{item.source}</strong>
                          <span>
                            {item.date}
                            {item.recurring ? " · Recurring" : ""}
                          </span>
                        </div>

                        <strong className="income-amount">
                          +{money(item.amount)}
                        </strong>

                        <button
                          className="icon-button"
                          onClick={() => setIncomeForm(item)}
                          aria-label={`Edit ${item.source}`}
                        >
                          ✎
                        </button>

                        <button
                          className="icon-button danger"
                          onClick={() => deleteIncome(item.id)}
                          aria-label={`Delete ${item.source}`}
                        >
                          ×
                        </button>
                      </div>
                    ))
                )}
              </div>
            </article>
          </section>
        )}

        {activeTab === "Transactions" && (
          <section className="tab-layout">
            <article className="panel form-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">MONEY OUT</p>
                  <h3>
                    {transactionForm.id ? "Edit expense" : "Add an expense"}
                  </h3>
                </div>
              </div>

              <form onSubmit={saveTransaction}>
                <label>
                  Description
                  <input
                    required
                    placeholder="Gas, groceries, streaming..."
                    value={transactionForm.description}
                    onChange={(event) =>
                      setTransactionForm({
                        ...transactionForm,
                        description: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Amount
                  <input
                    required
                    min="0.01"
                    step="0.01"
                    type="number"
                    placeholder="300.00"
                    value={transactionForm.amount}
                    onChange={(event) =>
                      setTransactionForm({
                        ...transactionForm,
                        amount: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Category
                  <select
                    value={transactionForm.category}
                    onChange={(event) =>
                      setTransactionForm({
                        ...transactionForm,
                        category: event.target.value,
                      })
                    }
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Date
                  <input
                    required
                    type="date"
                    value={transactionForm.date}
                    onChange={(event) =>
                      setTransactionForm({
                        ...transactionForm,
                        date: event.target.value,
                      })
                    }
                  />
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={transactionForm.recurring}
                    onChange={(event) =>
                      setTransactionForm({
                        ...transactionForm,
                        recurring: event.target.checked,
                      })
                    }
                  />
                  Repeat this expense monthly
                </label>

                <div className="button-row">
                  <button className="primary-button" type="submit">
                    {transactionForm.id ? "Save changes" : "Add expense"}
                  </button>

                  {transactionForm.id && (
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() =>
                        setTransactionForm({
                          ...EMPTY_TRANSACTION,
                          category: categories[0] || "Grocery",
                          date: dateForSelectedMonth(selectedMonth),
                        })
                      }
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <hr />

              <form onSubmit={addCategory} className="category-form">
                <label>
                  Add custom category
                  <input
                    placeholder="Example: Pets"
                    value={newCategory}
                    onChange={(event) => setNewCategory(event.target.value)}
                  />
                </label>

                <button className="secondary-button" type="submit">
                  Add category
                </button>
              </form>

              <div className="category-manage-list">
                {categories.map((category) => (
                  <span className="category-chip" key={category}>
                    {category}
                    <button
                      type="button"
                      className="category-chip-edit"
                      onClick={() => renameCategory(category)}
                      aria-label={`Rename ${category} category`}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCategory(category)}
                      aria-label={`Delete ${category} category`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">
                    {getMonthLabel(selectedMonth).toUpperCase()}
                  </p>
                  <h3>Expense history</h3>
                </div>

                <span className="pill coral">{money(totalExpenses)}</span>
              </div>

              <div className="filter-bar">
                <input
                  type="search"
                  placeholder="Search description or category..."
                  value={transactionSearch}
                  onChange={(event) =>
                    setTransactionSearch(event.target.value)
                  }
                />

                <select
                  value={transactionFilterCategory}
                  onChange={(event) =>
                    setTransactionFilterCategory(event.target.value)
                  }
                >
                  <option value="All">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="records">
                {monthTransactions.length === 0 ? (
                  <p className="empty-state">
                    No expenses recorded this month yet.
                  </p>
                ) : visibleTransactions.length === 0 ? (
                  <p className="empty-state">
                    No expenses match your search or filter.
                  </p>
                ) : (
                  visibleTransactions
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((item) => (
                      <div className="record-row" key={item.id}>
                        <div className="record-icon expense-icon">↘</div>

                        <div className="record-details">
                          <strong>{item.description}</strong>
                          <span>
                            {item.category} · {item.date}
                            {item.recurring ? " · Recurring" : ""}
                          </span>
                        </div>

                        <strong className="expense-amount">
                          -{money(item.amount)}
                        </strong>

                        <button
                          className="icon-button"
                          onClick={() => setTransactionForm(item)}
                          aria-label={`Edit ${item.description}`}
                        >
                          ✎
                        </button>

                        <button
                          className="icon-button danger"
                          onClick={() => deleteTransaction(item.id)}
                          aria-label={`Delete ${item.description}`}
                        >
                          ×
                        </button>
                      </div>
                    ))
                )}
              </div>
            </article>
          </section>
        )}

        {activeTab === "Budgets" && (
          <section className="tab-layout">
            <article className="panel form-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">SPENDING LIMITS</p>
                  <h3>{budgetForm.id ? "Edit budget" : "Set a budget"}</h3>
                </div>
              </div>

              <form onSubmit={saveBudget}>
                <label>
                  Budget item name
                  <input
                    required
                    placeholder="Example: Haircut, clothes, gym membership..."
                    value={budgetForm.name}
                    onChange={(event) =>
                      setBudgetForm({
                        ...budgetForm,
                        name: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  Category
                  <select
                    value={budgetForm.category}
                    onChange={(event) =>
                      setBudgetForm({
                        ...budgetForm,
                        category: event.target.value,
                      })
                    }
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Monthly spending limit
                  <input
                    required
                    min="0.01"
                    step="0.01"
                    type="number"
                    placeholder="400.00"
                    value={budgetForm.limit}
                    onChange={(event) =>
                      setBudgetForm({
                        ...budgetForm,
                        limit: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Description
                  <textarea
                    placeholder="Example: Groceries for home meals, snacks, and household food items."
                    rows="4"
                    value={budgetForm.description}
                    onChange={(event) =>
                      setBudgetForm({
                        ...budgetForm,
                        description: event.target.value,
                      })
                    }
                  />
                </label>

                <div className="button-row">
                  <button className="primary-button" type="submit">
                    {budgetForm.id ? "Save changes" : "Save budget"}
                  </button>

                  {budgetForm.id && (
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() =>
                        setBudgetForm({
                          ...EMPTY_BUDGET,
                          category: categories[0] || "Grocery",
                        })
                      }
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">
                    {getMonthLabel(selectedMonth).toUpperCase()}
                  </p>
                  <h3>Budget progress</h3>
                </div>
              </div>

              <div className="budget-grid scroll-grid">
                {budgets.length === 0 ? (
                  <p className="empty-state">
                    Set a category budget to start tracking progress.
                  </p>
                ) : (
                  budgets.map((budget) => {
                    const spent = categoryTotals[budget.category] || 0;
                    const remaining = Number(budget.limit) - spent;

                    const percent = Math.min(
                      (spent / Number(budget.limit)) * 100,
                      100
                    );

                    return (
                      <article className="budget-card" key={budget.id}>
                        <div className="budget-card-top">
                          <div>
  <strong>{budget.name || budget.category}</strong>
  <p className="budget-category-label">{budget.category}</p>
</div>

                          <div>
                            <button
                              className="icon-button"
                              onClick={() => setBudgetForm(budget)}
                              aria-label={`Edit ${budget.name || budget.category} budget`}
                            >
                              ✎
                            </button>

                            <button
                              className="icon-button danger"
                              onClick={() => deleteBudget(budget.id)}
                              aria-label={`Delete ${budget.name || budget.category} budget`}
                            >
                              ×
                            </button>
                          </div>
                        </div>

                        <p>
                          {money(spent)} of {money(budget.limit)}
                        </p>

                        {budget.description && (
                          <p className="budget-description">
                            {budget.description}
                          </p>
                        )}

                        <div className="progress-track large">
                          <div
                            className={
                              remaining < 0
                                ? "progress-fill over"
                                : "progress-fill"
                            }
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        <span
                          className={
                            remaining < 0 ? "over-budget" : "under-budget"
                          }
                        >
                          {remaining < 0
                            ? `${money(Math.abs(remaining))} over budget`
                            : `${money(remaining)} remaining`}
                        </span>
                      </article>
                    );
                  })
                )}
              </div>

              <div className="budget-list-section">
                <div className="budget-list-header">
                  <div>
                    <p className="eyebrow">ALL BUDGETS</p>
                    <h3>Budgeted items</h3>
                  </div>

                  <span className="pill green">
                    {budgets.length} {budgets.length === 1 ? "item" : "items"}
                  </span>
                </div>

                {budgets.length === 0 ? (
                  <p className="empty-state">
                    You have not added any budgeted items yet.
                  </p>
                ) : (
                  <div className="budget-item-list">
                    {budgets.map((budget) => {
                      const spent = categoryTotals[budget.category] || 0;
                      const remaining = Number(budget.limit) - spent;

                      return (
                        <div className="budget-item-row" key={budget.id}>
                          <div className="budget-item-icon">◎</div>

                          <div className="budget-item-details">
                            <strong>{budget.name || budget.category}</strong>
                            <span className="budget-category-label">{budget.category}</span>

                            {budget.description && (
                              <span>{budget.description}</span>
                            )}

                            <small>
                              {money(spent)} spent of {money(budget.limit)}
                            </small>
                          </div>

                          <div className="budget-item-amount">
                            <strong>{money(budget.limit)}</strong>

                            <span
                              className={
                                remaining < 0
                                  ? "over-budget"
                                  : "under-budget"
                              }
                            >
                              {remaining < 0
                                ? `${money(Math.abs(remaining))} over`
                                : `${money(remaining)} left`}
                            </span>
                          </div>

                          <button
                            className="icon-button"
                            onClick={() => setBudgetForm(budget)}
                            aria-label={`Edit ${budget.name || budget.category} budget`}
                          >
                            ✎
                          </button>

                          <button
                            className="icon-button danger"
                            onClick={() => deleteBudget(budget.id)}
                            aria-label={`Delete ${budget.name || budget.category} budget`}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </article>
          </section>
        )}

        {activeTab === "Debts" && (
          <section className="tab-layout">
            <article className="panel form-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">WHAT YOU OWE</p>
                  <h3>{debtForm.id ? "Edit debt" : "Add a debt"}</h3>
                </div>
              </div>

              <form onSubmit={saveDebt}>
                <label>
                  Debt name
                  <input
                    required
                    placeholder="Credit card, loan, I.O.U..."
                    value={debtForm.name}
                    onChange={(event) =>
                      setDebtForm({
                        ...debtForm,
                        name: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Starting amount owed
                  <input
                    required
                    min="0.01"
                    step="0.01"
                    type="number"
                    placeholder="680.00"
                    value={debtForm.startingBalance}
                    onChange={(event) =>
                      setDebtForm({
                        ...debtForm,
                        startingBalance: event.target.value,
                      })
                    }
                  />
                </label>

                <div className="button-row">
                  <button className="primary-button" type="submit">
                    {debtForm.id ? "Save changes" : "Add debt"}
                  </button>

                  {debtForm.id && (
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => setDebtForm(EMPTY_DEBT)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <hr />

              <div className="panel-heading">
                <div>
                  <p className="eyebrow">PAYMENT</p>
                  <h3>Record a payment</h3>
                </div>
              </div>

              <form onSubmit={addDebtPayment}>
                <label>
                  Choose debt
                  <select
                    required
                    value={paymentForm.debtId}
                    onChange={(event) =>
                      setPaymentForm({
                        ...paymentForm,
                        debtId: event.target.value,
                      })
                    }
                  >
                    <option value="">Select a debt</option>

                    {debts.map((debt) => (
                      <option key={debt.id} value={debt.id}>
                        {debt.name} — {money(getRemainingDebt(debt))} remaining
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Payment amount
                  <input
                    required
                    min="0.01"
                    step="0.01"
                    type="number"
                    placeholder="50.00"
                    value={paymentForm.amount}
                    onChange={(event) =>
                      setPaymentForm({
                        ...paymentForm,
                        amount: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Payment date
                  <input
                    required
                    type="date"
                    value={paymentForm.date}
                    onChange={(event) =>
                      setPaymentForm({
                        ...paymentForm,
                        date: event.target.value,
                      })
                    }
                  />
                </label>

                <button className="primary-button" type="submit">
                  Record payment
                </button>
              </form>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">DEBT OVERVIEW</p>
                  <h3>Your payoff progress</h3>
                </div>
              </div>

              <div className="budget-grid scroll-grid">
                {debts.length === 0 ? (
                  <p className="empty-state">
                    Add a debt, such as an I.O.U. balance of $680, to begin.
                  </p>
                ) : (
                  debts.map((debt) => {
                    const totalPaid = getTotalPaid(debt);
                    const remaining = getRemainingDebt(debt);

                    const paidPercent = Math.min(
                      (totalPaid / Number(debt.startingBalance)) * 100,
                      100
                    );

                    const sortedPayments = [...debt.payments].sort((a, b) =>
                      b.date.localeCompare(a.date)
                    );

                    return (
                      <article className="budget-card debt-card" key={debt.id}>
                        <div className="budget-card-top">
                          <div>
                            <p className="eyebrow">DEBT</p>
                            <strong>{debt.name}</strong>
                          </div>

                          <div>
                            <button
                              className="icon-button"
                              onClick={() => setDebtForm(debt)}
                              aria-label={`Edit ${debt.name}`}
                            >
                              ✎
                            </button>

                            <button
                              className="icon-button danger"
                              onClick={() => deleteDebt(debt.id)}
                              aria-label={`Delete ${debt.name}`}
                            >
                              ×
                            </button>
                          </div>
                        </div>

                        <div className="debt-balance-box">
                          <span>Remaining balance</span>
                          <h3>{money(remaining)}</h3>
                          <p>
                            Paid {money(totalPaid)} of{" "}
                            {money(debt.startingBalance)}
                          </p>
                        </div>

                        <div className="progress-track large">
                          <div
                            className="progress-fill"
                            style={{ width: `${paidPercent}%` }}
                          />
                        </div>

                        <span className="under-budget">
                          {Math.round(paidPercent)}% paid off
                        </span>

                        <div className="debt-history">
                          <div className="debt-history-header">
                            <strong>Payment history</strong>
                            <span>
                              {sortedPayments.length}{" "}
                              {sortedPayments.length === 1
                                ? "payment"
                                : "payments"}
                            </span>
                          </div>

                          {sortedPayments.length === 0 ? (
                            <p className="empty-state debt-empty">
                              No payments recorded yet.
                            </p>
                          ) : (
                            sortedPayments.map((payment) => (
                              <div
                                className="debt-payment-row"
                                key={payment.id}
                              >
                                <div>
                                  <strong>{money(payment.amount)}</strong>
                                  <span>{payment.date}</span>
                                </div>

                                <button
                                  className="icon-button danger"
                                  onClick={() =>
                                    deleteDebtPayment(debt.id, payment.id)
                                  }
                                  aria-label={`Delete ${money(
                                    payment.amount
                                  )} payment`}
                                >
                                  ×
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </article>
          </section>
        )}

        {activeTab === "Goals" && (
          <section className="tab-layout">
            <article className="panel form-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">WHAT YOU'RE SAVING FOR</p>
                  <h3>{goalForm.id ? "Edit goal" : "Add a goal"}</h3>
                </div>
              </div>

              <form onSubmit={saveGoal}>
                <label>
                  Goal name
                  <input
                    required
                    placeholder="Emergency fund, vacation..."
                    value={goalForm.name}
                    onChange={(event) =>
                      setGoalForm({
                        ...goalForm,
                        name: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Target amount
                  <input
                    required
                    min="0.01"
                    step="0.01"
                    type="number"
                    placeholder="1000.00"
                    value={goalForm.targetAmount}
                    onChange={(event) =>
                      setGoalForm({
                        ...goalForm,
                        targetAmount: event.target.value,
                      })
                    }
                  />
                </label>

                <div className="button-row">
                  <button className="primary-button" type="submit">
                    {goalForm.id ? "Save changes" : "Add goal"}
                  </button>

                  {goalForm.id && (
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => setGoalForm(EMPTY_GOAL)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <hr />

              <div className="panel-heading">
                <div>
                  <p className="eyebrow">CONTRIBUTION</p>
                  <h3>Add a contribution</h3>
                </div>
              </div>

              <form onSubmit={addGoalContribution}>
                <label>
                  Choose goal
                  <select
                    required
                    value={contributionForm.goalId}
                    onChange={(event) =>
                      setContributionForm({
                        ...contributionForm,
                        goalId: event.target.value,
                      })
                    }
                  >
                    <option value="">Select a goal</option>

                    {goals.map((goal) => (
                      <option key={goal.id} value={goal.id}>
                        {goal.name} — {money(getGoalRemaining(goal))} to go
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Contribution amount
                  <input
                    required
                    min="0.01"
                    step="0.01"
                    type="number"
                    placeholder="50.00"
                    value={contributionForm.amount}
                    onChange={(event) =>
                      setContributionForm({
                        ...contributionForm,
                        amount: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Contribution date
                  <input
                    required
                    type="date"
                    value={contributionForm.date}
                    onChange={(event) =>
                      setContributionForm({
                        ...contributionForm,
                        date: event.target.value,
                      })
                    }
                  />
                </label>

                <button className="primary-button" type="submit">
                  Add contribution
                </button>
              </form>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">GOAL OVERVIEW</p>
                  <h3>Your savings progress</h3>
                </div>
              </div>

              <div className="budget-grid scroll-grid">
                {goals.length === 0 ? (
                  <p className="empty-state">
                    Add a goal, such as a $1,000 emergency fund, to begin.
                  </p>
                ) : (
                  goals.map((goal) => {
                    const totalSaved = getTotalSaved(goal);
                    const remaining = getGoalRemaining(goal);

                    const savedPercent = Math.min(
                      (totalSaved / Number(goal.targetAmount)) * 100,
                      100
                    );

                    const sortedContributions = [...goal.contributions].sort(
                      (a, b) => b.date.localeCompare(a.date)
                    );

                    return (
                      <article className="budget-card debt-card" key={goal.id}>
                        <div className="budget-card-top">
                          <div>
                            <p className="eyebrow">GOAL</p>
                            <strong>{goal.name}</strong>
                          </div>

                          <div>
                            <button
                              className="icon-button"
                              onClick={() => setGoalForm(goal)}
                              aria-label={`Edit ${goal.name}`}
                            >
                              ✎
                            </button>

                            <button
                              className="icon-button danger"
                              onClick={() => deleteGoal(goal.id)}
                              aria-label={`Delete ${goal.name}`}
                            >
                              ×
                            </button>
                          </div>
                        </div>

                        <div className="debt-balance-box">
                          <span>Remaining to save</span>
                          <h3>{money(remaining)}</h3>
                          <p>
                            Saved {money(totalSaved)} of{" "}
                            {money(goal.targetAmount)}
                          </p>
                        </div>

                        <div className="progress-track large">
                          <div
                            className="progress-fill"
                            style={{ width: `${savedPercent}%` }}
                          />
                        </div>

                        <span className="under-budget">
                          {Math.round(savedPercent)}% saved
                        </span>

                        <div className="debt-history">
                          <div className="debt-history-header">
                            <strong>Contribution history</strong>
                            <span>
                              {sortedContributions.length}{" "}
                              {sortedContributions.length === 1
                                ? "contribution"
                                : "contributions"}
                            </span>
                          </div>

                          {sortedContributions.length === 0 ? (
                            <p className="empty-state debt-empty">
                              No contributions recorded yet.
                            </p>
                          ) : (
                            sortedContributions.map((contribution) => (
                              <div
                                className="debt-payment-row"
                                key={contribution.id}
                              >
                                <div>
                                  <strong>{money(contribution.amount)}</strong>
                                  <span>{contribution.date}</span>
                                </div>

                                <button
                                  className="icon-button danger"
                                  onClick={() =>
                                    deleteGoalContribution(
                                      goal.id,
                                      contribution.id
                                    )
                                  }
                                  aria-label={`Delete ${money(
                                    contribution.amount
                                  )} contribution`}
                                >
                                  ×
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </article>
          </section>
        )}
        {activeTab === "Bills" && (
          <section className="tab-layout">
            <article className="panel form-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">RECURRING PAYMENTS</p>
                  <h3>{billForm.id ? "Edit bill" : "Add a recurring bill"}</h3>
                </div>
              </div>

              <form onSubmit={saveBill}>
                <label>
                  Bill name
                  <input
                    required
                    placeholder="Rent, Netflix, Car payment..."
                    value={billForm.name}
                    onChange={(event) =>
                      setBillForm({ ...billForm, name: event.target.value })
                    }
                  />
                </label>

                <label>
                  Category
                  <select
                    value={billForm.category}
                    onChange={(event) =>
                      setBillForm({
                        ...billForm,
                        category: event.target.value,
                      })
                    }
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Amount
                  <input
                    required
                    min="0.01"
                    step="0.01"
                    type="number"
                    placeholder="49.99"
                    value={billForm.amount}
                    onChange={(event) =>
                      setBillForm({ ...billForm, amount: event.target.value })
                    }
                  />
                </label>

                <label>
                  Due day of month
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="15"
                    value={billForm.dueDay}
                    onChange={(event) =>
                      setBillForm({ ...billForm, dueDay: event.target.value })
                    }
                  />
                </label>

                <div className="button-row">
                  <button className="primary-button" type="submit">
                    {billForm.id ? "Save changes" : "Add bill"}
                  </button>

                  {billForm.id && (
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => setBillForm(EMPTY_BILL)}
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <p className="small-note">
                  Bills won't affect your balance or budgets until you mark
                  them paid for the month.
                </p>
              </form>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">
                    {getMonthLabel(selectedMonth).toUpperCase()}
                  </p>
                  <h3>Your bills</h3>
                </div>
              </div>

              <div className="budget-grid scroll-grid">
                {recurringBills.length === 0 ? (
                  <p className="empty-state">
                    Add a bill, such as Rent or Netflix, to start tracking it
                    here instead of your expense list.
                  </p>
                ) : (
                  recurringBills.map((bill) => {
                    const payment = getBillPaymentForMonth(
                      bill,
                      selectedMonth
                    );
                    const isPaid = Boolean(payment);

                    return (
                      <article
                        className="budget-card debt-card"
                        key={bill.id}
                      >
                        <div className="budget-card-top">
                          <div>
                            <p className="eyebrow">{bill.category}</p>
                            <strong>{bill.name}</strong>
                          </div>

                          <div>
                            <button
                              className="icon-button"
                              onClick={() => setBillForm(bill)}
                              aria-label={`Edit ${bill.name}`}
                            >
                              ✎
                            </button>

                            <button
                              className="icon-button danger"
                              onClick={() => deleteBill(bill.id)}
                              aria-label={`Delete ${bill.name}`}
                            >
                              ×
                            </button>
                          </div>
                        </div>

                        <div className="debt-balance-box">
                          <span>Amount due</span>
                          <h3>{money(bill.amount)}</h3>
                          <p>
                            {isPaid
                              ? `Paid on ${payment.date}`
                              : getDueDateLabel(bill, selectedMonth)
                              ? `Due ${getDueDateLabel(bill, selectedMonth)} · Not paid yet`
                              : "Not paid yet this month"}
                          </p>
                        </div>

                        <button
                          className={
                            isPaid ? "secondary-button" : "primary-button"
                          }
                          type="button"
                          onClick={() =>
                            isPaid
                              ? markBillUnpaid(bill.id)
                              : markBillPaid(bill.id)
                          }
                        >
                          {isPaid
                            ? "Mark unpaid"
                            : `Mark paid for ${getMonthLabel(selectedMonth)}`}
                        </button>
                      </article>
                    );
                  })
                )}
              </div>
            </article>
          </section>
        )}
      </main>
    </div>
  );
}