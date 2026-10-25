import { useState } from 'react'

const API_BASE = 'http://localhost:8080/api'

function App() {
const [token, setToken] = useState(localStorage.getItem('token') || '')
const [username, setUsername] = useState('')
const [password, setPassword] = useState('')
const [authMode, setAuthMode] = useState('login')
const [authError, setAuthError] = useState('')

const [role, setRole] = useState('Backend Developer')
const [experienceLevel, setExperienceLevel] = useState('1-3 years')
const [difficulty, setDifficulty] = useState('Medium')
const [questionCount, setQuestionCount] = useState(3)

const [questionSet, setQuestionSet] = useState(null)
const [view, setView] = useState('generate')

const [history, setHistory] = useState([])
const [loadingHistory, setLoadingHistory] = useState(false)
const [historyError, setHistoryError] = useState('')

const [loadingGenerate, setLoadingGenerate] = useState(false)
const [generateError, setGenerateError] = useState('')

const [answers, setAnswers] = useState({})
const [feedbacks, setFeedbacks] = useState({})
const [evaluatingId, setEvaluatingId] = useState(null)

async function handleAuth(e) {
e.preventDefault()
setAuthError('')

try {
  const res = await fetch(`${API_BASE}/auth/${authMode}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Authentication failed')
  }

  const data = await res.json()

  setToken(data.token)
  localStorage.setItem('token', data.token)

  setUsername('')
  setPassword('')
} catch (err) {
  setAuthError(err.message)
}

}

function logout() {
setToken('')
localStorage.removeItem('token')

setQuestionSet(null)
setHistory([])
setAnswers({})
setFeedbacks({})
setView('generate')

}

async function handleGenerate(e) {
e.preventDefault()

setLoadingGenerate(true)
setGenerateError('')
setQuestionSet(null)
setAnswers({})
setFeedbacks({})

try {
  const res = await fetch(`${API_BASE}/questions/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      role,
      experienceLevel,
      difficulty,
      questionCount: Number(questionCount)
    })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to generate questions')
  }

  const data = await res.json()
  setQuestionSet(data)
  setView('generate')
} catch (err) {
  setGenerateError(err.message)
} finally {
  setLoadingGenerate(false)
}

}

async function handleViewHistory() {
setView('history')
setLoadingHistory(true)
setHistoryError('')

try {
  const res = await fetch(`${API_BASE}/questions/history`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      err.error || 'Failed to load interview history'
    )
  }

  const data = await res.json()

  if (!Array.isArray(data)) {
    throw new Error('Unexpected history response from server')
  }

  setHistory(data)
} catch (err) {
  setHistoryError(err.message)
} finally {
  setLoadingHistory(false)
}

}

async function handleEvaluate(questionId) {
setEvaluatingId(questionId)

try {
  const res = await fetch(
    `${API_BASE}/questions/${questionId}/evaluate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        userAnswer: answers[questionId] || ''
      })
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to evaluate answer')
  }

  const data = await res.json()

  setFeedbacks(prev => ({
    ...prev,
    [questionId]: data
  }))
} catch (err) {
  setFeedbacks(prev => ({
    ...prev,
    [questionId]: {
      feedback: 'Error: ' + err.message
    }
  }))
} finally {
  setEvaluatingId(null)
}

}

const styles = {
page: {
fontFamily: 'system-ui, sans-serif',
maxWidth: 700,
margin: '40px auto',
padding: '0 20px'
},
card: {
border: '1px solid #ddd',
borderRadius: 8,
padding: 20,
marginBottom: 20
},
input: {
display: 'block',
width: '100%',
padding: 8,
marginBottom: 10,
boxSizing: 'border-box'
},
button: {
padding: '8px 16px',
cursor: 'pointer'
},
questionCard: {
border: '1px solid #ccc',
borderRadius: 6,
padding: 15,
marginBottom: 12
},
error: {
color: 'crimson'
},
muted: {
color: '#666',
fontSize: 14
}
}

if (!token) {
return (
<div style={styles.page}>
<h1>AI Interview Question Generator</h1>

    <div style={styles.card}>
      <h2>{authMode === 'login' ? 'Log in' : 'Register'}</h2>

      <form onSubmit={handleAuth}>
        <input
          style={styles.input}
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />

        <input
          style={styles.input}
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <button style={styles.button} type="submit">
          {authMode === 'login' ? 'Log in' : 'Register'}
        </button>
      </form>

      {authError && (
        <p style={styles.error}>{authError}</p>
      )}

      <p>
        <button
          style={styles.button}
          onClick={() =>
            setAuthMode(
              authMode === 'login' ? 'register' : 'login'
            )
          }
        >
          Switch to {authMode === 'login' ? 'Register' : 'Log in'}
        </button>
      </p>
    </div>
  </div>
)

}

return (
<div style={styles.page}>
<div
style={{
display: 'flex',
justifyContent: 'space-between',
alignItems: 'center',
gap: 10,
flexWrap: 'wrap'
}}
>
<h1>AI Interview Question Generator</h1>

    <div
      style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap'
      }}
    >
      <button
        style={styles.button}
        onClick={() => setView('generate')}
      >
        Generate Questions
      </button>

      <button
        style={styles.button}
        onClick={handleViewHistory}
      >
        Interview History
      </button>

      <button
        style={styles.button}
        onClick={logout}
      >
        Log out
      </button>
    </div>
  </div>

  {/* Question generation form */}
  {view === 'generate' && (
    <div style={styles.card}>
      <h2>Generate Questions</h2>

      <form onSubmit={handleGenerate}>
        <label>Role</label>
        <input
          style={styles.input}
          value={role}
          onChange={e => setRole(e.target.value)}
          required
        />

        <label>Experience Level</label>
        <input
          style={styles.input}
          value={experienceLevel}
          onChange={e => setExperienceLevel(e.target.value)}
          required
        />

        <label>Difficulty</label>
        <select
          style={styles.input}
          value={difficulty}
          onChange={e => setDifficulty(e.target.value)}
        >
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>

        <label>Number of Questions</label>
        <input
          style={styles.input}
          type="number"
          min="1"
          max="10"
          value={questionCount}
          onChange={e => setQuestionCount(e.target.value)}
          required
        />

        <button
          style={styles.button}
          type="submit"
          disabled={loadingGenerate}
        >
          {loadingGenerate
            ? 'Generating...'
            : 'Generate Questions'}
        </button>
      </form>

      {generateError && (
        <p style={styles.error}>{generateError}</p>
      )}
    </div>
  )}

  {/* Generated questions and answer evaluation */}
  {view === 'generate' && questionSet && (
    <div>
      <h2>
        Questions for {questionSet.role} ({questionSet.difficulty})
      </h2>

      {questionSet.questions?.map(q => (
        <div key={q.id} style={styles.questionCard}>
          <p>
            <strong>[{q.category}]</strong> {q.question}
          </p>

          <textarea
            style={{ ...styles.input, minHeight: 80 }}
            placeholder="Type your answer..."
            value={answers[q.id] || ''}
            onChange={e =>
              setAnswers(prev => ({
                ...prev,
                [q.id]: e.target.value
              }))
            }
          />

          <button
            style={styles.button}
            onClick={() => handleEvaluate(q.id)}
            disabled={evaluatingId === q.id}
          >
            {evaluatingId === q.id
              ? 'Evaluating...'
              : 'Submit Answer'}
          </button>

          {feedbacks[q.id] && (
            <div
              style={{
                marginTop: 10,
                padding: 10,
                background: '#f5f5f5',
                borderRadius: 4
              }}
            >
              {feedbacks[q.id].score !== undefined && (
                <p>
                  <strong>Score:</strong>{' '}
                  {feedbacks[q.id].score}/10
                </p>
              )}

              <p>
                <strong>Feedback:</strong>{' '}
                {feedbacks[q.id].feedback}
              </p>

              {feedbacks[q.id].missedPoints?.length > 0 && (
                <div>
                  <strong>Missed points:</strong>
                  <ul>
                    {feedbacks[q.id].missedPoints.map((mp, i) => (
                      <li key={i}>{mp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )}

  {/* Interview history */}
  {view === 'history' && (
    <div>
      <h2>Interview History</h2>

      {loadingHistory && (
        <p>Loading interview history...</p>
      )}

      {historyError && (
        <p style={styles.error}>{historyError}</p>
      )}

      {!loadingHistory &&
        !historyError &&
        history.length === 0 && (
          <div style={styles.card}>
            <p>No interview history found.</p>
            <p style={styles.muted}>
              Generate some interview questions first. Your saved
              question sets will appear here.
            </p>
            <button
              style={styles.button}
              onClick={() => setView('generate')}
            >
              Generate Questions
            </button>
          </div>
        )}

      {!loadingHistory &&
        !historyError &&
        history.map(item => (
          <div key={item.id} style={styles.card}>
            <h3>{item.role || 'Interview'}</h3>

            <p>
              <strong>Experience:</strong>{' '}
              {item.experienceLevel || 'Not specified'}
            </p>

            <p>
              <strong>Difficulty:</strong>{' '}
              {item.difficulty || 'Not specified'}
            </p>

            <p>
              <strong>Created:</strong>{' '}
              {item.createdAt
                ? new Date(item.createdAt).toLocaleString()
                : 'Unknown'}
            </p>

            <p>
              <strong>Number of questions:</strong>{' '}
              {item.questions?.length ?? 0}
            </p>

            {item.questions?.length > 0 && (
              <details>
                <summary style={{ cursor: 'pointer' }}>
                  View Questions
                </summary>

                <ol>
                  {item.questions.map((q, index) => (
                    <li key={q.id ?? index} style={{ marginTop: 8 }}>
                      {q.question}
                    </li>
                  ))}
                </ol>
              </details>
            )}
          </div>
        ))}

      {!loadingHistory && historyError && (
        <button
          style={styles.button}
          onClick={handleViewHistory}
        >
          Try Again
        </button>
      )}
    </div>
  )}
</div>

)
}

export default App