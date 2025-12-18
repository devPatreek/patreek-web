'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';

interface WeatherResponse {
  current_weather?: {
    temperature: number;
    windspeed: number;
    weathercode: number;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Failed to fetch weather');
  return res.json();
});

export default function WeatherCard() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!navigator.geolocation) {
      setGeoError('Location not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: Number(pos.coords.latitude.toFixed(3)),
          lon: Number(pos.coords.longitude.toFixed(3)),
        });
        setGeoError(null);
      },
      (err) => setGeoError(err.message || 'Location permission denied.'),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  const { data, error, isLoading } = useSWR<WeatherResponse>(
    coords ? `weather:${coords.lat}:${coords.lon}` : null,
    () =>
      fetcher(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords?.lat}&longitude=${coords?.lon}&current_weather=true`
      ),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60 * 60 * 1000,
    }
  );

  const temperature = data?.current_weather?.temperature;
  const wind = data?.current_weather?.windspeed;

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={labelStyle}>Local Weather</span>
        {coords && <span style={coordsStyle}>{coords.lat}°, {coords.lon}°</span>}
      </div>
      {geoError && <p style={errorStyle}>{geoError}</p>}
      {error && <p style={errorStyle}>Unable to load weather.</p>}
      {!geoError && !error && (
        <div style={{ minHeight: 40 }}>
          {isLoading && <p style={mutedStyle}>Fetching sky vibes…</p>}
          {temperature !== undefined && (
            <p style={valueStyle}>
              {temperature.toFixed(0)}°C
              {wind !== undefined && <span style={mutedStyle}> • Wind {wind.toFixed(0)} km/h</span>}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#0f172a',
  color: '#f8fafc',
  padding: '16px',
  borderRadius: '16px',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 10px 30px rgba(15,23,42,0.2)',
  minHeight: '120px',
};

const labelStyle: React.CSSProperties = {
  textTransform: 'uppercase',
  letterSpacing: '0.2em',
  fontSize: '11px',
  color: '#94a3b8',
};

const coordsStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#cbd5f5',
};

const mutedStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#94a3b8',
  marginLeft: 8,
};

const valueStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 700,
  margin: 0,
};

const errorStyle: React.CSSProperties = {
  color: '#f87171',
  fontSize: '13px',
  margin: 0,
};
