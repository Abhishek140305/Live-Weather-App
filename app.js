// Open-Meteo is used here because its public weather API does not require a key.
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

const form = document.querySelector('#search-form');
const cityInput = document.querySelector('#city-input');
const weatherContent = document.querySelector('#weather-content');
const searchButton = form.querySelector('button');

const weatherConditions = {
  0: ['Clear sky', '☀️'], 1: ['Mainly clear', '🌤️'], 2: ['Partly cloudy', '⛅'],
  3: ['Overcast', '☁️'], 45: ['Foggy', '🌫️'], 48: ['Rime fog', '🌫️'],
  51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Heavy drizzle', '🌧️'],
  56: ['Freezing drizzle', '🌨️'], 57: ['Heavy freezing drizzle', '🌨️'],
  61: ['Slight rain', '🌦️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'],
  66: ['Freezing rain', '🌨️'], 67: ['Heavy freezing rain', '🌨️'],
  71: ['Light snow', '🌨️'], 73: ['Snow', '🌨️'], 75: ['Heavy snow', '❄️'],
  77: ['Snow grains', '🌨️'], 80: ['Rain showers', '🌦️'],
  81: ['Heavy rain showers', '🌧️'], 82: ['Violent rain showers', '⛈️'],
  85: ['Snow showers', '🌨️'], 86: ['Heavy snow showers', '❄️'],
  95: ['Thunderstorm', '⛈️'], 96: ['Thunderstorm with hail', '⛈️'],
  99: ['Severe thunderstorm with hail', '⛈️']
};

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
  })[character]);
}

function showLoading() {
  weatherContent.innerHTML = `
    <div class="status-message">
      <span class="spinner" role="status" aria-label="Loading weather"></span>
      <p>Checking the latest conditions...</p>
    </div>`;
}

function showError(message) {
  weatherContent.innerHTML = `
    <div class="status-message error" role="alert">
      <span class="error-icon" aria-hidden="true">!</span>
      <p>${escapeHtml(message)}</p>
    </div>`;
}

function renderWeather(data) {
  const condition = weatherConditions[data.weatherCode] || ['Unknown conditions', '🌡️'];

  weatherContent.innerHTML = `
    <article class="weather-result">
      <h2 class="location">${escapeHtml(data.city)} <span class="country">${escapeHtml(data.countryCode)}</span></h2>
      <div class="condition-row">
        <p class="condition">${condition[0]}</p>
        <span class="weather-icon" role="img" aria-label="${condition[0]}">${condition[1]}</span>
      </div>
      <p class="temperature">${Math.round(data.temperature)}<span>°C</span></p>
      <div class="details" aria-label="Weather details">
        <div class="detail"><span class="detail-label">Humidity</span><span class="detail-value">${Math.round(data.humidity)}%</span></div>
        <div class="detail"><span class="detail-label">Wind speed</span><span class="detail-value">${data.windSpeed} m/s</span></div>
      </div>
    </article>`;
}

async function getWeather(city) {
  const locationResponse = await fetch(
    `${GEOCODING_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
  );
  if (!locationResponse.ok) throw new Error('Location search is temporarily unavailable. Please try again.');

  const locationData = await locationResponse.json();
  const location = locationData.results?.[0];
  if (!location) throw new Error('City not found. Check the spelling and try again.');

  const weatherResponse = await fetch(
    `${WEATHER_URL}?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&wind_speed_unit=ms`
  );
  if (!weatherResponse.ok) throw new Error('Weather data is temporarily unavailable. Please try again.');

  const weatherData = await weatherResponse.json();
  const current = weatherData.current;
  return {
    city: location.name,
    countryCode: location.country_code,
    temperature: current.temperature_2m,
    humidity: current.relative_humidity_2m,
    weatherCode: current.weather_code,
    windSpeed: current.wind_speed_10m
  };
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return cityInput.focus();

  showLoading();
  searchButton.disabled = true;
  try {
    renderWeather(await getWeather(city));
  } catch (error) {
    showError(error instanceof TypeError
      ? 'Network error. Check your connection and try again.'
      : error.message);
  } finally {
    searchButton.disabled = false;
  }
});
