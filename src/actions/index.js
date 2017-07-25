import fetch from 'isomorphic-fetch';
import { v4 } from 'uuid';
import moment from 'moment';
import nprogress from 'nprogress';
import capitalize from 'lodash/capitalize';

import { USDA_URL, FORECAST_URL, FORECAST_API_KEY } from '../constants';

export const END_FETCH = 'END_FETCH';
export const BEGIN_FETCH = 'BEGIN_FETCH';
export const SELECT_STATE = 'SELECT_STATE';
export const REQUEST_FORECAST = 'REQUEST_FORECAST';
export const RECEIVE_FORECAST = 'RECEIVE_FORECAST';
export const SET_FORECAST_FILTER = 'SET_FORECAST_FILTER';
export const FAIL_TO_RECEIVE_FORECAST = 'FAIL_TO_RECEIVE_FORECAST';
export const REACH_FORECAST_REQ_LIMIT = 'REACH_FORECAST_REQ_LIMIT';
export const REQUEST_SOYBEAN_PRODUCTION = 'REQUEST_SOYBEAN_PRODUCTION';
export const RECEIVE_SOYBEAN_PRODUCTION = 'RECEIVE_SOYBEAN_PRODUCTION';

export const selectState = (stateName) => ({
  type: SELECT_STATE,
  stateName
})

export const setForecastFilter = (blacklist) => ({
  type: SET_FORECAST_FILTER,
  blacklist
})

export const endFetch = () => ({
  type: END_FETCH
})

export const beginFetch = () => ({
  type: BEGIN_FETCH
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
  return fetch(USDA_URL)
    // Map the response to the values we care about and remove vaguely attributed data.
    .then(res => res.json())
    .then(({ data }) => (
      data
        .map(({ Value, state_name, state_alpha, county_name, unit_desc }) => ({
          soybeanYield: parseFloat(Value) * 1000,
          stateName: capitalize(state_name),
          stateAbbr: state_alpha,
          countyName: capitalize(county_name),
          unit: unit_desc
        }))
        .filter(({ countyName }) => countyName !== 'Other (combined) counties')
    ))
    .then(payload => dispatch(receiveSoybeanProduction(payload)))
}

// Pull soybean production data from usda.gov if inexistent or stale.
export const fetchSoybeanProductionIfNeeded = () => (dispatch, getState) => {
  const { lastUpdated } = getState().soybeanProduction;
  if (!lastUpdated || moment(lastUpdated).unix() < moment().startOf('year').unix()) {
    return dispatch(fetchSoybeanProduction());
  }
}

const requestForecast = (countyName) => ({
  type: REQUEST_FORECAST,
  countyName
})

const receiveForecast = ({ countyName, coords, series }) => ({
  type: RECEIVE_FORECAST,
  countyName,
  coords,
  series,
  id: v4()
})

const failToReceiveForecast = ({ countyName, message }) => ({
  type: FAIL_TO_RECEIVE_FORECAST,
  countyName,
  message
})

const reachForecastReqLimit = ({ countyName }) => ({
  type: REACH_FORECAST_REQ_LIMIT,
  countyName
})

const fetchCoords = ({ countyName, stateAbbr }) => (dispatch) => {
  return fetch(`https://lat-lng.now.sh/?address=${countyName},${stateAbbr}`)
    .then(
      res => res.status >= 400
        ? dispatch(failToReceiveForecast({ countyName, message: 'Something went wrong.' }))
        : res.json()
    )
    .then(({ lat, lng }) => ({
      countyName,
      coords: { lat, lng }
    }))
}

const today = moment().format('YYYY-MM-DDTHH:mm:ss');
const fetchForecast = ({ countyName, coords }, time = today) => (dispatch) => {
  const { lat, lng } = coords;
  dispatch(requestForecast(countyName));
  // Adding `time` to the req yields data starting at midnight of _that_ day and ending at the next midnight.
  return fetch(`${FORECAST_URL}/${FORECAST_API_KEY}/${lat},${lng},${time}`)
    .then(
      res => res.status >= 400
        ? res.status === 403
          ? dispatch(reachForecastReqLimit({ countyName }))
          : dispatch(failToReceiveForecast({ countyName, message: 'Something went wrong.' }))
        : res.json()
    )
    .then(({ hourly: { data } }) => {
      const series = data
        .map(({ time, precipIntensity: y, precipProbability: z }, i) => ({
          i,
          x: time * 1000,
          y,
          z
        }))

      dispatch(receiveForecast({ countyName, coords, series }));
    })
}

// TODO: use https://github.com/lelandrichardson/redux-pack (?)
// Get the forecast for a given county if it's not in the store (= inexistent or stale).
const fetchForecastIfNeeded = ({ countyName, stateAbbr }) => (dispatch, getState) => {
  const { precipForecasts } = getState().forecasts;
  // TODO: Check reachedLimitAt time...
  if (!precipForecasts.find(({ countyName: name }) => name === countyName)) {
    return dispatch(fetchCoords({ countyName, stateAbbr }))
      .then(({ countyName, coords }) => {
        // TODO: Chain request (fetch previous day).
        if (coords.lat && coords.lng) {
          return dispatch(fetchForecast({ countyName, coords }, undefined));
        }
      })
  } else {
    return Promise.resolve();
  }
}

export const loadForecasts = (payloadSubset) => (dispatch) => {
  nprogress.start();
  dispatch(beginFetch());
  Promise.all(payloadSubset.map(county => dispatch(fetchForecastIfNeeded(county))))
    .then(() => {
      dispatch(endFetch());
      nprogress.done();
    })
}
