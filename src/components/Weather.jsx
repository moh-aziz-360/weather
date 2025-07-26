import React, { useEffect, useState } from "react";

const Weather = () => {
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState("Kumasi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      setError(null);

      try {
        const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
        if (!apiKey) throw new Error("API key is missing");

        const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`;

        const response = await fetch(url);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Error fetching weather data: ${errorData.message}`);
        }

        const data = await response.json();
        setWeather(data);
      } catch (err) {
        setError(err.message);
        setWeather(null);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [location]);

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", textAlign: "center" }}>
      <h1>Weather App</h1>
      <input
        type="text"
        value={location}
        placeholder="Enter city..."
        onChange={(e) => setLocation(e.target.value)}
        style={{ padding: "0.5rem", width: "100%", marginBottom: "1rem" }}
      />
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {weather && (
        <div>
          <h3>{weather.name}</h3>
          <img
            src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
            alt={weather.weather[0].description}
          />
          <p>Weather: {weather.weather[0].description}</p>
          <p>Temperature: {weather.main.temp}°C</p>
          <p>Humidity: {weather.main.humidity}%</p>
          <p>Cloudiness: {weather.clouds.all}%</p>
        </div>
      )}
    </div>
  );
};

export default Weather;
