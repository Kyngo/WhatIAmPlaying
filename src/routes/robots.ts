/**
 * This method prevents the application from being tracked by crawlers.
 * Weirdly enough, I get my logs flooded with requests for that godforsaken file, 
 * so here they go.
 * 
 * @param req Express request
 * @param res Express response
 */
export default function (req: any, res: any): void
{
    res.status(200).send(`User-agent: * Disallow: /`);
}