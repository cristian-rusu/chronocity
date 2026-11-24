import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { App } from './app/App';
import { HomePage } from './pages/HomePage';
import { MyJourneyPage } from './pages/MyJourneyPage';
import { AcceptedPage } from './pages/AcceptedPage';
import { CityLabPage } from './pages/CityLabPage';
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
            <Route path="/my-journey" element={<MyJourneyPage />} />
            <Route path="/my-day" element={<MyJourneyPage initialStage="plan" />} />
            <Route path="/aftershock" element={<MyJourneyPage initialStage="disruption" />} />
            <Route path="/resync" element={<MyJourneyPage initialStage="recovery" />} />
            <Route path="/my-day/accepted" element={<AcceptedPage />} />
            <Route path="/city-lab" element={<CityLabPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </React.StrictMode>,
  );
