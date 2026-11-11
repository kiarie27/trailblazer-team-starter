// The forecast service module (runs in the browser for now).
// The card in app.js never talks to Open-Meteo itself. It asks getForecast,
// and getForecast always answers in one of two shapes:
//   { ok: true, data: [{ date, maxC, minC, rainMm }, ...] }
//   { ok: false, error: { code, message } }

// The towns this card knows about, with their real coordinates
export const TOWNS = [
  { name: 'Nairobi', latitude: -1.2833, longitude: 36.8167 },
  { name: 'Mombasa', latitude: -4.0547, longitude: 39.6636 },
  { name: 'Kisumu', latitude: -0.1022, longitude: 34.7617 },
  { name: 'Nakuru', latitude: -0.3072, longitude: 36.0723 },
  { name: 'Eldoret', latitude: 0.5204, longitude: 35.2699 },
]

// Builds the error shape, so every error looks the same
function fail(code, message) {
  return { ok: false, error: { code, message } }
}

// Asks Open-Meteo for a daily forecast for one town.
// fetchFn is fetch in the browser. The tests pass in a pretend fetch instead.
export async function getForecast(town, days, fetchFn = fetch) {
  // Rule: the town must be on our list
  const place = TOWNS.find((item) => item.name === town)
  if (!place) {
    return fail('UNKNOWN_TOWN', `We do not have a forecast for "${town}". Choose a town from the list.`)
  }

  // Day 4: add the DAYS_OUT_OF_RANGE rule here (days must be 1 to 7)

  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${place.latitude}&longitude=${place.longitude}` +
    '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum' +
    `&timezone=Africa/Nairobi&forecast_days=${days}`

  // Ask the server. If there is no answer at all, the connection failed.
  let response
  try {
    response = await fetchFn(url)
  } catch {
    return fail('NETWORK', 'Could not reach Open-Meteo. Check your connection and try again.')
  }

  // The server answered, but with a problem (for example 400 or 500)
  if (!response.ok) {
    return fail('BAD_RESPONSE', `Open-Meteo answered with status ${response.status}.`)
  }

  // Read the JSON and check it has the parts we need
  let body
  try {
    body = await response.json()
  } catch {
    return fail('BAD_RESPONSE', 'Open-Meteo sent an answer we could not read.')
  }
  const daily = body && body.daily
  const hasLists =
    daily &&
    [daily.time, daily.temperature_2m_max, daily.temperature_2m_min, daily.precipitation_sum].every(Array.isArray)
  if (!hasLists) {
    return fail('BAD_RESPONSE', 'Open-Meteo sent an answer without a daily forecast.')
  }

  // Turn Open-Meteo's lists into one object per day
  const data = daily.time.map((date, i) => ({
    date,
    maxC: daily.temperature_2m_max[i],
    minC: daily.temperature_2m_min[i],
    rainMm: daily.precipitation_sum[i],
  }))
  return { ok: true, data }
}
