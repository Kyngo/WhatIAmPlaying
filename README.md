# What I Am Playing

A small widget/API that shows you what you're playing on Spotify.

## Requirements

You need Node.js in your machine (tested with versions 10, 12 and 14). Will probably work with older versions of Node.

A recommendation is to also use `pm2` to make the process run forever in background. You can use other options, such as `nodemon` or `forever` if you wish to. A PM2 ecosystem file is included with this repository (`whatiamplaying.config.js`).

## Configuration

1. Login to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/login)
2. Create an app on the Dashboard. Put the name and description you wish to get.
3. Enter the app you created, copy the Client ID and Client Secret into the `credentials.json` file (an example is available at `credentials.json.dist`).
4. Click on "Edit settings" and add a redirect URL (can be any URL, for example `http://localhost/callback/`).
5. Open the following URL in your browser: ```bash
https://accounts.spotify.com/authorize?client_id={YOUR_CLIENT_ID}&response_type=code&scope=user-read-currently-playing,user-read-recently-played&redirect_uri=http://localhost/callback/```
6. When you're redirected to `http://localhost/callback/`, you will se that there is a code in the URL (`?code={TOKEN}`). Copy it into the `credentials.json` file as `token`.
7. Run `yarn start`. This will update the token and start a small web server. If you press Ctrl+C or close the terminal, the program will halt.
8. Configure a Node process manager such as PM2 to make the app run forever in background.

## Usage

To view a small widget with the song you're playing, open `http://localhost:38150/play` in your browser.

To get a JSON with the current song being played:

```bash
curl http://localhost:38150/play?mode=json
```

You can change the default port on the `credentials.json` file if you need to.

## Example widget

[![Spotify](http://prometheus.kyngo.net:38150/play?v=1)](https://open.spotify.com/user/arno-kun)

The widget itself will reply using HTTP. You can use an Apache or Nginx proxy to add an SSL layer if you wish to. You can also use other load balancers to accomplish such thing.

## Attributions

This work is inspired by @Novatorem [Source code](https://github.com/novatorem/novatorem).

## Contributions

Please, feel free to contribute with code or donations!

<a href="https://www.buymeacoffee.com/kyngo" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>
