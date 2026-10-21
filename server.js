// Starts the Moringa Pesa Sandbox.
// Practice data only: every account, phone number and balance is made up for this course.
import { createApp } from './sandbox/app.js'

const PORT = process.env.PORT || 3000

createApp().listen(PORT, () => {
  console.log(`Moringa Pesa Sandbox is running on port ${PORT}`)
  console.log('Practice data only. Nothing here is real money.')
})
