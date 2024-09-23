import { Avatar, Header as StyledHeader } from '../styles'

import { Flex } from 'grid-styled'
import React from 'react'

const Header = ({ user }) => {
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
