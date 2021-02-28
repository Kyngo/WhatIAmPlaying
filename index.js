/**
 * WhatIAmPlaying
 * 
 * This module allows you to show what you're listening to on Spotify with a web widget.
 * 
 * Copyright (c) 2021 Arnau "Kyngo" Martin. 
 * 
 * Code available to use and redistribute accoring to the AGPL 3.0 license.
 */

const fs = require('fs');

const express = require('express');
const axios = require('axios');

const configuration = JSON.parse(fs.readFileSync('./credentials.json', {encoding: 'utf-8'}));

const app = express();

const refreshToken = () => {
    const encodedToken = new Buffer.from(`${configuration.client}:${configuration.secret}`).toString('base64');
    axios({
        url: 'https://accounts.spotify.com/api/token',
        method: 'POST',
        headers: {
            Authorization: `Basic ${encodedToken}`
        }, 
        params: {
            grant_type: 'refresh_token', 
            refresh_token: configuration.refreshToken
        }
    }).then((res) => {
        configuration.token = res.data.access_token;
        fs.writeFileSync('./credentials.json', JSON.stringify(configuration, null, 4));
        console.log('Updated credentials');
    }).catch((err) => {
        if (err.response) console.log(err.response.data);
        else console.log(err);
    });
}

setInterval(refreshToken, 60 * 1000); // refresh token every minute

app.listen(configuration.port, () => {
    console.log(`WhatIAmPlaying Server is listening on port ${configuration.port} !`);
    refreshToken();
});

app.all('*', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, max-age=0')
    next();
    console.log(req.method, req.url, req.ip);
});

app.get('/play', async (req, res) => {
    const currentlyPlayingReq = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {headers: {Authorization: `Bearer ${configuration.token}`}});
    const currentlyPlaying = currentlyPlayingReq.data;
    let statusCode = 200;
    let html = '';
    let jsonReply = [];
    if (currentlyPlayingReq.status == 200) {
        const song = {
            name: currentlyPlaying.item.name,
            artist: currentlyPlaying.item.artists[0].name,
            album: currentlyPlaying.item.album.name,
            cover: currentlyPlaying.item.album.images[0].url,
            link: currentlyPlaying.item.external_urls.spotify
        };
        if (req.query.mode == 'json') {
            jsonReply = {status: 'ok', song};
        } else {
            const img = await axios.get(song.cover, { responseType: 'arraybuffer' });
            const image = `data:image/jpeg;base64,${Buffer.from(img.data, 'binary').toString('base64')}`;
            html = fs.readFileSync('./templates/playing.html', {encoding: 'utf-8'})
                .replace(/\$COVER\$/, image)
                .replace(/\$ARTIST\$/, song.artist)
                .replace(/\$ALBUM\$/, song.album)
                .replace(/\$NAME\$/, song.name)
                .replace(/\$SONGLINK\$/, song.link);
        }
    } else {
        if (req.query.mode == 'json') {
            statusCode = 404;
            jsonReply = {status: 'error', message: 'Nothing is being played.'};
        } else {
            html = fs.readFileSync('./templates/nothing.html', 'utf-8');
        }
    }
    
    res.status(statusCode);
    if (req.query.mode == 'json') {
        res.json(jsonReply);
    } else {
        res.set({'Content-Type': 'image/svg+xml; charset=utf-8'});
        res.send(html);
    }
});