<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useWeather } from './composables/useWeather';
import { getWeatherIconName } from './utils/weatherCodes';
import { 
  SunIcon, 
  CloudIcon, 
  CloudArrowDownIcon, // Rain
  BoltIcon // Lightning
} from '@heroicons/vue/24/solid';

// --- Time Logic (UTC+3 Fixed) ---
const timeString = ref('');
const dateString = ref('');
const dayString = ref('');
const isNight = ref(false);

const updateTime = () => {
  const now = new Date();
  // Calculate UTC+3 manually to ensure it's always correct regardless of client device settings
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const targetTime = new Date(utc + (3600000 * 3));
  
  const hours = targetTime.getHours();
  isNight.value = hours < 6 || hours > 20; // Night between 21:00 and 05:59

  timeString.value = targetTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  
  // Format: "Monday, 12 October"
  const optionsDate: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  const optionsDay: Intl.DateTimeFormatOptions = { weekday: 'long' };
  
  dateString.value = targetTime.toLocaleDateString('ru-RU', optionsDate);
  dayString.value = targetTime.toLocaleDateString('ru-RU', optionsDay);
  // Capitalize first letter of day
  dayString.value = dayString.value.charAt(0).toUpperCase() + dayString.value.slice(1);
};

let timerInterval: any;

// --- Weather Logic ---
const { weatherList } = useWeather();
const currentIndex = ref(0);

// Cycle through cities every 8 seconds
let cycleInterval: any;

const currentCity = computed(() => {
  if (weatherList.value.length === 0) return null;
  return weatherList.value[currentIndex.value];
});

const getIconComponent = (code: number) => {
  const name = getWeatherIconName(code);
  switch (name) {
    case 'sun': return SunIcon;
    case 'cloud': return CloudIcon;
    case 'rain': return CloudArrowDownIcon;
    case 'snow': return CloudIcon; // Fallback for snow
    case 'lightning': return BoltIcon;
    case 'fog': return CloudIcon; // Fallback
    default: return CloudIcon;
  }
};

const getDayName = (dateStr: string) => {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}.${month}`;
};

const weatherBackgroundClass = computed(() => {
  if (!currentCity.value) return 'bg-gradient-to-br from-gray-900 via-slate-800 to-black';

  const code = currentCity.value.code;
  const weatherType = getWeatherIconName(code);

  if (isNight.value) {
    switch (weatherType) {
      case 'sun': return 'bg-gradient-to-br from-gray-900 via-indigo-950 to-slate-900'; // Clear Night
      case 'cloud': return 'bg-gradient-to-br from-slate-800 via-slate-900 to-black';
      case 'rain': return 'bg-gradient-to-br from-slate-900 via-blue-950 to-black';
      case 'snow': return 'bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900';
      case 'fog': return 'bg-gradient-to-br from-gray-800 via-slate-800 to-gray-900';
      case 'lightning': return 'bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950';
      default: return 'bg-gradient-to-br from-gray-900 via-slate-800 to-black';
    }
  } else {
    switch (weatherType) {
      case 'sun': return 'bg-gradient-to-br from-blue-400 via-sky-500 to-indigo-500';
      case 'cloud': return 'bg-gradient-to-br from-gray-400 via-slate-500 to-zinc-600';
      case 'rain': return 'bg-gradient-to-br from-slate-700 via-blue-800 to-gray-900';
      case 'snow': return 'bg-gradient-to-br from-slate-300 via-blue-200 to-white';
      case 'fog': return 'bg-gradient-to-br from-gray-400 via-slate-400 to-gray-500';
      case 'lightning': return 'bg-gradient-to-br from-indigo-800 via-purple-800 to-slate-900';
      default: return 'bg-gradient-to-br from-blue-400 via-sky-500 to-indigo-500';
    }
  }
});

onMounted(() => {
  updateTime();
  timerInterval = setInterval(updateTime, 1000);

  cycleInterval = setInterval(() => {
    if (weatherList.value.length > 0) {
      currentIndex.value = (currentIndex.value + 1) % weatherList.value.length;
    }
  }, 8000); // Cycle every 8 seconds
});

onUnmounted(() => {
  clearInterval(timerInterval);
  clearInterval(cycleInterval);
});
</script>

<template>
  <!-- Main Container: exact 192x448 dimensions, centered for dev, or full screen if iframe -->
  <div class="flex items-center justify-center min-h-screen bg-gray-900">
    
    <!-- The Widget Area -->
    <div class="relative w-[192px] h-[448px] overflow-hidden bg-black text-white shadow-2xl rounded-[2rem] ring-8 ring-gray-800/50">
      
      <!-- iOS-style Dynamic Background -->
      <Transition name="fade" mode="out-in">
        <div 
          :key="currentCity?.city + '-' + isNight" 
          class="absolute inset-0 animate-gradient-slow"
          :class="weatherBackgroundClass"
        ></div>
      </Transition>
      
      <!-- Glass Overlay -->
      <div class="absolute inset-0 bg-black/20 backdrop-blur-[1px]"></div>

      <!-- Content Container -->
      <div class="relative z-10 flex flex-col items-center h-full py-6 px-4 font-sans">
        
        <!-- Clock Section -->
        <div class="flex flex-col items-center mt-2">
          <h1 class="text-5xl font-light tracking-tight text-white drop-shadow-md font-display">
            {{ timeString }}
          </h1>
          <div class="mt-1 text-center">
            <p class="text-sm font-medium text-red-100 uppercase tracking-wide opacity-90">{{ dayString }}</p>
            <p class="text-lg font-medium text-white/90">{{ dateString }}</p>
          </div>
        </div>

        <!-- Spacer -->
        <div class="h-4"></div>

        <!-- Weather Widget (Glass Card) -->
        <div class="w-full relative h-auto flex-grow flex flex-col justify-center"> <!-- Use flex-grow to center in remaining space -->
          <Transition name="fade" mode="out-in">
            <div 
              v-if="currentCity"
              :key="currentIndex"
              class="flex flex-col items-center justify-center w-full -mt-8" 
            >
              <!-- City Name -->
              <h2 class="text-xl font-semibold text-center text-white mb-3 truncate w-full drop-shadow-md">
                {{ currentCity.city }}
              </h2>

              <!-- Forecast List (Horizontal Grid) -->
              <div class="grid grid-cols-5 gap-1 w-full -mx-2 px-1">
                <div 
                  v-for="(day, idx) in currentCity.forecast.slice(0, 5)" 
                  :key="day.date"
                  class="flex flex-col items-center justify-start space-y-2"
                >
                  <!-- Day Name (DD.MM) -->
                  <span class="text-[10px] font-medium text-white/80 leading-tight tracking-tighter">
                    {{ getDayName(day.date) }}
                  </span>

                  <!-- Avg Temp -->
                  <span class="text-xs font-bold text-white drop-shadow-sm">
                    {{ Math.round((day.max + day.min) / 2) }}°
                  </span>

                  <!-- Icon -->
                  <div class="flex justify-center">
                    <component 
                      :is="getIconComponent(day.code)" 
                      class="w-6 h-6 drop-shadow-md" 
                      :class="getWeatherIconName(day.code) === 'sun' ? 'text-yellow-300' : 'text-white/90'" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="flex items-center justify-center h-40 text-white/50">
              <svg class="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </Transition>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.font-display {
  font-variant-numeric: tabular-nums;
}

/* Animation for background */
@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.animate-gradient-slow {
  background-size: 200% 200%;
  animation: gradient-shift 15s ease infinite;
}

/* Fade Transition for Weather Cards */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: scale(1.05) translateY(-10px);
}
</style>
