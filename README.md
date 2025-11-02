# ☕ Focus Café

Welcome to Focus Café! This is a pixel-art, multiplayer virtual space designed to help you stay productive. You can walk around the café, manage your to-do list, and invite other users nearby to start a "Pomodoro" focus session together.

---

## 🌟 Core Features

* **Real-time Multiplayer:** See other users move in the virtual space in real-time.
* **Focus Invitation System:** Invite nearby players to a co-focus session for a shared duration.
* **Focus Timer:** A built-in Pomodoro timer with customizable lengths.
* **To-Do List:** A persistent to-do list widget that saves your tasks using `localStorage`.
* **Pixel Art Animation:** Character walking and idle animations using sprite sheets.
* **User Dashboard:** Displays a welcome message, current time, and date.

---

## 🛠️ Tech Stack

* **Frontend (Client):**
    * [React](https://reactjs.org/) (v18+)
    * [Socket.io-client](https://socket.io/docs/v4/client-api/) (For real-time WebSocket communication)
    * Plain CSS (For all component styling and layout)
* **Backend (Server):**
    * [Node.js](https://nodejs.org/)
    * [Express](https://expressjs.com/) (As the base server for `socket.io`)
    * [Socket.io](https://socket.io/) (Handling real-time connections and event broadcasting)

---

## 📂 Project Structure

```
focus-cafe/
│
├── client/         # All React frontend code
│   ├── public/
│   └── src/
│       ├── assets/     # Images, background, sprite sheets
│       ├── components/ # React Components (FocusTimer, TodoList, InvitationModal...)
│       ├── maps/       # Collision map (cafeLayout.js)
│       ├── utils/      # Helper functions (user.js)
│       ├── App.js      # Main application component (handles game logic & sockets)
│       ├── App.css
│       └── index.js    # React entry point
│
└── server/         # All Node.js backend code
    ├── index.js    # Express and Socket.io server logic
    └── package.json
```

---

## 🚀 How to Run Locally

You will need to run **both** the backend server and the frontend application simultaneously.

### 1. Prerequisites

* [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
* [npm](https://www.npmjs.com/) (usually installed with Node.js)

### 2. Start the Backend Server

First, let's get the server running.

```bash
# 1. Navigate into the server directory
cd server

# 2. Install the necessary dependencies
npm install

# 3. Start the server (runs on http://localhost:3001 by default)
npm start
# Or, if you don't have a start script:
# node index.js
```

You should see a message in your terminal: `🚀 Server running on http://localhost:3001`.

### 3. Start the Frontend App

Open a **new** terminal window (leave the server terminal running).

```bash
# 1. (From the root folder) Navigate into the client directory
cd client

# 2. Install the necessary dependencies
npm install

# 3. Start the React development server (runs on http://localhost:3000 by default)
npm start
```

This command will automatically open `http://localhost:3000` in your default browser.

---

## 🕹️ How to Use

1.  Open `http://localhost:3000`.
2.  To test the multiplayer feature, open a **second browser tab** (or an incognito window) and navigate to `http://localhost:3000` again.
3.  You should see both characters in both windows.
4.  In one window, move your character next to the other character.