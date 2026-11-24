import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { App } from './app/App';
import { HomePage } from './pages/HomePage';
import { MyDayPage } from './pages/MyDayPage';
import { AftershockPage } from './pages/AftershockPage';
import { ResyncPage } from './pages/ResyncPage';
import { AcceptedPage } from './pages/AcceptedPage';
import { CityLabPage } from './pages/CityLabPage';
import { NotFoundPage } from './pages/NotFoundPage';
import './shared/styles/index.css';

const root = document.getElementById('root');
if (root) createRoot(root).render(<React.StrictMode><BrowserRouter><Routes><Route element={<App />}><Route path="/" element={<HomePage />} /><Route path="/my-day" element={<MyDayPage />} /><Route path="/aftershock" element={<AftershockPage />} /><Route path="/resync" element={<ResyncPage />} /><Route path="/my-day/accepted" element={<AcceptedPage />} /><Route path="/city-lab" element={<CityLabPage />} /><Route path="*" element={<NotFoundPage />} /></Route></Routes></BrowserRouter></React.StrictMode>);
