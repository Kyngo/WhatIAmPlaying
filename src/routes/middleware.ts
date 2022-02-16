export default (req: any, res: any, next: any) => {
    res.setHeader('Cache-Control', 'no-cache, max-age=0');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Powered-By', 'WhatIAmPlaying');
    next();
    console.log(req.method, req.url, req.ip);
}