# NoteSpace — Notes Application (Like Notion)

A full-stack notes application built with:

- HTML5
- CSS3
- JavaScript
- React
- Node.js
- Express.js
- MongoDB / Mongoose

## Features

- Create, edit and delete notes
- Pin notes
- Archive notes
- Trash and restore
- Search notes
- Filter by folder
- Tags
- Markdown-style text support in the editor
- Dark/light theme
- Responsive UI
- REST API with MongoDB

## Project structure

```text
notes-notion-app/
├── client/       # React UI/UX
└── server/       # Node + Express + MongoDB API
```

## Run locally

### 1. Install dependencies

```bash
npm install
npm --prefix server install
npm --prefix client install
```

### 2. Configure MongoDB

Copy:

```text
server/.env.example
```

to:

```text
server/.env
```

Set:

```env
MONGO_URI=mongodb://127.0.0.1:27017/your_database_name
PORT=5000
```

You can also use a MongoDB Atlas connection string.

### 3. Start both frontend and backend

```bash
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:5000

## API

- GET `/api/notes`
- POST `/api/notes`
- PUT `/api/notes/:id`
- DELETE `/api/notes/:id`
- PATCH `/api/notes/:id/archive`
- PATCH `/api/notes/:id/pin`
- PATCH `/api/notes/:id/restore`

## Academic project

This project separates the required layers:

1. UI/UX — React, HTML, CSS, JavaScript
2. Business logic — React state + Express controllers/routes
3. Backend/database — Node.js, Express.js, MongoDB/Mongoose
