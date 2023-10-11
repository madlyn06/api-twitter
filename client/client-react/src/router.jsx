import { createBrowserRouter } from 'react-router-dom'
import Home from './Home'
import './index.css'
import Login from './Login'
import Chat from './Chat'
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/login/oauth',
    element: <Login />
  },
  {
    path: '/chat',
    element: <Chat />
  }
])
