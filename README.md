# ResPart - Find Your Research Partner

A modern, Tinder-style research paper discovery app built with React, Vite, and Framer Motion.

## 🎯 Features

- **Swipeable Cards** - Drag papers left (dislike) or right (like) with smooth animations
- **Real Papers** - Fetches live data from Semantic Scholar API
- **Export Options** - Export your collection in 5 formats:
  - JSON - App-friendly data format
  - CSV - Spreadsheet compatible  
  - BibTeX - LaTeX/Overleaf citations
  - EndNote - Reference manager format
  - Text - Plain readable format
- **Archive System** - Auto-archive liked papers by topic
- **Stats Tracking** - Real-time counts of liked, disliked, and archived papers
- **Framer Motion** - Smooth drag animations and transitions
- **Responsive Design** - Works on desktop and mobile

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📱 How to Use

1. **Search** - Enter a research topic (e.g., "machine learning")
2. **Swipe** - Drag cards right to like, left to dislike
3. **Export** - Click the Export button to save your collection
4. **Archive** - Papers are auto-archived by topic when liked

## 🛠️ Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Semantic Scholar API** - Research papers data

## 📁 Project Structure

```
research-swipe-react/
├── src/
│   ├── components/
│   │   ├── SwipeCard.jsx       # Main swipeable card
│   │   ├── ExportModal.jsx     # Export tabs modal
│   │   ├── SearchBar.jsx       # Search input
│   │   └── Stats.jsx           # Stats display
│   ├── App.jsx                 # Main app component
│   ├── main.jsx                # Entry point
│   └── index.css               # Global styles
├── index.html
├── package.json
└── vite.config.js
```

## 🎨 Customization

### Change Colors
Edit the CSS files in `src/components/` to customize colors and styles.

### API Integration
The app uses Semantic Scholar API (no key required). To use a different API, modify the `searchPapers` function in `App.jsx`.

## 📄 License

MIT License - feel free to use this project for your research!

## 🤝 Contributing

Contributions welcome! Feel free to open issues or pull requests.

---

Built with ❤️ for researchers
