// The starting data for the sandbox.
// Everything here is made up for this course: the names, the phone numbers,
// the balances and the transactions. No real money moves, and these numbers
// are not meant to belong to anyone.
//
// Each transaction is from the account owner's point of view:
// "sent" means money went out, "received" means money came in.
// Transactions are listed newest first.

export const seedAccounts = [
  {
    phone: '0700000001',
    name: 'Asha',
    balanceKsh: 2500,
    transactions: [
      { id: 'T0006', type: 'received', otherParty: '0700000003', amountKsh: 400, balanceAfterKsh: 2500, at: '2026-11-03T11:20:00+03:00' },
      { id: 'T0005', type: 'sent', otherParty: '0700000002', amountKsh: 150, balanceAfterKsh: 2100, at: '2026-11-03T08:05:00+03:00' },
      { id: 'T0004', type: 'sent', otherParty: '0700000004', amountKsh: 250, balanceAfterKsh: 2250, at: '2026-11-02T17:40:00+03:00' },
      { id: 'T0003', type: 'received', otherParty: '0700000005', amountKsh: 1000, balanceAfterKsh: 2500, at: '2026-11-02T10:15:00+03:00' },
      { id: 'T0002', type: 'sent', otherParty: '0700000002', amountKsh: 300, balanceAfterKsh: 1500, at: '2026-11-01T16:30:00+03:00' },
      { id: 'T0001', type: 'received', otherParty: '0700000003', amountKsh: 800, balanceAfterKsh: 1800, at: '2026-11-01T09:00:00+03:00' },
    ],
  },
  {
    phone: '0700000002',
    name: 'Baraka',
    balanceKsh: 1200,
    transactions: [
      { id: 'T0005', type: 'received', otherParty: '0700000001', amountKsh: 150, balanceAfterKsh: 1200, at: '2026-11-03T08:05:00+03:00' },
      { id: 'T0002', type: 'received', otherParty: '0700000001', amountKsh: 300, balanceAfterKsh: 1050, at: '2026-11-01T16:30:00+03:00' },
    ],
  },
  {
    phone: '0700000003',
    name: 'Chebet',
    balanceKsh: 800,
    transactions: [
      { id: 'T0006', type: 'sent', otherParty: '0700000001', amountKsh: 400, balanceAfterKsh: 800, at: '2026-11-03T11:20:00+03:00' },
      { id: 'T0001', type: 'sent', otherParty: '0700000001', amountKsh: 800, balanceAfterKsh: 1200, at: '2026-11-01T09:00:00+03:00' },
    ],
  },
  {
    phone: '0700000004',
    name: 'Daudi',
    balanceKsh: 300,
    transactions: [
      { id: 'T0004', type: 'received', otherParty: '0700000001', amountKsh: 250, balanceAfterKsh: 300, at: '2026-11-02T17:40:00+03:00' },
    ],
  },
  {
    phone: '0700000005',
    name: 'Eunice',
    balanceKsh: 4000,
    transactions: [
      { id: 'T0003', type: 'sent', otherParty: '0700000001', amountKsh: 1000, balanceAfterKsh: 4000, at: '2026-11-02T10:15:00+03:00' },
    ],
  },
  {
    // A brand-new account with no history: useful for testing the empty state
    phone: '0700000006',
    name: 'Faraji',
    balanceKsh: 0,
    transactions: [],
  },
]
