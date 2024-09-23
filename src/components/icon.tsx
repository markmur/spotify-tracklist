import { color, fontSize, space } from 'styled-system'

import React from 'react'
import styled from 'styled-components'

interface IconProps {
  type: string
  className?: string
  [key: string]: any
}

export default styled(({ type, className = '', ...props }: IconProps) => (
  <i className={`icon-${type} ${className}`} {...props} />
))`
  ${fontSize};
  ${color};
  ${space};

  &:hover {
    ${(p) =>
      'hoverColor' in p
        ? `color: ${p.theme.colors[p.hoverColor] || p.hoverColor}`
        : ''};
  }
`
