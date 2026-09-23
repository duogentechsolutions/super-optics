import { Check, CheckCheck, CalendarDays, Clock } from 'lucide-react';
import type { Message, Product } from '../../types';
import { clock, inr } from '../../lib/format';
import { ProductArt } from '../products/ProductArt';

interface Props {
  m: Message;
  products: Product[];
  onPick: (m: Message, option: string) => void;
}

/** One WhatsApp-style bubble, including tappable interactive options. */
export function ChatMessage({ m, products, onPick }: Props) {
  if (m.from === 'system') {
    return <div className="wa-system">{m.text}</div>;
  }
  const mine = m.from === 'store';
  const block = m.interactive;
  return (
    <div className={`wa-row ${mine ? 'wa-row--out' : 'wa-row--in'}`}>
      <div className={`wa-bubble ${mine ? 'wa-bubble--out' : 'wa-bubble--in'} ${block ? 'wa-bubble--rich' : ''}`}>
        <p className="wa-bubble__text">{m.text}</p>

        {block && block.kind !== 'products' && (
          <div className="wa-options">
            {block.options.map((o) => (
              <button key={o} className="wa-option" disabled={block.used} onClick={() => onPick(m, o)}>
                {block.kind === 'dates' ? <CalendarDays size={14} /> : <Clock size={14} />}
                {o}
              </button>
            ))}
          </div>
        )}

        {block?.kind === 'products' && (
          <div className="wa-products">
            {block.options.map((id) => {
              const p = products.find((x) => x.id === id);
              if (!p) return null;
              return (
                <div key={id} className="wa-product">
                  <ProductArt p={p} />
                  <div className="wa-product__body">
                    <strong>{p.name}</strong>
                    <span>{inr(p.price)}</span>
                  </div>
                  <button className="wa-option wa-option--block" disabled={block.used} onClick={() => onPick(m, id)}>
                    I like this
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <span className="wa-bubble__meta">
          {clock(m.time)}
          {mine && (m.status === 'read' ? <CheckCheck size={14} className="tick tick--read" /> : m.status === 'delivered' ? <CheckCheck size={14} className="tick" /> : <Check size={14} className="tick" />)}
        </span>
      </div>
    </div>
  );
}

export function TypingBubble() {
  return (
    <div className="wa-row wa-row--in">
      <div className="wa-bubble wa-bubble--in wa-typing" aria-label="Typing">
        <i /><i /><i />
      </div>
    </div>
  );
}

/** Label for a day divider between messages. */
export function dayDivider(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(now) - start(d)) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: diff > 300 ? 'numeric' : undefined });
}
