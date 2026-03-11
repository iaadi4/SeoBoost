export interface GlossaryTerm {
  slug: string
  title: string
  description: string
  content: string
  category: 'Technical' | 'On-Page' | 'Off-Page' | 'Content'
}

export const glossaryTerms: GlossaryTerm[] = [
  {
    slug: 'canonical-tag',
    title: 'Canonical Tag',
    description: 'A canonical tag (rel="canonical") is an HTML element that helps webmasters prevent duplicate content issues by specifying the "canonical" or "preferred" version of a web page.',
    content: `
      <h2>What is a Canonical Tag?</h2>
      <p>A canonical tag is a snippet of HTML code that defines the main version for duplicate, near-duplicate and similar pages. In other words, if you have different URLs with identical or very similar content, you use canonical tags to tell search engines which version they should index and rank.</p>
      
      <h2>Why are Canonical Tags Important for SEO?</h2>
      <ul>
        <li><strong>Prevents Duplicate Content:</strong> Search engines can get confused when there are multiple URLs with the same content. They might not know which URL to rank.</li>
        <li><strong>Consolidates Link Equity:</strong> If other sites link to different versions of your page, a canonical tag consolidates all those links (and their ranking power) into the single, preferred URL.</li>
        <li><strong>Improves Crawl Budget:</strong> By avoiding crawling duplicate pages, search engine bots can spend more time crawling your unique, important content.</li>
      </ul>

      <h2>How to Implement a Canonical Tag</h2>
      <p>Add the following code inside the <code>&lt;head&gt;</code> section of your HTML:</p>
      <pre><code>&lt;link rel="canonical" href="https://example.com/preferred-page/" /&gt;</code></pre>
    `,
    category: 'Technical'
  },
  {
    slug: 'core-web-vitals',
    title: 'Core Web Vitals',
    description: 'Core Web Vitals are a set of specific factors that Google considers important in a webpage\'s overall user experience.',
    content: `
      <h2>What are Core Web Vitals?</h2>
      <p>Core Web Vitals are a subset of Web Vitals that apply to all web pages, should be measured by all site owners, and will be surfaced across all Google tools. Each of the Core Web Vitals represents a distinct facet of the user experience, is measurable in the field, and reflects the real-world experience of a critical user-centric outcome.</p>

      <h2>The Three Pillars of Core Web Vitals</h2>
      <ul>
        <li><strong>Largest Contentful Paint (LCP):</strong> Measures loading performance. To provide a good user experience, LCP should occur within 2.5 seconds of when the page first starts loading.</li>
        <li><strong>Interaction to Next Paint (INP):</strong> Measures responsiveness. INP observes the latency of all interactions a user has with the page, and reports a single value which all (or nearly all) interactions were below. A good INP is under 200 milliseconds.</li>
        <li><strong>Cumulative Layout Shift (CLS):</strong> Measures visual stability. To provide a good user experience, pages should maintain a CLS of 0.1. or less.</li>
      </ul>

      <h2>Why Core Web Vitals Matter</h2>
      <p>Google uses Core Web Vitals as a ranking signal. While excellent content is still paramount, if there are two pages with similar content quality, the one with better Core Web Vitals will likely rank higher.</p>
    `,
    category: 'Technical'
  },
  {
    slug: 'robots-txt',
    title: 'Robots.txt',
    description: 'A robots.txt file tells search engine crawlers which URLs the crawler can access on your site.',
    content: `
      <h2>What is a Robots.txt File?</h2>
      <p>A robots.txt file lives at the root of your site (e.g., www.example.com/robots.txt). It uses the Robots Exclusion Protocol (REP) to regulate how search engine spiders crawl and index your website. It's essentially a set of instructions for bots.</p>

      <h2>Common Uses for Robots.txt</h2>
      <ul>
        <li><strong>Preventing Indexing of Certain Areas:</strong> You can block bots from crawling admin sections, private directories, or duplicate content.</li>
        <li><strong>Managing Crawl Budget:</strong> By preventing bots from crawling unimportant or low-value pages, you ensure they spend their time on your most important content.</li>
        <li><strong>Specifying Sitemap Location:</strong> You can point crawlers to your XML sitemap within the robots.txt file.</li>
      </ul>

      <h2>Basic Syntax</h2>
      <pre><code>User-agent: *
Disallow: /admin/
Allow: /</code></pre>
      <p>This tells all bots (User-agent: *) not to crawl the /admin/ directory, but allows them to crawl everything else.</p>
    `,
    category: 'Technical'
  },
  {
    slug: 'backlinks',
    title: 'Backlinks',
    description: 'Backlinks are links from one website to a page on another website. Google and other major search engines consider backlinks "votes" for a specific page.',
    content: `
      <h2>What are Backlinks?</h2>
      <p>In SEO terminology a backlink is a link created when one website links to another. Backlinks are also called "inbound links" or "incoming links." Backlinks are important to SEO.</p>

      <h2>Why are Backlinks Important?</h2>
      <p>Backlinks are especially valuable for SEO because they represent a "vote of confidence" from one site to another. In essence, backlinks to your website are a signal to search engines that others vouch for your content. If many sites link to the same webpage or website, search engines can infer that content is worth linking to, and therefore also worth surfacing on a SERP.</p>

      <h2>Types of Backlinks</h2>
      <ul>
        <li><strong>Dofollow Links:</strong> These are the standard links that pass SEO value (Link Equity) from the linking site to the destination site.</li>
        <li><strong>Nofollow Links:</strong> These links have a <code>rel="nofollow"</code> tag, telling search engines not to pass rank effectively. They still have networking and referral traffic value, but less direct SEO impact.</li>
      </ul>
    `,
    category: 'Off-Page'
  }
]
