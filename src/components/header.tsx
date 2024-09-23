import { Avatar, Header as StyledHeader } from '../styles'

import { Flex } from 'grid-styled'
import React from 'react'

interface User {
  name: string
  image_url: string
}

const Header = ({ user }: { user: User }) => {
  return (
    <StyledHeader>
      <h3>Tracklist for Spotify</h3>
      {user && (
        <Flex alignItems="center">
          {user.name}
          <Avatar ml={3} $src={user.image_url} />
        </Flex>
      )}
    </StyledHeader>
  )
}

export default Header
