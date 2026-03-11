import express from "express";
import cors from "cors";
import multer from "multer";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Gemini AI
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Stateless in-memory uploads (no disk or DB)
const MAX_INLINE_SIZE = 20 * 1024 * 1024; // 20MB Gemini inline limit

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "audio/mpeg",
    "audio/wav",
    "audio/flac",
    "audio/mp3",
    "audio/x-wav",
    "audio/webm",
    "audio/webm;codecs=opus",
    "audio/aiff",
    "audio/aac",
    "audio/ogg",
  ];
  const allowedExts = [
    ".mp3",
    ".wav",
    ".flac",
    ".webm",
    ".aiff",
    ".aac",
    ".ogg",
  ];
  const ext = (file.originalname || "").split(".").pop().toLowerCase();
  const hasExt = allowedExts.includes("." + ext);

  if (allowedMimes.includes(file.mimetype) || hasExt) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Supported formats: MP3, WAV, FLAC, WebM, AIFF, AAC, OGG."
      ),
      false
    );
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: MAX_INLINE_SIZE, // Cap at 20MB so we stay inline-only (no Files API, no temp files)
  },
});

// Build Gemini inline part from in-memory buffer (no disk I/O)
function bufferToInlinePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType: mimeType || "audio/mp3",
    },
  };
}

// POST endpoint for audio classification (stateless: audio kept in memory only)
app.post("/api/classify", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        error: "No audio file provided",
        success: false,
      });
    }

    const mimeType = req.file.mimetype || "audio/mp3";
    const filePart = bufferToInlinePart(req.file.buffer, mimeType);

    // Craft a clear prompt for genre classification
    const prompt = `
You are an expert music analyst trained to identify musical genres from audio.

TASK
Listen to the provided audio and determine the most appropriate musical genre.

Your classification must be based strictly on audible musical characteristics such as:

- instrumentation
- vocal style
- rhythm and groove
- tempo
- harmonic structure
- production style
- ensemble structure (solo, band, choir, electronic, etc.)

IMPORTANT RULES

- Do NOT assume the genre based only on language or region.
- Do NOT force the music into a genre unless the musical characteristics clearly match.
- If the genre is unclear, choose the closest widely recognized genre.
- African music should not automatically be classified as traditional percussion genres.
- Choir or vocal ensemble music may belong to genres such as Gospel, Choral, or Religious music.

ANALYSIS PROCESS

1. Identify the dominant instruments or sound sources.
2. Identify the vocal style (solo, rap, melodic singing, choir, chant, etc).
3. Identify rhythm and tempo characteristics.
4. Identify whether the production is acoustic, band-based, or electronic.
5. Based on these observations, determine the most appropriate genre.

Return the MOST LIKELY genre based on musical evidence.

Do not guess artist or song title.
Focus only on musical classification.

Return only the JSON structure defined in the schema.
`;

    // Generate content using Gemini with structured output
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [filePart, { text: prompt }],
      },
      config: {
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            genre: {
              type: Type.STRING,
              description: "Primary musical genre (e.g., Apala, Fuji, Jazz, Hip-hop, Pop). Use specific genre names, not generic terms.",
            },
            culturalOrigin: {
              type: Type.STRING,
              description: "Cultural or regional origin (e.g., 'Yoruba (Nigeria)', 'West African', 'Western', 'Latin American'). Use 'N/A' if not culturally specific. This is for backend tracking only.",
            },
            subgenre: {
              type: Type.STRING,
              description: "Specific subgenre or null if not applicable",
              nullable: true,
            },
            confidence: {
              type: Type.NUMBER,
              description: "Confidence score from 0-100",
            },
            acousticAnalysis: {
              type: Type.OBJECT,
              properties: {
                tempo: {
                  type: Type.STRING,
                  description:
                    "Description of tempo (e.g., 'fast', 'moderate', 'slow')",
                },
                instrumentation: {
                  type: Type.STRING,
                  description: "Key instruments detected. For African music, specifically identify: talking drums/dundun, agogo, shekere, djembe, log drums, shakers, or other traditional African percussion. For other genres, list the primary instruments.",
                },
                rhythm: {
                  type: Type.STRING,
                  description: "Rhythm pattern description. For African music, note polyrhythmic patterns, call-and-response structures, and specific rhythmic characteristics.",
                },
                harmonic: {
                  type: Type.STRING,
                  description: "Harmonic characteristics (e.g., minimal, complex, modal, tonal)",
                },
              },
              required: ["tempo", "instrumentation", "rhythm", "harmonic"],
            },
            reasoning: {
              type: Type.STRING,
              description:
                "Detailed expert analysis explaining the genre classification. Focus on musical characteristics like tempo, instrumentation, rhythm patterns, harmonic structure, and overall musical style. Explain why this specific genre was chosen over alternatives.",
            },
          },
          required: ["genre", "culturalOrigin", "confidence", "acousticAnalysis", "reasoning"],
        },
      },
    });

    const genreData = JSON.parse(response.text);
    if (genreData.culturalOrigin) {
      console.log("Cultural origin detected:", genreData.culturalOrigin);
    }

    // Send response (no server-side storage; culturalOrigin not sent to frontend)
    res.json({
      success: true,
      genre: genreData.genre || "Unknown",
      subgenre: genreData.subgenre || null,
      confidence: genreData.confidence || 70,
      acousticAnalysis: genreData.acousticAnalysis || {},
      reasoning: genreData.reasoning || "Classification completed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Classification error:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Failed to classify audio",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Music Genre Classifier API",
    gemini: !!process.env.GEMINI_API_KEY ? "configured" : "missing",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File size too large. Maximum size is 20MB for in-memory processing.",
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    error: err.message || "Internal server error",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎵 Music Genre Classifier API running on port ${PORT}`);
  console.log(
    `🔑 Gemini API Key: ${
      process.env.GEMINI_API_KEY ? "✓ Configured" : "✗ Missing"
    }`
  );
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});
