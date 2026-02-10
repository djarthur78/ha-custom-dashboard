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

### Special Case: Liked Songs

Your "Liked Songs" collection has a special URI format:
```
spotify:user:{your_username}:collection
```

To find your Spotify username:
1. Go to your Spotify profile
2. Click **⋯** → **Share** → **Copy Profile Link**
3. The link will be: `https://open.spotify.com/user/{username}`
4. Use that username in: `spotify:user:{username}:collection`

For example, if your link is `https://open.spotify.com/user/djarthur78`, your Liked Songs URI is:
```
spotify:user:djarthur78:collection
```

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

**Problem:** Playlist doesn't play
**Solution:** Check that the URI format is correct (spotify:playlist:ID)

**Problem:** "No favorite playlists configured"
**Solution:** Ensure the `FAVORITE_PLAYLISTS` object has entries for your account (daz or nic)

**Problem:** Wrong playlists showing
**Solution:** Clear browser cache and refresh

## Architecture Notes

- Favorite playlists are displayed **instantly** (no browsing required)
- Clicking "Browse All" enables the original browse_media functionality
- Playlists are played via `media_player.play_media` service
- The active speaker determines which device plays the music
