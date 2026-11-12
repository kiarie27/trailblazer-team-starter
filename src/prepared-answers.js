// Prepared answers. Your product never calls an AI model while it runs.
// Instead it looks up answers Claude wrote for your team's prompts, checked by
// your team and saved in data/prepared-answers.json. findAnswer always answers in one of two shapes:
//   { ok: true, data: { answer, checkedOn } }
//   { ok: false, error: { code, message } }
// Codes: EMPTY_QUESTION, BLOCKED_TOPIC, NO_MATCH

// Words that mean the question holds something private. Add your own.
const BLOCKED_WORDS = ['password', 'passcode', 'id number', 'home address']

// A phone number: 9 or more digits in a row, once spaces and dashes are taken out
function hasPhoneNumber(text) {
  return /\d{9,}/.test(text.replace(/[\s-]/g, ''))
}

// An email address: something@something.something
const EMAIL_ADDRESS = /\S+@\S+\.\S+/

function fail(code, message) {
  return { ok: false, error: { code, message } }
}

// Turns "What's 10mm of RAIN?" into " what s 10mm of rain ", so we can look for whole words
function toWords(text) {
  const words = text.toLowerCase().match(/[a-z0-9]+/g) || []
  return ` ${words.join(' ')} `
}

// question: what the user typed. answers: the "answers" list from data/prepared-answers.json
export function findAnswer(question, answers) {
  // Rule 1: there must be a question
  if (typeof question !== 'string' || question.trim() === '') {
    return fail('EMPTY_QUESTION', 'Type a question first.')
  }

  // Rule 2: no personal details in the question
  const words = toWords(question)
  const hasBlockedWord = BLOCKED_WORDS.some((word) => words.includes(` ${word} `))
  if (hasPhoneNumber(question) || EMAIL_ADDRESS.test(question) || hasBlockedWord) {
    return fail(
      'BLOCKED_TOPIC',
      'Please do not type personal details such as phone numbers, email addresses or passwords. Ask again without them.',
    )
  }

  // Find the answer whose keywords appear most often in the question
  let best = null
  let bestCount = 0
  for (const entry of answers) {
    const count = entry.keywords.filter((keyword) => words.includes(` ${keyword.toLowerCase()} `)).length
    if (count > bestCount) {
      best = entry
      bestCount = count
    }
  }

  if (!best) {
    return fail('NO_MATCH', 'Sorry, we do not have a checked answer for that question yet.')
  }

  return { ok: true, data: { answer: best.answer, checkedOn: best.checkedOn } }
}
