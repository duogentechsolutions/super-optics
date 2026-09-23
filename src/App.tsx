import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { useStore } from './store/AppStore';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerProfile from './pages/CustomerProfile';
import Prescriptions from './pages/Prescriptions';
import Orders from './pages/Orders';
import FollowUps from './pages/FollowUps';
import WhatsApp from './pages/WhatsApp';
import Products from './pages/Products';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.querySelector('.main')?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

export default function App() {
  const { state } = useStore();
  const compact = state.settings.user.compactTables;
  useEffect(() => {
    document.body.classList.toggle('compact', compact);
  }, [compact]);

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<CustomerProfile />} />
          <Route path="prescriptions" element={<Prescriptions />} />
          <Route path="orders" element={<Orders />} />
          <Route path="follow-ups" element={<FollowUps />} />
          <Route path="whatsapp" element={<WhatsApp />} />
          <Route path="products" element={<Products />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}
