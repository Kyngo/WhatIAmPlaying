import sharp from 'sharp';
import * as fs from 'fs';

import Requester from '../services/request';

import log from '../services/logger';

import { ICredentialsFile, IJSONReply, IJSONSong } from '../interfaces';

/**
 * Play method - this will query the Spotify API and parse its result.
 * If nothing is being played, a specific response will be given.
 * Otherwise, the thumbnail will be obtained and the current track
 * will be returned as JSON or image.
 *
 * @param req Express request
 * @param res Express response
 * @param credentials Spotify credentials file
 */
export default async function (req: any, res: any, credentials: ICredentialsFile): Promise<void> {
  const currentlyPlayingReq = await Requester.get('https://api.spotify.com/v1/me/player/currently-playing?additional_types=episode', {
    headers: { Authorization: `Bearer ${credentials.token}` }
  });
  const currentlyPlaying = currentlyPlayingReq.data;
  let statusCode = 200;
  let html = '';
  let jsonReply: IJSONReply = { status: 'pending' };
  if (currentlyPlayingReq.status === 200) {
    const song: IJSONSong = {
      name: currentlyPlaying.item.name,
      artist: currentlyPlaying.currently_playing_type === 'track' ? currentlyPlaying.item.artists[0].name : currentlyPlaying.item.show.publisher,
      album: currentlyPlaying.currently_playing_type === 'track' ? currentlyPlaying.item.album.name : currentlyPlaying.item.show.name,
      cover: currentlyPlaying.currently_playing_type === 'track' ? currentlyPlaying.item.album.images[0].url : currentlyPlaying.item.images[0].url,
      link: currentlyPlaying.item.external_urls.spotify
    };
    if (req.query.mode === 'json') {
      jsonReply = { status: 'ok', song };
    } else {
      const img = await Requester.get(song.cover, { responseType: 'arraybuffer' });
      const barcode = await Requester.get(`https://scannables.scdn.co/uri/plain/png/000000/white/1024/${currentlyPlaying.item.uri}`, { responseType: 'arraybuffer' });
      const image = `data:image/jpeg;base64,${Buffer.from(img.data, 'binary').toString('base64')}`;
      let { artist, album, name } = song;
      if (name.length > 40) {
        name = name.slice(0, 37) + "...";
      }
      if (album.length > 70) {
        album = album.slice(0, 67) + "...";
      }

      const icon = fs.readFileSync(currentlyPlaying.currently_playing_type === 'track' ? './templates/headphones.png' : './templates/microphone.png').toString('base64');

      html = fs.readFileSync('./templates/playing.svg', { encoding: 'utf-8' })
        .replace(/\$HEADPHONES\$/, `data:image/png;base64,${icon}`)
        .replace(/\$COVER\$/, image)
        .replace(/\$BARCODE\$/, `data:image/png;base64,${Buffer.from(barcode.data, 'binary').toString('base64')}`)
        .replace(/\$ARTIST\$/, artist.replace('&', '&amp;'))
        .replace(/\$ALBUM\$/, album.replace('&', '&amp;'))
        .replace(/\$NAME\$/, name.replace('&', '&amp;'));
    }
  } else {
    if (req.query.mode === 'json') {
      statusCode = 404;
      jsonReply = { status: 'error', message: 'Nothing is being played.' };
    } else {
      html = fs.readFileSync('./templates/nothing.svg', 'utf-8');
    }
  }

  res.status(statusCode);
  if (req.query.mode === 'json') {
    res.json(jsonReply);
  } else {
    sharp(Buffer.from(html)).jpeg({ quality: 100, progressive: true }).toBuffer().then(image => {
      res.set({ 'Content-Type': 'image/jpeg' });
      res.send(image);
    }).catch(err => {
      res.status(500).send('Something went wrong when parsing the results...');
      log(err);
    });
  }
}
