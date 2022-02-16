/**
 * Not found method. This simply returns a 404 response. That's it.
 * 
 * @param req Express request
 * @param res Express response
 */

export default function (req: any, res: any): void
{
    res.json({ status: "not found" });
}