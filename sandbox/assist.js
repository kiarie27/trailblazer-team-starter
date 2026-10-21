// A practice stand-in for an AI model. It is NOT a real AI.
// It picks a prepared answer by looking for keywords in the question.
//
// It is here so your product can follow the safe pattern for an AI feature:
// - the browser asks YOUR server, and only your server would ever talk to a model,
//   so no secret key ever sits in the browser or in your repository
// - every answer is labelled, so users know where it came from
// - there is a fallback answer when the "model" cannot help
// - there is a way to make it fail, so you can build and test the error state

const preparedAnswers = [
  {
    keywords: ['balance', 'how much'],
    answer: 'To check a balance, type the account phone number in the Check balance card and press the button.',
  },
  {
    keywords: ['send', 'transfer', 'pay'],
    answer: 'To send money, fill in who it is from, who it is to and the amount, then press Send money. The sandbox checks the request before any money moves.',
  },
  {
    keywords: ['fee', 'charge', 'cost'],
    answer: 'This sandbox does not charge fees. A real service must show its fees before you confirm a payment.',
  },
  {
    keywords: ['statement', 'history', 'transactions'],
    answer: 'The mini statement shows the last five transactions for an account, newest first.',
  },
]

const FALLBACK_ANSWER = 'Sorry, I cannot help with that yet. Try asking about balances, sending money, fees or statements.'

export const DISCLOSURE = 'This answer comes from a practice simulation, not a real AI model.'

export function assist(question) {
  const text = question.toLowerCase()
  const match = preparedAnswers.find((item) => item.keywords.some((word) => text.includes(word)))
  if (match) {
    return { answer: match.answer, fallback: false }
  }
  return { answer: FALLBACK_ANSWER, fallback: true }
}
