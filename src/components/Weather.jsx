import React, { useEffect, useState, useMemo } from "react";
import { useWeather } from "../hooks/useWeather";
import { getWindDirection, debounce } from "../utils/weatherUtils";

const Weather = () => {
  const { weather, forecast, loading, error, fetchWeatherData } = useWeather();
  const [searchInput, setSearchInput] = useState("");
  const [location, setLocation] = useState("Detecting location...");
  const [unit, setUnit] = useState("metric");
  const [recentSearches, setRecentSearches] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState("current");
  const [favorites, setFavorites] = useState([]);
  const [theme, setTheme] = useState("dark");
  const [suggestions, setSuggestions] = useState([]);
  const [uvIndex, setUvIndex] = useState(null);
  const [airQuality, setAirQuality] = useState(null);
  const [weatherAlerts, setWeatherAlerts] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) setRecentSearches(JSON.parse(saved));
    const savedUnit = localStorage.getItem("weatherUnit");
    if (savedUnit) setUnit(savedUnit);
    const savedFavorites = localStorage.getItem("weatherFavorites");
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    const savedTheme = localStorage.getItem("weatherTheme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const saveToRecent = (city) => {
    const updated = [city, ...recentSearches.filter((c) => c !== city)].slice(
      0,
      5
    );
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  const handleWeatherFetch = async (city) => {
    try {
      await fetchWeatherData(city, unit);
      saveToRecent(city);

      // Fetch additional data if weather is available
      if (weather && weather.coord) {
        getUVIndex(weather.coord.lat, weather.coord.lon);
        getAirQuality(weather.coord.lat, weather.coord.lon);
      }
    } catch (err) {
      console.error("Failed to fetch weather:", err);
    }
  };

  // Fetch additional data when weather changes
  useEffect(() => {
    if (weather && weather.coord) {
      getUVIndex(weather.coord.lat, weather.coord.lon);
      getAirQuality(weather.coord.lat, weather.coord.lon);
    }
  }, [weather]);

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
    "New York",
    "London",
    "Tokyo",
    "Paris",
    "Sydney",
    "Dubai",
    "Singapore",
    "Mumbai",
    "Los Angeles",
    "Berlin",
    "Toronto",
    "Madrid",
    "Rome",
    "Amsterdam",
    "Bangkok",
    "Hong Kong",
    "Seoul",
    "Moscow",
    "Cairo",
    "Istanbul",
    "Mexico City",
    "São Paulo",
  ];

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    console.log("Input changed:", value);

    if (value.length > 1) {
      const filtered = popularCities
        .filter((city) => city.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5);
      console.log("Filtered cities:", filtered);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (city) => {
    setSearchInput(city);
    setLocation(city);
    handleWeatherFetch(city);
    setSuggestions([]);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      // Use IP-based location if geolocation not supported
      fetchLocationByIP().then(ipLocation => {
        if (ipLocation) {
          setSearchInput(ipLocation.city);
          setLocation(ipLocation.city);
          handleWeatherFetch(ipLocation.city);
        } else {
          alert('Unable to detect your location');
        }
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const apiKey =
          import.meta.env.VITE_WEATHER_API_KEY ||
          "954de46ced1b94019c631ee2aaf328c1";

        try {
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=${unit}`
          );
          const data = await response.json();

          setSearchInput(data.name);
          setLocation(data.name);
          handleWeatherFetch(data.name);
        } catch (err) {
          alert("Failed to get weather for your location");
        }
      },
      async () => {
        // Use IP-based location if GPS is denied
        const ipLocation = await fetchLocationByIP();
        if (ipLocation) {
          setSearchInput(ipLocation.city);
          setLocation(ipLocation.city);
          handleWeatherFetch(ipLocation.city);
        } else {
          alert('Please allow location access or check your connection');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleUnitChange = (newUnit) => {
    setUnit(newUnit);
    localStorage.setItem("weatherUnit", newUnit);
    if (location) handleWeatherFetch(location);
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("weatherTheme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const toggleFavorite = (city) => {
    const updated = favorites.includes(city)
      ? favorites.filter((f) => f !== city)
      : [...favorites, city];
    setFavorites(updated);
    localStorage.setItem("weatherFavorites", JSON.stringify(updated));
  };

  const getSunTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUVIndex = async (lat, lon) => {
    try {
      const apiKey =
        import.meta.env.VITE_WEATHER_API_KEY ||
        "954de46ced1b94019c631ee2aaf328c1";
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${apiKey}`
      );
      const data = await response.json();
      setUvIndex(data.value);
    } catch (err) {
      console.error("Failed to fetch UV index:", err);
    }
  };

  const getAirQuality = async (lat, lon) => {
    try {
      const apiKey =
        import.meta.env.VITE_WEATHER_API_KEY ||
        "954de46ced1b94019c631ee2aaf328c1";
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`
      );
      const data = await response.json();
      setAirQuality(data.list[0]);
    } catch (err) {
      console.error("Failed to fetch air quality:", err);
    }
  };

  const getUVLevel = (uv) => {
    if (uv <= 2) return { level: "Low", color: "#10b981" };
    if (uv <= 5) return { level: "Moderate", color: "#f59e0b" };
    if (uv <= 7) return { level: "High", color: "#f97316" };
    if (uv <= 10) return { level: "Very High", color: "#ef4444" };
    return { level: "Extreme", color: "#7c2d12" };
  };

  const getAQILevel = (aqi) => {
    if (aqi <= 50) return { level: "Good", color: "#10b981" };
    if (aqi <= 100) return { level: "Moderate", color: "#f59e0b" };
    if (aqi <= 150)
      return { level: "Unhealthy for Sensitive", color: "#f97316" };
    if (aqi <= 200) return { level: "Unhealthy", color: "#ef4444" };
    return { level: "Hazardous", color: "#7c2d12" };
  };

  const getWeatherAdvice = () => {
    if (!weather) return [];
    const temp = weather.main.temp;
    const condition = weather.weather[0].main.toLowerCase();
    const humidity = weather.main.humidity;
    const windSpeed = weather.wind.speed;
    const advice = [];

    if (temp < 0) advice.push("🧊 Freezing - dress very warmly, watch for ice");
    else if (temp < 10) advice.push("🧥 Cold - wear layers and warm clothing");
    else if (temp > 35)
      advice.push("🌡️ Very hot - stay hydrated, avoid sun exposure");
    else if (temp > 25) advice.push("☀️ Warm - light clothing recommended");

    if (condition.includes("rain"))
      advice.push("☔ Rain expected - bring umbrella");
    if (condition.includes("snow"))
      advice.push("❄️ Snow - drive carefully, wear boots");
    if (condition.includes("storm"))
      advice.push("⛈️ Storms - stay indoors if possible");
    if (windSpeed > 15) advice.push("💨 Very windy - secure loose objects");
    if (humidity > 80) advice.push("💧 High humidity - may feel warmer");
    if (humidity < 30) advice.push("🏜️ Low humidity - stay hydrated");

    if (uvIndex > 7) advice.push("🧴 High UV - use sunscreen, wear hat");
    if (airQuality && airQuality.main.aqi > 3)
      advice.push("😷 Poor air quality - limit outdoor activities");

    return advice;
  };

  const fetchLocationByIP = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      return { city: data.city, lat: data.latitude, lon: data.longitude };
    } catch (err) {
      console.error('IP location failed:', err);
      return null;
    }
  };

  useEffect(() => {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY || '954de46ced1b94019c631ee2aaf328c1';
    
    if (!apiKey) {
      setError('Missing API key');
      return;
    }

    // Auto-detect location on app load
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=${unit}`
            );
            const data = await response.json();
            
            setLocation(data.name);
            setSearchInput(data.name);
            await fetchWeatherData(data.name, unit);
            saveToRecent(data.name);
          } catch (err) {
            console.warn('Failed to get GPS weather, trying IP location');
            const ipLocation = await fetchLocationByIP();
            if (ipLocation) {
              setLocation(ipLocation.city);
              setSearchInput(ipLocation.city);
              handleWeatherFetch(ipLocation.city);
            } else {
              handleWeatherFetch('London');
            }
          }
        },
        async (err) => {
          console.warn('Geolocation denied, trying IP location');
          const ipLocation = await fetchLocationByIP();
          if (ipLocation) {
            setLocation(ipLocation.city);
            setSearchInput(ipLocation.city);
            handleWeatherFetch(ipLocation.city);
          } else {
            handleWeatherFetch('London');
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      // No geolocation support, use IP location
      fetchLocationByIP().then(ipLocation => {
        if (ipLocation) {
          setLocation(ipLocation.city);
          setSearchInput(ipLocation.city);
          handleWeatherFetch(ipLocation.city);
        } else {
          handleWeatherFetch('London');
        }
      });
    }
  }, []);

  const tempSymbol = unit === "metric" ? "°C" : "°F";
  const speedUnit = unit === "metric" ? "m/s" : "mph";

  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading weather data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">
          <h1>WeatherPro</h1>
        </div>
        <div className="nav-actions">
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </nav>

      <div className="container">
        <aside className="sidebar">
          <div className="search-panel">
            <div className="search-box">
              <input
                type="text"
                value={searchInput}
                placeholder="Search for a city..."
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
              />
              <button onClick={handleSearch} disabled={loading}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </button>

              {suggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {suggestions.map((city, index) => (
                    <button
                      key={index}
                      className="suggestion-item"
                      onClick={() => handleSuggestionClick(city)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="controls-row">
              <div className="unit-selector">
                <button
                  className={unit === "metric" ? "active" : ""}
                  onClick={() => handleUnitChange("metric")}
                >
                  °C
                </button>
                <button
                  className={unit === "imperial" ? "active" : ""}
                  onClick={() => handleUnitChange("imperial")}
                >
                  °F
                </button>
              </div>

              <button
                className="location-btn"
                onClick={getCurrentLocation}
                disabled={loading}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Current Location
              </button>
            </div>
          </div>

          {(favorites.length > 0 || recentSearches.length > 0) && (
            <div className="quick-access">
              {favorites.length > 0 && (
                <div className="section">
                  <h3>Favorites</h3>
                  <div className="city-list">
                    {favorites.map((city, i) => (
                      <button
                        key={i}
                        className="city-btn"
                        onClick={() => {
                          setSearchInput(city);
                          setLocation(city);
                          handleWeatherFetch(city);
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {recentSearches.length > 0 && (
                <div className="section">
                  <h3>Recent</h3>
                  <div className="city-list">
                    {recentSearches.map((city, i) => (
                      <button
                        key={i}
                        className="city-btn"
                        onClick={() => {
                          setSearchInput(city);
                          setLocation(city);
                          handleWeatherFetch(city);
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12,6 12,12 16,14"></polyline>
                        </svg>
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>

        <main className="main-content">
          {error && (
            <div className="alert alert-error">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              {error}
            </div>
          )}

          {weather && (
            <div className="weather-dashboard">
              <div className="weather-header">
                <div className="location-info">
                  <h2>
                    {weather.name}, {weather.sys.country}
                  </h2>
                  <p>
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                {weather && (
                  <button
                    className={`favorite-toggle ${
                      favorites.includes(weather.name) ? "active" : ""
                    }`}
                    onClick={() => toggleFavorite(weather.name)}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill={
                        favorites.includes(weather.name)
                          ? "currentColor"
                          : "none"
                      }
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="weather-tabs">
                <button
                  className={`tab ${activeTab === "current" ? "active" : ""}`}
                  onClick={() => setActiveTab("current")}
                >
                  Current
                </button>
                <button
                  className={`tab ${activeTab === "hourly" ? "active" : ""}`}
                  onClick={() => setActiveTab("hourly")}
                >
                  Hourly
                </button>
                <button
                  className={`tab ${activeTab === "forecast" ? "active" : ""}`}
                  onClick={() => setActiveTab("forecast")}
                >
                  5-Day Forecast
                </button>
              </div>

              <div className="tab-content">
                {activeTab === "current" && (
                  <div className="current-weather">
                    <div className="weather-overview">
                      <div className="weather-visual">
                        <img
                          src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`}
                          alt={weather.weather[0].description}
                          className="weather-icon"
                        />
                        <div className="temperature-display">
                          <span className="temperature">
                            {Math.round(weather.main.temp)}
                          </span>
                          <span className="unit">{tempSymbol}</span>
                        </div>
                      </div>
                      <div className="weather-summary">
                        <h3>{weather.weather[0].description}</h3>
                        <p>
                          Feels like {Math.round(weather.main.feels_like)}
                          {tempSymbol}
                        </p>
                        <div className="temp-range">
                          <span>
                            H: {Math.round(weather.main.temp_max)}
                            {tempSymbol}
                          </span>
                          <span>
                            L: {Math.round(weather.main.temp_min)}
                            {tempSymbol}
                          </span>
                        </div>
                      </div>
                    </div>

                    {getWeatherAdvice().length > 0 && (
                      <div className="weather-alerts">
                        <h4>Weather Advice</h4>
                        <div className="alerts-grid">
                          {getWeatherAdvice().map((advice, i) => (
                            <div key={i} className="alert-item">
                              {advice}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="weather-metrics">
                      <div className="metric-card">
                        <div className="metric-icon">💧</div>
                        <div className="metric-info">
                          <span className="metric-label">Humidity</span>
                          <span className="metric-value">
                            {weather.main.humidity}%
                          </span>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{ width: `${weather.main.humidity}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="metric-card">
                        <div className="metric-icon">💨</div>
                        <div className="metric-info">
                          <span className="metric-label">Wind</span>
                          <span className="metric-value">
                            {weather.wind.speed} {speedUnit}
                          </span>
                          <span className="metric-detail">
                            {weather.wind.deg &&
                              getWindDirection(weather.wind.deg)}
                          </span>
                        </div>
                      </div>

                      <div className="metric-card">
                        <div className="metric-icon">🌡️</div>
                        <div className="metric-info">
                          <span className="metric-label">Pressure</span>
                          <span className="metric-value">
                            {weather.main.pressure} hPa
                          </span>
                          <span className="metric-detail">
                            {weather.main.pressure > 1013 ? "High" : "Low"}
                          </span>
                        </div>
                      </div>

                      <div className="metric-card">
                        <div className="metric-icon">👁️</div>
                        <div className="metric-info">
                          <span className="metric-label">Visibility</span>
                          <span className="metric-value">
                            {(weather.visibility / 1000).toFixed(1)} km
                          </span>
                          <span className="metric-detail">
                            {weather.visibility > 8000 ? "Clear" : "Limited"}
                          </span>
                        </div>
                      </div>

                      {uvIndex !== null && (
                        <div className="metric-card">
                          <div className="metric-icon">☀️</div>
                          <div className="metric-info">
                            <span className="metric-label">UV Index</span>
                            <span className="metric-value">
                              {uvIndex.toFixed(1)}
                            </span>
                            <span
                              className="metric-detail"
                              style={{ color: getUVLevel(uvIndex).color }}
                            >
                              {getUVLevel(uvIndex).level}
                            </span>
                          </div>
                        </div>
                      )}

                      {airQuality && (
                        <div className="metric-card">
                          <div className="metric-icon">🌬️</div>
                          <div className="metric-info">
                            <span className="metric-label">Air Quality</span>
                            <span className="metric-value">
                              AQI {airQuality.main.aqi}
                            </span>
                            <span
                              className="metric-detail"
                              style={{
                                color: getAQILevel(airQuality.main.aqi).color,
                              }}
                            >
                              {getAQILevel(airQuality.main.aqi).level}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="metric-card">
                        <div className="metric-icon">🌅</div>
                        <div className="metric-info">
                          <span className="metric-label">Sunrise</span>
                          <span className="metric-value">
                            {getSunTime(weather.sys.sunrise)}
                          </span>
                        </div>
                      </div>

                      <div className="metric-card">
                        <div className="metric-icon">🌇</div>
                        <div className="metric-info">
                          <span className="metric-label">Sunset</span>
                          <span className="metric-value">
                            {getSunTime(weather.sys.sunset)}
                          </span>
                        </div>
                      </div>

                      <div className="metric-card">
                        <div className="metric-icon">🌡️</div>
                        <div className="metric-info">
                          <span className="metric-label">Dew Point</span>
                          <span className="metric-value">
                            {Math.round(
                              weather.main.temp -
                                (100 - weather.main.humidity) / 5
                            )}
                            {tempSymbol}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "hourly" && forecast && (
                  <div className="hourly-forecast">
                    <div className="forecast-grid">
                      {forecast.list.slice(0, 8).map((item, i) => (
                        <div key={i} className="hourly-card">
                          <div className="hour-time">
                            {new Date(item.dt * 1000).toLocaleTimeString(
                              "en-US",
                              { hour: "numeric" }
                            )}
                          </div>
                          <img
                            src={`https://openweathermap.org/img/wn/${item.weather[0].icon}.png`}
                            alt={item.weather[0].description}
                            className="hour-icon"
                          />
                          <div className="hour-temp">
                            {Math.round(item.main.temp)}
                            {tempSymbol}
                          </div>
                          <div className="hour-condition">
                            {item.weather[0].main}
                          </div>
                          <div className="hour-rain">
                            💧{" "}
                            {item.pop ? `${Math.round(item.pop * 100)}%` : "0%"}
                          </div>
                          <div className="hour-wind">
                            💨 {item.wind.speed.toFixed(1)} {speedUnit}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "forecast" && forecast && (
                  <div className="daily-forecast">
                    <div className="forecast-list">
                      {forecast.list
                        .filter((_, i) => i % 8 === 0)
                        .slice(0, 5)
                        .map((item, i) => (
                          <div key={i} className="daily-card">
                            <div className="day-info">
                              <div className="day-name">
                                {new Date(item.dt * 1000).toLocaleDateString(
                                  "en-US",
                                  { weekday: "short" }
                                )}
                              </div>
                              <div className="day-date">
                                {new Date(item.dt * 1000).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" }
                                )}
                              </div>
                            </div>
                            <img
                              src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`}
                              alt={item.weather[0].description}
                              className="day-icon"
                            />
                            <div className="day-condition">
                              {item.weather[0].main}
                            </div>
                            <div className="day-temps">
                              <span className="temp-high">
                                {Math.round(item.main.temp_max)}
                                {tempSymbol}
                              </span>
                              <span className="temp-low">
                                {Math.round(item.main.temp_min)}
                                {tempSymbol}
                              </span>
                            </div>
                            <div className="day-details">
                              <span>💧 {item.main.humidity}%</span>
                              <span>
                                💨 {item.wind.speed} {speedUnit}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Weather;
