# Webapp Frontend

Frontend project for the Auto Washing Management System developed using React and Vite.

---

## Tech Stack

- React.js
- Vite
- React Router DOM
- Axios
- Tailwind CSS / CSS Modules
- ESLint

---

## Project Setup

### 1. Clone repository

```bash
git clone https://github.com/WDP301-SU26-AutoWashingManagement/Webapp_Frontend.git
```

---

### 2. Move to project folder

```bash
cd Webapp_Frontend
```

---

### 3. Install dependencies

```bash
npm install
```

---

### 4. Run development server

```bash
npm run dev
```

Application will run at:

```bash
http://localhost:5173
```

---

## Available Scripts

### Run development server

```bash
npm run dev
```

### Build project

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Run ESLint

```bash
npm run lint
```

---

## Project Structure

```bash
src/
├── assets/        # Images, icons, static files
├── components/    # Reusable UI components
├── pages/         # Application pages
├── routes/        # Route configuration
├── services/      # API calls
├── hooks/         # Custom hooks
├── context/       # Context API
├── layouts/       # Layout components
├── utils/         # Helper functions
└── main.jsx
```

---

## Git Workflow

- Create a new branch before developing features
- Push code to feature branches
- Create Pull Request into `dev`
- Merge `dev` into `main` when stable

Example:

```bash
git checkout -b feature/login-page
```

---

## Team Collaboration Rules

- Do not push directly to `main`
- Resolve conflicts locally before creating PR
- Use meaningful commit messages

Example commit messages:

```bash
feat: add login page
fix: resolve navbar routing issue
refactor: optimize authentication flow
```

---

## Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3000
```

---

## Contributors

WDP301 - Auto Washing Management Team