# Music Genre Classifier App

An AI-powered music genre classification application built with Vue 3, Node.js, and Google Gemini AI.

## Features

- 🎤 **Real-time Audio Recording** - Record audio directly from your microphone with live waveform visualization
- 📤 **File Upload Support** - Upload MP3, WAV, FLAC, or WebM files (up to 10MB)
- 🤖 **AI-Powered Classification** - Powered by Google Gemini AI for accurate genre detection using native audio analysis
- 🎨 **Premium Dark UI** - Beautiful, responsive design with smooth animations
- ⚡ **Fast & Responsive** - Optimized for both desktop and mobile devices

## Tech Stack

### Frontend
- Vue 3 (Composition API)
- Vue Router
- Tailwind CSS 4
- Web Audio API
- Axios

### Backend
- Node.js
- Express
- Google Generative AI (Gemini)
- Multer (file uploads)

## Setup Instructions

### Prerequisites
- Node.js (v20.19.0 or higher / v22.12.0 or higher)
- A Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Backend Setup

1. Navigate to the Backend directory:
```bash
cd Backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```

4. Add your Gemini API key to `.env`:
```
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
NODE_ENV=development
```

5. Start the server:
```bash
npm start
```

The backend will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to the Frontend directory:
```bash
cd Frontend
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. (Optional) Create `.env` file if you need to change the API URL:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` (or another port if 5173 is in use)

## Usage

1. **Start Backend**: Make sure the backend server is running on port 3000
2. **Start Frontend**: Run the frontend dev server
3. **Open Browser**: Navigate to the frontend URL (usually `http://localhost:5173`)
4. **Choose Input Method**:
   - **Record**: Click "Record Audio" tab and record 5-10 seconds of music
   - **Upload**: Click "Upload File" tab and drag-drop or select an audio file
5. **Classify**: Click the analyze/classify button
6. **View Results**: See the detected genre with confidence score and analysis

## API Endpoints

### Backend API

- `GET /api/health` - Health check endpoint
- `POST /api/classify` - Classify audio genre
  - Accepts: `multipart/form-data` with `audio` file field
  - Returns: JSON with genre, subgenre, confidence, reasoning, and acoustic analysis

### Response Format

```json
{
  "success": true,
  "genre": "Rock",
  "subgenre": "Alternative Rock",
  "confidence": 85,
  "acousticAnalysis": {
    "tempo": "moderate",
    "instrumentation": "electric guitars, drums, bass",
    "rhythm": "4/4 time signature",
    "harmonic": "power chords, minor key"
  },
  "reasoning": "Detailed analysis explaining the genre classification...",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## How It Works

The app uses Google Gemini AI's native audio analysis capabilities to classify music genres. Gemini AI can directly process audio files and analyze musical characteristics such as:

- Tempo and rhythm patterns
- Instrumentation
- Harmonic structure
- Overall musical style

This approach eliminates the need for manual feature extraction, making the system simpler, faster, and more accurate. Gemini's pre-trained models have been trained on diverse global music datasets, enabling recognition of various genres including cultural genres like Highlife, Afrobeats, and Amapiano.

## Project Structure

```
Music Genre Classifier App/
├── Backend/
│   ├── server.js              # Express server with Gemini integration
│   ├── featureExtraction.js   # Legacy feature extraction (optional, not used)
│   ├── package.json            # Node dependencies
│   ├── .env.example            # Environment variables template
│   └── uploads/                # Temporary audio uploads (auto-created)
│
└── Frontend/
    ├── src/
    │   ├── components/
    │   │   ├── AudioRecorder.vue   # Microphone recording
    │   │   ├── AudioUploader.vue   # File upload
    │   │   └── GenreResult.vue     # Results display
    │   ├── views/
    │   │   └── HomeView.vue        # Main view
    │   ├── services/
    │   │   └── api.js              # API client
    │   ├── App.vue
    │   └── main.js
    ├── tailwind.config.js
    └── package.json
```

## Supported Audio Formats

- MP3 (.mp3)
- WAV (.wav)
- FLAC (.flac)
- WebM (.webm)

Maximum file size: 10MB

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari

Note: Microphone recording requires HTTPS (or localhost for development)

## License

MIT

## Credits

Powered by [Google Gemini AI](https://ai.google.dev/)
