import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<App />);
} else {
  console.error('Root element not found.');
}
<>
  {console.log("🔥 VITE_API_URL:", import.meta.env.VITE_API_URL)}
  <App />
</>;
