# Music Dashboard - Configuration Guide

## Finding Spotify Playlist URIs

To add your favorite playlists to `FAVORITE_PLAYLISTS` in `musicConfig.js`, you need the Spotify URI for each playlist.

### Method 1: Spotify Desktop/Mobile App

1. Open Spotify
2. Navigate to your playlist
3. Click the **⋯** (three dots) menu
4. Click **Share** → **Copy Spotify URI**
5. The URI will look like: `spotify:playlist:37i9dQZF1DXcBWIGoYBM5M`

### Method 2: Spotify Web Player

1. Open https://open.spotify.com
2. Navigate to your playlist
3. The URL will be: `https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M`
4. Convert to URI format: `spotify:playlist:37i9dQZF1DXcBWIGoYBM5M`

### Special Case: Liked Songs ⚠️

**Important:** The standard Home Assistant Spotify integration **does not support** playing "Liked Songs" directly via URI. This is a limitation of the Spotify API.

**Workarounds:**
1. **Use "Browse All" button** → Navigate to "Liked Songs" in the media browser
2. **Create a playlist** → Make a real Spotify playlist with your liked songs and use that URI
3. **Install SpotifyPlus** → The custom [SpotifyPlus integration](https://github.com/hokiebrian/spotify_plus) adds support for Liked Songs

We recommend using option #1 (Browse All) for easiest access to Liked Songs.

## Adding Playlists to Config

Edit `musicConfig.js` and update the `FAVORITE_PLAYLISTS` object:

```javascript
export const FAVORITE_PLAYLISTS = {
  daz: [
    {
      name: 'Liked Songs',
      uri: 'spotify:user:djarthur78:collection',
      thumbnail: null,
      description: 'Your liked songs',
    },
    {
      name: 'Hip Hop Collector',
      uri: 'spotify:playlist:37i9dQZF1DXcBWIGoYBM5M', // Replace with actual URI
      thumbnail: null,
      description: 'Hip hop collection',
    },
  ],
  nic: [
    // Add Nic's playlists here when connected
  ],
};
```

## Getting Playlist Thumbnails (Optional)

Thumbnails are optional (will use default icon if `null`). To get a thumbnail URL:

1. Use the Spotify Web API (requires API token)
2. Or use a direct image URL from Spotify's CDN
3. Format: `https://i.scdn.co/image/{hash}`

Example:
```javascript
{
  name: 'My Playlist',
  uri: 'spotify:playlist:37i9dQZF1DXcBWIGoYBM5M',
  thumbnail: 'https://i.scdn.co/image/ab67616d0000b273abc123def456',
  description: 'Description here',
}
```

## Testing Your Configuration

1. Build the app: `npm run build`
2. Deploy to Home Assistant
3. Open Music Dashboard → Click "Daz" or "Nic" tab
4. Your favorite playlists should appear immediately
5. Click a playlist to play it on the active speaker
6. Click "Browse All" to access the full Sonos/Spotify library

## Troubleshooting

**Problem:** Playlist doesn't play when clicked
**Solutions:**
- Verify the URI format is correct: `spotify:playlist:YOUR_ACTUAL_ID`
- Make sure you replaced `YOUR_PLAYLIST_ID` with a real Spotify playlist ID
- Test the URI manually in HA Developer Tools:
  ```yaml
  service: media_player.play_media
  data:
    entity_id: media_player.office  # Or any Sonos speaker
    media_content_id: "spotify:playlist:37i9dQZF1DXcBWIGoYBM5M"
    media_content_type: "playlist"
  ```
- Check that your Spotify account is properly linked to Home Assistant

**Problem:** "No favorite playlists configured"
**Solution:** Ensure the `FAVORITE_PLAYLISTS` object has entries for your account (daz or nic)

**Problem:** Wrong playlists showing
**Solution:** Clear browser cache and refresh

**Problem:** "HTTP 500" error when playing
**Solutions:**
- Verify your Spotify integration is set up correctly in HA
- Check that the playlist exists and is accessible
- Try playing the playlist from Spotify app first to ensure it's valid

## Architecture Notes

- Favorite playlists are displayed **instantly** (no browsing required)
- Clicking "Browse All" enables the original browse_media functionality
- Playlists are played via `media_player.play_media` service
- The active speaker determines which device plays the music
