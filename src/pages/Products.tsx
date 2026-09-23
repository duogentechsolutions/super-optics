import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, MessageCircle, PackageOpen } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useFakeLoading } from '../hooks/useFakeLoading';
import { Badge, Button, EmptyState, PageHeader, SearchInput, Select, Skeleton, Tabs } from '../components/ui/primitives';
import { ProductArt } from '../components/products/ProductArt';
import { ProductDetailModal, ShareProductModal, stockTone } from '../components/products/ProductModals';
import { inr } from '../lib/format';
import { productSales } from '../lib/selectors';
import type { Product, ProductCategory } from '../types';

const CATS = ['All', 'Frames', 'Lenses', 'Contact Lenses', 'Accessories'] as const;
type Cat = (typeof CATS)[number];
type Sort = 'popular' | 'low' | 'high' | 'name';

export default function Products() {
  const { state } = useStore();
  const [params, setParams] = useSearchParams();
  const loading = useFakeLoading(400);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('popular');
  const cat = (CATS.includes(params.get('cat') as Cat) ? params.get('cat') : 'All') as Cat;
  const [viewId, setViewId] = useState<string | undefined>(params.get('open') ?? undefined);
  const [share, setShare] = useState<Product>();

  useEffect(() => { const o = params.get('open'); if (o) setViewId(o); }, [params]);

  const setCat = (c: Cat) => {
    const p = new URLSearchParams(params);
    if (c === 'All') p.delete('cat'); else p.set('cat', c);
    setParams(p, { replace: true });
  };

  const closeView = () => {
    setViewId(undefined);
    if (params.get('open')) { const p = new URLSearchParams(params); p.delete('open'); setParams(p, { replace: true }); }
  };

  const sales = useMemo(() => productSales(state), [state]);
  const counts = useMemo(() => {
    const r: Partial<Record<Cat, number>> = { All: state.products.length };
    for (const c of CATS.slice(1)) r[c] = state.products.filter((p) => p.category === (c as ProductCategory)).length;
    return r;
  }, [state.products]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const out = state.products
      .filter((p) => cat === 'All' || p.category === cat)
      .filter((p) => !t || `${p.name} ${p.brand} ${p.collection}`.toLowerCase().includes(t));
    const units = (p: Product) => sales.get(p.id)?.units ?? 0;
    return out.sort((a, b) =>
      sort === 'low' ? a.price - b.price : sort === 'high' ? b.price - a.price : sort === 'name' ? a.name.localeCompare(b.name) : units(b) - units(a),
    );
  }, [state.products, cat, q, sort, sales]);

  const lowStock = state.products.filter((p) => p.stock <= 5).length;
  const viewing = state.products.find((p) => p.id === viewId);

  return (
    <div className="page">
      <PageHeader
        title="Products"
        subtitle={`A lightweight catalogue to share with customers on WhatsApp · ${state.products.length} products${lowStock ? ` · ${lowStock} running low` : ''}`}
      />
      <div className="toolbar">
        <Tabs tabs={CATS} value={cat} onChange={setCat} counts={counts} />
        <div className="toolbar__right">
          <SearchInput value={q} onChange={setQ} placeholder="Search products or brands" />
          <Select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort products">
            <option value="popular">Most popular</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
            <option value="name">Name A–Z</option>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="product-grid">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="card product-card">
              <Skeleton h={150} r={0} />
              <div className="product-card__body"><Skeleton w="70%" /><Skeleton w="45%" h={12} /><Skeleton w="30%" h={20} /></div>
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="card card--pad">
          <EmptyState icon={<PackageOpen size={22} />} title="No products found" body={q ? `Nothing matches "${q}" in ${cat === 'All' ? 'the catalogue' : cat}.` : 'This category is empty.'} action={q ? <Button onClick={() => setQ('')}>Clear search</Button> : undefined} />
        </div>
      ) : (
        <div className="product-grid">
          {list.map((p) => {
            const st = stockTone(p);
            const sold = sales.get(p.id)?.units ?? 0;
            return (
              <article key={p.id} className="card product-card">
                <button className="product-card__media" onClick={() => setViewId(p.id)} aria-label={`View ${p.name}`}>
                  <ProductArt p={p} />
                  {p.stock <= 5 && <span className="product-card__flag"><Badge tone={st.tone}>{st.label}</Badge></span>}
                </button>
                <div className="product-card__body">
                  <span className="eyebrow">{p.category}</span>
                  <h3>{p.name}</h3>
                  <p className="muted">{p.collection}</p>
                  <div className="product-card__row">
                    <strong className="price">{inr(p.price)}</strong>
                    {sold > 0 && <span className="muted small">{sold} sold</span>}
                  </div>
                </div>
                <div className="product-card__actions">
                  <Button size="sm" variant="secondary" icon={<Eye size={15} />} onClick={() => setViewId(p.id)}>View</Button>
                  <Button size="sm" variant="whatsapp" icon={<MessageCircle size={15} />} onClick={() => setShare(p)}>WhatsApp</Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ProductDetailModal product={viewing} onClose={closeView} onShare={(p) => { closeView(); setShare(p); }} />
      <ShareProductModal product={share} onClose={() => setShare(undefined)} />
    </div>
  );
}
