import React from 'react'
import styled from 'styled-components'
import { fontSize, color, space } from 'styled-system'

export default styled(({ type, className, ...props }) => (
  <i className={`icon-${type} ${className || ''}`} {...props} />
))`
  ${fontSize};
  ${color};
  ${space};

  &:hover {
    ${p =>
      'hoverColor' in p
        ? `color: ${p.theme.colors[p.hoverColor] || p.hoverColor}`
        : ''};
  }
`
