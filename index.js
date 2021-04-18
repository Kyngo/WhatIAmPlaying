/**
 * WhatIAmPlaying
 * 
 * This module allows you to show what you're listening to on Spotify with a web widget.
 * 
 * Created by Arnau "Kyngo" Martin.
 * 
 * Code available to use and redistribute accoring to the AGPL 3.0 license.
 */

const fs = require('fs');

const express = require('express');
const axios = require('axios');

const configFilePath = `${__dirname}/credentials.json`;

if (!fs.existsSync(configFilePath)) {
    console.error('[ERR] Missing "credentials.json" file in project root folder! Please create the file as instructed in the project README.');
    process.exit(1);
}

const configuration = JSON.parse(fs.readFileSync(configFilePath, {encoding: 'utf-8'}));

if (
    !configuration.port ||
    !configuration.client ||
    !configuration.secret ||
    !configuration.token ||
    !configuration.refreshToken
) {
    console.error('[ERR] Credentials configuration file is missing either of the following parameters: port, client, secret, token, refreshToken.');
    console.error('Please create the file as instructed in the project README.');
    process.exit(1);
}

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
        const errorLogFilePath = `${__dirname}/messages.log`;
        if (!fs.existsSync(errorLogFilePath)) {
            fs.writeFileSync(errorLogFilePath, '');
        }
        console.error(`Something went wrong when updating the credentials. Please check the logs file located at ${errorLogFilePath} for more details.`);
        fs.appendFileSync(errorLogFilePath, '== NEW ERROR ==');
        fs.appendFileSync(errorLogFilePath, JSON.stringify(err));
        if (err.response) {
            fs.appendFileSync(errorLogFilePath, JSON.stringify(err.response.data));
        }
        else console.log(err);
    });
}

setInterval(refreshToken, 60 * 1000); // refresh token every minute

app.listen(configuration.port, () => {
    console.log(`WhatIAmPlaying Server is listening on port ${configuration.port} !`);
    refreshToken();
});

app.all('*', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, max-age=0');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Powered-By', 'WhatIAmPlaying');
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
            html = fs.readFileSync('./templates/playing.html', {encoding: 'utf-8'})
                .replace(/\$COVER\$/, song.cover)
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

app.all('*', (_, res) => {
    res.redirect('/play');
});
