export const formatDate = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
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