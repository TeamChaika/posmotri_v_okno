import { ref, onMounted, onUnmounted } from 'vue';

export interface DailyForecast {
  date: string; // ISO string or timestamp
  min: number;
  max: number;
  code: number;
}

export interface WeatherData {
  temp: number;
  code: number;
  city: string;
  location: string;
  forecast: DailyForecast[];
}

const CITIES = [
  { name: 'Ялта', lat: 44.49, lng: 34.16 },
  { name: 'Москва', lat: 55.75, lng: 37.61 },
  { name: 'С. Петербург', lat: 59.93, lng: 30.33 },
];

export function useWeather() {
  const weatherList = ref<WeatherData[]>([]);
  const loading = ref(true);
  const error = ref<string | null>(null);

  const fetchWeather = async () => {
    loading.value = true;
    try {
      const promises = CITIES.map(async (city) => {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe%2FMoscow`;
        const res = await fetch(url);
        const data = await res.json();
        
        // Process daily forecast (next 4 days including today)
        const forecast: DailyForecast[] = [];
        if (data.daily && data.daily.time) {
          for (let i = 0; i < Math.min(5, data.daily.time.length); i++) {
             forecast.push({
               date: data.daily.time[i],
               max: Math.round(data.daily.temperature_2m_max[i]),
               min: Math.round(data.daily.temperature_2m_min[i]),
               code: data.daily.weather_code[i]
             });
          }
        }

        return {
          city: city.name,
          location: city.name,
          temp: Math.round(data.current.temperature_2m),
          code: data.current.weather_code,
          forecast
        };
      });

      weatherList.value = await Promise.all(promises);
      error.value = null;
    } catch (e) {
      console.error("Error fetching weather:", e);
      error.value = "Failed to load weather";
    } finally {
      loading.value = false;
    }
  };

  // Refresh weather every 30 minutes
  let interval: any;
  onMounted(() => {
    fetchWeather();
    interval = setInterval(fetchWeather, 30 * 60 * 1000);
  });

  onUnmounted(() => {
    if (interval) clearInterval(interval);
  });

  return {
    weatherList,
    loading,
    error
  };
}

