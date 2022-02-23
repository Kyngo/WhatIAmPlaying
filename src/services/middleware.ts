/**
 * Middleware method, this injects a couple headers in the response.
 * Disables cache, allows CORS and applies a small stamp.
 * 
 * @param req Express request
 * @param res Express response
 * @param next Express callback
 */
export default function (req: any, res: any, next: any): void
{
    res.setHeader('Cache-Control', 'no-cache, max-age=0');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Powered-By', 'WhatIAmPlaying');
    next();
}