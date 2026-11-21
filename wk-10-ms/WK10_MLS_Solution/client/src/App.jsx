import { useEffect, useRef, useState } from 'react'
import './App.css'

const SUGGESTIONS = [
  "What's the weather in Tokyo?",
  'Plan a 5-day budget itinerary for Bali',
  'Best time to visit Switzerland?',
  'Top street food spots in Bangkok',
]

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const threadIdRef = useRef(crypto.randomUUID())
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    const message = text.trim()
    if (!message || loading) return

    setMessages((prev) => [...prev, { role: 'user', text: message }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, threadId: threadIdRef.current }),
      })
      const data = await res.json()
      const reply = res.ok ? data.reply : `Sorry, something went wrong: ${data.error}`
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `Could not reach the server: ${err.message}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  const newChat = () => {
    threadIdRef.current = crypto.randomUUID()
    setMessages([])
    setInput('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div className="app">
      <header className="header">
        <h1>✈️ Travel Agent</h1>
        <button className="new-chat" onClick={newChat}>
          + New chat
        </button>
      </header>

      <main className="chat">
        {messages.length === 0 && (
          <div className="welcome">
            <p className="welcome-title">Where would you like to go?</p>
            <p className="welcome-sub">
              I can search the web for travel info and check the weather anywhere.
            </p>
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="chip" onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.text.split('\n').map((line, j) => (
              <p key={j}>{line}</p>
            ))}
          </div>
        ))}

        {loading && (
          <div className="bubble assistant typing">
            <span /><span /><span />
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      <form className="input-bar" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about destinations, itineraries, weather…"
          disabled={loading}
          autoFocus
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}

export default App
