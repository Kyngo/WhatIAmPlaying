# What I Am Playing

A small widget/API that shows you what you're playing on Spotify.

## Configuration

1. Login to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/login)
2. Create an app on the Dashboard. Put the name and description you wish to get.
3. Enter the app you created, copy the Client ID and Client Secret into the `credentials.json` file (an example is available at `credentials.json.dist`).
4. Click on "Edit settings" and add a redirect URL (can be any URL, for example `http://localhost/callback/`).
5. Open the following URL in your browser: ```bash
https://accounts.spotify.com/authorize?client_id={YOUR_CLIENT_ID}&response_type=code&scope=user-read-currently-playing,user-read-recently-played&redirect_uri=http://localhost/callback/```
6. When you're redirected to `http://localhost/callback/`, you will se that there is a code in the URL (`?code={TOKEN}`). Copy it into the `credentials.json` file as `token`.
7. Run `yarn start`. This will update the token and start a small web server.

## Usage

To view a small widget with the song you're playing, open `http://localhost:38150/play` in your browser.

To get a JSON with the current song being played:

```bash
curl http://localhost:38150/play?mode=json
```

## Example widget

[![Spotify](http://prometheus.kyngo.net:38150/play?v=1)](https://open.spotify.com/user/arno-kun)

## Attributions

This work is inspired by [Novatorem](https://github.com/novatorem/novatorem).

## Contributions

Please, feel free to contribute with code or donations!
