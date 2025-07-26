import { useState, useEffect, useCallback } from 'react';

export const useWeather = () => {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeatherData = useCallback(async (city, unit = 'metric') => {
    setLoading(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
      if (!apiKey) throw new Error('API key is missing');

      const [weatherRes, forecastRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${unit}`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${unit}`)
      ]);

      if (!weatherRes.ok) {
        const errorData = await weatherRes.json();
        throw new Error(errorData.message);
      }

      const [weatherData, forecastData] = await Promise.all([
        weatherRes.json(),
        forecastRes.json()
      ]);

      setWeather(weatherData);
      setForecast(forecastData);
      return { weather: weatherData, forecast: forecastData };
    } catch (err) {
      setError(err.message);
      setWeather(null);
      setForecast(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWeatherByCoords = useCallback(async (lat, lon, unit = 'metric') => {
    setLoading(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${unit}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch weather data');
      
      const data = await response.json();
      return data.name;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    weather,
    forecast,
    loading,
    error,
    fetchWeatherData,
    fetchWeatherByCoords
  };
};