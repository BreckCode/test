const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

const WMO_CODES = {
  0: { description: 'Clear sky', icon: '☀️' },
  1: { description: 'Mainly clear', icon: '🌤️' },
  2: { description: 'Partly cloudy', icon: '⛅' },
  3: { description: 'Overcast', icon: '☁️' },
  45: { description: 'Foggy', icon: '🌫️' },
  48: { description: 'Depositing rime fog', icon: '🌫️' },
  51: { description: 'Light drizzle', icon: '🌦️' },
  53: { description: 'Moderate drizzle', icon: '🌦️' },
  55: { description: 'Dense drizzle', icon: '🌦️' },
  61: { description: 'Slight rain', icon: '🌧️' },
  63: { description: 'Moderate rain', icon: '🌧️' },
  65: { description: 'Heavy rain', icon: '🌧️' },
  71: { description: 'Slight snow', icon: '🌨️' },
  73: { description: 'Moderate snow', icon: '🌨️' },
  75: { description: 'Heavy snow', icon: '🌨️' },
  77: { description: 'Snow grains', icon: '🌨️' },
  80: { description: 'Slight rain showers', icon: '🌦️' },
  81: { description: 'Moderate rain showers', icon: '🌧️' },
  82: { description: 'Violent rain showers', icon: '🌧️' },
  85: { description: 'Slight snow showers', icon: '🌨️' },
  86: { description: 'Heavy snow showers', icon: '🌨️' },
  95: { description: 'Thunderstorm', icon: '⛈️' },
  96: { description: 'Thunderstorm with slight hail', icon: '⛈️' },
  99: { description: 'Thunderstorm with heavy hail', icon: '⛈️' },
};

const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const weatherCard = document.getElementById('weather-card');
const forecastSection = document.getElementById('forecast');
const errorDiv = document.getElementById('error');

searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;

  hideError();
  weatherCard.classList.add('hidden');
  forecastSection.classList.add('hidden');

  try {
    const location = await geocodeCity(city);
    const weather = await fetchWeather(location.latitude, location.longitude);
    displayWeather(weather, location);
    displayForecast(weather);
  } catch (err) {
    showError(err.message);
  }
});

async function geocodeCity(city) {
  const res = await fetch(`${GEOCODING_URL}?name=${encodeURIComponent(city)}&count=1`);
  if (!res.ok) throw new Error('Failed to search for city.');
  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error('City not found. Please check the name and try again.');
  }
  return data.results[0];
}

async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
    forecast_days: '6',
  });
  const res = await fetch(`${WEATHER_URL}?${params}`);
  if (!res.ok) throw new Error('Failed to fetch weather data.');
  return res.json();
}

function getWeatherInfo(code) {
  return WMO_CODES[code] || { description: 'Unknown', icon: '❓' };
}

function displayWeather(data, location) {
  const current = data.current;
  const info = getWeatherInfo(current.weather_code);

  document.getElementById('city-name').textContent =
    `${location.name}, ${location.country_code || location.country || ''}`;
  document.getElementById('weather-description').textContent = info.description;
  document.getElementById('icon').textContent = info.icon;
  document.getElementById('temperature').textContent = `${Math.round(current.temperature_2m)}°C`;
  document.getElementById('feels-like').textContent = `${Math.round(current.apparent_temperature)}°C`;
  document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;
  document.getElementById('wind').textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  document.getElementById('pressure').textContent = `${Math.round(current.surface_pressure)} hPa`;

  weatherCard.classList.remove('hidden');
}

function displayForecast(data) {
  const container = document.getElementById('forecast-cards');
  container.innerHTML = '';

  // Skip today (index 0), show next 5 days
  for (let i = 1; i <= 5 && i < data.daily.time.length; i++) {
    const info = getWeatherInfo(data.daily.weather_code[i]);
    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <div class="day">${formatDay(data.daily.time[i])}</div>
      <div class="forecast-icon">${info.icon}</div>
      <div class="temp">${Math.round(data.daily.temperature_2m_max[i])}°</div>
      <div class="temp-low">${Math.round(data.daily.temperature_2m_min[i])}°</div>
    `;
    container.appendChild(card);
  }

  forecastSection.classList.remove('hidden');
}

function formatDay(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
}

function showError(message) {
  errorDiv.textContent = message;
  errorDiv.classList.remove('hidden');
}

function hideError() {
  errorDiv.classList.add('hidden');
}
