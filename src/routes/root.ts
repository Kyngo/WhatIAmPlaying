/**
 * Root method - this returns a simple status-like page in JSON format,
 * can be used for health checks.
 * 
 * @param req Express request
 * @param res Express response
 */
export default function (req: any, res: any): void
{
    res.status(200).json({status: 'ok', name: 'WhatIAmPlaying', routes: ['/play']})
}