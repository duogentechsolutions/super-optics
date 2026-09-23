import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useStore } from '../../store/AppStore';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import { Badge, Button, Field, Select, Textarea } from '../ui/primitives';
import { ProductArt } from './ProductArt';
import { firstName, fmtDate, inr, num } from '../../lib/format';
import { productSales } from '../../lib/selectors';
import type { Product } from '../../types';

export function stockTone(p: Product) {
  if (p.stock === 0) return { tone: 'red' as const, label: 'Out of stock' };
  if (p.stock <= 5) return { tone: 'amber' as const, label: `Low stock · ${p.stock}` };
  return { tone: 'green' as const, label: `${p.stock} in stock` };
}

export function ProductDetailModal({ product, onClose, onShare }: { product?: Product; onClose: () => void; onShare: (p: Product) => void }) {
  const { state } = useStore();
  if (!product) return null;
  const sales = productSales(state).get(product.id);
  const st = stockTone(product);
  return (
    <Modal
      open
      onClose={onClose}
      title={product.name}
      subtitle={`${product.brand} · ${product.collection}`}
      size="md"
      footer={<>
        <Button variant="ghost" onClick={onClose}>Close</Button>
        <Button variant="whatsapp" icon={<MessageCircle size={16} />} onClick={() => onShare(product)}>Share on WhatsApp</Button>
      </>}
    >
      <div className="product-detail">
        <ProductArt p={product} className="product-detail__art" />
        <div className="product-detail__info">
          <div className="product-detail__price">{inr(product.price)}</div>
          <div className="badge-row">
            <Badge tone="blue">{product.category}</Badge>
            <Badge tone={st.tone} dot>{st.label}</Badge>
          </div>
          <p>{product.description}</p>
          <dl className="facts">
            <div><dt>Units sold</dt><dd>{num(sales?.units ?? 0)}</dd></div>
            <div><dt>Revenue</dt><dd>{inr(sales?.revenue ?? 0)}</dd></div>
            <div><dt>Last sold</dt><dd>{sales?.lastSold ? fmtDate(sales.lastSold) : '—'}</dd></div>
            <div><dt>Reporting group</dt><dd>{product.group}</dd></div>
          </dl>
        </div>
      </div>
    </Modal>
  );
}

export function ShareProductModal({ product, onClose }: { product?: Product; onClose: () => void }) {
  const { customers, sendMessage, state } = useStore();
  const toast = useToast();
  const [cid, setCid] = useState('');
  const [text, setText] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    setCid('');
    setErr('');
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    const c = customers.find((x) => x.id === cid);
    setText(`Hi ${c ? firstName(c.name) : '{{customer_name}}'}, we thought you'd love the ${product.name} from our ${product.collection} — ${inr(product.price)} at ${state.settings.business.name}. Want us to keep one aside for a trial? 👓`);
  }, [cid, product, customers, state.settings.business.name]);

  if (!product) return null;

  const submit = () => {
    if (!cid) { setErr('Choose a customer to send this to'); return; }
    sendMessage(cid, text, 'store', { kind: 'products', options: [product.id] });
    const c = customers.find((x) => x.id === cid)!;
    toast('Sent on WhatsApp', { body: `${product.name} shared with ${c.name}`, tone: 'whatsapp' });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Share on WhatsApp"
      subtitle={product.name}
      size="sm"
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="whatsapp" icon={<MessageCircle size={16} />} onClick={submit}>Send</Button>
      </>}
    >
      <div className="form-grid">
        <Field label="Customer" error={err} full>
          <Select value={cid} onChange={(e) => { setCid(e.target.value); setErr(''); }}>
            <option value="">Select a customer…</option>
            {[...customers].sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
              <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>
            ))}
          </Select>
        </Field>
        <Field label="Message" hint="A product card is attached automatically" full>
          <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
