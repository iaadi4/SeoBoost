import * as cheerio from 'cheerio';

export interface SEOReport {
    score: number;
    title: { value: string; pass: boolean; message: string };
    description: { value: string; pass: boolean; message: string };
    h1: { count: number; value: string; pass: boolean; message: string };
    images: { total: number; missingAlt: number; pass: boolean; message: string };
    links: { total: number; internal: number; external: number; message: string };
    content: { wordCount: number; pass: boolean; message: string };
    technical: {
        hasViewport: boolean;
        hasFavicon: boolean;
        isIndexable: boolean;
        hasOGTags: boolean;
        pass: boolean;
        message: string;
    };
}

export async function scanDomain(url: string): Promise<SEOReport> {
    try {
        // Ensure URL has protocol
        const targetUrl = url.startsWith('http') ? url : `https://${url}`;
        
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'SEOBoostBot/2.0 (+https://seoboost.com)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            next: { revalidate: 3600 } 
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch domain: ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        let score = 100;

        // 1. Title Tag Check (15 pts)
        const title = $('title').text().trim();
        const titlePass = title.length >= 30 && title.length <= 65;
        if (!titlePass) score -= 15;

        // 2. Meta Description Check (15 pts)
        const description = $('meta[name="description"]').attr('content')?.trim() || '';
        const descPass = description.length >= 70 && description.length <= 160;
        if (!descPass) score -= 15;

        // 3. H1 Check (10 pts)
        const h1s = $('h1');
        const h1Count = h1s.length;
        const h1Pass = h1Count === 1;
        if (!h1Pass) score -= 10;

        // 4. Images Alt Check (10 pts)
        const images = $('img');
        let missingAlt = 0;
        images.each((_, el) => {
            const alt = $(el).attr('alt');
            if (!alt || alt.trim() === '') {
                missingAlt++;
            }
        });
        const imagesPass = images.length === 0 || (missingAlt / images.length) <= 0.2; // Less than 20% missing alt allowed
        if (!imagesPass) score -= 10;

        // 5. Links Analysis (5 pts)
        const links = $('a');
        let internal = 0;
        let external = 0;
        
        const domainURL = new URL(targetUrl);
        links.each((_, el) => {
            const href = $(el).attr('href');
            if (href) {
                if (href.startsWith('http') && !href.includes(domainURL.hostname)) {
                    external++;
                } else if (href.startsWith('/') || href.includes(domainURL.hostname)) {
                    internal++;
                }
            }
        });
        // We just penalize if there are absolutely no internal links (poor architecture)
        if (internal === 0 && links.length > 0) score -= 5;

        // 6. Content Volume / Word Count check (15 pts)
        // Extract plain text from body, removing scripts and styles
        $('script, style, noscript, svg, nav, footer').remove();
        const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
        const wordCount = bodyText.split(' ').filter(w => w.length > 0).length;
        const wordPass = wordCount >= 300; // General rule of thumb for indexable pages
        if (!wordPass) score -= 15;

        // 7. Technical Checks (30 pts combined)
        const hasViewport = $('meta[name="viewport"]').length > 0;
        const hasFavicon = $('link[rel="icon"], link[rel="shortcut icon"]').length > 0;
        
        const robotsMeta = $('meta[name="robots"]').attr('content')?.toLowerCase() || '';
        const isIndexable = !robotsMeta.includes('noindex');

        const hasOGTitle = $('meta[property="og:title"]').length > 0;
        const hasOGImage = $('meta[property="og:image"]').length > 0;
        const hasOGTags = hasOGTitle || hasOGImage;

        // Penalties for critical technical failures
        if (!hasViewport) score -= 10;
        if (!hasFavicon) score -= 5;
        if (!isIndexable) score -= 15; // Critical error if they want SEO
        if (!hasOGTags) score -= 5;

        const technicalPass = hasViewport && isIndexable && hasOGTags;

        // Normalize score
        score = Math.max(0, Math.min(100, score));

        return {
            score,
            title: {
                value: title,
                pass: titlePass,
                message: titlePass ? "Optimal length" : title ? `Title length (${title.length}) should be 30-65 chars` : "Missing Title tag"
            },
            description: {
                value: description,
                pass: descPass,
                message: descPass ? "Optimal length" : description ? `Description length (${description.length}) should be 70-160 chars` : "Missing Meta Description"
            },
            h1: {
                count: h1Count,
                value: h1s.first().text().trim().substring(0, 100) + (h1Count > 0 && h1s.first().text().length > 100 ? "..." : ""),
                pass: h1Pass,
                message: h1Pass ? "Only one H1 tag found (Good)" : h1Count === 0 ? "Missing H1 tag" : "Multiple H1 tags found. Use exactly one."
            },
            images: {
                total: images.length,
                missingAlt,
                pass: imagesPass,
                message: imagesPass ? "Images formats optimized" : `${missingAlt} out of ${images.length} images are missing alt text.`
            },
            links: {
                total: links.length,
                internal,
                external,
                message: `Found ${internal} internal and ${external} external links.`
            },
            content: {
                wordCount,
                pass: wordPass,
                message: wordPass ? "Sufficient content volume" : `Thin content detected (${wordCount} words). Aim for at least 300 words.`
            },
            technical: {
                hasViewport,
                hasFavicon,
                isIndexable,
                hasOGTags,
                pass: technicalPass,
                message: isIndexable ? (technicalPass ? "Core technical tags present" : "Missing some technical tags (viewport, favicon, or OG)") : "CRITICAL: Page is blocked from search engines (noindex detected)!"
            }
        };

    } catch (error) {
        console.error("Scan error:", error);
        throw new Error("Failed to scan the domain. Make sure the URL is correct and accessible.");
    }
}
