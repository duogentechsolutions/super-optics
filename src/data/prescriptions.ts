import type { EyeRx, Prescription } from '../types';

const e = (sph: number, cyl: number, axis: number, add: number, pd: number, va = '6/6'): EyeRx => ({ sph, cyl, axis, add, pd, va });

export const OPTOMETRISTS = ['Dr. Kavitha Rao', 'Dr. S. Mahesh'];
const [DR_K, DR_M] = OPTOMETRISTS;

export const seedPrescriptions: Prescription[] = [
  { id: 'rx01', customerId: 'c01', date: '2024-03-08', optometrist: DR_M, right: e(-1.0, -0.5, 90, 0.75, 31), left: e(-0.75, -0.25, 85, 0.75, 31), lensAdvice: 'Single vision, anti-glare', notes: 'First visit. Early presbyopia noted; reading add suggested for near work.' },
  { id: 'rx02', customerId: 'c01', date: '2025-03-15', optometrist: DR_K, right: e(-1.25, -0.5, 90, 0.75, 31), left: e(-1.0, -0.25, 85, 0.75, 31), lensAdvice: 'Blue cut, anti-glare', notes: 'Long screen hours at work. Recommended blue cut coating.' },
  { id: 'rx03', customerId: 'c01', date: '2026-09-12', optometrist: DR_K, right: e(-1.25, -0.5, 90, 1.0, 31), left: e(-1.0, -0.25, 85, 1.0, 31), lensAdvice: 'Progressive, anti-glare', notes: 'Add increased to +1.00. Moved to progressive lenses. Review in 6 months.' },
  { id: 'rx04', customerId: 'c02', date: '2025-01-20', optometrist: DR_M, right: e(-2.0, 0, 0, 0, 30), left: e(-2.25, -0.25, 180, 0, 30), lensAdvice: 'Single vision', notes: 'Myopia stable.' },
  { id: 'rx05', customerId: 'c02', date: '2026-03-22', optometrist: DR_K, right: e(-2.25, 0, 0, 0, 30), left: e(-2.25, -0.25, 180, 0, 30), lensAdvice: 'Contact lenses with backup spectacles', notes: 'Fitted for Acuvue Oasys. Comfortable on trial.' },
  { id: 'rx06', customerId: 'c03', date: '2025-10-08', optometrist: DR_K, right: e(-0.75, -0.75, 170, 0, 32), left: e(-0.5, -0.5, 10, 0, 32), lensAdvice: 'Blue cut', notes: 'Mild astigmatism.' },
  { id: 'rx07', customerId: 'c03', date: '2026-09-19', optometrist: DR_K, right: e(-1.0, -0.75, 170, 0, 32), left: e(-0.75, -0.5, 10, 0, 32), lensAdvice: 'Photochromic', notes: 'Rides to work daily; photochromic recommended.' },
  { id: 'rx08', customerId: 'c04', date: '2025-11-20', optometrist: DR_M, right: e(1.25, 0, 0, 0, 29), left: e(1.0, 0, 0, 0, 29), lensAdvice: 'Single vision', notes: 'Hyperopia. Headaches with prolonged reading.' },
  { id: 'rx09', customerId: 'c05', date: '2026-09-05', optometrist: DR_K, right: e(-3.5, -0.5, 180, 0, 32), left: e(-3.25, -0.75, 175, 0, 32), lensAdvice: 'Single vision, thin index', notes: 'New customer. Last check-up was over 2 years ago elsewhere.' },
  { id: 'rx10', customerId: 'c06', date: '2025-02-14', optometrist: DR_K, right: e(1.5, -0.5, 95, 2.0, 30), left: e(1.75, -0.5, 80, 2.0, 30), lensAdvice: 'Progressive', notes: 'Stable. Prefers premium frames.' },
  { id: 'rx11', customerId: 'c06', date: '2026-09-23', optometrist: DR_K, right: e(1.75, -0.5, 95, 2.25, 30), left: e(1.75, -0.5, 80, 2.25, 30), lensAdvice: 'Progressive, anti-glare', notes: 'Add increased to +2.25.' },
  { id: 'rx12', customerId: 'c07', date: '2026-03-23', optometrist: DR_M, right: e(-0.5, 0, 0, 1.5, 33), left: e(-0.5, 0, 0, 1.5, 33), lensAdvice: 'Progressive', notes: 'Discussed the progressive adaptation period.' },
  { id: 'rx13', customerId: 'c08', date: '2025-08-11', optometrist: DR_M, right: e(2.0, -1.0, 100, 2.5, 30, '6/9'), left: e(2.25, -0.75, 75, 2.5, 30, '6/9'), lensAdvice: 'Progressive', notes: 'Early cataract changes. Refer to ophthalmologist if vision drops.' },
  { id: 'rx14', customerId: 'c09', date: '2026-09-18', optometrist: DR_K, right: e(-1.75, 0, 0, 0, 31), left: e(-1.5, 0, 0, 0, 31), lensAdvice: 'Contact lenses with blue cut spectacles', notes: 'Trial with Acuvue went well.' },
  { id: 'rx15', customerId: 'c10', date: '2026-01-15', optometrist: DR_M, right: e(-1.0, -0.25, 90, 0, 30), left: e(-1.25, 0, 0, 0, 30), lensAdvice: 'Blue cut', notes: 'Due for review in July.' },
  { id: 'rx16', customerId: 'c12', date: '2026-09-10', optometrist: DR_K, right: e(-0.75, 0, 0, 0, 29), left: e(-1.0, 0, 0, 0, 29), lensAdvice: 'Blue cut', notes: 'First pair of spectacles.' },
  { id: 'rx17', customerId: 'c13', date: '2026-07-02', optometrist: DR_K, right: e(-2.0, -0.75, 165, 1.75, 32), left: e(-2.25, -0.5, 15, 1.75, 32), lensAdvice: 'Progressive photochromic', notes: 'Upgraded to photochromic progressives.' },
  { id: 'rx18', customerId: 'c16', date: '2025-12-05', optometrist: DR_M, right: e(-1.5, 0, 0, 0, 30), left: e(-1.5, -0.25, 170, 0, 30), lensAdvice: 'Blue cut', notes: '' },
  { id: 'rx19', customerId: 'c19', date: '2026-04-18', optometrist: DR_K, right: e(1.0, -0.5, 90, 2.5, 31), left: e(1.25, -0.5, 90, 2.5, 31), lensAdvice: 'Progressive', notes: 'Diabetic. Annual retina check advised.' },
  { id: 'rx20', customerId: 'c22', date: '2026-09-23', optometrist: DR_M, right: e(-0.5, -0.25, 180, 0, 30), left: e(-0.75, 0, 0, 0, 30), lensAdvice: 'Single vision', notes: 'New customer, walk-in.' },
];
