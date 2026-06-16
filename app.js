// Weather API Configuration
const API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your OpenWeatherMap API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const weatherDisplay = document.getElementById('currentWeather');
const forecastSection = document.getElementById('forecastSection');
const errorMessage = document.getElementById('errorMessage');
const welcomeMessage = document.getElementById('welcomeMessage');

// Weather Details Elements
const cityName = document.getElementById('cityName');
const temperature = document.getElementById('temperature');
const weatherCondition = document.getElementById('weatherCondition');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const pressure = document.getElementById('pressure');
const feelsLike = document.getElementById('feelsLike');
const forecastContainer = document.getElementById('forecastContainer');

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

/**
 * Main search handler - fetches and displays weather data
 */
async function handleSearch() {
    const city = searchInput.value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }
    
    try {
        hideError();
        welcomeMessage.style.display = 'none';
        
        // Fetch current weather
        const weatherData = await fetchWeatherData(city);
        displayCurrentWeather(weatherData);
        weatherDisplay.style.display = 'block';
        
        // Fetch 5-day forecast
        const forecastData = await fetchForecastData(weatherData.coord.lat, weatherData.coord.lon);
        displayForecast(forecastData);
        forecastSection.style.display = 'block';
        
        // Clear input
        searchInput.value = '';
    } catch (error) {
        welcomeMessage.style.display = 'none';
        weatherDisplay.style.display = 'none';
        forecastSection.style.display = 'none';
        showError(error.message);
    }
}

/**
 * Fetch current weather data from API
 * @param {string} city - City name to search
 * @returns {Promise<Object>} Weather data object
 */
async function fetchWeatherData(city) {
    try {
        const response = await fetch(
            `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
        );
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('❌ City not found. Please check the spelling and try again.');
            }
            if (response.status === 401) {
                throw new Error('❌ Invalid API key. Please check your configuration.');
            }
            throw new Error('Failed to fetch weather data');
        }
        
        return await response.json();
    } catch (error) {
        throw new Error(error.message);
    }
}

/**
 * Fetch 5-day forecast data from API
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} Forecast data object
 */
async function fetchForecastData(lat, lon) {
    try {
        const response = await fetch(
            `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch forecast data');
        }
        
        return await response.json();
    } catch (error) {
        throw new Error('Unable to fetch forecast: ' + error.message);
    }
}

/**
 * Display current weather information
 * @param {Object} data - Weather data from API
 */
function displayCurrentWeather(data) {
    cityName.textContent = `${data.name}, ${data.sys.country}`;
    temperature.textContent = `${Math.round(data.main.temp)}°C`;
    weatherCondition.textContent = getWeatherEmoji(data.weather[0].main) + ' ' + data.weather[0].main;
    humidity.textContent = data.main.humidity;
    windSpeed.textContent = Math.round(data.wind.speed * 3.6); // Convert m/s to km/h
    pressure.textContent = data.main.pressure;
    feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
}

/**
 * Display 5-day forecast
 * @param {Object} data - Forecast data from API
 */
function displayForecast(data) {
    forecastContainer.innerHTML = '';
    
    const dailyForecasts = {};
    
    // Group forecasts by day
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        
        if (!dailyForecasts[dayKey]) {
            dailyForecasts[dayKey] = {
                tempMin: item.main.temp_min,
                tempMax: item.main.temp_max,
                temp: Math.round(item.main.temp),
                condition: item.weather[0].main,
                icon: item.weather[0].icon
            };
        } else {
            // Update min/max temperatures
            dailyForecasts[dayKey].tempMin = Math.min(dailyForecasts[dayKey].tempMin, item.main.temp_min);
            dailyForecasts[dayKey].tempMax = Math.max(dailyForecasts[dayKey].tempMax, item.main.temp_max);
        }
    });
    
    // Display first 5 days
    Object.entries(dailyForecasts).slice(0, 5).forEach(([day, forecast]) => {
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="day">${day}</div>
            <div class="temp">${Math.round(forecast.tempMax)}°C</div>
            <div class="condition">${getWeatherEmoji(forecast.condition)} ${forecast.condition}</div>
        `;
        forecastContainer.appendChild(card);
    });
}

/**
 * Get weather emoji based on condition
 * @param {string} condition - Weather condition
 * @returns {string} Emoji
 */
function getWeatherEmoji(condition) {
    const conditions = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Drizzle': '🌦️',
        'Thunderstorm': '⛈️',
        'Snow': '❄️',
        'Mist': '🌫️',
        'Smoke': '💨',
        'Haze': '🌫️',
        'Dust': '🌪️',
        'Fog': '🌫️',
        'Sand': '🌪️',
        'Ash': '🌋',
        'Squall': '💨',
        'Tornado': '🌪️'
    };
    
    return conditions[condition] || '🌤️';
}

/**
 * Display error message
 * @param {string} message - Error message
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

/**
 * Hide error message
 */
function hideError() {
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';
}

/**
 * Initialize app on page load
 */
window.addEventListener('load', () => {
    console.log('Weather App loaded successfully');
    // Uncomment the line below to load a default city on startup
    // searchInput.value = 'London';
    // handleSearch();
});