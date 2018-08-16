import styled from 'styled-components'
import { lighten } from 'polished'
import { space } from 'styled-system'

const color = color => p => p.theme.colors[color]

export const Label = styled.label`
  display: block;
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
  background: ${color('header')};
  padding: 1em;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

export const Footer = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  white-space: nowrap;
  height: 56px;
  background: ${color('footer')};
  padding: 1em 2em;
  color: white;
  font-size: 13px;
  text-align: center;
  color: ${p => lighten(0.2, p.theme.colors.light)};

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
`

export const LeftPanel = styled.div`
  flex: 0 1 50%;
  background: white;
  overflow: auto;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: ${p => lighten(0.001, p.theme.colors.footer)};
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
  background: ${p => lighten(0.001, p.theme.colors.footer)};
`

export const RightPanel = styled.div`
  display: flex;
  position: relative;
  flex-direction: column;
  justify-content: space-between;
  background: ${p => p.theme.colors.dark};
  flex: 0 1 50%;
  color: white;
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

export const Albums = styled.div`
  padding: 1em 2em 2em;
  flex: 1;
  overflow: auto;
  max-height: calc(100vh - 56px - 56px);
`

export const Album = styled.a`
  display: flex;
  padding: 0.75em 1em;
  border-radius: 4px;
  border-bottom: 1px solid ${color('border')};

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-bottom-color: transparent;
  }

  img {
    margin-right: 1em;
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

export const ActionsBar = styled.div`
  background: ${color('light')};
  display: flex;
  justify-content: flex-end;
`

export const LoginButton = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 1.25em 0.9em;
  border-radius: 45px;
  background: ${p => lighten(0.001, p.theme.colors.footer)};
`

const hoverColor = color => `
&:hover {
  background: ${lighten(0.05, color)};
}
`
const primary = p =>
  p.primary &&
  `background: ${p.theme.colors.spotify}; ${hoverColor(p.theme.colors.spotify)}`

const secondary = p =>
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

  ${primary};
  ${secondary};
`

export const SpotifyButton = styled.button`
  background: ${color('spotify')};
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

  ${p => hoverColor(p.theme.colors.spotify)};
  ${p =>
    p.small &&
    `
    font-size: 12px;
    padding: 0.5em 1.75em;
  `};
`

export const SpotifyLink = SpotifyButton.withComponent('a')

export const Avatar = styled.img.attrs({
  size: 30
})`
  width: ${p => p.size}px;
  height: ${p => p.size}px;
  border-radius: 50%;
  ${space};
`

export const Modal = styled.div`
  display: ${p => (p.visible ? 'block' : 'none')};
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
  background: ${color('light')};
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
  border-bottom: 1px solid ${color('light')};

  &:hover {
    background: ${color('light')};
  }

  strong {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    padding-right: 1em;
  }
`
