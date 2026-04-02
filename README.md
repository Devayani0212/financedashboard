# Finance Dashboard UI (Frontend Intern Assignment)

## Overview

A responsive financial dashboard implemented using plain HTML/CSS/JavaScript (no build step required). It demonstrates:
- Summary cards (Total Balance, Income, Expenses, Transaction count)
- Time-based trend visualization (SVG line chart)
- Categorical breakdown (expense bar chart)
- Transaction table with search/filter/sort
- Simulated role-based UI (Viewer / Admin)
- Insights panel with derived metrics
- Local storage persistence
- Dark mode toggle

## Features

1. Dashboard Overview
   - Summary cards: total balance, income, expenses, transactions
   - Balance trend chart using transaction history
   - Spending breakdown for expense categories

2. Transactions Section
   - Displays date, description, category, type, amount
   - Search by description/category
   - Filter by type (all/income/expense)
   - Sort by date/amount

3. Role-Based UI
   - Viewer: read-only, no add/edit/delete controls
   - Admin: add/edit/delete transactions, form visible
   - Role switcher in top bar

4. Insights
   - Highest expense category
   - Income and expense month-over-month change
   - Net balance

5. State Management
   - State object in JS tracks transactions, filters, role, dark mode
   - localStorage persistence on changes

6. UI/UX
   - Responsive layout for mobile and desktop
   - Clear, accessible controls
   - Handles empty/no data states gracefully

## Run Locally

1. Open `index.html` directly in a browser (or serve from local HTTP server).
2. Interact with controls (role switch, dark mode, search, filter, sort).
3. Admin can add/edit/delete transactions.

## Notes

- As per assignment: no backend required, static data with local storage used.
- Added quick interactions and nice UI states while keeping implementation clean.
