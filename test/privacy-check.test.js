// Tests for the privacy check (scripts/privacy-check.js).
// They build a small made-up repository in a temporary folder, hide three problems in its
// history, and check that the report shows all three. Every name and number here is made up.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT = fileURLToPath(new URL('../scripts/privacy-check.js', import.meta.url))

// Git settings for the made-up repository only: nothing from this computer is used
const ENV = {
  ...process.env,
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'green-kite',
  GIT_AUTHOR_EMAIL: '1+green-kite@users.noreply.github.com',
  GIT_COMMITTER_NAME: 'green-kite',
  GIT_COMMITTER_EMAIL: '1+green-kite@users.noreply.github.com',
}

let folder
let remote
let codespace

function git(cwd, args, env = ENV) {
  const result = spawnSync('git', args, { cwd, env, encoding: 'utf8' })
  return result.status === 0
}

function commitFile(cwd, name, text, message, env = ENV) {
  writeFileSync(path.join(cwd, name), text)
  git(cwd, ['add', '-A'], env)
  assert.ok(git(cwd, ['commit', '-q', '-m', message], env), `commit "${message}"`)
}

function runCheck(cwd, words = []) {
  const result = spawnSync(process.execPath, [SCRIPT, ...words], { cwd, env: ENV, encoding: 'utf8' })
  return { status: result.status, report: result.stdout }
}

before(() => {
  folder = mkdtempSync(path.join(tmpdir(), 'privacy-check-'))
  const work = path.join(folder, 'work')
  remote = path.join(folder, 'remote.git')
  codespace = path.join(folder, 'codespace')

  git(folder, ['init', '-q', '-b', 'main', work])
  commitFile(work, 'notes.md', 'Our notes\n', 'Start the notes')

  // Problem 1: personal details added, then deleted in the next commit
  commitFile(work, 'notes.md', 'Our notes\nCall Pat on 0700123456\n', 'Add a line')
  commitFile(work, 'notes.md', 'Our notes\n', 'Remove the line')

  // Problem 2: a commit with a full name and a real-looking email, kept only in a closed pull request
  const fullName = { ...ENV, GIT_AUTHOR_NAME: 'Pat Example', GIT_AUTHOR_EMAIL: 'pat.example@school.example' }
  git(work, ['switch', '-q', '-c', 'idea'])
  commitFile(work, 'idea.md', 'Made by Pat Example of Hilltop School\n', 'Try an idea', fullName)
  git(work, ['update-ref', 'refs/pull/1/head', 'idea'])
  git(work, ['switch', '-q', 'main'])
  git(work, ['branch', '-q', '-D', 'idea'])

  // Problem 3: new text typed while resolving a merge conflict
  git(work, ['switch', '-q', '-c', 'side'])
  commitFile(work, 'notes.md', 'Side notes\n', 'Rename on the side branch')
  git(work, ['switch', '-q', 'main'])
  commitFile(work, 'notes.md', 'Main notes\n', 'Rename on main')
  git(work, ['merge', '-q', 'side'])
  commitFile(work, 'notes.md', 'Notes, ask on 0700654321\n', 'Merge the side branch')

  // The remote keeps the pull request; a fresh clone (like a codespace) does not get it
  git(folder, ['clone', '-q', '--mirror', work, remote])
  git(folder, ['clone', '-q', remote, codespace])
})

after(() => rmSync(folder, { recursive: true, force: true }))

test('the privacy check reports a deleted line, a pull request author and text typed in a merge', () => {
  const { status, report } = runCheck(codespace)

  assert.match(report, /Fetched every branch and every pull request/)
  assert.match(report, /Call Pat on 0700123456/)
  assert.match(report, /Pat Example <pat\.example@school\.example>.*LOOK/)
  assert.match(report, /Notes, ask on 0700654321/)
  assert.match(report, /Added lines to read: 2\n/)
  // Finding something is not a failure: people read the report and decide
  assert.equal(status, 0)
})

test('the privacy check also searches for the words you add', () => {
  const { status, report } = runCheck(codespace, ['hilltop school'])

  assert.match(report, /idea\.md: Made by Pat Example of Hilltop School +<-- YOUR WORD/)
  assert.match(report, /Places with your words \(hilltop school\): 1,/)
  assert.match(report, /Added lines to read: 3\n/)
  assert.equal(status, 0)
})

test('the privacy check carries on with a clear note when it cannot fetch', () => {
  git(codespace, ['remote', 'set-url', 'origin', path.join(folder, 'missing.git')])

  const { status, report } = runCheck(codespace)

  assert.match(report, /NOTE: the fetch did not work/)
  assert.match(report, /Call Pat on 0700123456/)
  assert.equal(status, 0)
})
