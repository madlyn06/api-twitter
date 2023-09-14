import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Link } from 'react-router-dom'
export default function Home() {
  const getGoogleAuthUri = () => {
    const { VITE_GOOGLE_CLIENT_ID, VITE_GOOGLE_RIDIRECT_URI } = import.meta.env
    console.log(import.meta.env)
    const url = `https://accounts.google.com/o/oauth2/v2/auth`
    const query = {
      client_id: VITE_GOOGLE_CLIENT_ID,
      redirect_uri: VITE_GOOGLE_RIDIRECT_URI,
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ].join(' '),
      prompt: 'consent'
    }
    const queryString = new URLSearchParams(query).toString()
    return `${url}?${queryString}`
  }
  const url_google = getGoogleAuthUri()
  console.log(url_google)
  return (
    <>
      <div>
        <span href='https://vitejs.dev' target='_blank'>
          <img src={viteLogo} className='logo' alt='Vite logo' />
        </span>
        <span href='https://react.dev' target='_blank'>
          <img src={reactLogo} className='logo react' alt='React logo' />
        </span>
      </div>
      <h1>Vite + React</h1>
      <p className='read-the-docs'>
        <Link to={url_google}>Login with Google</Link>
      </p>
    </>
  )
}
