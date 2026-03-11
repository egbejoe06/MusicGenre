<template>
  <div class="audio-uploader">
    <div 
      class="dropzone"
      :class="{ 
        'drag-over': isDragging,
        'has-file': selectedFile,
        'uploading': isUploading 
      }"
      @drop.prevent="handleDrop"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        accept="audio/mp3,audio/mpeg,audio/wav,audio/flac,.mp3,.wav,.flac"
        @change="handleFileSelect"
        class="hidden-input"
      />

      <div class="dropzone-content">
        <!-- Upload icon -->
        <div class="icon-container" v-if="!selectedFile">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" x2="12" y1="3" y2="15"/>
          </svg>
          <h3>Drop your audio file here</h3>
          <p>or click to browse</p>
          <p class="file-types">Supports MP3, WAV, FLAC (max 10MB)</p>
        </div>

        <!-- Selected file preview -->
        <div class="file-preview" v-else-if="!isUploading">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
          <div class="file-info">
            <p class="file-name">{{ selectedFile.name }}</p>
            <p class="file-size">{{ formatFileSize(selectedFile.size) }}</p>
          </div>
          <button @click.stop="clearFile" class="clear-btn" title="Remove file">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" x2="6" y1="6" y2="18"/>
              <line x1="6" x2="18" y1="6" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Upload progress -->
        <div class="upload-progress" v-if="isUploading">
          <div class="spinner-large"></div>
          <p>Analyzing audio...</p>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${uploadProgress}%` }"></div>
          </div>
          <p class="progress-text">{{ uploadProgress }}%</p>
        </div>
      </div>
    </div>

    <!-- Classify button -->
    <button 
      v-if="selectedFile && !isUploading"
      @click="uploadAndClassify"
      class="classify-btn"
      :disabled="isUploading"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
      <span>Classify Genre</span>
    </button>

    <!-- Error message -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { classifyAudio } from '@/services/api.js';

const emit = defineEmits(['result', 'error', 'processing']);

const fileInput = ref(null);
const selectedFile = ref(null);
const isDragging = ref(false);
const isUploading = ref(false);
const uploadProgress = ref(0);
const error = ref(null);

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac', 'audio/x-wav', 'audio/aiff', 'audio/aac', 'audio/ogg'];

function triggerFileInput() {
  if (!isUploading.value) {
    fileInput.value?.click();
  }
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    validateAndSetFile(file);
  }
}

function handleDrop(event) {
  isDragging.value = false;
  const file = event.dataTransfer.files[0];
  if (file) {
    validateAndSetFile(file);
  }
}

function validateAndSetFile(file) {
  error.value = null;

  // Check file type
  const fileExt = file.name.split('.').pop().toLowerCase();
  const isValidType = ALLOWED_TYPES.includes(file.type) || 
                     ['mp3', 'wav', 'flac', 'aiff', 'aac', 'ogg'].includes(fileExt);

  if (!isValidType) {
    error.value = 'Invalid file type. Supported formats: MP3, WAV, FLAC, AIFF, AAC, OGG.';
    return;
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    error.value = `File size exceeds 100MB limit. Your file is ${formatFileSize(file.size)}.`;
    return;
  }

  selectedFile.value = file;
}

function clearFile() {
  selectedFile.value = null;
  uploadProgress.value = 0;
  error.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

async function uploadAndClassify() {
  if (!selectedFile.value) return;

  try {
    error.value = null;
    isUploading.value = true;
    uploadProgress.value = 0;
    emit('processing', true);

    const result = await classifyAudio(selectedFile.value, (progress) => {
      uploadProgress.value = progress;
    });

    emit('result', result);
    isUploading.value = false;
    emit('processing', false);

  } catch (err) {
    console.error('Upload error:', err);
    error.value = err.message || 'Failed to classify audio';
    emit('error', error.value);
    isUploading.value = false;
    uploadProgress.value = 0;
    emit('processing', false);
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
</script>

<style scoped>
.audio-uploader {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.dropzone {
  position: relative;
  width: 100%;
  min-height: 250px;
  border: 3px dashed rgba(139, 92, 246, 0.3);
  border-radius: 1rem;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.dropzone:hover {
  border-color: rgba(139, 92, 246, 0.5);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%);
}

.dropzone.drag-over {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%);
  transform: scale(1.02);
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.3);
}

.dropzone.has-file {
  border-style: solid;
  border-color: rgba(34, 197, 94, 0.5);
}

.dropzone.uploading {
  cursor: not-allowed;
}

.hidden-input {
  display: none;
}

.dropzone-content {
  text-align: center;
  width: 100%;
}

.icon-container {
  color: rgba(139, 92, 246, 0.8);
}

.icon-container h3 {
  margin: 1rem 0 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #e2e8f0;
}

.icon-container p {
  margin: 0.25rem 0;
  color: rgba(226, 232, 240, 0.7);
}

.file-types {
  font-size: 0.875rem;
  color: rgba(139, 92, 246, 0.6);
  margin-top: 1rem !important;
}

.file-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 0.5rem;
  color: #6ee7b7;
}

.file-preview svg {
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  text-align: left;
}

.file-name {
  margin: 0;
  font-weight: 600;
  font-size: 1rem;
  color: #e2e8f0;
  word-break: break-word;
}

.file-size {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: rgba(226, 232, 240, 0.6);
}

.clear-btn {
  flex-shrink: 0;
  background: rgba(239, 68, 68, 0.2);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #fca5a5;
}

.clear-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  transform: scale(1.1);
}

.upload-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner-large {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(139, 92, 246, 0.2);
  border-top-color: #8b5cf6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.upload-progress p {
  margin: 0;
  color: #e2e8f0;
  font-weight: 500;
}

.progress-bar {
  width: 100%;
  max-width: 300px;
  height: 8px;
  background: rgba(139, 92, 246, 0.2);
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6 0%, #ec4899 100%);
  transition: width 0.3s ease;
  border-radius: 9999px;
}

.progress-text {
  font-size: 0.875rem;
  color: rgba(226, 232, 240, 0.7);
}

.classify-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  border-radius: 9999px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  width: 100%;
}

.classify-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.4);
}

.classify-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  .dropzone {
    min-height: 200px;
    padding: 1.5rem;
  }
  
  .icon-container h3 {
    font-size: 1.125rem;
  }
  
  .file-preview {
    flex-direction: column;
    text-align: center;
  }
  
  .file-info {
    text-align: center;
  }
}
</style>
