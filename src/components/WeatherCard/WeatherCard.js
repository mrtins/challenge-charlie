import React from 'react';
import { Card, CardContent, CircularProgress } from '@material-ui/core';

import FutureWeather from './FutureWeather/FutureWeather';
import TodayWeather from './TodayWeather/TodayWeather';
import LoadingBackground from '../utils/LoadingBackground';

import LocationSearchInput from '../LocationSearchInput';

import { openCageKey, openWeatherKey } from '../../config/apiKeys';

import { convertCelsiusFahrenheit } from '../../utils/unitConvertion';
import { convertWindDeg } from '../../utils/compassConvertion';

export default () => {
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [loadingCity, setLoadingCity] = React.useState(false);

  const [weatherData, setWeatherData] = React.useState(null);
  const [unitSelected, setUnitSelected] = React.useState('C');

  const [initialCity, setInitialCity] = React.useState('');

  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(getInitialCoords);
    } else {
      alert('Não foi possível verificar sua localização. Por favor, atualize seu navegador.');
    }
  }, []);

  // Initial position from browser
  const getInitialCoords = (position) => {
    setInitialLoading(true);

    const coords = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };

    getCityName(coords);
    getWeather(coords);
  }

  const getCityName = async ({ lat, lng }) => {
    await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${openCageKey}`)
      .then(res => res.json())
      .then(data => {
        const location = data.results[0].components;

        setInitialCity(`${location.city}, ${location.state_code}, ${location.state}`);
      }).catch(err => {
        console.log(err);
        alert('Ocorreu um erro. Tente novamente.');
        setInitialLoading(false);
      });
  }

  const getWeather = async ({ lat, lng }) => {
    setLoadingCity(true);

    await fetch(`http://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lng}&appid=${openWeatherKey}&lang=pt_br&units=metric`)
      .then(res => res.json())
      .then(data => {
        const weatherDataObj = {
          current: {
            temp: data.current.temp.toFixed(),
            humidity: data.current.humidity,
            pressure: data.current.pressure,
            windSpeed: data.current.wind_speed,
            windDirection: convertWindDeg(data.current.wind_deg),
            conditionDescription: data.current.weather[0].description,
            condition: data.current.weather[0].main
          },
          tomorrow: { temp: data.daily[1].temp.day.toFixed(), condition: data.daily[1].weather[0].main },
          dayAfter: { temp: data.daily[2].temp.day.toFixed(), condition: data.daily[2].weather[0].main }
        };

        setWeatherData(weatherDataObj);
        setInitialLoading(false);
        setLoadingCity(false);
      }).catch(err => {
        console.log(err);
        alert('Ocorreu um erro. Tente novamente.');
        setInitialLoading(false);
        setLoadingCity(false);
      });
  }

  // Toggle Celsius or Fahrenheit
  const convertUnits = () => {
    const convertedWeatherData = {
      ...weatherData,
      current: { ...weatherData.current, temp: convertCelsiusFahrenheit(weatherData.current.temp, unitSelected) },
      tomorrow: { ...weatherData.tomorrow, temp: convertCelsiusFahrenheit(weatherData.tomorrow.temp, unitSelected) },
      dayAfter: { ...weatherData.dayAfter, temp: convertCelsiusFahrenheit(weatherData.dayAfter.temp, unitSelected) },
    };

    setUnitSelected(unitSelected === 'C' ? 'F' : 'C');
    setWeatherData(convertedWeatherData);
  }

  return (
    <>
      <div className="d-flex flex-center h-100">
        {initialLoading && <LoadingBackground />}

        {!initialLoading &&
          <Card style={{ backgroundColor: 'transparent' }}>
            <CardContent style={{ padding: 0, }}>
              <div className="card-title">
                <span
                  style={{ fontSize: '1.2em', marginRight: '5px' }}
                  className="icon"
                  data-icon="("
                />

                <LocationSearchInput
                  getWeather={getWeather}
                  initialCity={initialCity}
                />

                {loadingCity && <CircularProgress size={20} style={{ marginLeft: '5px' }} />}
              </div>

              <TodayWeather
                currentWeather={weatherData.current}
                unitSelected={unitSelected}
                convertUnits={convertUnits}
              />

              <FutureWeather
                tomorrow={weatherData.tomorrow}
                dayAfter={weatherData.dayAfter}
                unitSelected={unitSelected}
                convertUnits={convertUnits}
              />
            </CardContent>
          </Card>
        }
      </div>
    </>
  );
}