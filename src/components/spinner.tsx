import styled, { keyframes } from 'styled-components'

const spin = keyframes`
100% {
  transform: rotate(360deg)
}
`

interface SpinnerProps {
  active?: boolean
}

export default styled.div<SpinnerProps>`
  display: ${(p) => (p.active ? 'inline-block' : 'none')};
  position: relative;
  top: 2px;
  margin-right: 1em;
  pointer-events: none;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-color: transparent;
  border-top-color: white;
  border-radius: 50%;
  animation: ${spin} 650ms linear infinite;
`
