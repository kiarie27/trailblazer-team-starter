// The practice card's interface. It asks the forecast service module for data
// and shows the answer. It never talks to Open-Meteo directly.
import { TOWNS, getForecast } from './forecast-service.js'

const form = document.querySelector('#forecast-form')
const townSelect = document.querySelector('#town')
const daysInput = document.querySelector('#days')
const slowSwitch = document.querySelector('#slow-switch')
const failSwitch = document.querySelector('#fail-switch')
const statusLine = document.querySelector('#forecast-status')
const list = document.querySelector('#forecast-list')

// Put every town from TOWNS into the drop-down list
for (const town of TOWNS) {
  const option = document.createElement('option')
  option.value = town.name
  option.textContent = town.name
  townSelect.append(option)
}

// Shows a message in the status line. kind is 'loading', 'empty', 'ok' or 'error'
function showStatus(kind, message) {
  statusLine.dataset.kind = kind
  statusLine.textContent = message
}

// Turns "2026-11-11" into "Wed 11 Nov"
function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// ---------------------------------------------------------------
// The practice switches. You do not need to change this part.
// practiceFetch works like fetch, but it listens to the two switches.
// If the real network is down, it uses a saved forecast instead,
// so the card still works in class.
// ---------------------------------------------------------------
let usedSavedCopy = false

async function practiceFetch(url) {
  usedSavedCopy = false
  if (slowSwitch.checked) {
    await wait(3000)
  }
  if (failSwitch.checked) {
    throw new TypeError('Failed to fetch (the fail switch is on)')
  }
  try {
    return await fetch(url)
  } catch {
    usedSavedCopy = true
    return fetch('../data/forecast-sample.json')
  }
}

// ---------------------------------------------------------------
// The card. It only shows the success state for now.
// ---------------------------------------------------------------
form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const town = townSelect.value
  const days = Number(daysInput.value)

  // DAY 3: show a loading message here, before you wait for the forecast

  const result = await getForecast(town, days, practiceFetch)

  // Success: show one line per day. textContent shows text safely.
  if (result.ok) {
    list.replaceChildren()
    for (const day of result.data) {
      const item = document.createElement('li')
      item.textContent = `${formatDate(day.date)}: ${day.minC}°C to ${day.maxC}°C, rain ${day.rainMm} mm`
      list.append(item)
    }
    if (usedSavedCopy) {
      showStatus('ok', 'Open-Meteo could not be reached, so this is a saved forecast for Nairobi from 11 Nov 2026.')
    } else {
      showStatus('ok', `${town}: forecast for ${result.data.length} days`)
    }
  }

  // DAY 3: add the error state here.
  // If result.ok is false, clear the list and show result.error.message.
})
