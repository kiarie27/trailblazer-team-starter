// The privacy check your team runs before the repository goes public. `npm run privacy-check` runs it.
// It reads the whole history: every branch, every pull request and every commit, even deleted lines.
// It only finds things for people to read. It never changes anything, and it never decides for you.
// To search for your own words too, add them: npm run privacy-check Kamau "Hill School"
import { spawnSync } from 'node:child_process'
import { realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// What the search looks for in every added line (capital letters do not matter)
const PATTERNS = ['key', 'token', 'password', '[a-z0-9]@[a-z]', '[0-9]{9}']

// This check's own files name the patterns, so they are left out of the search
const OWN_FILES = ['scripts/privacy-check.js', 'test/privacy-check.test.js']

const MARK = '\u0001'
const END = '\u0002'
const LONGEST_LINE = 200

// Runs one git command and gives back what it printed
function git(args, options = {}) {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 1024,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    ...options,
  })
  const ok = result.status === 0 && !result.error
  return { ok, out: result.stdout ?? '', err: (result.stderr ?? '').trim() }
}

// Turns the words to search for into one pattern
export function buildPattern(extraWords = []) {
  const escaped = extraWords.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return new RegExp([...PATTERNS, ...escaped].join('|'), 'i')
}

// True when an email is one GitHub makes up to keep the real one private
export function isPrivateEmail(email) {
  const lower = email.toLowerCase()
  return lower.endsWith('@users.noreply.github.com') || lower === 'noreply@github.com'
}

// Reads the output of `git log -p --cc` and gives every added line that matches the pattern
export function findAddedLines(logText, pattern) {
  const found = []
  let commit = ''
  let file = ''
  let inFileHeader = false
  let columns = 1

  for (const line of logText.split('\n')) {
    if (line.startsWith(MARK)) {
      commit = line.slice(1)
      file = ''
      continue
    }
    if (line.startsWith('diff --')) {
      inFileHeader = true
      file = ''
      continue
    }
    if (inFileHeader) {
      if (line.startsWith('@@')) {
        // A merge shows one column of + and - signs for each parent
        columns = line.indexOf(' ') - 1
        inFileHeader = false
      } else if (line.startsWith('--- a/') && !file) {
        file = line.slice(6)
      } else if (line.startsWith('+++ b/')) {
        file = line.slice(6)
        if (!OWN_FILES.includes(file) && pattern.test(file)) {
          found.push({ commit, file, text: '(the file name)' })
        }
      }
      continue
    }
    if (line.startsWith('@@')) {
      columns = line.indexOf(' ') - 1
      continue
    }
    const signs = line.slice(0, columns)
    const text = line.slice(columns)
    if (/^\++$/.test(signs) && !OWN_FILES.includes(file) && pattern.test(text)) {
      found.push({ commit, file, text: text.trim().slice(0, LONGEST_LINE) })
    }
  }
  return found
}

// Step 1: bring in every branch and every pull request, when there is somewhere to fetch from
function fetchEverything(print) {
  const remotes = git(['remote']).out.split('\n').filter(Boolean)
  if (remotes.length === 0) {
    print('  This repository has no remote, so there is nothing to fetch. Carrying on with what is here.')
    return false
  }
  const remote = remotes.includes('origin') ? 'origin' : remotes[0]
  const shallow = git(['rev-parse', '--is-shallow-repository']).out.trim() === 'true'
  const branches = git(['fetch', '--all', '--quiet', ...(shallow ? ['--unshallow'] : [])], { timeout: 120000 })
  const pulls = git(['fetch', '--quiet', remote, '+refs/pull/*/head:refs/remotes/' + remote + '/pr/*'], {
    timeout: 120000,
  })
  if (branches.ok && pulls.ok) {
    print('  Fetched every branch and every pull request, open or closed.')
    return true
  }
  print('  NOTE: the fetch did not work, so this check reads only what is already in this codespace.')
  print('  It may miss branches and pull requests. Check your connection and run it again.')
  const reason = (branches.ok ? pulls.err : branches.err).split('\n')[0]
  if (reason) {
    print('  Git said: ' + reason)
  }
  return false
}

// Runs the whole check and prints the report. Gives back the numbers for the summary.
export function runPrivacyCheck(extraWords = [], print = console.log) {
  if (!git(['rev-parse', '--git-dir']).ok) {
    print('This folder is not a Git repository, so there is no history to check.')
    return null
  }
  const pattern = buildPattern(extraWords)
  const hasYourWords = (text) => extraWords.some((word) => text.toLowerCase().includes(word.toLowerCase()))

  print('Privacy check: every branch, every pull request, every commit')
  print('')
  print('Step 1 of 4. Fetch')
  const fetched = fetchEverything(print)

  // One line for each commit: short id, author, committer, then the message
  const format = ['%h', '%an <%ae>', '%cn <%ce>', '%s', '%b'].join(MARK) + END
  const commits = git(['log', '--all', '--format=' + format]).out
    .split(END)
    .map((entry) => entry.replace(/^\n/, '').split(MARK))
    .filter((parts) => parts.length >= 4)
    .map(([id, author, committer, subject, body = '']) => ({ id, author, committer, subject, body: body.trim() }))

  print('')
  const people = [...new Set(commits.flatMap((commit) => [commit.author, commit.committer]))].sort()
  print('Step 2 of 4. Authors and committers (' + people.length + ')')
  print('  Each name should be a username or a first name.')
  let peopleToLookAt = 0
  let yourWordPlaces = 0
  for (const person of people) {
    const email = person.slice(person.lastIndexOf('<') + 1, -1)
    const notes = []
    if (!isPrivateEmail(email)) {
      notes.push('not a GitHub noreply email')
    }
    if (hasYourWords(person)) {
      notes.push('has one of your words')
      yourWordPlaces += 1
    }
    if (notes.length > 0) {
      peopleToLookAt += 1
    }
    print('  ' + person + (notes.length > 0 ? '   <-- LOOK: ' + notes.join(', ') : ''))
  }

  print('')
  print('Step 3 of 4. Commit messages (' + commits.length + ')')
  print('  Read each one. No names or personal details should be in them.')
  let messagesToLookAt = 0
  for (const commit of commits) {
    const message = commit.body ? commit.subject + '\n' + commit.body : commit.subject
    const yours = hasYourWords(message)
    const look = yours || pattern.test(message)
    if (look) {
      messagesToLookAt += 1
    }
    if (yours) {
      yourWordPlaces += 1
    }
    const note = yours ? '   <-- LOOK: has one of your words' : look ? '   <-- LOOK' : ''
    print('  ' + commit.id + ' ' + message.split('\n').join('\n          ') + note)
  }

  print('')
  const searchedFor =
    'a key, token or password, an email address, a long number' +
    (extraWords.length > 0 ? ', or your words (' + extraWords.join(', ') + ')' : '')
  print('Step 4 of 4. Lines added in any commit, even if deleted later, that mention')
  print('  ' + searchedFor)
  const log = git(['log', '--all', '-p', '--cc', '--no-color', '--no-ext-diff', '--no-textconv', '--format=' + MARK + '%h %s'])
  const lines = findAddedLines(log.out, pattern)
  let lastCommit = ''
  for (const line of lines) {
    if (line.commit !== lastCommit) {
      print('')
      print('  Commit ' + line.commit)
      lastCommit = line.commit
    }
    const yours = hasYourWords(line.file + ' ' + line.text)
    if (yours) {
      yourWordPlaces += 1
    }
    print('    ' + line.file + ': ' + line.text + (yours ? '   <-- YOUR WORD' : ''))
  }
  if (lines.length === 0) {
    print('  None found.')
  }

  print('')
  print('Summary')
  print('  Fetched first: ' + (fetched ? 'yes' : 'NO, so branches or pull requests may be missing'))
  print('  Authors and committers: ' + people.length + ' (' + peopleToLookAt + ' marked LOOK)')
  print('  Commit messages: ' + commits.length + ' (' + messagesToLookAt + ' marked LOOK)')
  print('  Added lines to read: ' + lines.length)
  if (extraWords.length === 0) {
    print('  No words of your own were searched. To add them: npm run privacy-check Surname "School name"')
  } else {
    print('  Places with your words (' + extraWords.join(', ') + '): ' + yourWordPlaces + ', each one marked')
  }
  print('')
  print('This check finds things for you to read. It does not decide anything.')
  print('Lines that came with the starter are fine. Anything else? Stop and tell your TM.')
  print('It cannot read pictures, issues or pull request text. Read those on github.com.')
  return {
    fetched,
    people: people.length,
    peopleToLookAt,
    commits: commits.length,
    messagesToLookAt,
    lines: lines.length,
    yourWordPlaces,
  }
}

// Runs only when this file is started directly, not when a test imports it
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  const result = runPrivacyCheck(process.argv.slice(2).filter((word) => word.trim() !== ''))
  // Finding something is never an error. Only "this is not a repository" is.
  process.exitCode = result === null ? 1 : 0
}
