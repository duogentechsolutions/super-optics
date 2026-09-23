import type { Prescription } from '../../types';
import { fmtDate, fmtDateLong, rx } from '../../lib/format';

const ROWS: { key: 'sph' | 'cyl' | 'axis' | 'add' | 'pd' | 'va'; label: string; title: string }[] = [
  { key: 'sph', label: 'SPH', title: 'Sphere — lens power in dioptres' },
  { key: 'cyl', label: 'CYL', title: 'Cylinder — astigmatism correction' },
  { key: 'axis', label: 'AXIS', title: 'Orientation of the cylinder, 1–180°' },
  { key: 'add', label: 'ADD', title: 'Additional near power for reading' },
  { key: 'pd', label: 'PD', title: 'Pupillary distance per eye, mm' },
  { key: 'va', label: 'VA', title: 'Visual acuity' },
];

function cell(key: (typeof ROWS)[number]['key'], v: number | string) {
  if (key === 'axis') return v ? `${v}°` : '—';
  if (key === 'pd') return `${v} mm`;
  if (key === 'va') return String(v);
  if (key === 'add' && v === 0) return '—';
  return rx(v as number);
}

/** A prescription slip laid out the way optometrists write them: OD / OS columns. */
export function RxSlip({ p, compare, customerName }: { p: Prescription; compare?: Prescription; customerName?: string }) {
  return (
    <div className="rx-slip">
      <div className="rx-slip__head">
        <div>
          <span className="rx-slip__mark">℞</span>
          <div>
            <strong>{customerName ? `${customerName} · ` : ''}Spectacle prescription</strong>
            <small>{fmtDateLong(p.date)} · {p.optometrist}</small>
          </div>
        </div>
        <span className="rx-slip__advice">{p.lensAdvice}</span>
      </div>
      <div className="rx-table-wrap">
        <table className="rx-table">
          <thead>
            <tr>
              <th />
              <th>Right eye <span>OD</span></th>
              <th>Left eye <span>OS</span></th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => {
              const changedR = compare && compare.right[r.key] !== p.right[r.key];
              const changedL = compare && compare.left[r.key] !== p.left[r.key];
              return (
                <tr key={r.key}>
                  <th scope="row" data-tip={r.title}>{r.label}</th>
                  <td className={changedR ? 'is-changed' : ''}>{cell(r.key, p.right[r.key])}</td>
                  <td className={changedL ? 'is-changed' : ''}>{cell(r.key, p.left[r.key])}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {compare && <p className="rx-slip__legend"><i /> Changed since {fmtDate(compare.date)}</p>}
      {p.notes && <p className="rx-slip__notes">{p.notes}</p>}
    </div>
  );
}

export function RxTimeline({ items, activeId, onSelect }: { items: Prescription[]; activeId?: string; onSelect: (id: string) => void }) {
  return (
    <ol className="timeline">
      {items.map((p, i) => (
        <li key={p.id} className={p.id === activeId ? 'is-active' : ''}>
          <button onClick={() => onSelect(p.id)}>
            <span className="timeline__dot" />
            <strong>{fmtDate(p.date)}{i === 0 && <em>Current</em>}</strong>
            <small>{p.lensAdvice}</small>
            <small>R {rx(p.right.sph)} / L {rx(p.left.sph)}{p.right.add ? ` · Add ${rx(p.right.add)}` : ''}</small>
          </button>
        </li>
      ))}
    </ol>
  );
}
