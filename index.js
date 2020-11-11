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
refreshToken();
setInterval(refreshToken, 60 * 1000); // refresh token every minute

app.listen(configuration.port, () => {
    console.log(`Server is listening on port ${configuration.port}`);
});

app.all('*', (req, res, next) => {
    next();
    console.log(req.method, req.url, req.ip);
});

app.get('/play', (req, res) => {
    axios.get('https://api.spotify.com/v1/me/player/currently-playing', {headers: {Authorization: `Bearer ${configuration.token}`}}).then((response) => {
        if (response.status == 200) {
            const song = {
                name: response.data.item.name,
                artist: response.data.item.artists[0].name,
                album: response.data.item.album.name,
                cover: response.data.item.album.images[0].url,
                link: response.data.item.external_urls.spotify
            };
            if (req.query.mode == 'json') {
                res.status(200).json({status: 'ok', song});
            } else {
                const html = fs.readFileSync('./templates/playing.html')
                                .toString('utf-8')
                                .replace(/\$COVER\$/, song.cover)
                                .replace(/\$ARTIST\$/, song.artist)
                                .replace(/\$ALBUM\$/, song.album)
                                .replace(/\$NAME\$/, song.name)
                                .replace(/\$SONGLINK\$/, song.link);
                res.send(html);
            }
        } else {
            if (req.query.mode == 'json') {
                res.status(404).json({status: 'error', message: 'Nothing is being played.'});
            } else {
                const html = fs.readFileSync('./templates/nothing.html').toString('utf-8');
                res.send(html)
            }
        }
    })
})