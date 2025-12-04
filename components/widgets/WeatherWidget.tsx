'use client';

import { useEffect, useState } from 'react';
import styles from './WeatherWidget.module.css';

interface WeatherData {
  location: string;
  forecast: Array<{
    day: string;
    icon: string;
    high: number;
    low: number;
  }>;
}

interface WeatherWidgetProps {
  location?: string; // City name or coordinates
  countryCode?: string; // For location detection
}

export default function WeatherWidget({ location, countryCode }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detectedLocation, setDetectedLocation] = useState<string>('Amsterdam');

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // If location is provided, use it; otherwise detect from IP
        let cityName = location;
        if (!cityName) {
          // Detect location from IP (for guests) or use country code
          try {
            // Use a free IP geolocation service
            const ipResponse = await fetch('https://ipapi.co/json/');
            if (ipResponse.ok) {
              const ipData = await ipResponse.json();
              cityName = ipData.city || 'Amsterdam';
              setDetectedLocation(cityName || 'Amsterdam');
            } else {
              cityName = countryCode ? getDefaultCityForCountry(countryCode) : 'Amsterdam';
              setDetectedLocation(cityName);
            }
          } catch (ipError) {
            cityName = countryCode ? getDefaultCityForCountry(countryCode) : 'Amsterdam';
            setDetectedLocation(cityName);
          }
        } else {
          setDetectedLocation(cityName);
        }

        // Fetch weather data from OpenWeatherMap API (free tier)
        // Note: You'll need to add your API key to environment variables
        const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY || '';
        if (!apiKey) {
          // Fallback: Use mock data for development
          setWeather({
            location: cityName || 'Amsterdam',
            forecast: [
              { day: 'Today', icon: '☁️', high: 48, low: 40 },
              { day: 'Wed', icon: '☁️', high: 48, low: 40 },
              { day: 'Thu', icon: '☁️', high: 46, low: 39 },
              { day: 'Fri', icon: '☁️', high: 44, low: 38 },
            ],
          });
          setIsLoading(false);
          return;
        }

        const cityNameToUse = cityName || 'Amsterdam';
        const weatherResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cityNameToUse)}&appid=${apiKey}&units=imperial&cnt=4`
        );

        if (!weatherResponse.ok) {
          throw new Error('Failed to fetch weather');
        }

        const data = await weatherResponse.json();
        
        // Transform OpenWeatherMap data to our format
        const forecast = data.list.slice(0, 4).map((item: any, index: number) => {
          const date = new Date(item.dt * 1000);
          const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
          const icon = getWeatherIcon(item.weather[0].main);
          
          return {
            day: dayName,
            icon,
            high: Math.round(item.main.temp_max),
            low: Math.round(item.main.temp_min),
          };
        });

        setWeather({
          location: data.city.name,
          forecast,
        });
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError('Unable to load weather');
        // Set fallback data
        setWeather({
          location: detectedLocation,
          forecast: [
            { day: 'Today', icon: '☁️', high: 48, low: 40 },
            { day: 'Wed', icon: '☁️', high: 48, low: 40 },
            { day: 'Thu', icon: '☁️', high: 46, low: 39 },
            { day: 'Fri', icon: '☁️', high: 44, low: 38 },
          ],
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, [location, countryCode]);

  const getWeatherIcon = (condition: string): string => {
    const icons: Record<string, string> = {
      Clear: '☀️',
      Clouds: '☁️',
      Rain: '🌧️',
      Drizzle: '🌦️',
      Thunderstorm: '⛈️',
      Snow: '❄️',
      Mist: '🌫️',
      Fog: '🌫️',
    };
    return icons[condition] || '☁️';
  };

  const getDefaultCityForCountry = (code: string): string => {
    const cityMap: Record<string, string> = {
      US: 'New York',
      GB: 'London',
      CA: 'Toronto',
      AU: 'Sydney',
      DE: 'Berlin',
      FR: 'Paris',
      IT: 'Rome',
      ES: 'Madrid',
      NL: 'Amsterdam',
      NG: 'Lagos',
      KE: 'Nairobi',
      ZA: 'Johannesburg',
    };
    return cityMap[code] || 'Amsterdam';
  };

  if (isLoading) {
    return (
      <div className={styles.widget}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerBar}></div>
            <span className={styles.headerTitle}>Weather</span>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.location}>{detectedLocation}</span>
            <span className={styles.locationIcon}>📍</span>
          </div>
        </div>
        <div className={styles.loading}>Loading weather...</div>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className={styles.widget}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerBar}></div>
            <span className={styles.headerTitle}>Weather</span>
          </div>
        </div>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerBar}></div>
          <span className={styles.headerTitle}>Weather</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.location}>{weather?.location || detectedLocation}</span>
          <span className={styles.locationIcon}>📍</span>
        </div>
      </div>

      <div className={styles.forecast}>
        {weather?.forecast.map((day, index) => (
          <div key={index} className={styles.forecastDay}>
            <div className={styles.dayName}>{day.day}</div>
            <div className={styles.weatherIcon}>{day.icon}</div>
            <div className={styles.temperatures}>
              <span className={styles.high}>{day.high}°</span>
              <span className={styles.low}>{day.low}°</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <a href="https://www.accuweather.com" target="_blank" rel="noopener noreferrer" className={styles.seeMore}>
          See more
        </a>
        <div className={styles.accuWeather}>
          <div className={styles.accuLogo}>☀️</div>
          <span className={styles.accuText}>AccuWeather</span>
        </div>
      </div>
    </div>
  );
}
