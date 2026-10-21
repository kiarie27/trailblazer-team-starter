// The practice interface. It talks to the sandbox only through fetch.
// It can check what you typed to help you, but it never decides whether
// a transfer is allowed: the sandbox does that.

// Shows a message in a status line. kind is 'loading', 'empty', 'ok' or 'error'
function showStatus(statusLine, kind, message) {
  statusLine.dataset.kind = kind
  statusLine.textContent = message
}

// Every sandbox error looks like { "error": { "code": "...", "message": "..." } }
async function readErrorMessage(response) {
  try {
    const body = await response.json()
    return body.error.message
  } catch {
    return `The sandbox answered with error ${response.status}.`
  }
}

const formatKsh = (amount) => `KSh ${amount.toLocaleString('en-KE')}`

// ---------------------------------------------------------------
// WORKED EXAMPLE: the mini statement, with all four states
// ---------------------------------------------------------------
const statementForm = document.querySelector('#statement-form')
const statementPhone = document.querySelector('#statement-phone')
const statementStatus = document.querySelector('#statement-status')
const statementList = document.querySelector('#statement-list')

statementForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  const phone = statementPhone.value.trim()
  statementList.replaceChildren()

  // Invalid: catch an obvious mistake before asking the server
  if (phone === '') {
    showStatus(statementStatus, 'error', 'Type a phone number first.')
    return
  }

  // Loading: tell the user something is happening
  showStatus(statementStatus, 'loading', 'Loading...')

  try {
    const response = await fetch(`/accounts/${encodeURIComponent(phone)}/statement`)

    // Error: the sandbox answered, but with a problem
    if (!response.ok) {
      showStatus(statementStatus, 'error', await readErrorMessage(response))
      return
    }

    const data = await response.json()

    // Empty: the answer was fine, but there is nothing to show
    if (data.transactions.length === 0) {
      showStatus(statementStatus, 'empty', `${data.name} has no transactions yet.`)
      return
    }

    // Success: show each transaction. textContent shows text safely.
    for (const transaction of data.transactions) {
      const item = document.createElement('li')
      const direction = transaction.type === 'sent' ? 'Sent to' : 'Received from'
      item.textContent = `${direction} ${transaction.otherParty}: ${formatKsh(transaction.amountKsh)} (balance after: ${formatKsh(transaction.balanceAfterKsh)})`
      statementList.append(item)
    }
    showStatus(statementStatus, 'ok', `${data.name}'s last ${data.transactions.length} transactions`)
  } catch {
    // Failure: no answer at all (the sandbox is stopped, or the connection dropped)
    showStatus(statementStatus, 'error', 'Could not reach the sandbox. Is it running?')
  }
})

// ---------------------------------------------------------------
// DAY 3 EXERCISE: make the Check balance card work
// Follow the mini statement example above, step by step:
//   1. Read the phone number from the box.
//   2. If it is empty, show an error and stop.
//   3. Show "Loading...".
//   4. await fetch(`/accounts/${encodeURIComponent(phone)}/balance`)
//   5. If response.ok is false, show the error message and stop.
//   6. Otherwise read the JSON and show, for example, "Asha has KSh 2,500".
//   7. If the fetch fails completely, show "Could not reach the sandbox. Is it running?"
// ---------------------------------------------------------------
const balanceForm = document.querySelector('#balance-form')
const balancePhone = document.querySelector('#balance-phone')
const balanceStatus = document.querySelector('#balance-status')

balanceForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  showStatus(balanceStatus, 'error', 'Not built yet: this is your Day 3 exercise.')
})

// ---------------------------------------------------------------
// Send money (this works; you will read it on Day 4)
// ---------------------------------------------------------------
const sendForm = document.querySelector('#send-form')
const sendFrom = document.querySelector('#send-from')
const sendTo = document.querySelector('#send-to')
const sendAmount = document.querySelector('#send-amount')
const sendStatus = document.querySelector('#send-status')

sendForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  const from = sendFrom.value.trim()
  const to = sendTo.value.trim()
  const amountKsh = Number(sendAmount.value)

  // These checks help the user. They do not protect the money:
  // anyone can skip this page and send a request straight to the sandbox.
  if (from === '' || to === '') {
    showStatus(sendStatus, 'error', 'Fill in both phone numbers.')
    return
  }
  if (!(amountKsh > 0)) {
    showStatus(sendStatus, 'error', 'Enter an amount more than 0.')
    return
  }

  showStatus(sendStatus, 'loading', 'Sending...')

  try {
    const response = await fetch('/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, amountKsh }),
    })

    if (!response.ok) {
      showStatus(sendStatus, 'error', await readErrorMessage(response))
      return
    }

    const data = await response.json()
    showStatus(sendStatus, 'ok', `Sent ${formatKsh(data.amountKsh)}. New balance: ${formatKsh(data.newBalanceKsh)}. Reference ${data.transactionId}.`)
  } catch {
    showStatus(sendStatus, 'error', 'Could not reach the sandbox. Is it running?')
  }
})
