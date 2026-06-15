// ==========================================================================
// AURAWEATHER APP LOGIC & GEOLOCATION LOGIC
// ==========================================================================

// Application State
let currentState = {
    latitude: null,
    longitude: null,
    cityName: '',
    country: '',
    timezone: 'auto'
};

// DOM Elements
const citySearchInput = document.getElementById('citySearchInput');
const searchSuggestions = document.getElementById('searchSuggestions');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const useLocationBtn = document.getElementById('useLocationBtn');
const welcomePanel = document.getElementById('welcomePanel');
const weatherContent = document.getElementById('weatherContent');
const loadingOverlay = document.getElementById('loadingOverlay');
const errorPanel = document.getElementById('errorPanel');
const errorText = document.getElementById('errorText');
const errorCloseBtn = document.getElementById('errorCloseBtn');

const cityNameEl = document.getElementById('cityName');
const countryNameEl = document.getElementById('countryName');

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    initSearchEvents();
    initLocationEvents();
});

// Search Autocomplete Events
let debounceTimer;
function initSearchEvents() {
    citySearchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        // Show/hide clear button
        clearSearchBtn.style.display = query ? 'block' : 'none';
        
        // Clear previous suggestions if query is too short
        if (query.length < 2) {
            clearSuggestions();
            return;
        }

        // Debounce API requests to avoid spamming
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            fetchCitySuggestions(query);
        }, 350);
    });

    clearSearchBtn.addEventListener('click', () => {
        citySearchInput.value = '';
        clearSearchBtn.style.display = 'none';
        clearSuggestions();
        citySearchInput.focus();
    });

    // Close suggestion list when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-form-wrapper')) {
            clearSuggestions();
        }
    });

    errorCloseBtn.addEventListener('click', () => {
        errorPanel.style.display = 'none';
    });
}

// Fetch cities matching query from Open-Meteo Geocoding API
async function fetchCitySuggestions(query) {
    try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&format=json`;
        const res = await fetch(url);
        
        if (!res.ok) throw new Error('Failed to retrieve search matches');
        
        const data = await res.json();
        
        if (!data.results || data.results.length === 0) {
            clearSuggestions();
            return;
        }
        
        renderSuggestions(data.results);
    } catch (err) {
        console.error('Geocoding error:', err);
    }
}

// Render autocomplete dropdown suggestions
function renderSuggestions(cities) {
    searchSuggestions.innerHTML = '';
    
    cities.forEach(city => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        
        const stateStr = city.admin1 ? `${city.admin1}, ` : '';
        const countryStr = city.country || '';
        
        item.innerHTML = `
            <span class="suggestion-name">${city.name}</span>
            <span class="suggestion-admin">${stateStr}${countryStr}</span>
        `;
        
        item.addEventListener('click', () => {
            selectCity({
                name: city.name,
                country: city.country,
                lat: city.latitude,
                lon: city.longitude,
                timezone: city.timezone
            });
        });
        
        searchSuggestions.appendChild(item);
    });
    
    searchSuggestions.style.display = 'block';
}

function clearSuggestions() {
    searchSuggestions.innerHTML = '';
    searchSuggestions.style.display = 'none';
}

// Trigger city selection and request weather
function selectCity(cityInfo) {
    currentState.cityName = cityInfo.name;
    currentState.country = cityInfo.country || '';
    currentState.latitude = cityInfo.lat;
    currentState.longitude = cityInfo.lon;
    currentState.timezone = cityInfo.timezone || 'auto';
    
    clearSuggestions();
    citySearchInput.value = cityInfo.name;
    clearSearchBtn.style.display = 'block';
    
    // Start fetching weather data
    loadWeatherData();
}

// Geolocation Trigger events
function initLocationEvents() {
    useLocationBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            showError('Geolocation is not supported by your browser.');
            return;
        }
        
        showLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                currentState.latitude = pos.coords.latitude;
                currentState.longitude = pos.coords.longitude;
                currentState.cityName = 'Current Location';
                currentState.country = '';
                currentState.timezone = 'auto';
                
                loadWeatherData();
            },
            (err) => {
                showLoading(false);
                let message = 'Unable to access geolocation.';
                if (err.code === err.PERMISSION_DENIED) {
                    message = 'Location access denied. Please enable location permissions in browser settings.';
                }
                showError(message);
            }
        );
    });
}

// Load weather data from Open-Meteo Forecast API
async function loadWeatherData() {
    showLoading(true);
    errorPanel.style.display = 'none';
    welcomePanel.style.display = 'none';
    
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${currentState.latitude}&longitude=${currentState.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(currentState.timezone)}`;
        
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to retrieve weather details');
        
        const data = await res.json();
        renderWeather(data);
        
        // Display main panel container
        weatherContent.style.display = 'block';
        showLoading(false);
    } catch (err) {
        console.error('Weather Fetch Error:', err);
        showLoading(false);
        showError('Error loading weather data. Please check your network and try again.');
    }
}

// Render entire weather payload onto UI components
function renderWeather(data) {
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;
    
    // 1. Current Conditions
    const weatherInfo = parseWeatherCode(current.weather_code, current.is_day);
    
    // Injects weather theme onto body
    document.body.className = `theme-${weatherInfo.theme}`;
    
    cityNameEl.textContent = currentState.cityName;
    countryNameEl.textContent = currentState.country || `Lat: ${currentState.latitude.toFixed(2)}, Lon: ${currentState.longitude.toFixed(2)}`;
    
    const resolvedTimezone = data.timezone || currentState.timezone;
    document.getElementById('localTime').textContent = formatLocalTime(resolvedTimezone);
    
    document.getElementById('currentTemp').textContent = Math.round(current.temperature_2m);
    document.getElementById('currentHigh').textContent = `${Math.round(daily.temperature_2m_max[0])}°`;
    document.getElementById('currentLow').textContent = `${Math.round(daily.temperature_2m_min[0])}°`;
    
    document.getElementById('currentWeatherIcon').textContent = weatherInfo.icon;
    document.getElementById('currentWeatherDesc').textContent = weatherInfo.desc;
    
    // Set Metric Grid
    document.getElementById('humidityVal').textContent = `${current.relative_humidity_2m}%`;
    document.getElementById('windVal').textContent = `${current.wind_speed_10m} km/h`;
    document.getElementById('uvVal').textContent = getWindDirection(current.wind_direction_10m);
    document.getElementById('pressureVal').textContent = `${Math.round(current.pressure_msl)} hPa`;
    
    // 2. Render Hourly Forecast slider (24 Periods)
    const hourlyContainer = document.getElementById('hourlyContainer');
    hourlyContainer.innerHTML = '';
    
    const now = new Date();
    let startIdx = 0;
    
    if (hourly.time && hourly.time.length > 0) {
        const currentHourString = now.toISOString().slice(0, 13) + ':00';
        const idx = hourly.time.findIndex(timeStr => timeStr.startsWith(currentHourString.slice(0, 13)));
        if (idx !== -1) startIdx = idx;
    }
    
    for (let i = startIdx; i < startIdx + 24 && i < hourly.time.length; i++) {
        const timeStr = hourly.time[i];
        const temp = hourly.temperature_2m[i];
        const code = hourly.weather_code[i];
        
        const hourNum = new Date(timeStr).getHours();
        const isDayPeriod = hourNum >= 6 && hourNum < 18 ? 1 : 0;
        const hrInfo = parseWeatherCode(code, isDayPeriod);
        
        const hourFormatted = new Date(timeStr).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        
        const item = document.createElement('div');
        item.className = 'hourly-item';
        item.innerHTML = `
            <span class="hourly-time">${hourFormatted}</span>
            <span class="hourly-icon" title="${hrInfo.desc}">${hrInfo.icon}</span>
            <span class="hourly-temp">${Math.round(temp)}°</span>
        `;
        hourlyContainer.appendChild(item);
    }
    
    // 3. Render 5-Day Outlook Table
    const dailyContainer = document.getElementById('dailyContainer');
    dailyContainer.innerHTML = '';
    
    for (let i = 0; i < 5 && i < daily.time.length; i++) {
        const dayStr = daily.time[i];
        const maxTemp = daily.temperature_2m_max[i];
        const minTemp = daily.temperature_2m_min[i];
        const code = daily.weather_code[i];
        
        const dayInfo = parseWeatherCode(code, 1);
        
        let dayLabel = '';
        if (i === 0) {
            dayLabel = 'Today';
        } else if (i === 1) {
            dayLabel = 'Tomorrow';
        } else {
            dayLabel = new Date(dayStr).toLocaleDateString('en-US', { weekday: 'long' });
        }
        
        const row = document.createElement('div');
        row.className = 'daily-row';
        row.innerHTML = `
            <span class="daily-day">${dayLabel}</span>
            <span class="daily-icon" title="${dayInfo.desc}">${dayInfo.icon}</span>
            <span class="daily-desc">${dayInfo.desc}</span>
            <span class="daily-temps">
                <span class="daily-max">${Math.round(maxTemp)}°</span>
                <span class="daily-min">${Math.round(minTemp)}°</span>
            </span>
        `;
        dailyContainer.appendChild(row);
    }
}

// Parse WMO Weather interpretation codes
function parseWeatherCode(code, isDay = 1) {
    const isNight = isDay === 0;
    
    if (code === 0) {
        return {
            desc: 'Clear Sky',
            icon: isNight ? '🌙' : '☀️',
            theme: isNight ? 'night' : 'sunny'
        };
    } else if (code === 1 || code === 2 || code === 3) {
        const desc = code === 1 ? 'Mainly Clear' : code === 2 ? 'Partly Cloudy' : 'Overcast';
        return {
            desc: desc,
            icon: isNight ? (code === 3 ? '☁️' : '🌤️') : (code === 3 ? '☁️' : '⛅'),
            theme: isNight ? 'night' : 'cloudy'
        };
    } else if (code === 45 || code === 48) {
        return { desc: 'Foggy', icon: '🌫️', theme: 'cloudy' };
    } else if (code === 51 || code === 53 || code === 55 || code === 56 || code === 57) {
        return { desc: 'Drizzle', icon: '🌧️', theme: 'rainy' };
    } else if (code === 61 || code === 63 || code === 65 || code === 66 || code === 67 || code === 80 || code === 81 || code === 82) {
        const desc = code >= 80 ? 'Heavy Showers' : 'Rainy';
        return { desc: desc, icon: '🌧️', theme: 'rainy' };
    } else if (code === 71 || code === 73 || code === 75 || code === 77 || code === 85 || code === 86) {
        return { desc: 'Snowfall', icon: '❄️', theme: 'snowy' };
    } else if (code === 95 || code === 96 || code === 99) {
        return { desc: 'Thunderstorm', icon: '⛈️', theme: 'rainy' };
    }
    
    return { desc: 'Cloudy', icon: '☁️', theme: 'cloudy' };
}

// Convert wind direction degrees to cardinal tags
function getWindDirection(deg) {
    const index = Math.round(deg / 45) % 8;
    const directions = ['North (N)', 'North-East (NE)', 'East (E)', 'South-East (SE)', 'South (S)', 'South-West (SW)', 'West (W)', 'North-West (NW)'];
    return `${directions[index]} (${deg}°)`;
}

// Format local timezone time
function formatLocalTime(timezoneString) {
    const options = { weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: true };
    try {
        return new Intl.DateTimeFormat('en-US', {
            ...options,
            timeZone: timezoneString
        }).format(new Date());
    } catch (e) {
        return new Date().toLocaleDateString('en-US', { weekday: 'long' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
}

// View manager utilities
function showLoading(isLoading) {
    loadingOverlay.style.display = isLoading ? 'flex' : 'none';
}

function showError(message) {
    errorText.textContent = message;
    errorPanel.style.display = 'block';
    weatherContent.style.display = 'none';
}
