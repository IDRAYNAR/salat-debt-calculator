# Salat Debt Calculator (Qadâ' Tracker) 🕌

![Project Status](https://img.shields.io/badge/status-active-emerald)
![License](https://img.shields.io/badge/license-MIT-blue)
![Next.js](https://img.shields.io/badge/Next.js-Latest-black)

A modern, privacy-focused, and responsive web application designed to help Muslims calculate, track, and fulfill their missed prayers (Qadâ').

Built with **Next.js**, **React**, and **Tailwind CSS**, this tool runs entirely in the browser using LocalStorage. No data is sent to any server.

## 🌟 Features

* **🧮 Smart Calculation:** Input missed years, months, and days to automatically calculate the total number of days required to make up.
* **📊 Progress Tracking:** Visual progress bar and percentage indicators to keep you motivated.
* **💾 Local Persistence:** All data is saved automatically to the browser's `localStorage`. Your progress is safe even if you close the tab.
* **🌙 Dark Mode UI:** A clean, minimal, and eye-friendly dark interface, perfect for late-night usage.
* **⚙️ Adjustable Debt:** Life happens. You can easily add more days to your debt via the settings menu if needed.
* **📱 Mobile First:** Fully responsive design that works perfectly on smartphones, tablets, and desktops.

## 🛠️ Tech Stack

This project is built using the latest versions of the following technologies:

* **[Next.js](https://nextjs.org/)** (App Router)
* **[React](https://react.dev/)**
* **[Tailwind CSS](https://tailwindcss.com/)**
* **[Lucide React](https://lucide.dev/)** (Icons)

## 🚀 Getting Started

Follow these steps to run the project locally on your machine.

### Prerequisites

* Node.js (v18 or later recommended)
* npm, yarn, or pnpm

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/IDRAYNAR/salat-debt-calculator.git](https://github.com/IDRAYNAR/salat-debt-calculator.git)
    cd salat-debt-calculator
    ```

2.  **Install dependencies**
    Since this project uses the latest dependencies, simply run:
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Run the development server**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```

4.  **Open your browser**
    Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 📖 How to Use

1.  **Initial Setup:** On the first visit, enter the estimated amount of missed prayers in Years, Months, and Days.
2.  **The Dashboard:** Once calculated, you will see your dashboard.
3.  **Tracking:**
    * Click the big **"+ 1 Day Completed"** button every time you finish a full day of Qadâ' (Subh, Dhuhr, Asr, Maghrib, Isha).
    * Use the **Undo** button if you clicked by mistake.
4.  **Adjustments:** Click the **Settings (⚙️)** icon to view your total target, add to your debt, or reset your progress entirely.

## 🔒 Privacy Policy

**Your data belongs to you.**

* This application does **not** use a backend database.
* This application does **not** use cookies for tracking.
* All data is stored exclusively in your browser's `localStorage`.
* If you clear your browser cache, your progress will be reset.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/[...]`).
3.  Commit your changes (`git commit -m 'Add some [...]'`).
4.  Push to the branch (`git push origin feature/[...]`).
5.  Open a Pull Request.

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

**Made with ❤️ by [IDRAYNAR](https://github.com/IDRAYNAR)**

*May this tool be a Sadaqa Jariya for us all.*

</div>