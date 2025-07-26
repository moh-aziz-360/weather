export const formatDate = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

export const getTimeOfDay = (timestamp, sunrise, sunset) => {
  const time = timestamp * 1000;
  const sunriseTime = sunrise * 1000;
  const sunsetTime = sunset * 1000;
  
  if (time < sunriseTime) return 'night';
  if (time < sunsetTime) return 'day';
  return 'night';
};

export const getWindDirection = (degrees) => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return directions[Math.round(degrees / 22.5) % 16];
};

export const getUVIndexLevel = (uvIndex) => {
  if (uvIndex <= 2) return { level: 'Low', color: '#00e400' };
  if (uvIndex <= 5) return { level: 'Moderate', color: '#ffff00' };
  if (uvIndex <= 7) return { level: 'High', color: '#ff7e00' };
  if (uvIndex <= 10) return { level: 'Very High', color: '#ff0000' };
  return { level: 'Extreme', color: '#8b00ff' };
};

export const getAirQualityLevel = (aqi) => {
  if (aqi === 1) return { level: 'Good', color: '#00e400' };
  if (aqi === 2) return { level: 'Fair', color: '#ffff00' };
  if (aqi === 3) return { level: 'Moderate', color: '#ff7e00' };
  if (aqi === 4) return { level: 'Poor', color: '#ff0000' };
  return { level: 'Very Poor', color: '#8b00ff' };
};

export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

export const getWeatherRecommendation = (weather) => {
  const temp = weather.main.temp;
  const condition = weather.weather[0].main.toLowerCase();
  const humidity = weather.main.humidity;
  const windSpeed = weather.wind.speed;

  let recommendations = [];

  if (temp < 10) recommendations.push('🧥 Wear warm clothing');
  else if (temp > 30) recommendations.push('🩳 Light clothing recommended');
  
  if (condition.includes('rain')) recommendations.push('☂️ Don\'t forget your umbrella');
  if (condition.includes('snow')) recommendations.push('❄️ Drive carefully, icy conditions');
  if (windSpeed > 10) recommendations.push('💨 Windy conditions, secure loose items');
  if (humidity > 80) recommendations.push('💧 High humidity, stay hydrated');
  
  return recommendations;
};

export const getComfortLevel = (temp, humidity) => {
  const heatIndex = temp + (0.5 * (humidity - 10));
  
  if (heatIndex < 15) return { level: 'Cold', color: '#3b82f6', icon: '🥶' };
  if (heatIndex < 25) return { level: 'Cool', color: '#06b6d4', icon: '😊' };
  if (heatIndex < 30) return { level: 'Comfortable', color: '#10b981', icon: '😌' };
  if (heatIndex < 35) return { level: 'Warm', color: '#f59e0b', icon: '😅' };
  return { level: 'Hot', color: '#ef4444', icon: '🥵' };
};

export const getMoonPhase = (date) => {
  const phases = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
  const cycle = 29.53;
  const known = new Date('2000-01-06'); // Known new moon
  const diff = (date - known) / (1000 * 60 * 60 * 24);
  const phase = ((diff % cycle) / cycle) * 8;
  return phases[Math.floor(phase)];
};

export const formatWindSpeed = (speed, unit) => {
  if (unit === 'imperial') {
    return `${speed} mph`;
  }
  const kmh = (speed * 3.6).toFixed(1);
  return `${speed} m/s (${kmh} km/h)`;
};