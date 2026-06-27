import type { AppProps } from 'next/app'
import Head from 'next/head'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/lib/auth'
import '@/styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Tamakita 💕 Mahal kita, 20 lang pera ko</title>
        <meta name="description" content="Your cute couple app for budget dates!" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AuthProvider>
        <Component {...pageProps} />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: '20px',
              background: '#fff',
              color: '#333',
              fontFamily: 'Nunito, sans-serif',
              fontWeight: '700',
              border: '2px solid #FFD6E7',
              boxShadow: '0 4px 15px rgba(255, 107, 157, 0.2)',
            },
            success: {
              iconTheme: { primary: '#FF6B9D', secondary: '#fff' },
            },
          }}
        />
      </AuthProvider>
    </>
  )
}
