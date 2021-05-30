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
const sharp = require('sharp');

const configFilePath = `${__dirname}/credentials.json`;

if (!fs.existsSync(configFilePath)) {
    console.error('[ERR] Missing "credentials.json" file in project root folder! Please create the file as instructed in the project README.');
    process.exit(1);
}

const configuration = JSON.parse(fs.readFileSync(configFilePath, {encoding: 'utf-8'}));

if (
    !configuration.port ||
    !configuration.client ||
    !configuration.secret
) {
    console.error('[ERR] Credentials configuration file is missing either of the following parameters: port, client, secret, token.');
    console.error('Please create the file as instructed in the project README.');
    process.exit(1);
}

if (!configuration.refreshUrl) {
    console.error('[ERR] Missing refresh URL. Please add the callback URL used to obtain the token inside the "credentials.json" file.');
    console.error('If you followed the example given in the README file, you should enter "http://localhost/callback/" as the value.');
    process.exit(1);
}

if (!configuration.token) {
    console.error('[ERR] Credentials are missing a token. To retrieve it, please follow this link:');
    console.error(`https://accounts.spotify.com/authorize?client_id=${configuration.client}&response_type=code&scope=user-read-currently-playing,user-read-recently-played&redirect_uri=${configuration.refreshUrl}`)
    process.exit(1);
}

const app = express();

const refreshToken = () => {
    const encodedToken = new Buffer.from(`${configuration.client}:${configuration.secret}`).toString('base64');
    let queryParams = {
        grant_type: 'authorization_code',
        redirect_uri: configuration.refreshUrl,
        code: configuration.token
    };
    if (configuration.refreshToken) {
        queryParams = {
            grant_type: 'refresh_token', 
            refresh_token: configuration.refreshToken
        };
    }
    axios({
        url: 'https://accounts.spotify.com/api/token',
        method: 'POST',
        headers: {
            Authorization: `Basic ${encodedToken}`
        }, 
        params: queryParams
    }).then((res) => {
        configuration.token = res.data.access_token;
        if (res.data.refresh_token) {
            configuration.refreshToken = res.data.refresh_token;
        }
        fs.writeFileSync('./credentials.json', JSON.stringify(configuration, null, 4));
        console.log('Updated credentials');
    }).catch((err) => {
        const errorLogFilePath = `${__dirname}/messages.log`;
        if (!fs.existsSync(errorLogFilePath)) {
            fs.writeFileSync(errorLogFilePath, '');
        }
        console.error(`Something went wrong when updating the credentials. Please check the logs file located at ${errorLogFilePath} for more details.`);
        fs.appendFileSync(errorLogFilePath, '== NEW ERROR ==\n');
        fs.appendFileSync(errorLogFilePath, JSON.stringify(err) + '\n');
        if (err.response) {
            fs.appendFileSync(errorLogFilePath, JSON.stringify(err.response.data) + '\n');
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
            const img = await axios.get(song.cover, { responseType: 'arraybuffer' });
            const barcode = await axios.get(`https://scannables.scdn.co/uri/plain/png/000000/white/1024/${currentlyPlaying.item.uri}`, { responseType: 'arraybuffer' });
            const image = `data:image/jpeg;base64,${Buffer.from(img.data, 'binary').toString('base64')}`;
            let { artist, album, name } = song;
            if (name.length > 25) {
                name = name.slice(0, 22) + "...";
            }
            if (album.length > 40) {
                name = name.slice(0, 40) + "...";
            }

            const headphones = fs.readFileSync('./templates/headphones.png');

            html = fs.readFileSync('./templates/playing.svg', {encoding: 'utf-8'})
                .replace(/\$HEADPHONES\$/, `data:image/png;base64,${Buffer.from(headphones, 'binary').toString('base64')}`)
                .replace(/\$COVER\$/, image)
                .replace(/\$BARCODE\$/, `data:image/png;base64,${Buffer.from(barcode.data, 'binary').toString('base64')}`)
                .replace(/\$ARTIST\$/, artist)
                .replace(/\$ALBUM\$/, album)
                .replace(/\$NAME\$/, name);
        }
    } else {
        if (req.query.mode == 'json') {
            statusCode = 404;
            jsonReply = {status: 'error', message: 'Nothing is being played.'};
        } else {
            html = fs.readFileSync('./templates/nothing.svg', 'utf-8');
        }
    }
    
    res.status(statusCode);
    if (req.query.mode == 'json') {
        res.json(jsonReply);
    } else {
        sharp(Buffer.from(html)).jpeg({ quality: 100, progressive: true }).toBuffer().then(image => {
            res.set({'Content-Type': 'image/jpeg'});
            res.send(image);
        }).catch(err => {
            res.status(500).send('Something went wrong when parsing the results...');
            console.error(err);
        });
    }
});

app.all('*', (_, res) => {
    res.redirect('/play');
});
