<template>
  <div class="home-view">
    <div class="container">
      <!-- Header -->
      <header class="header">
        <div class="logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
          <h1>Music Genre Classifier</h1>
        </div>
        <p class="subtitle">Discover the genre of any song using AI</p>
      </header>

      <!-- Main content -->
      <main class="main-content">
        <!-- Show result if available -->
        <GenreResult 
          v-if="classificationResult" 
          :result="classificationResult"
          :is-loading="isProcessing"
          @reset="resetClassification"
        />

        <!-- Show input methods when no result -->
        <div v-else class="input-section">
          <!-- Tab selector -->
          <div class="tab-selector">
            <button 
              @click="activeTab = 'record'"
              class="tab-btn"
              :class="{ active: activeTab === 'record' }"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" x2="12" y1="19" y2="22"/>
              </svg>
              Record Audio
            </button>
            <button 
              @click="activeTab = 'upload'"
              class="tab-btn"
              :class="{ active: activeTab === 'upload' }"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" x2="12" y1="3" y2="15"/>
              </svg>
              Upload File
            </button>
          </div>

          <!-- Tab content -->
          <div class="tab-content">
            <Transition name="fade" mode="out-in">
              <AudioRecorder 
                v-if="activeTab === 'record'"
                @result="handleResult"
                @error="handleError"
                @processing="handleProcessing"
              />
              <AudioUploader 
                v-else
                @result="handleResult"
                @error="handleError"
                @processing="handleProcessing"
              />
            </Transition>
          </div>
        </div>
      </main>


    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import AudioRecorder from '@/components/AudioRecorder.vue';
import AudioUploader from '@/components/AudioUploader.vue';
import GenreResult from '@/components/GenreResult.vue';

const activeTab = ref('record');
const classificationResult = ref(null);
const isProcessing = ref(false);

function handleResult(result) {
  classificationResult.value = result;
  isProcessing.value = false;
}

function handleError(error) {
  console.error('Classification error:', error);
  isProcessing.value = false;
}

function handleProcessing(processing) {
  isProcessing.value = processing;
}

function resetClassification() {
  classificationResult.value = null;
  isProcessing.value = false;
}
</script>

<style scoped>
.home-view {
  min-height: 100vh;
  width: 100%;
  padding: 2rem 1rem;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

/* Header */
.header {
  text-align: center;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.logo svg {
  color: #8b5cf6;
  filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.5));
}

.logo h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.125rem;
  color: rgba(226, 232, 240, 0.7);
  margin: 0;
}

/* Main content */
.main-content {
  flex: 1;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Tabs */
.tab-selector {
  display: flex;
  gap: 1rem;
  background: rgba(15, 23, 42, 0.5);
  padding: 0.5rem;
  border-radius: 9999px;
  border: 1px solid rgba(139, 92, 246, 0.2);
  backdrop-filter: blur(10px);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: transparent;
  border: none;
  border-radius: 9999px;
  color: rgba(226, 232, 240, 0.6);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  color: rgba(226, 232, 240, 0.9);
}

.tab-btn.active {
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.tab-content {
  position: relative;
  min-height: 300px;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Footer */
.footer {
  text-align: center;
  padding: 1.5rem 0;
  color: rgba(226, 232, 240, 0.5);
  font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 768px) {
  .home-view {
    padding: 1.5rem 1rem;
  }
  
  .logo h1 {
    font-size: 2rem;
  }
  
  .logo {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .tab-selector {
    flex-direction: column;
    gap: 0.5rem;
    border-radius: 1rem;
  }
  
  .tab-btn {
    border-radius: 0.75rem;
  }
}

@media (max-width: 480px) {
  .logo h1 {
    font-size: 1.75rem;
  }
}
</style>
