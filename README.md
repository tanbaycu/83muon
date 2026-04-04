# 🌸 Greeting Card Platform

> An avant-garde, editorial-style web app for creating and sharing personalized greeting cards — powered by Firebase Firestore, built with React + Vite.

Each person gets a unique card accessed by their ID: a cinematic full-screen experience with their name, photo, custom message, and share link.

**Live demo:** [your-app.vercel.app](https://your-app.vercel.app)

---

## ✨ What It Does

- **ID-based card lookup** — type a number or text ID to open a personalized card
- **Cinematic mobile layout** — full-screen immersive view with swipe-up drawer on phones
- **Editorial desktop layout** — split-panel magazine design with animated iframe background
- **Film strip animation** — scrolling gallery of all card photos as a cinematic backdrop
- **Shareable URLs** — every card has a permanent share link at `/share/:id`
- **Admin CMS** (`/systemremits`) — full content management with:
  - Google Sign-In (any Google account)
  - Markdown message editor with live preview
  - Built-in image crop + compression (images stored as base64 in Firestore — no Storage needed)
  - Ownership locking — only the creator can edit their own card
  - Dashboard view to manage all entries

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite 6 |
| Animation | Framer Motion, Anime.js |
| Styling | Tailwind CSS v4 |
| Database | Firebase Firestore |
| Auth | Firebase Auth (Google Sign-In) |
| Routing | React Router v7 |
| Markdown | react-markdown + remark-gfm |
| Image | react-easy-crop + browser-image-compression |
| Hosting | Vercel (recommended) |

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
npm install
```

### 2. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Add project**
2. Enable **Firestore Database** → Start in **Production mode**
3. Enable **Authentication** → Sign-in method → **Google**
4. Go to **Project Settings → Your Apps → Add Web App**
5. Copy the config object — you'll need it in the next step

### 3. Configure Environment

```bash
cp .env.example .env
```

Open `.env` and fill in your Firebase credentials:

```env
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123456789:web:abc..."
VITE_FIREBASE_MEASUREMENT_ID="G-XXXXXXX"
```

### 4. Set Firestore Security Rules

In Firebase Console → Firestore → **Rules** tab, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /girls/{id} {
      // Anyone can read cards (public viewer)
      allow read: if true;
      // Only authenticated users can create new cards
      allow create: if request.auth != null;
      // Only the original creator can update their card
      allow update: if request.auth != null &&
        (resource.data.authorUid == null ||
         resource.data.authorUid == request.auth.uid);
    }
  }
}
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## ☁️ Deploy to Vercel

1. Push your repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. In **Environment Variables**, add all `VITE_FIREBASE_*` keys from your `.env`
4. Deploy — done!

> ⚠️ **Important:** Never commit `.env`. The `.gitignore` already excludes it. Use `.env.example` as the template.

---

## 📁 Project Structure

```
├── lib/
│   └── firebase.js          # Firebase init — reads from VITE_* env vars
├── public/
│   ├── animated.html        # Iframe flower animation background
│   └── loadingv1.svg        # Path-drawing loading animation
├── src/
│   ├── App.jsx              # Main card viewer + routing
│   ├── SystemRemits.jsx     # Admin CMS panel (/systemremits)
│   ├── ShareCard.jsx        # Public share page (/share/:id)
│   ├── App.css              # Global styles + CSS variables
│   └── index.css            # Tailwind base
├── .env.example             # Environment variable template (safe to commit)
├── .env                     # Your local secrets (gitignored)
└── vite.config.js
```

---

## 🗃 Firestore Data Schema

Cards are stored in the `girls` collection. The **document ID** is the card's unique identifier (e.g., `01`, `02`, `alice`, `teacher`):

```json
{
  "stt": "01",
  "name": "Display Name",
  "wish": "Your message here — supports **Markdown**",
  "signature": "— From: The Team",
  "imageUrl": "data:image/jpeg;base64,...",
  "authorUid": "firebase_uid_of_creator",
  "authorEmail": "creator@gmail.com",
  "updatedAt": "2025-03-08T10:00:00.000Z"
}
```

> **Storage strategy:** Images are compressed to < 50KB via `browser-image-compression` then stored as base64 strings directly in Firestore — bypassing Firebase Storage entirely.

---

## 🔐 Admin Panel (`/systemremits`)

| Step | Action |
|------|--------|
| 1 | Navigate to `/systemremits` |
| 2 | Sign in with any Google account |
| 3 | Enter an ID → click **Check STT** to verify availability |
| 4 | Fill in: display name, Markdown message, signature, photo |
| 5 | Click **Save** → card is instantly live |

**Ownership model:** Once a card is created, only its original Google account can edit it. Other users see it as "Locked" in the dashboard.

**Preview before saving:** Use the **Preview** button to open a sandbox view of your card without publishing.

---

## 🎨 Customize for Your Event

This project is designed as a reusable template. Adapt it for graduation, birthdays, holidays, or any group celebration:

| What | Where |
|------|-------|
| Marquee banner text | `src/App.jsx` → `EditorialMarquee` component |
| Loading animation | Replace `public/loadingv1.svg` |
| Background animation | Replace `public/animated.html` |
| Default fallback message | `src/App.jsx` → `defaultWish` constant |
| Color palette | `src/App.css` → CSS variables (`--color-*`) |
| Page title & meta tags | `index.html` |
| Collection name in Firestore | Search `'girls'` in `src/App.jsx` and `src/SystemRemits.jsx` |

---

## 📄 License

MIT — Free to use, fork, and adapt for personal and educational projects.
