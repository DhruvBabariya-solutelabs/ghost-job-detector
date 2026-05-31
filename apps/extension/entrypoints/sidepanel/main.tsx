import { createRoot } from 'react-dom/client';
import { App } from './App';
import './sidepanel.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Side-panel #root container missing — index.html is corrupt.');
}

createRoot(container).render(<App />);
