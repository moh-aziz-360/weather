import React, { useEffect, useState, useMemo } from "react";
import { useWeather } from "../hooks/useWeather";
import { getWindDirection, debounce } from "../utils/weatherUtils";

const Weather = () => {
  const { weather, forecast, loading, error, fetchWeatherData, fetchWeatherByCoords } = useWeather();
  const [searchInput, setSearchInput] = useState("");
  const [location, setLocation] = useState("Kumasi");
  const [unit, setUnit] = useState("metric");
  const [recentSearches, setRecentSearches] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState('current');
  const [favorites, setFavorites] = useState([]);
  const [theme, setTheme] = useState('auto');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) setRecentSearches(JSON.parse(saved));
    const savedUnit = localStorage.getItem("weatherUnit");
    if (savedUnit) setUnit(savedUnit);
    const savedFavorites = localStorage.getItem("weatherFavorites");
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    const savedTheme = localStorage.getItem("weatherTheme");
    if (savedTheme) setTheme(savedTheme);
  }, []);

  const saveToRecent = (city) => {
    const updated = [city, ...recentSearches.filter(c => c !== city)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  const handleWeatherFetch = async (city) => {
    try {
      await fetchWeatherData(city, unit);
      saveToRecent(city);
    } catch (err) {
      console.error('Failed to fetch weather:', err);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const cityName = await fetchWeatherByCoords(latitude, longitude, unit);
            setLocation(cityName);
            setSearchInput(cityName);
            handleWeatherFetch(cityName);
          } catch (err) {
            console.error('Failed to get location weather:', err);
          }
        },
        (err) => console.error('Location access denied:', err)
      );
    }
  };

  const handleSearch = () => {
    if (searchInput.trim()) {
      const city = searchInput.trim();
      setLocation(city);
      handleWeatherFetch(city);
      setShowSuggestions(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") setShowSuggestions(false);
  };

  const popularCities = [
    "New York", "London", "Tokyo", "Paris", "Sydney", "Dubai", "Singapore", "Mumbai", 
    "Los Angeles", "Berlin", "Toronto", "Madrid", "Rome", "Amsterdam", "Bangkok", 
    "Hong Kong", "Seoul", "Moscow", "Cairo", "Istanbul", "Mexico City", "São Paulo",
    "Buenos Aires", "Lagos", "Nairobi", "Cape Town", "Accra", "Kumasi", "Casablanca"
  ];

  const debouncedSearch = useMemo(
    () => debounce((query) => {
      if (query.length > 1) {
        const filtered = popularCities
          .filter(city => city.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 5);
        setSuggestions(filtered);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300),
    []
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  const handleSuggestionClick = (city) => {
    setSearchInput(city);
    setLocation(city);
    handleWeatherFetch(city);
    setShowSuggestions(false);
  };

  const handleUnitChange = (newUnit) => {
    setUnit(newUnit);
    localStorage.setItem("weatherUnit", newUnit);
    if (location) handleWeatherFetch(location);
  };

  useEffect(() => {
    handleWeatherFetch(location);
  }, []);

  const tempSymbol = unit === "metric" ? "°C" : "°F";
  const speedUnit = unit === "metric" ? "m/s" : "mph";

  const getSunTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleFavorite = (city) => {
    const updated = favorites.includes(city) 
      ? favorites.filter(f => f !== city)
      : [...favorites, city];
    setFavorites(updated);
    localStorage.setItem("weatherFavorites", JSON.stringify(updated));
  };

  const getHourlyForecast = () => {
    if (!forecast) return [];
    return forecast.list.slice(0, 8);
  };

  const getWeatherBackground = () => {
    if (!weather) return 'default';
    const condition = weather.weather[0].main.toLowerCase();
    const isDay = weather.weather[0].icon.includes('d');
    return `${condition}-${isDay ? 'day' : 'night'}`;
  };

  const getAirQuality = async (lat, lon) => {
    try {
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`
      );
      return await response.json();
    } catch (err) {
      console.error('Failed to fetch air quality:', err);
      return null;
    }
  };

  return (
    <div className={`weather-app ${getWeatherBackground()}`}>
      <div className="weather-container">
        <div className="header">
          <h1>🌤️ Weather Pro</h1>
          <div className="header-controls">
            <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
        
        <div className="search-section">
          <div className="search-bar">
            <div className="search-input-wrapper">
              <input
                type="text"
                value={searchInput}
                placeholder="Search for a city..."
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onFocus={() => searchInput.length > 1 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              <button className="search-btn" onClick={handleSearch} disabled={loading}>
                🔍
              </button>
              {showSuggestions && suggestions.length > 0 && (
                <div className="search-suggestions">
                  {suggestions.map((city, index) => (
                    <button
                      key={index}
                      className="suggestion-item"
                      onClick={() => handleSuggestionClick(city)}
                    >
                      <span className="suggestion-icon">📍</span>
                      <span className="suggestion-text">{city}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="location-btn" onClick={getCurrentLocation} disabled={loading} title="Get current location">
              📍
            </button>
            {weather && (
              <button 
                className={`favorite-btn ${favorites.includes(weather.name) ? 'active' : ''}`}
                onClick={() => toggleFavorite(weather.name)}
                title="Add to favorites"
              >
                {favorites.includes(weather.name) ? '❤️' : '🤍'}
              </button>
            )}
          </div>
          
          <div className="controls">
            <div className="unit-toggle">
              <button 
                className={unit === "metric" ? "active" : ""}
                onClick={() => handleUnitChange("metric")}
              >°C</button>
              <button 
                className={unit === "imperial" ? "active" : ""}
                onClick={() => handleUnitChange("imperial")}
              >°F</button>
            </div>
          </div>
        </div>

        <div className="quick-access">
          {favorites.length > 0 && (
            <div className="favorites">
              <p>⭐ Favorites:</p>
              {favorites.map((city, index) => (
                <button 
                  key={index} 
                  onClick={() => {
                    setSearchInput(city);
                    setLocation(city);
                    handleWeatherFetch(city);
                  }}
                  className="quick-btn favorite"
                >
                  {city}
                </button>
              ))}
            </div>
          )}
          
          {recentSearches.length > 0 && (
            <div className="recent-searches">
              <p>🕒 Recent:</p>
              {recentSearches.map((city, index) => (
                <button 
                  key={index} 
                  onClick={() => {
                    setSearchInput(city);
                    setLocation(city);
                    handleWeatherFetch(city);
                  }}
                  className="quick-btn recent"
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading weather data...</p>
          </div>
        )}
        {error && (
          <div className="error">
            <span className="error-icon">⚠️</span>
            <p>Error: {error}</p>
          </div>
        )}
      
        {weather && (
          <div className="weather-info">
            <div className="tab-navigation">
              <button 
                className={`tab ${activeTab === 'current' ? 'active' : ''}`}
                onClick={() => setActiveTab('current')}
              >
                Current
              </button>
              <button 
                className={`tab ${activeTab === 'hourly' ? 'active' : ''}`}
                onClick={() => setActiveTab('hourly')}
              >
                Hourly
              </button>
              <button 
                className={`tab ${activeTab === 'forecast' ? 'active' : ''}`}
                onClick={() => setActiveTab('forecast')}
              >
                5-Day
              </button>
            </div>

            {activeTab === 'current' && (
              <div className="current-weather">
                <div className="location-header">
                  <h2>{weather.name}, {weather.sys.country}</h2>
                  <div className="current-time">
                    {new Date().toLocaleString()}
                  </div>
                </div>
                
                <div className="weather-hero">
                  <div className="weather-main">
                    <div className="weather-icon-container">
                      <img
                        src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`}
                        alt={weather.weather[0].description}
                        className="weather-icon"
                      />
                    </div>
                    <div className="temp-info">
                      <div className="temperature">{Math.round(weather.main.temp)}{tempSymbol}</div>
                      <div className="description">{weather.weather[0].description}</div>
                      <div className="feels-like">Feels like {Math.round(weather.main.feels_like)}{tempSymbol}</div>
                      <div className="temp-range">
                        H: {Math.round(weather.main.temp_max)}{tempSymbol} L: {Math.round(weather.main.temp_min)}{tempSymbol}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="weather-details">
                  <div className="detail-card">
                    <div className="detail-icon">💧</div>
                    <div className="detail-content">
                      <span className="detail-label">Humidity</span>
                      <span className="detail-value">{weather.main.humidity}%</span>
                    </div>
                  </div>
                  <div className="detail-card">
                    <div className="detail-icon">💨</div>
                    <div className="detail-content">
                      <span className="detail-label">Wind</span>
                      <span className="detail-value">{weather.wind.speed} {speedUnit} {weather.wind.deg ? getWindDirection(weather.wind.deg) : ''}</span>
                    </div>
                  </div>
                  <div className="detail-card">
                    <div className="detail-icon">🌡️</div>
                    <div className="detail-content">
                      <span className="detail-label">Pressure</span>
                      <span className="detail-value">{weather.main.pressure} hPa</span>
                    </div>
                  </div>
                  <div className="detail-card">
                    <div className="detail-icon">👁️</div>
                    <div className="detail-content">
                      <span className="detail-label">Visibility</span>
                      <span className="detail-value">{(weather.visibility / 1000).toFixed(1)} km</span>
                    </div>
                  </div>
                  <div className="detail-card">
                    <div className="detail-icon">🌅</div>
                    <div className="detail-content">
                      <span className="detail-label">Sunrise</span>
                      <span className="detail-value">{getSunTime(weather.sys.sunrise)}</span>
                    </div>
                  </div>
                  <div className="detail-card">
                    <div className="detail-icon">🌇</div>
                    <div className="detail-content">
                      <span className="detail-label">Sunset</span>
                      <span className="detail-value">{getSunTime(weather.sys.sunset)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'hourly' && forecast && (
              <div className="hourly-forecast">
                <h3>24-Hour Forecast</h3>
                <div className="hourly-list">
                  {getHourlyForecast().map((item, index) => (
                    <div key={index} className="hourly-item">
                      <div className="hourly-time">
                        {new Date(item.dt * 1000).toLocaleTimeString('en-US', { hour: 'numeric' })}
                      </div>
                      <img
                        src={`https://openweathermap.org/img/wn/${item.weather[0].icon}.png`}
                        alt={item.weather[0].description}
                      />
                      <div className="hourly-temp">{Math.round(item.main.temp)}{tempSymbol}</div>
                      <div className="hourly-desc">{item.weather[0].main}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'forecast' && forecast && (
              <div className="forecast">
                <h3>5-Day Forecast</h3>
                <div className="forecast-list">
                  {forecast.list.filter((_, index) => index % 8 === 0).slice(0, 5).map((item, index) => (
                    <div key={index} className="forecast-item">
                      <div className="forecast-date">
                        {new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <img
                        src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`}
                        alt={item.weather[0].description}
                        title={item.weather[0].description}
                      />
                      <div className="forecast-temp">
                        {Math.round(item.main.temp)}{tempSymbol}
                      </div>
                      <div className="forecast-desc">{item.weather[0].main}</div>
                      <div className="forecast-details">
                        <small>💧 {item.main.humidity}%</small>
                        <small>💨 {item.wind.speed} {speedUnit}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Weather;
