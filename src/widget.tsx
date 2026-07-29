import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import { Widget } from '@/components/layout/Widget';

const container = document.getElementById('widget-root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <Widget />
    </StrictMode>,
  );
}
