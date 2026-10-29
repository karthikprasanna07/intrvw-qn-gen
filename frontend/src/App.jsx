import { useState } from 'react'
import './App.css'

const API_BASE = 'http://localhost:8080/api'

function App() {
  const [token, setToken] = useState(
    localStorage.getItem('token') || ''
  )

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

        throw new Error(
          err.error || 'Failed to evaluate answer'
        )
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

  // Login and registration screen
  if (!token) {
    return (
      <main className="app-page auth-page">
        <div className="auth-container">
          <header className="auth-brand">
            <h1 className="app-title">
              AI Interview Question Generator
            </h1>

            <p className="app-subtitle">
              Prepare for interviews with role-specific questions
              and personalised feedback.
            </p>
          </header>

          <section className="panel auth-panel">
            <h2 className="panel-title">
              {authMode === 'login'
                ? 'Welcome back'
                : 'Create your account'}
            </h2>

            <p className="section-description">
              {authMode === 'login'
                ? 'Log in to continue your interview preparation.'
                : 'Register to start practising for your interviews.'}
            </p>

            <form className="auth-form" onSubmit={handleAuth}>
              <div className="form-field">
                <label className="form-label" htmlFor="username">
                  Username
                </label>

                <input
                  className="form-input"
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="password">
                  Password
                </label>

                <input
                  className="form-input"
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={
                    authMode === 'login'
                      ? 'current-password'
                      : 'new-password'
                  }
                  required
                />
              </div>

              {authError && (
                <p className="error-message">{authError}</p>
              )}

              <button
                className="button button-primary auth-submit"
                type="submit"
              >
                {authMode === 'login'
                  ? 'Log in'
                  : 'Create account'}
              </button>
            </form>

            <p className="auth-switch">
              {authMode === 'login'
                ? "Don't have an account?"
                : 'Already have an account?'}

              {' '}

              <button
                className="text-button"
                type="button"
                onClick={() => {
                  setAuthMode(
                    authMode === 'login' ? 'register' : 'login'
                  )
                  setAuthError('')
                }}
              >
                {authMode === 'login' ? 'Register' : 'Log in'}
              </button>
            </p>
          </section>
        </div>
      </main>
    )
  }

  // Main application
  return (
    <main className="app-page">
      <header className="app-header">
        <div className="app-brand">
          <h1 className="app-title">
            AI Interview Question Generator
          </h1>

          <p className="app-subtitle">
            Practise interview questions and improve your answers.
          </p>
        </div>

        <nav className="app-navigation">
          <button
            className={`button ${
              view === 'generate' ? 'button-primary' : ''
            }`}
            onClick={() => setView('generate')}
          >
            Generate Questions
          </button>

          <button
            className={`button ${
              view === 'history' ? 'button-primary' : ''
            }`}
            onClick={handleViewHistory}
          >
            Interview History
          </button>

          <button className="button" onClick={logout}>
            Log out
          </button>
        </nav>
      </header>

      {/* Question generation form */}
      {view === 'generate' && (
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2 className="panel-title">
                Generate interview questions
              </h2>

              <p className="section-description">
                Choose your target role and preferences to create
                a practice session.
              </p>
            </div>
          </div>

          <form onSubmit={handleGenerate}>
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label" htmlFor="role">
                  Target role
                </label>

                <input
                  className="form-input"
                  id="role"
                  type="text"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="e.g. Java Developer"
                  required
                />
              </div>

              <div className="form-field">
                <label
                  className="form-label"
                  htmlFor="experienceLevel"
                >
                  Experience level
                </label>

                <select
                  className="form-input"
                  id="experienceLevel"
                  value={experienceLevel}
                  onChange={e => setExperienceLevel(e.target.value)}
                >
                  <option value="Fresher">Fresher</option>
                  <option value="0-1 years">0-1 years</option>
                  <option value="1-3 years">1-3 years</option>
                  <option value="3-5 years">3-5 years</option>
                  <option value="5+ years">5+ years</option>
                </select>
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="difficulty">
                  Difficulty
                </label>

                <select
                  className="form-input"
                  id="difficulty"
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>

              <div className="form-field">
                <label
                  className="form-label"
                  htmlFor="questionCount"
                >
                  Number of questions
                </label>

                <select
                  className="form-input"
                  id="questionCount"
                  value={questionCount}
                  onChange={e => setQuestionCount(e.target.value)}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(count => (
                    <option key={count} value={count}>
                      {count} {count === 1 ? 'question' : 'questions'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button
                className="button button-primary"
                type="submit"
                disabled={loadingGenerate}
              >
                {loadingGenerate
                  ? 'Generating questions...'
                  : 'Generate Questions'}
              </button>
            </div>
          </form>

          {generateError && (
            <p className="error-message">{generateError}</p>
          )}
        </section>
      )}

      {/* Generated questions and answer evaluation */}
      {view === 'generate' && questionSet && (
        <section className="question-section">
          <div className="section-heading">
            <div>
              <h2 className="panel-title">
                Your interview questions
              </h2>

              <p className="section-description">
                {questionSet.role} · {questionSet.difficulty} difficulty
              </p>
            </div>

            <span className="question-category">
              {questionSet.questions?.length ?? 0} questions
            </span>
          </div>

          <div className="question-list">
            {questionSet.questions?.map((q, index) => (
              <article className="question-card" key={q.id}>
                <div className="question-topline">
                  <span className="question-number">
                    Question {index + 1}
                  </span>

                  {q.category && (
                    <span className="question-category">
                      {q.category}
                    </span>
                  )}
                </div>

                <p className="question-text">{q.question}</p>

                <div className="form-field">
                  <label
                    className="form-label"
                    htmlFor={`answer-${q.id}`}
                  >
                    Your answer
                  </label>

                  <textarea
                    className="form-input answer-input"
                    id={`answer-${q.id}`}
                    placeholder="Write your answer here..."
                    value={answers[q.id] || ''}
                    onChange={e =>
                      setAnswers(prev => ({
                        ...prev,
                        [q.id]: e.target.value
                      }))
                    }
                  />
                </div>

                <div className="form-actions">
                  <button
                    className="button button-primary"
                    onClick={() => handleEvaluate(q.id)}
                    disabled={
                      evaluatingId === q.id ||
                      !(answers[q.id] || '').trim()
                    }
                  >
                    {evaluatingId === q.id
                      ? 'Evaluating answer...'
                      : 'Evaluate Answer'}
                  </button>
                </div>

                {feedbacks[q.id] && (
                  <div className="feedback-panel">
                    <h3 className="feedback-heading">
                      Evaluation results
                    </h3>

                    {feedbacks[q.id].score !== undefined && (
                      <p className="score-text">
                        Score: {feedbacks[q.id].score}/10
                      </p>
                    )}

                    <p className="feedback-text">
                      <strong>Feedback:</strong>{' '}
                      {feedbacks[q.id].feedback}
                    </p>

                    {feedbacks[q.id].missedPoints?.length > 0 && (
                      <div className="missed-points">
                        <p className="form-label">Points to improve</p>

                        <ul>
                          {feedbacks[q.id].missedPoints.map(
                            (point, i) => (
                              <li key={i}>{point}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Interview history */}
      {view === 'history' && (
        <section>
          <div className="section-heading">
            <div>
              <h2 className="panel-title">Interview history</h2>

              <p className="section-description">
                Review your previously generated interview sessions.
              </p>
            </div>
          </div>

          {loadingHistory && (
            <div className="panel">
              <p className="muted-text">
                Loading interview history...
              </p>
            </div>
          )}

          {historyError && (
            <div className="panel">
              <p className="error-message">{historyError}</p>

              <button
                className="button button-primary"
                onClick={handleViewHistory}
              >
                Try Again
              </button>
            </div>
          )}

          {!loadingHistory &&
            !historyError &&
            history.length === 0 && (
              <div className="panel empty-state">
                <h3>No interview sessions yet</h3>

                <p className="muted-text">
                  Generate your first set of questions. Your saved
                  sessions will appear here.
                </p>

                <button
                  className="button button-primary"
                  onClick={() => setView('generate')}
                >
                  Generate Questions
                </button>
              </div>
            )}

          {!loadingHistory && !historyError && history.length > 0 && (
            <div className="history-list">
              {history.map(item => (
                <article className="history-card" key={item.id}>
                  <div className="history-details">
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
                      <strong>Questions:</strong>{' '}
                      {item.questions?.length ?? 0}
                    </p>
                  </div>

                  {item.questions?.length > 0 && (
                    <details className="history-questions">
                      <summary>View questions</summary>

                      <ol>
                        {item.questions.map((q, index) => (
                          <li key={q.id ?? index}>
                            {q.question}
                          </li>
                        ))}
                      </ol>
                    </details>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  )
}

export default App