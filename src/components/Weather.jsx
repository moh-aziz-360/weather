import React, { useEffect, useState } from "react";

const Weather = () => {
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState("Kumasi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      setError(null); // Clear previous errors
      try {
        const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
        if (!apiKey) {
          throw new Error("API key is missing");
        }

        console.log("Using API Key:", apiKey); // Debugging line

        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Error fetching weather data: ${errorData.message}`);
        }

        const data = await response.json();
        console.log("Weather data:", data); // Debugging line
        setWeather(data);
      } catch (error) {
        console.error("Error fetching weather data:", error); // Debugging line
        setError(error.message);
        setWeather(null);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [location]);

  return (
    <div>
      <h1>Fetch Weather</h1>
      <input
        type="text"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}
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
