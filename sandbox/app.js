// The Moringa Pesa Sandbox: a small practice service that works like a
// mobile-money service. Practice data only: nothing here is real money.
//
// The browser (your interface) sends requests here. This server decides
// what is allowed. The interface never decides whether a transfer is allowed,
// because anyone can skip the interface and send a request straight to the server.

import express from 'express'
import { fileURLToPath } from 'node:url'
import { seedAccounts } from './accounts.js'
import { assist, DISCLOSURE } from './assist.js'

// The longest question the practice assistant accepts
const MAX_QUESTION_LENGTH = 300

// A fresh copy of the starting data, so every restart (and every test) begins the same way
function freshState() {
  return { accounts: structuredClone(seedAccounts), nextId: 1001 }
}

// Every error has the same shape, so the interface can show any error the same way:
// { "error": { "code": "ACCOUNT_NOT_FOUND", "message": "No account has the number 0799999999." } }
function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } })
}

export function createApp() {
  const app = express()
  let state = freshState()

  const findAccount = (phone) => state.accounts.find((account) => account.phone === phone)

  // Read JSON request bodies, and serve the practice interface from the public folder
  app.use(express.json())
  app.use(express.static(fileURLToPath(new URL('../public', import.meta.url))))

  // Is the sandbox running?
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'Moringa Pesa Sandbox', note: 'Practice data only. Made up for this course.' })
  })

  // The balance of one account
  app.get('/accounts/:phone/balance', (req, res) => {
    const account = findAccount(req.params.phone)
    if (!account) {
      return sendError(res, 404, 'ACCOUNT_NOT_FOUND', `No account has the number ${req.params.phone}.`)
    }
    res.json({ phone: account.phone, name: account.name, balanceKsh: account.balanceKsh })
  })

  // The last five transactions of one account, newest first
  app.get('/accounts/:phone/statement', (req, res) => {
    const account = findAccount(req.params.phone)
    if (!account) {
      return sendError(res, 404, 'ACCOUNT_NOT_FOUND', `No account has the number ${req.params.phone}.`)
    }
    res.json({ phone: account.phone, name: account.name, transactions: account.transactions.slice(0, 5) })
  })

  // Send money from one account to another
  // Body: { "from": "0700000001", "to": "0700000002", "amountKsh": 300 }
  app.post('/send', (req, res) => {
    const { from, to, amountKsh } = req.body ?? {}

    // Rule 1: every field must be there
    if (!from || !to || amountKsh === undefined) {
      return sendError(res, 400, 'MISSING_FIELD', 'Send needs from, to and amountKsh.')
    }

    // Rule 2: the amount must be a number
    if (typeof amountKsh !== 'number' || !Number.isFinite(amountKsh)) {
      return sendError(res, 400, 'INVALID_AMOUNT', 'amountKsh must be a number.')
    }

    // DAY 4 (everyone): the interface stops you typing an amount of 0 or less,
    // but anyone can skip the interface and call this route directly.
    // Add Rule 3 here: reject an amount of 0 or less with a 400 INVALID_AMOUNT error.
    // Then write a test for it in test/sandbox.test.js.
    //
    // DAY 4 stretch ideas: check that phone numbers look like 07 followed by
    // 8 digits; add a fee or a limit; add a new route such as POST /tokens.

    const sender = findAccount(from)
    const receiver = findAccount(to)
    if (!sender) {
      return sendError(res, 404, 'ACCOUNT_NOT_FOUND', `No account has the number ${from}.`)
    }
    if (!receiver) {
      return sendError(res, 404, 'ACCOUNT_NOT_FOUND', `No account has the number ${to}.`)
    }
    if (from === to) {
      return sendError(res, 400, 'SAME_ACCOUNT', 'You cannot send money to the same account.')
    }
    if (sender.balanceKsh < amountKsh) {
      return sendError(res, 422, 'INSUFFICIENT_FUNDS', `${sender.name} does not have enough money for this.`)
    }

    // Everything checks out: move the money and record it on both accounts
    sender.balanceKsh -= amountKsh
    receiver.balanceKsh += amountKsh
    const id = `T${state.nextId++}`
    const at = new Date().toISOString()
    sender.transactions.unshift({ id, type: 'sent', otherParty: to, amountKsh, balanceAfterKsh: sender.balanceKsh, at })
    receiver.transactions.unshift({ id, type: 'received', otherParty: from, amountKsh, balanceAfterKsh: receiver.balanceKsh, at })

    res.json({ transactionId: id, from, to, amountKsh, newBalanceKsh: sender.balanceKsh })
  })

  // The practice assistant (a simulation, not a real AI model)
  // Body: { "question": "How do I check my balance?" }
  // Add ?fail=true to the address to pretend the model is down.
  app.post('/assist', (req, res) => {
    const question = req.body?.question

    if (req.query.fail === 'true') {
      return sendError(res, 503, 'MODEL_UNAVAILABLE', 'The assistant is not available right now. Please try again later.')
    }
    if (typeof question !== 'string' || question.trim() === '') {
      return sendError(res, 400, 'MISSING_FIELD', 'Assist needs a question.')
    }
    if (question.length > MAX_QUESTION_LENGTH) {
      return sendError(res, 400, 'QUESTION_TOO_LONG', `Keep your question under ${MAX_QUESTION_LENGTH} characters.`)
    }
    // Input boundary: personal details never go to an AI model
    if (/\d{9,}/.test(question.replace(/[\s-]/g, ''))) {
      return sendError(res, 400, 'PERSONAL_DATA', 'Do not put phone numbers or other personal details into the assistant.')
    }

    const { answer, fallback } = assist(question)
    res.json({ answer, fallback, source: 'simulation', disclosure: DISCLOSURE })
  })

  // Put every account back to its starting balance and history
  app.post('/reset', (req, res) => {
    state = freshState()
    res.json({ status: 'reset' })
  })

  // Any other address: a structured "not found" error
  app.use((req, res) => {
    sendError(res, 404, 'NOT_FOUND', `There is no route for ${req.method} ${req.path}.`)
  })

  // A request body that is not valid JSON, or anything else that breaks
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return sendError(res, 400, 'BAD_JSON', 'The request body is not valid JSON.')
    }
    console.error(err)
    sendError(res, 500, 'SERVER_ERROR', 'Something went wrong inside the sandbox.')
  })

  return app
}
