import fetch from 'isomorphic-fetch';
import nprogress from 'nprogress';
import capitalize from 'lodash/capitalize';

// import { schemas } from '../middleware';
import { MS_IN_DAY, USDA_URL, FORECAST_URL, FORECAST_API_KEY } from '../constants';

export const SELECT_STATE = 'SELECT_STATE';
export const REQUEST_FORECAST = 'REQUEST_FORECAST';
export const RECEIVE_FORECAST = 'RECEIVE_FORECAST';
export const FAIL_TO_RECEIVE_FORECAST = 'FAIL_TO_RECEIVE_FORECAST';
export const REQUEST_SOYBEAN_PRODUCTION = 'REQUEST_SOYBEAN_PRODUCTION';
export const RECEIVE_SOYBEAN_PRODUCTION = 'RECEIVE_SOYBEAN_PRODUCTION';
export const CHANGE_SOYBEAN_YIELD_BOUNDS = 'CHANGE_SOYBEAN_YIELD_BOUNDS';

export const selectState = (name) => ({
  type: SELECT_STATE,
  name
})

const requestSoybeanProduction = () => ({
  type: REQUEST_SOYBEAN_PRODUCTION
})

const receiveSoybeanProduction = (payload) => ({
  type: RECEIVE_SOYBEAN_PRODUCTION,
  payload
})

const fetchSoybeanProduction = () => (dispatch) => {
  dispatch(requestSoybeanProduction());
  nprogress.start();
  return fetch(USDA_URL)
    // Map the response to the values we care about and remove vaguely attributed data.
    .then(res => res.json())
    .then(({ data }) => (
      data
        .map(({ Value, state_name, state_alpha, county_name, unit_desc }) => ({
          soybeanYield: parseInt(Value, 10) * 1000,
          stateName: capitalize(state_name),
          stateAbbr: state_alpha,
          countyName: capitalize(county_name),
          unit: unit_desc
        }))
        .filter(({ countyName }) => countyName !== 'Other (combined) counties')
    ))
    .then((payload) => {
      dispatch(receiveSoybeanProduction(payload));
      nprogress.done();
    })
}

// Pull soybean production data from usda.gov if inexistent or stale.
export const fetchSoybeanProductionIfNeeded = () => (dispatch, getState) => {
  const { soybeanProduction: { lastUpdated } } = getState();
  if (!lastUpdated || Date.now() - lastUpdated > 365 * MS_IN_DAY) {
    return dispatch(fetchSoybeanProduction());
  }
}

// export const changeSoybeanYieldBounds = ({ lowerbound, upperbound }) => ({
//   type: CHANGE_SOYBEAN_YIELD_BOUNDS,
//   lowerbound,
//   upperbound
// })

const requestForecast = (countyName) => ({
  type: REQUEST_FORECAST,
  countyName
})

const receiveForecast = ({ countyName, coords, series }) => ({
  type: RECEIVE_FORECAST,
  countyName,
  coords,
  series
})

const failToReceiveForecast = ({ countyName, err }) => ({
  type: FAIL_TO_RECEIVE_FORECAST,
  countyName,
  err
})

const fetchCoords = ({ countyName, stateAbbr }) => (dispatch) => {
  return fetch(`https://lat-lng.now.sh/?address=${countyName},${stateAbbr}`)
    .then(res => res.json())
    .then(({ lat, lng }) => ({
      countyName,
      coords: { lat, lng }
    }))
}

const yesterday = new Date(Date.now() - MS_IN_DAY);
const fetchForecast = ({ countyName, coords }, time = yesterday) => (dispatch, getState) => {
  const { lat, lng } = coords;
  dispatch(requestForecast(countyName));
  // TODO: Adding `time` to the req yields data starting at midnight of _that_ day and ending at the next midnight.
  return fetch(`${FORECAST_URL}/${FORECAST_API_KEY}/${lat},${lng}`)
    .then(
      res => res.json(),
      err => failToReceiveForecast({ countyName, err })
    )
    .then(({ hourly: { data } }) => {
      // Mapreduce the response to form a series with y values expressing the accumulated precipIntensity
      // (where precipIntensity = "inches of liquid water per hour").
      const series = data
        .map(({ time, precipIntensity: y, precipProbability: z }, i) => ({
          i,
          x: time * 1000,
          y,
          z
        }))
        .reduce((acc, { i, x, y, z }) => ([
          ...acc,
          {
            i,
            x,
            y: i > 0 ? y + acc[i - 1].y : y,
            z
          }
        ]), [])

      nprogress.done();
      dispatch(receiveForecast({ countyName, coords, series }));
    })
}

// Find coordinates and the forecast for a given county if inexistent (or not up to date).
export const fetchForecastIfNeeded = ({ countyName, stateAbbr }) => (dispatch, getState) => {
  const { forecasts } = getState();
  if (!forecasts.find(({ countyName: name }) => name === countyName)) {
    nprogress.start();
    return dispatch(fetchCoords({ countyName, stateAbbr }))
      .then(({ countyName, coords }) => {
        return dispatch(fetchForecast({ countyName, coords }));
      })
  }
}
