import React from 'react';

const WeatherAlerts = ({ alerts }) => {
  if (!alerts || alerts.length === 0) return null;

  const getAlertIcon = (event) => {
    const eventLower = event.toLowerCase();
    if (eventLower.includes('rain') || eventLower.includes('flood')) return '🌧️';
    if (eventLower.includes('snow') || eventLower.includes('blizzard')) return '❄️';
    if (eventLower.includes('wind') || eventLower.includes('gale')) return '💨';
    if (eventLower.includes('thunder') || eventLower.includes('storm')) return '⛈️';
    if (eventLower.includes('heat')) return '🔥';
    if (eventLower.includes('cold') || eventLower.includes('freeze')) return '🥶';
    return '⚠️';
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'minor': return '#fbbf24';
      case 'moderate': return '#f97316';
      case 'severe': return '#ef4444';
      case 'extreme': return '#dc2626';
      default: return '#6b7280';
    }
  };

  return (
    <div className="weather-alerts">
      <h3>🚨 Weather Alerts</h3>
      {alerts.map((alert, index) => (
        <div 
          key={index} 
          className="alert-item"
          style={{ borderLeftColor: getSeverityColor(alert.severity) }}
        >
          <div className="alert-header">
            <span className="alert-icon">{getAlertIcon(alert.event)}</span>
            <span className="alert-title">{alert.event}</span>
            <span 
              className="alert-severity"
              style={{ backgroundColor: getSeverityColor(alert.severity) }}
            >
              {alert.severity}
            </span>
          </div>
          <p className="alert-description">{alert.description}</p>
          <div className="alert-time">
            Valid: {new Date(alert.start * 1000).toLocaleString()} - {new Date(alert.end * 1000).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WeatherAlerts;