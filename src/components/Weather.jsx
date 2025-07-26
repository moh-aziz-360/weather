import React, { useEffect, useState } from "react";
import { useWeather } from "../hooks/useWeather";
import { getWindDirection, debounce } from "../utils/weatherUtils";

const Weather = () => {
  const { weather, forecast, loading, error, fetchWeatherData, fetchWeatherByCoords } = useWeather();
  const [searchInput, setSearchInput] = useState("");
  const [location, setLocation] = useState("Kumasi");
  const [unit, setUnit] = useState("metric");
  const [recentSearches, setRecentSearches] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) setRecentSearches(JSON.parse(saved));
    const savedUnit = localStorage.getItem("weatherUnit");
    if (savedUnit) setUnit(savedUnit);
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

  return (
    <div className="weather-container">
      <h1>Weather Forecast</h1>
      
      <div className="search-section">
        <div className="search-bar">
          <input
            type="text"
            value={searchInput}
            placeholder="Enter city name..."
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setShowSuggestions(true)}
          />
          <button onClick={handleSearch} disabled={loading}>Search</button>
          <button onClick={getCurrentLocation} disabled={loading} title="Get current location">📍</button>
        </div>
        
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

      {recentSearches.length > 0 && (
        <div className="recent-searches">
          <p>Recent searches:</p>
          {recentSearches.map((city, index) => (
            <button 
              key={index} 
              onClick={() => {
                setSearchInput(city);
                setLocation(city);
                handleWeatherFetch(city);
              }}
              className="recent-btn"
            >
              {city}
            </button>
          ))}
        </div>
      )}

      {loading && <div className="loading">Loading weather data...</div>}
      {error && <div className="error">Error: {error}</div>}
      
      {weather && (
        <div className="weather-info">
          <div className="current-weather">
            <h2>{weather.name}, {weather.sys.country}</h2>
            <div className="weather-main">
              <img
                src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`}
                alt={weather.weather[0].description}
              />
              <div className="temp-info">
                <div className="temperature">{Math.round(weather.main.temp)}{tempSymbol}</div>
                <div className="description">{weather.weather[0].description}</div>
                <div className="feels-like">Feels like {Math.round(weather.main.feels_like)}{tempSymbol}</div>
                <div className="temp-range">
                  H: {Math.round(weather.main.temp_max)}{tempSymbol} L: {Math.round(weather.main.temp_min)}{tempSymbol}
                </div>
              </div>
            </div>
            
            <div className="weather-details">
              <div className="detail-item">
                <span>Humidity</span>
                <span>{weather.main.humidity}%</span>
              </div>
              <div className="detail-item">
                <span>Wind</span>
                <span>{weather.wind.speed} {speedUnit} {weather.wind.deg ? getWindDirection(weather.wind.deg) : ''}</span>
              </div>
              <div className="detail-item">
                <span>Pressure</span>
                <span>{weather.main.pressure} hPa</span>
              </div>
              <div className="detail-item">
                <span>Visibility</span>
                <span>{(weather.visibility / 1000).toFixed(1)} km</span>
              </div>
              <div className="detail-item">
                <span>Sunrise</span>
                <span>{getSunTime(weather.sys.sunrise)}</span>
              </div>
              <div className="detail-item">
                <span>Sunset</span>
                <span>{getSunTime(weather.sys.sunset)}</span>
              </div>
            </div>
          </div>

          {forecast && (
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
                      <small>{item.main.humidity}% humidity</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Weather;
