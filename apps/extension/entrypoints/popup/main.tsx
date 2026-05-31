import { createRoot } from 'react-dom/client';
import { App } from './App';
import './popup.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Popup #root container missing — index.html is corrupt.');
}

createRoot(container).render(<App />);
