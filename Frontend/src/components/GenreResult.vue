<template>
  <div class="genre-result" v-if="result">
    <div class="result-card" :class="`genre-${genreClass}`">
      <!-- Genre icon/visual -->
      <div class="genre-icon">
        <div class="icon-circle">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
      </div>

      <!-- Genre information -->
      <div class="genre-info">
        <div class="genre-badge">{{ result.genre }}</div>
        <p v-if="result.subgenre" class="subgenre">{{ result.subgenre }}</p>

        <!-- Confidence score -->
        <div class="confidence-container">
          <div class="confidence-label">
            <span>Confidence</span>
            <span class="confidence-value">{{ result.confidence }}%</span>
          </div>
          <div class="confidence-bar">
            <div class="confidence-fill" :style="{ width: `${result.confidence}%` }"></div>
          </div>
        </div>

        <!-- Acoustic Analysis -->
        <div v-if="result.acousticAnalysis" class="acoustic-analysis">
          <h3>Acoustic Characteristics</h3>
          <div class="acoustic-grid">
            <div v-if="result.acousticAnalysis.tempo" class="acoustic-item">
              <span class="label">Tempo:</span>
              <span class="value">{{ result.acousticAnalysis.tempo }}</span>
            </div>
            <div v-if="result.acousticAnalysis.instrumentation" class="acoustic-item">
              <span class="label">Instruments:</span>
              <span class="value">{{ result.acousticAnalysis.instrumentation }}</span>
            </div>
            <div v-if="result.acousticAnalysis.rhythm" class="acoustic-item">
              <span class="label">Rhythm:</span>
              <span class="value">{{ result.acousticAnalysis.rhythm }}</span>
            </div>
            <div v-if="result.acousticAnalysis.harmonic" class="acoustic-item">
              <span class="label">Harmonic:</span>
              <span class="value">{{ result.acousticAnalysis.harmonic }}</span>
            </div>
          </div>
        </div>

        <!-- Reasoning -->
        <div v-if="result.reasoning" class="reasoning">
          <h3>Analysis</h3>
          <p>{{ result.reasoning }}</p>
        </div>

        <!-- Timestamp -->
        <div class="timestamp">
          Classified {{ formatTimestamp(result.timestamp) }}
        </div>
      </div>

      <!-- Try again button -->
      <button @click="$emit('reset')" class="try-again-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M3 21v-5h5" />
        </svg>
        Try Another Song
      </button>
    </div>
  </div>

  <!-- Loading state -->
  <div v-else-if="isLoading" class="genre-result loading">
    <div class="loading-animation">
      <div class="music-bars">
        <div class="bar" v-for="i in 5" :key="i" :style="{ animationDelay: `${i * 0.1}s` }"></div>
      </div>
      <p>Analyzing your music...</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  result: {
    type: Object,
    default: null
  },
  isLoading: {
    type: Boolean,
    default: false
  }
});

defineEmits(['reset']);

const genreClass = computed(() => {
  if (!props.result?.genre) return 'default';
  return props.result.genre.toLowerCase().replace(/[^a-z0-9]/g, '-');
});

function formatTimestamp(timestamp) {
  if (!timestamp) return 'just now';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
}
</script>

<style scoped>
.genre-result {
  width: 100%;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.result-card {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%);
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-radius: 1.5rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.3);
}

.genre-icon {
  margin-bottom: 0.5rem;
}

.icon-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 3s ease-in-out infinite;
  box-shadow: 0 10px 30px rgba(139, 92, 246, 0.4);
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}

.icon-circle svg {
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.genre-info {
  width: 100%;
  text-align: center;
}

.song-details {
  text-align: center;
  margin-bottom: -0.5rem;
}

.song-name {
  font-size: 2.25rem;
  font-weight: 800;
  margin: 0;
  color: white;
  letter-spacing: -0.02em;
}

.artist-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #8b5cf6;
  margin: 0.25rem 0 0;
}

.genre-badge {
  display: inline-block;
  padding: 0.5rem 1.5rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  border-radius: 9999px;
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 1rem;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.subgenre {
  font-size: 1rem;
  color: rgba(226, 232, 240, 0.6);
  margin: 0.75rem 0 1.5rem;
  text-transform: capitalize;
  font-style: italic;
}

.confidence-container {
  margin: 1.5rem 0;
}

.confidence-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: rgba(226, 232, 240, 0.7);
}

.confidence-value {
  font-weight: 700;
  color: #8b5cf6;
}

.confidence-bar {
  width: 100%;
  height: 12px;
  background: rgba(139, 92, 246, 0.2);
  border-radius: 9999px;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6 0%, #ec4899 100%);
  border-radius: 9999px;
  transition: width 0.8s ease-out;
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
}

.reasoning {
  margin: 1.5rem 0;
  padding: 1.25rem;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 0.75rem;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.reasoning h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #8b5cf6;
  margin: 0 0 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.reasoning p {
  margin: 0;
  color: rgba(226, 232, 240, 0.9);
  line-height: 1.6;
  text-align: left;
}

.acoustic-analysis {
  margin: 1.5rem 0;
  padding: 1.25rem;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 0.75rem;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.acoustic-analysis h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #8b5cf6;
  margin: 0 0 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.acoustic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
}

.acoustic-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.acoustic-item .label {
  font-size: 0.75rem;
  color: rgba(226, 232, 240, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.acoustic-item .value {
  font-size: 0.875rem;
  color: rgba(226, 232, 240, 0.9);
  font-weight: 500;
}

.timestamp {
  margin-top: 1rem;
  font-size: 0.75rem;
  color: rgba(226, 232, 240, 0.5);
}

.try-again-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  background: rgba(139, 92, 246, 0.1);
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-radius: 9999px;
  color: #c4b5fd;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.try-again-btn:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.5);
  transform: translateY(-2px);
}

/* Loading state */
.genre-result.loading {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-animation {
  text-align: center;
}

.music-bars {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 0.5rem;
  height: 80px;
  margin-bottom: 1.5rem;
}

.bar {
  width: 12px;
  background: linear-gradient(180deg, #8b5cf6 0%, #ec4899 100%);
  border-radius: 9999px;
  animation: musicBar 1s ease-in-out infinite;
}

@keyframes musicBar {

  0%,
  100% {
    height: 20px;
  }

  50% {
    height: 80px;
  }
}

.loading-animation p {
  color: rgba(226, 232, 240, 0.8);
  font-size: 1.125rem;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 640px) {
  .result-card {
    padding: 1.5rem;
  }

  .genre-title {
    font-size: 2rem;
  }

  .icon-circle {
    width: 80px;
    height: 80px;
  }

  .icon-circle svg {
    width: 36px;
    height: 36px;
  }
}
</style>
