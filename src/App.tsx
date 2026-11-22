import { useState } from 'react'
import './App.css'

type Message = { text: string; mine: boolean; time: string }
type Chat = { id: number; name: string; avatar: string; messages: Message[] }

const starter: Chat[] = [
  { id: 1, name: 'پشتیبانی NOVA', avatar: 'N', messages: [
    { text: 'به NOVA Messenger خوش اومدی! 👋', mine: false, time: '14:30' },
    { text: 'این یک گفت‌وگوی آزمایشی است.', mine: false, time: '14:31' }
  ]},
  { id: 2, name: 'گفتگوی شخصی', avatar: 'A', messages: [
    { text: 'اینجا می‌تونی پیام‌هات رو تست کنی.', mine: false, time: 'دیروز' }
  ]},
  { id: 3, name: 'گروه دوستان', avatar: 'G', messages: [
    { text: 'به گروه خوش اومدی!', mine: false, time: 'دیروز' }
  ]}
]

export default function App() {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [logged, setLogged] = useState(localStorage.getItem('nova_demo_login') === 'yes')
  const [chats, setChats] = useState<Chat[]>(() => {
    try { return JSON.parse(localStorage.getItem('nova_demo_chats') || 'null') || starter }
    catch { return starter }
  })
  const [selected, setSelected] = useState(1)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [mobileChat, setMobileChat] = useState(false)

  const active = chats.find(c => c.id === selected) || chats[0]
  const saveChats = (next: Chat[]) => {
    setChats(next)
    localStorage.setItem('nova_demo_chats', JSON.stringify(next))
  }

  function sendMessage() {
    if (!message.trim() || !active) return
    const next = chats.map(c => c.id === active.id
      ? { ...c, messages: [...c.messages, { text: message.trim(), mine: true, time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) }] }
      : c)
    saveChats(next)
    setMessage('')
  }

  function login() {
    if (phone.replace(/\D/g, '').length < 8) {
      alert('شماره موبایل معتبر وارد کن.')
      return
    }
    setStep('code')
  }

  function verify() {
    if (code !== '1234') {
      alert('کد آزمایشی اشتباه است. کد تست: 1234')
      return
    }
    localStorage.setItem('nova_demo_login', 'yes')
    localStorage.setItem('nova_demo_phone', phone)
    setLogged(true)
  }

  if (!logged) return (
    <main className="login-page">
      <div className="login-box">
        <div className="brand-logo">N</div>
        <div className="brand-name">NOVA<span> MESSENGER</span></div>
        <h1>{step === 'phone' ? 'به نوا خوش اومدی' : 'تأیید شماره موبایل'}</h1>
        <p>{step === 'phone' ? 'برای ورود شماره موبایلت رو وارد کن.' : 'کد آزمایشی را وارد کن: 1234'}</p>
        {step === 'phone' ? (
          <input dir="ltr" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+98 912 000 0000" type="tel" />
        ) : (
          <input dir="ltr" value={code} onChange={e => setCode(e.target.value)} placeholder="کد ۴ رقمی" inputMode="numeric" maxLength={4} />
        )}
        <button className="gold-button" onClick={step === 'phone' ? login : verify}>
          {step === 'phone' ? 'دریافت کد آزمایشی' : 'ورود به NOVA'}
        </button>
        {step === 'code' && <button className="back-button" onClick={() => setStep('phone')}>بازگشت</button>}
        <small>نسخه آزمایشی · ارسال پیامک واقعی فعال نیست</small>
      </div>
    </main>
  )

  return (
    <main className="messenger">
      <aside className={`sidebar ${mobileChat ? 'hide-mobile' : ''}`}>
        <header className="side-header">
          <div className="brand-mini"><b>N</b> NOVA</div>
          <button className="icon-button" title="پروفایل" onClick={() => alert('شماره: ' + (localStorage.getItem('nova_demo_phone') || ''))}>👤</button>
        </header>
        <div className="search-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جست‌وجوی گفتگو..." />
        </div>
        <div className="chat-heading">
          <span>گفتگوها</span>
          <button onClick={() => {
            const name = prompt('نام گفتگوی جدید را وارد کن:')
            if (name?.trim()) {
              const id = Date.now()
              saveChats([...chats, { id, name: name.trim(), avatar: name.trim()[0], messages: [] }])
              setSelected(id)
              setMobileChat(true)
            }
          }}>＋</button>
        </div>
        <div className="chat-list">
          {chats.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map(chat => {
            const last = chat.messages[chat.messages.length - 1]
            return (
              <button key={chat.id} className={`chat-item ${selected === chat.id ? 'selected' : ''}`} onClick={() => { setSelected(chat.id); setMobileChat(true) }}>
                <div className="avatar">{chat.avatar}</div>
                <div className="chat-info">
                  <strong>{chat.name}</strong>
                  <span>{last?.text || 'هنوز پیامی وجود ندارد'}</span>
                </div>
                <small>{last?.time || ''}</small>
              </button>
            )
          })}
        </div>
        <footer className="side-footer">
          <span>✦ NOVA Messenger</span>
          <button onClick={() => { localStorage.removeItem('nova_demo_login'); setLogged(false); setStep('phone') }}>خروج</button>
        </footer>
      </aside>

      <section className={`conversation ${mobileChat ? 'show-mobile' : ''}`}>
        {active ? <>
          <header className="conversation-header">
            <button className="mobile-back" onClick={() => setMobileChat(false)}>→</button>
            <div className="avatar small-avatar">{active.avatar}</div>
            <div className="contact-info"><strong>{active.name}</strong><span>گفتگوی آزمایشی</span></div>
            <button className="icon-button" onClick={() => alert('تماس در نسخه‌های بعدی اضافه می‌شود.')}>☎</button>
          </header>
          <div className="messages">
            <div className="date-label">امروز</div>
            {active.messages.map((m, i) => (
              <div key={i} className={`message-row ${m.mine ? 'mine' : ''}`}>
                <div className="bubble">
                  <div>{m.text}</div>
                  <small>{m.time} {m.mine ? '✓✓' : ''}</small>
                </div>
              </div>
            ))}
          </div>
          <form className="composer" onSubmit={e => { e.preventDefault(); sendMessage() }}>
            <input value={message} onChange={e => setMessage(e.target.value)} placeholder="پیامت رو بنویس..." />
            <button type="submit" disabled={!message.trim()}>➤</button>
          </form>
        </> : <div className="empty-state">یک گفتگو انتخاب کن</div>}
      </section>
    </main>
  )
}
