import '../src/index.css'

import { ThemeProvider } from 'styled-components'
import theme from '../src/styles/theme'

function App({
  Component,
  pageProps
}: {
  Component: React.ComponentType
  pageProps: any
}) {
  return (
    <ThemeProvider theme={theme}>
      <Component {...pageProps} user={pageProps.user} />
    </ThemeProvider>
  )
}

export default App
