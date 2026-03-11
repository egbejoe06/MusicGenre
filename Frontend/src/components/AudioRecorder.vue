<template>
  <div class="audio-recorder">
    <div class="recorder-container">
      <!-- Waveform visualization -->
      <div class="waveform-container" :class="{ active: isRecording }">
        <canvas ref="waveformCanvas" class="waveform-canvas"></canvas>
        <div v-if="!isRecording && !hasRecording" class="placeholder-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" x2="12" y1="19" y2="22"/>
          </svg>
          <p>Click record to start</p>
        </div>
      </div>

      <!-- Recording timer -->
      <div v-if="isRecording" class="timer">
        <span class="recording-dot"></span>
        Recording: {{ formattedTime }}
      </div>

      <!-- Record button -->
      <button 
        @click="toggleRecording" 
        class="record-btn"
        :class="{ recording: isRecording, 'has-recording': hasRecording }"
        :disabled="isProcessing"
      >
        <svg v-if="!isRecording" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10"/>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="2"/>
        </svg>
        <span>{{ isRecording ? 'Stop' : hasRecording ? 'Re-record' : 'Record' }}</span>
      </button>

      <!-- Analyze button -->
      <button 
        v-if="hasRecording && !isRecording" 
        @click="analyzeAudio"
        class="analyze-btn"
        :disabled="isProcessing"
      >
        <svg v-if="!isProcessing" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.3-4.3"/>
        </svg>
        <div v-else class="spinner"></div>
        <span>{{ isProcessing ? 'Analyzing...' : 'Analyze Genre' }}</span>
      </button>

      <!-- Error message -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted, computed, onMounted, nextTick } from 'vue';
import { classifyAudio } from '@/services/api.js';

const emit = defineEmits(['result', 'error', 'processing']);

const isRecording = ref(false);
const hasRecording = ref(false);
const isProcessing = ref(false);
const error = ref(null);
const recordingTime = ref(0);
const waveformCanvas = ref(null);

let mediaRecorder = null;
let audioChunks = [];
let recordedBlob = null;
let animationFrame = null;
let timerInterval = null;
let audioContext = null;
let analyser = null;
let dataArray = null;

const formattedTime = computed(() => {
  const seconds = recordingTime.value;
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
});

// Initialize canvas dimensions
function initCanvas() {
  if (!waveformCanvas.value) return;
  
  const canvas = waveformCanvas.value;
  const rect = canvas.getBoundingClientRect();
  // Set internal canvas dimensions to match display size
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  
  // Scale context for high DPI displays
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
}

// Initialize canvas when component mounts
onMounted(() => {
  nextTick(() => {
    initCanvas();
    // Re-initialize on window resize
    window.addEventListener('resize', initCanvas);
  });
});

async function toggleRecording() {
  if (isRecording.value) {
    stopRecording();
  } else {
    await startRecording();
  }
}

async function startRecording() {
  try {
    error.value = null;
    audioChunks = [];
    recordingTime.value = 0;

    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Set up audio context for visualization
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    // Set up media recorder
    mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      recordedBlob = new Blob(audioChunks, { type: 'audio/webm' });
      hasRecording.value = true;
      
      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());
      
      // Clean up
      if (audioContext) {
        audioContext.close();
        audioContext = null;
      }
    };

    mediaRecorder.start();
    isRecording.value = true;

    // Start timer
    timerInterval = setInterval(() => {
      recordingTime.value++;
      
      // Auto-stop after 30 seconds
      if (recordingTime.value >= 30) {
        stopRecording();
      }
    }, 1000);

    // Start visualization
    visualize();

  } catch (err) {
    console.error('Error accessing microphone:', err);
    error.value = 'Could not access microphone. Please grant permission.';
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    isRecording.value = false;
    
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  }
}

function visualize() {
  if (!waveformCanvas.value || !analyser) return;

  const canvas = waveformCanvas.value;
  
  // Ensure canvas dimensions are set
  if (canvas.width === 0 || canvas.height === 0) {
    initCanvas();
  }
  
  const canvasCtx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;

  const draw = () => {
    if (!isRecording.value) return;
    
    animationFrame = requestAnimationFrame(draw);

    analyser.getByteFrequencyData(dataArray);

    // Create gradient
    const gradient = canvasCtx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#8b5cf6');
    gradient.addColorStop(0.5, '#ec4899');
    gradient.addColorStop(1, '#f97316');

    canvasCtx.fillStyle = 'rgba(15, 23, 42, 0.2)';
    canvasCtx.fillRect(0, 0, width, height);

    const barWidth = (width / dataArray.length) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      barHeight = (dataArray[i] / 255) * height * 0.8;

      canvasCtx.fillStyle = gradient;
      canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }
  };

  draw();
}

async function analyzeAudio() {
  if (!recordedBlob) return;

  try {
    error.value = null;
    isProcessing.value = true;
    emit('processing', true);

    // Convert webm to a File object with proper name
    const audioFile = new File([recordedBlob], 'recording.webm', { type: 'audio/webm' });

    const result = await classifyAudio(audioFile);
    
    emit('result', result);
    isProcessing.value = false;
    emit('processing', false);

  } catch (err) {
    console.error('Analysis error:', err);
    error.value = err.message || 'Failed to analyze audio';
    emit('error', error.value);
    isProcessing.value = false;
    emit('processing', false);
  }
}

onUnmounted(() => {
  // Remove resize listener
  window.removeEventListener('resize', initCanvas);
  
  if (isRecording.value) {
    stopRecording();
  }
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
  if (audioContext) {
    audioContext.close();
  }
});
</script>

<style scoped>
.audio-recorder {
  width: 100%;
}

.recorder-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
}

.waveform-container {
  position: relative;
  width: 100%;
  height: 200px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%);
  border-radius: 1rem;
  overflow: hidden;
  border: 2px solid rgba(139, 92, 246, 0.2);
  transition: all 0.3s ease;
}

.waveform-container.active {
  border-color: rgba(139, 92, 246, 0.6);
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.3);
}

.waveform-canvas {
  width: 100%;
  height: 100%;
}

.placeholder-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
}

.placeholder-icon svg {
  margin-bottom: 0.5rem;
  opacity: 0.6;
}

.placeholder-icon p {
  font-size: 0.875rem;
  margin: 0;
}

.timer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #f87171;
}

.recording-dot {
  width: 12px;
  height: 12px;
  background: #ef4444;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

.record-btn,
.analyze-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  border: none;
  border-radius: 9999px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.record-btn {
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  color: white;
}

.record-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -5px rgba(139, 92, 246, 0.4);
}

.record-btn.recording {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  animation: record-pulse 2s ease-in-out infinite;
}

@keyframes record-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }
}

.analyze-btn {
  background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
  color: white;
}

.analyze-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -5px rgba(6, 182, 212, 0.4);
}

.record-btn:disabled,
.analyze-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  padding: 0.75rem 1.25rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.5rem;
  color: #fca5a5;
  font-size: 0.875rem;
  text-align: center;
}

@media (max-width: 640px) {
  .waveform-container {
    height: 150px;
  }
  
  .record-btn,
  .analyze-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
