import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import App from './App.tsx'
import KmlMapViewer from './KmlMapViewer.tsx';

const styles = `
  @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
  
  *, *::before, *::after {
    box-sizing: border-box;
  }
  
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #f5f5f5;
    color: #333;
  }
  
  .container {
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: 1rem;
  }
`;

// Create a style element and append it to the head
const styleElement = document.createElement('style');
styleElement.textContent = styles;
document.head.appendChild(styleElement);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
<div className="min-h-screen bg-gray-100 py-8">
      <KmlMapViewer />
    </div>
  </StrictMode>,
)
