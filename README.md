# Campus Notification Portal

A full-stack notification dashboard designed to fetch, prioritize, and display campus alerts in real-time. This project handles dynamic data fetching, priority-based sorting, and includes a custom universal logging middleware.

## 🚀 Features

* **Priority Sorting Algorithm:** Custom logic that ensures critical notifications (like Placements) are always sorted above standard Events and Results, factoring in recency as a tie-breaker.
* **Universal Logging Middleware:** A custom-built logging package designed to work seamlessly across both Node.js (CommonJS) and modern React (ES Modules) environments.
* **Responsive Dashboard:** Built with React and Material UI, featuring real-time unread badges, category filtering, and customizable display limits.
* **State Persistence:** Tracks and stores "read" vs "unread" notification states securely in the browser's `localStorage`.
* **CORS Proxy:** Configured a Vite server proxy to securely route API requests and bypass strict Cross-Origin Resource Sharing restrictions.

## 🛠️ Tech Stack

* **Frontend:** React, Vite, Material UI (MUI)
* **Backend:** Node.js, Express (API consumption)
* **Architecture:** Monorepo style structure with decoupled middleware

## 📁 Project Structure

* `/notification_app_be`: Node.js backend scripts for fetching and applying priority algorithms to raw notification data.
* `/notification_app_fe`: The Vite + React frontend dashboard application.
* `/logging_middleware`: Custom reusable logging package consumed by both the frontend and backend.

## 💻 How to Run Locally

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### 1. Setup the Frontend
Navigate to the frontend directory and install the dependencies:
```bash
cd notification_app_fe
npm install