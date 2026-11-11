// Your product's interface. It asks the service module (src/service.js)
// for data and shows the answer. It never fetches data itself.
import { getItems } from './src/service.js'

const statusLine = document.querySelector('#items-status')
const list = document.querySelector('#items-list')

// Shows a message in the status line. kind is 'loading', 'empty', 'ok' or 'error'
function showStatus(kind, message) {
  statusLine.dataset.kind = kind
  statusLine.textContent = message
}

async function showItems() {
  // DAY 3: show a loading message here

  const result = await getItems()

  // Success: one list item per item. textContent shows text safely.
  if (result.ok) {
    list.replaceChildren()
    for (const item of result.data) {
      const entry = document.createElement('li')
      const title = document.createElement('strong')
      title.textContent = item.title
      const detail = document.createElement('span')
      detail.textContent = ` ${item.detail}`
      entry.append(title, detail)
      list.append(entry)
    }
    showStatus('ok', `Showing ${result.data.length} items.`)
  }

  // DAY 3: add the error state here (result.error.message), as on the practice card.
  // By the Team alpha gate, also add the empty and invalid states.
}

showItems()
