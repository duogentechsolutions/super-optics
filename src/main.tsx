import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppStoreProvider } from './store/AppStore';
import { ToastProvider } from './components/ui/Toast';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppStoreProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AppStoreProvider>
    </BrowserRouter>
  </StrictMode>,
);
