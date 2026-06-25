<script setup lang="ts">
import { ref, onMounted } from 'vue';

const visible = ref(true);

onMounted(() => {
  setTimeout(() => {
    visible.value = false;
  }, 2000);
});
</script>

<template>
  <Transition name="fade">
    <div
      v-if="visible"
      id="loading"
      class="fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500"
    >
      <div class="particles">
        <span class="particle"></span>
        <span class="particle"></span>
        <span class="particle"></span>
        <span class="particle"></span>
        <span class="particle"></span>
        <span class="particle"></span>
      </div>

      <div class="loading-content">
        <div class="spinner-wrapper">
          <div class="spinner-icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"
              />
            </svg>
          </div>
        </div>

        <div class="loading-text">
          <div class="app-title">STATIC HUB</div>
          <div class="app-subtitle">静态资源管理系统</div>
        </div>

        <div class="progress-container">
          <div class="progress-bar"></div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

#loading {
  background: linear-gradient(160deg, #f4f6f9 0%, #eceff4 40%, #e2e6ed 100%);
}

.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.particle {
  position: absolute;
  border-radius: 50%;
  background: rgba(24, 160, 88, 0.22);
  animation: floatUp 7s ease-in-out infinite;
}
.particle:nth-child(1) {
  width: 5px;
  height: 5px;
  top: 18%;
  left: 12%;
  animation-duration: 7.2s;
  animation-delay: 0s;
}
.particle:nth-child(2) {
  width: 7px;
  height: 7px;
  top: 28%;
  right: 14%;
  animation-duration: 8.5s;
  animation-delay: 1.2s;
}
.particle:nth-child(3) {
  width: 4px;
  height: 4px;
  bottom: 22%;
  left: 10%;
  animation-duration: 6.4s;
  animation-delay: 2.4s;
}
.particle:nth-child(4) {
  width: 6px;
  height: 6px;
  bottom: 28%;
  right: 18%;
  animation-duration: 9s;
  animation-delay: 0.8s;
}
.particle:nth-child(5) {
  width: 4px;
  height: 4px;
  top: 55%;
  left: 78%;
  animation-duration: 7.8s;
  animation-delay: 1.8s;
}
.particle:nth-child(6) {
  width: 5px;
  height: 5px;
  top: 42%;
  left: 6%;
  animation-duration: 6.8s;
  animation-delay: 3.2s;
}

@keyframes floatUp {
  0%,
  100% {
    transform: translateY(0) translateX(0);
    opacity: 0.25;
  }
  25% {
    transform: translateY(-18px) translateX(8px);
    opacity: 0.6;
  }
  50% {
    transform: translateY(-36px) translateX(-4px);
    opacity: 0.3;
  }
  75% {
    transform: translateY(-18px) translateX(-12px);
    opacity: 0.55;
  }
}

.loading-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  animation: contentFadeIn 0.6s ease-out both;
}

@keyframes contentFadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.spinner-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #18a058;
}
.spinner-wrapper::before {
  content: '';
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  border: 3px solid;
  border-color: inherit;
  opacity: 0.12;
}
.spinner-wrapper::after {
  content: '';
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: currentColor;
  border-right-color: currentColor;
  border-bottom-color: transparent;
  border-left-color: transparent;
  animation: spin 1s cubic-bezier(0.55, 0.15, 0.45, 0.85) infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spinner-icon {
  position: relative;
  z-index: 1;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: iconPulse 2.2s ease-in-out infinite;
}
.spinner-icon svg {
  width: 100%;
  height: 100%;
  fill: #18a058;
}

@keyframes iconPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.12);
  }
}

.loading-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.app-title {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 6px;
  color: #1a1a2e;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
    sans-serif;
}
.app-subtitle {
  font-size: 13px;
  font-weight: 400;
  letter-spacing: 3px;
  opacity: 0.6;
  color: #4a5568;
}

.progress-container {
  width: 180px;
  height: 3px;
  border-radius: 3px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.08);
}
.progress-bar {
  height: 100%;
  border-radius: 3px;
  width: 0%;
  background: linear-gradient(90deg, #18a058, #36ad6a, #63e2b7);
  animation: loadProgress 2s ease-out forwards;
}

@keyframes loadProgress {
  0% {
    width: 0%;
  }
  12% {
    width: 8%;
  }
  30% {
    width: 35%;
  }
  55% {
    width: 65%;
  }
  78% {
    width: 85%;
  }
  100% {
    width: 96%;
  }
}
</style>
