import { ThemeProvider } from 'styled-components'

import theme from '../src/styles/theme'

import '../src/index.css'

function App({ Component, pageProps }) {
  return (
    <ThemeProvider theme={theme}>
      <Component {...pageProps} user={pageProps.user} />
    </ThemeProvider>
  )
}

export default App
