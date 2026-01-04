import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/themes.css';
import './styles/index.css';

// Set default theme class to prevent FOUC (Flash of Unstyled Content)
document.documentElement.classList.add('theme-default');

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
