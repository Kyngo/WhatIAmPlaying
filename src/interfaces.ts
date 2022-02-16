/**
 * ICredentialsFile interface
 * 
 * Defines the structure that the credentials file has to follow.
 * 
 * This file also contains core configuration for the app such as the server port.
 */
interface ICredentialsFile {
    port: number,
    client: string,
    secret: string,
    token: string,
    refreshUrl?: string,
    refreshToken?: string
}

/**
 * IJSONSong interface
 * 
 * This is part of the response model for the JSON API, in case you don't want to get an image.
 * 
 * This specific part contains details about the track being currently played on Spotify.
 */
interface IJSONSong {
    name: string,
    artist: string,
    album: string,
    cover: string,
    link: string
}

/**
 * IJSONReply interface
 * 
 * This is the response model for the JSON API, which contains the IJSONSong model in itself.
 * 
 * It may not return a song if an error occurs, or nothing is being played.
 */
interface IJSONReply {
    status: string,
    message?: string,
    song?: IJSONSong
}

/**
 * IQueryParams interface
 * 
 * This is the request model for the Spotify API to update the token required to make the currently playing API call.
 * 
 * Depending on if you have the API token or not, some or other parameters will be sent
 */
interface IQueryParams {
    grant_type: string,
    redirect_uri?: string,
    code?: string,
    refresh_token?: string
}

export {
    ICredentialsFile,
    IJSONReply,
    IQueryParams
};