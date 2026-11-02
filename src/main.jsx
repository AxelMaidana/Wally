import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { autoHideScrollbars } from './lib/scrollbars'

autoHideScrollbars()

createRoot(document.getElementById('root')).render(
  <App />
)
