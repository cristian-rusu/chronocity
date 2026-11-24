import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { App } from './app/App';
import { HomePage } from './pages/HomePage';
import { RecoveryPage } from './pages/RecoveryPage';
import { NotFoundPage } from './pages/NotFoundPage';
import '../styles.css';

const root = document.getElementById('root');
if (root)
  createRoot(root).render(
    <React.StrictMode>
      <BrowserRouter>
        <Routes>
          <Route element={<App />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/recovery" element={<RecoveryPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </React.StrictMode>,
  );
