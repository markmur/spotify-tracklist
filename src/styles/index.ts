import { backgroundColor, color, fontSize, space } from 'styled-system'
import styled, { css } from 'styled-components'

import { Flex as StyledFlex } from 'grid-styled'
import { lighten } from 'polished'

const mobile = (content: any) => css`
  @media (max-width: 767px) {
    ${content};
  }
`

export const Box = styled.div`
  ${space};
`

export const Flex = styled(StyledFlex as any)`
  ${color};
  ${backgroundColor};
`

const getColor = (color: any) => (p: any) => p.theme.colors[color]

export const Label = styled.label`
  display: block;
`

export const TrackImage = styled.div`
  position: relative;
  margin-right: 1em;
  height: 40px;
  width: 40px;
  flex-shrink: 0;
`

export const Text = styled.p`
  ${fontSize};
  ${space};
`

export const PlaybackIcon = styled.div`
  visibility: hidden;
  position: absolute;
  display: flex;
  flex-direction: column;
  text-align: center;
  justify-content: center;
  z-index: 2;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  color: white;
  background: rgba(0, 0, 0, 0.7);

  ${(p) => p.isPlaying && `visibility: visible`};
`

export const Input = styled.input`
  background: transparent;
  border: none;
  padding: 1em 0;
  font-size: 15px;
  width: 100%;
  outline: none;
  color: white;
  font-weight: bold;
`

export const Header = styled.header`
  height: 56px;
  background: ${getColor('header')};
  padding: 1em;
  color: white;
  display: flex;
  font-size: 13px;
  font-weight: bold;
  align-items: center;
  justify-content: space-between;
`

export const Footer = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  white-space: nowrap;
  height: 56px;
  background: ${getColor('footer')};
  padding: 1em 2em;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  text-align: center;
  line-height: 2;

  ${mobile(`
    white-space: normal;
  `)};

  strong {
    margin: 0 1em;
  }

  a {
    border-bottom: 1px dashed;
    padding-bottom: 2px;

    &:hover {
      color: white;
    }
  }
`

export const Content = styled.div`
  display: flex;
  height: calc(100vh - 56px - 56px);

  ${mobile(`
    flex-direction: column;
  `)};
`

export const LeftPanel = styled.div`
  flex: 0 1 50%;
  background: white;
  overflow: auto;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: ${(p) => lighten(0.001, p.theme.colors.footer)};

  ${mobile(`
    flex: 1;
    max-height: calc(50vh - 56px);
  `)};
`

export const RightPanel = styled.div`
  display: flex;
  position: relative;
  flex-direction: column;
  justify-content: space-between;
  background: ${(p) => p.theme.colors.dark};
  flex: 0 1 50%;
  color: white;

  ${mobile(`
    flex: 1;
    max-height: calc(50vh - 56px);
  `)};
`

export const Textarea = styled.textarea`
  flex: 1;
  width: 100%;
  border: none;
  outline: none;
  font-size: 15px;
  font-weight: bold;
  height: 70vh;
  line-height: 2.5;
  padding: 1.75em;
  color: white;
  resize: none;
  background: ${(p) => lighten(0.001, p.theme.colors.footer)};
`

export const EmptyState = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  text-align: center;
  transform: translate(-50%, -50%);
  color: rgba(255, 255, 255, 0.4);
  font-weight: bold;
  font-size: 14px;

  p {
    margin-bottom: 1em;
  }
`

export const TracklistContainer = styled.div`
  flex: 1;
  overflow: auto;
  max-height: calc(100vh - 56px - 56px);
`

export const Tracks = styled.div`
  padding: 0 2em 2em;
  flex: 1;
  overflow: auto;
  // max-height: calc(100vh - 56px - 56px);
`

export const Track = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.75em 1em;
  border-radius: 4px;
  align-items: center;
  cursor: pointer;
  border-bottom: 1px solid ${getColor('border')};
  ${(p) => p.$missing && `opacity: 0.4`};

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-bottom-color: transparent;

    .playback-icon {
      visibility: visible;
    }
  }
`

export const Image = styled.img.attrs({
  width: 40,
  height: 40
})`
  flex: 0 1 auto;
  border-radius: 3px;
  ${space};
`

export const FallbackImage = styled.div`
  background: rgba(255, 255, 255, 0.1);
  flex: 0 1 auto;
  border-radius: 3px;
  ${space};
  width: 40px;
  height: 40px;
`

export const SongTitle = styled.strong`
  display: block;
  color: white;
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 5px;
`

export const SongArtist = styled.small`
  color: #e3e3e3;
  display: block;
  font-size: 12px;
`

export const ActionsBar = styled(Flex).attrs({
  justifyContent: 'flex-end'
})`
  background: ${getColor('light')};
`

export const LoginButton = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 1.25em 0.9em;
  border-radius: 45px;
  z-index: 100;
  white-space: nowrap;
  background: ${(p) => lighten(0.001, p.theme.colors.footer)};
`

const hoverColor = (color) => `
&:hover {
  background: ${lighten(0.05, color)};
}
`
const primary = (p) =>
  p.primary &&
  `background: ${p.theme.colors.spotify}; ${hoverColor(p.theme.colors.spotify)}`

const secondary = (p) =>
  p.secondary &&
  `background: ${p.theme.colors.dark}; ${hoverColor(p.theme.colors.dark)}`

export const ActionButton = styled.button`
  border: none;
  outline: none;
  color: white;
  padding: 1.35em 2.5em;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 1px;
  flex: ${(p) => p.$flex || 'initial'};

  i {
    position: relative;
    top: 1px;
  }

  ${primary};
  ${secondary};

  &:disabled {
    opacity: 0.6;
    pointer-events: none;
  }
`

export const SpotifyButton = styled.button`
  background: ${getColor('spotify')};
  border-radius: 35px;
  color: white;
  border: none;
  outline: none;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.125em;
  padding: 0.8em 3em;
  font-size: 13px;
  cursor: pointer;
  align-self: center;

  ${(p) => hoverColor(p.theme.colors.spotify)};
  ${(p) =>
    p.$small &&
    `
    font-size: 12px;
    padding: 0.5em 1.75em;
  `};
`

export const Avatar = styled.div.attrs({
  size: 30
})`
  width: ${(p) => p.size}px;
  height: ${(p) => p.size}px;
  border-radius: 50%;
  background-image: url(${(p) => p.$src});
  background-size: cover;
  background-position: center center;
  ${space};
`

export const Modal = styled.div`
  display: ${(p) => (p.$visible ? 'block' : 'none')};
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: auto;
  padding: 2em;
  color: white;
  z-index: 100;
`

export const Playlists = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-height: 75vh;
  max-width: 500px;
  overflow: auto;
  padding: 2em;
  color: white;
  z-index: 100;
  font-weight: bold;
  background: ${getColor('light')};
  border-radius: 4px;
  z-index: 2;
`

export const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1;
`

export const Playlist = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 1em;
  font-size: 14px;
  overflow: hidden;
  border-bottom: 1px solid ${getColor('light')};

  &:hover {
    background: ${getColor('light')};
  }

  strong {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    padding-right: 1em;
  }
`
