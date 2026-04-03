const API_KEY = 'YOUR_API_KEY'; // Replace with your OpenWeatherMap API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

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
    const [weather, forecast] = await Promise.all([
      fetchWeather(city),
      fetchForecast(city),
    ]);
    displayWeather(weather);
    displayForecast(forecast);
  } catch (err) {
    showError(err.message);
  }
});

async function fetchWeather(city) {
  const res = await fetch(
    `${BASE_URL}/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`
  );
  if (!res.ok) {
    if (res.status === 404) throw new Error('City not found. Please check the name and try again.');
    if (res.status === 401) throw new Error('Invalid API key. Please add your OpenWeatherMap API key in app.js.');
    throw new Error('Failed to fetch weather data.');
  }
  return res.json();
}

async function fetchForecast(city) {
  const res = await fetch(
    `${BASE_URL}/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`
  );
  if (!res.ok) throw new Error('Failed to fetch forecast data.');
  return res.json();
}

function displayWeather(data) {
  document.getElementById('city-name').textContent = `${data.name}, ${data.sys.country}`;
  document.getElementById('weather-description').textContent = data.weather[0].description;
  document.getElementById('icon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  document.getElementById('icon').alt = data.weather[0].description;
  document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°C`;
  document.getElementById('feels-like').textContent = `${Math.round(data.main.feels_like)}°C`;
  document.getElementById('humidity').textContent = `${data.main.humidity}%`;
  document.getElementById('wind').textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
  document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;

  weatherCard.classList.remove('hidden');
}

function displayForecast(data) {
  const dailyForecasts = getDailyForecasts(data.list);
  const container = document.getElementById('forecast-cards');
  container.innerHTML = '';

  dailyForecasts.forEach((day) => {
    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <div class="day">${formatDay(day.dt)}</div>
      <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="${day.weather[0].description}">
      <div class="temp">${Math.round(day.main.temp_max)}°</div>
      <div class="temp-low">${Math.round(day.main.temp_min)}°</div>
    `;
    container.appendChild(card);
  });

  forecastSection.classList.remove('hidden');
}

function getDailyForecasts(list) {
  const days = {};
  list.forEach((item) => {
    const date = item.dt_txt.split(' ')[0];
    const today = new Date().toISOString().split('T')[0];
    if (date === today) return;

    if (!days[date]) {
      days[date] = { ...item };
    } else {
      if (item.main.temp_max > days[date].main.temp_max) {
        days[date].main.temp_max = item.main.temp_max;
      }
      if (item.main.temp_min < days[date].main.temp_min) {
        days[date].main.temp_min = item.main.temp_min;
      }
      // Use the midday reading for icon/description
      if (item.dt_txt.includes('12:00:00')) {
        days[date].weather = item.weather;
      }
    }
  });
  return Object.values(days).slice(0, 5);
}

function formatDay(timestamp) {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', { weekday: 'short' });
}

function showError(message) {
  errorDiv.textContent = message;
  errorDiv.classList.remove('hidden');
}

function hideError() {
  errorDiv.classList.add('hidden');
}
