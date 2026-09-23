import type { Customer } from '../types';

type Row = [
  id: string,
  name: string,
  phone: string,
  gender: 'Male' | 'Female',
  dob: string,
  area: string,
  since: string,
  channel?: Customer['preferredChannel'],
];

const rows: Row[] = [
  ['c01', 'Arun Kumar', '98765 43210', 'Male', '1978-05-14', 'Anna Nagar', '2024-03-08'],
  ['c02', 'Priya Sharma', '98401 22817', 'Female', '1991-11-02', 'Kilpauk', '2025-01-20'],
  ['c03', 'Karthik Raj', '99620 13458', 'Male', '1986-01-27', 'Aminjikarai', '2023-11-02'],
  ['c04', 'Divya S', '97910 55302', 'Female', '1994-07-09', 'Shenoy Nagar', '2024-07-15'],
  ['c05', 'Rahul Kumar', '90030 77145', 'Male', '1999-03-18', 'Anna Nagar West', '2026-09-05'],
  ['c06', 'Meena Krishnan', '98410 90021', 'Female', '1968-12-21', 'Anna Nagar', '2022-06-11', 'Call'],
  ['c07', 'Suresh Babu', '94440 31876', 'Male', '1972-04-30', 'Mogappair', '2023-02-18'],
  ['c08', 'Lakshmi Narayanan', '98843 60274', 'Female', '1960-08-16', 'Villivakkam', '2021-09-30', 'Call'],
  ['c09', 'Vignesh Ramesh', '81226 40913', 'Male', '1997-10-05', 'Koyambedu', '2026-09-18'],
  ['c10', 'Anitha Rajan', '99401 88230', 'Female', '1983-02-11', 'Arumbakkam', '2024-12-03'],
  ['c11', 'Deepak Menon', '98848 12567', 'Male', '1980-06-24', 'Anna Nagar East', '2025-04-22'],
  ['c12', 'Kavya Iyer', '96000 45781', 'Female', '2001-09-29', 'Kilpauk', '2026-09-10'],
  ['c13', 'Sanjay Gupta', '98410 66390', 'Male', '1975-01-08', 'Chetpet', '2022-10-05'],
  ['c14', 'Revathi Sundaram', '97899 20114', 'Female', '1985-09-23', 'Mogappair East', '2023-05-27'],
  ['c15', 'Mohammed Irfan', '90420 38827', 'Male', '1990-12-02', 'Aminjikarai', '2025-08-14'],
  ['c16', 'Nandhini Ganesh', '95000 71642', 'Female', '1988-03-03', 'Thirumangalam', '2024-02-19'],
  ['c17', 'Harish Chandran', '98407 51399', 'Male', '1965-11-19', 'Villivakkam', '2021-12-12', 'SMS'],
  ['c18', 'Swathi Prakash', '87544 90312', 'Female', '1996-05-26', 'Anna Nagar', '2026-09-21'],
  ['c19', 'Ganesh Murthy', '94442 60758', 'Male', '1958-07-12', 'Shenoy Nagar', '2023-08-08', 'Call'],
  ['c20', 'Fathima Begum', '99529 17436', 'Female', '1982-10-14', 'Arumbakkam', '2025-06-30'],
  ['c21', 'Ajay Varma', '98848 30921', 'Male', '1993-10-12', 'Koyambedu', '2024-10-17'],
  ['c22', 'Pooja Reddy', '90807 66124', 'Female', '1998-04-04', 'Anna Nagar West', '2026-09-23'],
  ['c23', 'Senthil Kumar', '94449 27603', 'Male', '1970-02-25', 'Padi', '2022-03-15', 'SMS'],
  ['c24', 'Janani Venkat', '97109 84452', 'Female', '1992-08-31', 'Thirumangalam', '2025-11-09'],
];

function emailFor(name: string): string {
  const [first, last = ''] = name.toLowerCase().split(' ');
  const domain = ['gmail.com', 'outlook.com', 'yahoo.in'][name.length % 3];
  return `${first}${last ? '.' + last : ''}@${domain}`;
}

const seededNotes: Record<string, Customer['notes']> = {
  c01: [
    { id: 'n1', text: 'Prefers lightweight frames. Mentioned neck strain with heavier acetate.', date: '2026-09-12', author: 'Dr. Kavitha Rao' },
    { id: 'n2', text: 'Interested in prescription sunglasses before December travel.', date: '2025-03-15', author: 'Ravi (Store)' },
  ],
  c06: [{ id: 'n3', text: 'High-value customer. Call personally before a new collection launch.', date: '2025-02-14', author: 'Owner' }],
  c08: [{ id: 'n4', text: 'May have moved to Porur. Confirm address on next call.', date: '2025-08-11', author: 'Ravi (Store)' }],
  c12: [{ id: 'n5', text: 'Student. Asked for a call as soon as the frames arrive.', date: '2026-09-10', author: 'Ravi (Store)' }],
};

export const seedCustomers: Customer[] = rows.map(([id, name, phone, gender, dob, area, since, channel]) => ({
  id,
  name,
  phone,
  email: emailFor(name),
  gender,
  dob,
  area,
  customerSince: since,
  preferredChannel: channel ?? 'WhatsApp',
  notes: seededNotes[id] ?? [],
}));
