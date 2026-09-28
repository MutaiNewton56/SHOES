import React from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const products = [
  { id: 1, name: 'Classic Runner', price: 4500, sizes: ['39','40','41','42','43','44'] },
  { id: 2, name: 'Street Flex', price: 5200, sizes: ['40','41','42','43','44'] },
  { id: 3, name: 'Urban Court', price: 6000, sizes: ['39','40','41','42','43'] }
];

function App() {
  const [message, setMessage] = React.useState('');
  const [status, setStatus] = React.useState('');

  async function sendMessage(e) {
    e.preventDefault();
    setStatus('Sending...');
    try {
      const res = await fetch('http://localhost:5000/api/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      setStatus(data.message || 'Message sent.');
      if (res.ok) setMessage('');
    } catch {
      setStatus('Could not connect to the backend. Is the server running?');
    }
  }

  return <>
    <header><strong>SoleHub</strong><nav><a href="#shop">Shop</a><a href="#contact">Contact</a></nav></header>
    <main>
      <section className="hero"><div><p className="eyebrow">STEP INTO STYLE</p><h1>Quality shoes.<br/>Simple shopping.</h1><p>Browse our collection and order your next pair online.</p><a className="button" href="#shop">Shop shoes</a></div></section>
      <section id="shop"><h2>Featured shoes</h2><div className="grid">{products.map(p => <article className="card" key={p.id}><div className="shoe-placeholder">{p.name}</div><div className="card-body"><h3>{p.name}</h3><p>KSh {p.price.toLocaleString()}</p><label>Size <select defaultValue={p.sizes[0]}>{p.sizes.map(s => <option key={s}>{s}</option>)}</select></label><button onClick={() => alert(`${p.name} added — checkout is our next step.`)}>Add to cart</button></div></article>)}</div></section>
      <section id="contact" className="contact"><div><p className="eyebrow">CONTACT US</p><h2>Have a question?</h2><p>Send us a message and we’ll get back to you.</p></div><form onSubmit={sendMessage}><input placeholder="Your name" required/><input type="email" placeholder="Email address" required/><textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Your message" required/><button type="submit">Send message</button><small>{status}</small></form></section>
    </main>
    <footer>© 2026 SoleHub</footer>
  </>;
}

createRoot(document.getElementById('root')).render(<App />);
