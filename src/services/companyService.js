/**
 * Add-an-Ad Advertising Agency Platform
 * Real Company Directory & Backend Client Integration Service
 * Connects with:
 * - ClientController & AdminController (/api/client, /api/admin/clients)
 * - ReviewController (/api/reviews/public/client/{clientId})
 * - CampaignController (/api/campaign/client/{clientId})
 */

import { getAllClients, getClientById } from '../pages/client/api';
import { getCampaignsByClientId } from '../pages/campaign/campaignApi';
import {
  getClientReviewSummary,
  getPublicReviewsForClient,
  getAllPublicReviews,
} from '../pages/communication/reviewApi';

// Fallback demo company catalog used strictly for offline preview when requested by user
export const DEFAULT_COMPANIES = [
  {
    clientID: 101,
    companyName: 'OmniVanguard Digital',
    tagline: 'Full-Funnel Performance Video & E-Commerce Scaling',
    companyDetails:
      'OmniVanguard Digital is a premier growth and performance marketing agency. We partner with direct-to-consumer and enterprise brands to build, deploy, and scale high-converting ad creatives. With proprietary audience targeting tools and dedicated creative directors, our team delivers predictable returns on ad spend across every major digital placement.',
    category: 'Performance Marketing',
    tags: ['YouTube Video Ads', 'Meta Performance Ads', 'E-commerce Scaling', 'ROAS Optimization'],
    location: 'New York, NY',
    email: 'marcus@omnivanguard.io',
    contactNumber: '+1 (555) 849-2041',
    representative: 'Marcus Vance',
    established: '2018',
    completedCampaigns: 142,
    clientSatisfaction: '99%',
    avgRoas: '3.8x',
    verified: true,
    accentColor: '#08D9D6',
    services: [
      {
        title: 'Performance Video Ads',
        desc: 'Direct-response video production scripted and styled for YouTube, Reels, and TikTok high conversions.',
      },
      {
        title: 'Multi-Channel Paid Ads',
        desc: 'Full-funnel campaign management across Google Search, Display, Meta Ads, and programmatic networks.',
      },
      {
        title: 'Conversion Funnel CRO',
        desc: 'Continuous A/B testing of landing page headlines and lead funnels maximizing click-through conversion.',
      },
      {
        title: 'Attribution & Analytics',
        desc: 'Clear weekly KPI reports, CPA tracking, and transparent rate cards without hidden agency markups.',
      },
    ],
  },
  {
    clientID: 102,
    companyName: 'Lumina Creative Labs',
    tagline: 'Interactive Viral Ads & High-Impact Brand Storytelling',
    companyDetails:
      'Lumina Creative Labs crafts unforgettable visual narratives that capture audience attention in under three seconds. Specializing in rapid creative testing, interactive digital displays, and 3D visual assets, Lumina bridges the gap between artistic elegance and viral engagement for consumer tech & lifestyle enterprises.',
    category: 'Creative & Viral Media',
    tags: ['Viral Storytelling', '3D Motion Ads', 'TikTok & Instagram', 'Brand Identity'],
    location: 'San Francisco, CA',
    email: 'elena@luminacreative.com',
    contactNumber: '+1 (555) 672-1194',
    representative: 'Elena Rostova',
    established: '2020',
    completedCampaigns: 98,
    clientSatisfaction: '98%',
    avgRoas: '4.2x',
    verified: true,
    accentColor: '#FF2E63',
    services: [
      {
        title: 'Viral Social Content',
        desc: 'Short-form dynamic storytelling engineered for organic momentum and paid algorithmic amplification.',
      },
      {
        title: '3D Product CGI & VFX',
        desc: 'Photorealistic 3D product renders and immersive visual assets tailored for digital displays.',
      },
      {
        title: 'Brand Identity Systems',
        desc: 'Cohesive typography, color guidelines, and multi-platform digital asset libraries.',
      },
      {
        title: 'Rapid Creative Testing',
        desc: 'Weekly testing of dozens of ad hooks to systematically isolate high-performing winner concepts.',
      },
    ],
  },
  {
    clientID: 103,
    companyName: 'Apex Brand Strategies',
    tagline: 'Omnichannel Advertising & Precision Media Placement',
    companyDetails:
      'Apex Brand Strategies combines over a decade of media buying intelligence with aggressive brand-building methodologies. From high-visibility digital billboards and Google Search dominance to on-site consumer pins, Apex ensures your brand remains memorable and prominent at every consumer decision point.',
    category: 'Omnichannel Strategy',
    tags: ['Search Engine Hype', 'Media Pins', 'Audience Retargeting', 'Brand Equity'],
    location: 'Chicago, IL',
    email: 'julian@apexbrand.co',
    contactNumber: '+1 (555) 438-9920',
    representative: 'Julian Holloway',
    established: '2014',
    completedCampaigns: 265,
    clientSatisfaction: '97%',
    avgRoas: '3.5x',
    verified: true,
    accentColor: '#08D9D6',
    services: [
      {
        title: 'Omnichannel Media Buying',
        desc: 'Cross-platform ad distribution that reinforces brand authority across every consumer touchpoint.',
      },
      {
        title: 'High-Intent Search Ads',
        desc: 'Capturing bottom-of-the-funnel search volume and converting intent into immediate transactions.',
      },
      {
        title: 'On-Site Media Pins & DOOH',
        desc: 'Precision-placed physical and digital location ads designed for maximum geographic recall.',
      },
      {
        title: 'Rate Card Negotiation',
        desc: 'Maximizing every marketing dollar with aggressive vendor rate card negotiation and audits.',
      },
    ],
  },
  {
    clientID: 1,
    companyName: 'Nova Marketing Agency',
    tagline: 'Integrated Multi-Platform Campaigns & Rapid Audience Growth',
    companyDetails:
      'Nova Marketing Agency has been the creative powerhouse behind numerous top-charting marketing initiatives. Our integrated team handles everything from creative ideation to technical campaign setup, ensuring effortless collaboration and stellar audience response across all digital touchpoints.',
    category: 'Integrated Campaigns',
    tags: ['YouTube Promos', 'Audience Targeting', 'Campaign Management', 'ROI Driven'],
    location: 'Austin, TX',
    email: 'contact@novamarketing.agency',
    contactNumber: '+1 (555) 312-9840',
    representative: 'Alexander Wright',
    established: '2019',
    completedCampaigns: 120,
    clientSatisfaction: '100%',
    avgRoas: '4.5x',
    verified: true,
    accentColor: '#08D9D6',
    services: [
      {
        title: 'Full Lifecycle Campaigning',
        desc: 'Comprehensive management of timelines, creative assets, ad variants, and spend distribution.',
      },
      {
        title: 'High-Definition Video Promos',
        desc: 'Studio-grade video production optimized for maximum viewer retention and strong call-to-actions.',
      },
      {
        title: 'Behavioral Segmentation',
        desc: 'Laser-focused behavioral and demographic clustering for maximum ad relevance and engagement.',
      },
      {
        title: 'Post-Campaign Reporting',
        desc: 'In-depth ROI breakdowns, impression audits, and strategic recommendations for next flights.',
      },
    ],
  },
  {
    clientID: 104,
    companyName: 'EchoSphere Media',
    tagline: 'Gen-Z Influencer Amplification & Social Hyper-Scaling',
    companyDetails:
      'EchoSphere Media connects forward-thinking brands with authentic creator voices. We negotiate, produce, and manage hundreds of influencer partnerships, generating viral waves and brand buzz that traditional ads cannot match.',
    category: 'Influencer & Social',
    tags: ['Influencer Marketing', 'TikTok Viral', 'Creator Network', 'Gen-Z Reach'],
    location: 'Los Angeles, CA',
    email: 'claire@echosphere.net',
    contactNumber: '+1 (555) 201-7782',
    representative: 'Claire Bennett',
    established: '2021',
    completedCampaigns: 85,
    clientSatisfaction: '96%',
    avgRoas: '3.9x',
    verified: true,
    accentColor: '#FF2E63',
    services: [
      {
        title: 'Creator Matchmaking',
        desc: 'Matching vetted niche creators who genuinely resonate with your product and target demographic.',
      },
      {
        title: 'Whitelisted Spark Ads',
        desc: 'Running paid ad spend directly through creator profiles for up to 300% higher authenticity.',
      },
      {
        title: 'Trend Jacking Production',
        desc: 'Capitalizing on breakout memes, audio trends, and cultural conversations within 48 hours.',
      },
      {
        title: 'Creator ROI Tracking',
        desc: 'Granular tracking of affiliate codes, trackable shortlinks, and brand sentiment metrics.',
      },
    ],
  },
  {
    clientID: 105,
    companyName: 'Pulse Velocity Advertising',
    tagline: 'High-Frequency Programmatic Ads & Behavioral Retargeting',
    companyDetails:
      'Pulse Velocity Advertising harnesses automated programmatic algorithms to bid on the highest quality ad inventory in milliseconds. Perfect for large-scale enterprise campaigns needing continuous ad rotation and dynamic creative personalization.',
    category: 'Programmatic & AI',
    tags: ['Programmatic Ads', 'Dynamic Banners', 'AI Optimization', 'Global Scale'],
    location: 'Seattle, WA',
    email: 'hello@pulsevelocity.io',
    contactNumber: '+1 (555) 902-3341',
    representative: 'Victor Sterling',
    established: '2022',
    completedCampaigns: 170,
    clientSatisfaction: '98%',
    avgRoas: '3.7x',
    verified: true,
    accentColor: '#08D9D6',
    services: [
      {
        title: 'Programmatic Bidding',
        desc: 'Real-time bidding across global ad exchanges reaching 92% of the internet-connected population.',
      },
      {
        title: 'Dynamic Creative (DCO)',
        desc: 'Ads that automatically tailor imagery and discounts based on weather, location, and user behavior.',
      },
      {
        title: 'Omnipresent Retargeting',
        desc: 'Re-engaging high-intent cart abandoners across desktop, tablet, and mobile applications.',
      },
      {
        title: 'Fraud-Free Verification',
        desc: 'Strict brand safety filters preventing invalid click bots and unauthorized domain placements.',
      },
    ],
  },
];

/**
 * Check if the backend Spring Boot server is reachable
 */
export async function checkBackendHealth() {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
    const res = await fetch(`${API_BASE_URL}/api/reviews/public/all`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(3500),
    });
    return { connected: res.ok, status: res.status };
  } catch (err) {
    return { connected: false, error: err.message, isNetworkError: true };
  }
}

/**
 * Helper to infer clean category name from company name & details
 */
function inferCategory(companyName = '', details = '') {
  const text = `${companyName} ${details}`.toLowerCase();
  if (text.includes('environ') || text.includes('green') || text.includes('eco') || text.includes('sustain')) {
    return 'Sustainable & Eco Products';
  }
  if (text.includes('build') || text.includes('construct') || text.includes('engineer')) {
    return 'Engineering & Construction';
  }
  if (text.includes('fashion') || text.includes('cloth') || text.includes('apparel') || text.includes('wear')) {
    return 'Fashion & Apparel';
  }
  if (text.includes('super') || text.includes('retail') || text.includes('mart') || text.includes('store') || text.includes('grocery')) {
    return 'Retail & Consumer Goods';
  }
  if (text.includes('ad') || text.includes('market') || text.includes('media') || text.includes('campaign') || text.includes('promo')) {
    return 'Digital Advertising & Media';
  }
  return 'Enterprise Business Solutions';
}

/**
 * Helper to determine genuine location from phone number, company name, or details
 */
function inferLocation(contactNumber = '', details = '', name = '') {
  const text = `${name} ${details} ${contactNumber}`.toLowerCase();
  if (text.includes('lanka') || contactNumber?.startsWith('07') || contactNumber?.startsWith('+94')) {
    return 'Sri Lanka';
  }
  if (contactNumber?.startsWith('+1') || text.includes('usa') || text.includes('united states') || text.includes('york') || text.includes('austin')) {
    return 'United States';
  }
  return 'Verified Business';
}

/**
 * Helper to generate tags from description
 */
function inferTags(companyName = '', details = '', category = '') {
  const text = `${companyName} ${details} ${category}`.toLowerCase();
  const tags = [];
  if (text.includes('video') || text.includes('youtube')) tags.push('Video Ads');
  if (text.includes('social') || text.includes('facebook') || text.includes('meta')) tags.push('Meta Ads');
  if (text.includes('search') || text.includes('google')) tags.push('Google Ads');
  if (text.includes('tiktok')) tags.push('TikTok Viral');
  if (text.includes('environ') || text.includes('eco')) tags.push('Eco Solutions');
  if (text.includes('build') || text.includes('engineer')) tags.push('Modern Design');
  if (text.includes('fashion') || text.includes('cloth')) tags.push('Trendsetters');
  if (text.includes('e-commerce') || text.includes('growth')) tags.push('Growth & CRO');
  if (text.includes('pin')) tags.push('On-Site Pins');
  if (tags.length === 0) tags.push('Ad Campaigns', 'Branding');
  return tags.slice(0, 4);
}

/**
 * Fetch real companies from the backend via Spring Boot REST APIs (/api/admin/clients, /api/client).
 * Enriches each company with live public rating summaries and real campaigns.
 */
export async function getRealCompanies({ allowDemoFallback = false } = {}) {
  try {
    // 1. Fetch real client records from Spring Boot backend (ClientController / AdminController)
    const backendClients = await getAllClients();

    if (!Array.isArray(backendClients)) {
      throw new Error('Invalid response format from backend clients endpoint.');
    }

    if (backendClients.length === 0) {
      // Backend online but no clients registered yet
      return {
        connected: true,
        companies: [],
        isDemo: false,
      };
    }

    // 2. Enrich each real client with genuine live ratings and active campaigns from the backend
    const companyList = await Promise.all(
      backendClients.map(async (bc) => {
        const id = bc.clientID || bc.id;
        const name = bc.companyName || `${bc.firstName || ''} ${bc.lastName || ''}`.trim() || `Client Agency #${id}`;
        const bio = bc.companyDetails || 'Registered brand client providing verified advertising solutions.';
        const representative = `${bc.firstName || ''} ${bc.lastName || ''}`.trim() || 'Business Representative';
        const location = inferLocation(bc.contactNumber, bio, name);
        const category = inferCategory(name, bio);

        // Fetch real summary & campaigns in parallel for this client
        const [summary, campaigns, publicReviews] = await Promise.all([
          getClientReviewSummary(id).catch(() => null),
          getCampaignsByClientId(id).catch(() => []),
          getPublicReviewsForClient(id).catch(() => []),
        ]);

        const realCampaigns = Array.isArray(campaigns) ? campaigns : [];
        const reviewsCount = Number(summary?.totalReviews !== undefined ? summary.totalReviews : (publicReviews?.length || 0));
        const avgRating = Number(summary?.averageRating || 0);

        return {
          clientID: id,
          companyName: name,
          tagline: bio.length > 90 ? bio.slice(0, 90) + '...' : bio,
          companyDetails: bio,
          category,
          tags: inferTags(name, bio, category),
          location,
          email: bc.email || '',
          contactNumber: bc.contactNumber || '',
          representative,
          status: bc.status || 'PENDING',
          verified: bc.status === 'ACCEPTED',
          accentColor: '#08D9D6',
          completedCampaigns: realCampaigns.length,
          campaigns: realCampaigns,
          rating: avgRating,
          reviewCount: reviewsCount,
          starBreakdown: summary?.starBreakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          services: realCampaigns.length > 0
            ? realCampaigns.map((camp) => ({
                title: camp.campaignName || camp.campaignType || 'Active Campaign',
                desc: `Channel allocation: ${camp.selectedChannels || 'Multi-platform'} (Budget: Rs. ${Number(camp.campaignPrices || 0).toLocaleString()})`,
              }))
            : [
                {
                  title: 'Core Business Offerings',
                  desc: bio,
                },
                {
                  title: 'Multi-Channel Advertising',
                  desc: 'Targeted media buying, ad campaigns, and brand engagement.',
                },
              ],
        };
      })
    );

    return {
      connected: true,
      companies: companyList,
      isDemo: false,
    };
  } catch (err) {
    console.warn('Backend connection error in getRealCompanies:', err?.message);

    if (allowDemoFallback) {
      return {
        connected: false,
        companies: DEFAULT_COMPANIES,
        isDemo: true,
        error: err.message,
      };
    }

    throw err;
  }
}

/**
 * Fetch a specific real company by client ID using backend APIs.
 * Connects with:
 * - getClientById(clientId) -> /api/client/{id}
 * - getCampaignsByClientId(clientId) -> /api/campaign/client/{id}
 * - getClientReviewSummary(clientId) -> /api/reviews/public/client/{id}/summary
 * - getPublicReviewsForClient(clientId) -> /api/reviews/public/client/{id}
 */
export async function getRealCompanyById(clientId, { allowDemoFallback = false } = {}) {
  try {
    // 1. Fetch real client profile from backend: GET /api/client/{id}
    let clientProfile = null;
    try {
      clientProfile = await getClientById(clientId);
    } catch (e) {
      if (e.isNetworkError) throw e;
      // Fallback: search in getAllClients() list
      try {
        const all = await getAllClients();
        clientProfile = all?.find((c) => String(c.clientID || c.id) === String(clientId));
      } catch {}
    }

    if (!clientProfile) {
      // If not in live backend, check if demo fallback allowed
      if (allowDemoFallback) {
        const demoComp = DEFAULT_COMPANIES.find((c) => String(c.clientID) === String(clientId)) || DEFAULT_COMPANIES[0];
        return {
          connected: false,
          company: demoComp,
          reviews: [],
          summary: {
            clientId: Number(clientId),
            brandName: demoComp.companyName,
            averageRating: demoComp.rating || 4.8,
            totalReviews: demoComp.reviewCount || 4,
            starBreakdown: { 5: 3, 4: 1, 3: 0, 2: 0, 1: 0 },
            reviews: [],
          },
          campaigns: [],
          isDemo: true,
          error: 'Using offline demo profile',
        };
      }
      throw new Error(`Company with ID ${clientId} not found.`);
    }

    // 2. Fetch real live reviews, ratings summary, and active campaigns concurrently
    const [summary, publicReviews, campaigns] = await Promise.all([
      getClientReviewSummary(clientId).catch(() => null),
      getPublicReviewsForClient(clientId).catch(() => []),
      getCampaignsByClientId(clientId).catch(() => []),
    ]);

    const name = clientProfile.companyName || `${clientProfile.firstName || ''} ${clientProfile.lastName || ''}`.trim() || `Company #${clientId}`;
    const bio = clientProfile.companyDetails || 'Verified business providing advertising and marketing solutions.';
    const representative = `${clientProfile.firstName || ''} ${clientProfile.lastName || ''}`.trim() || 'Account Lead';
    const location = inferLocation(clientProfile.contactNumber, bio, name);
    const category = inferCategory(name, bio);

    const realCampaigns = Array.isArray(campaigns) ? campaigns : [];
    const reviewsList = Array.isArray(publicReviews) ? publicReviews : (summary?.reviews || []);
    const reviewCount = Number(summary?.totalReviews !== undefined ? summary.totalReviews : reviewsList.length);
    const rating = Number(summary?.averageRating !== undefined ? summary.averageRating : 0);

    const enriched = {
      clientID: clientProfile.clientID || clientId,
      companyName: name,
      tagline: bio.length > 90 ? bio.slice(0, 90) + '...' : bio,
      companyDetails: bio,
      category,
      tags: inferTags(name, bio, category),
      location,
      email: clientProfile.email || '',
      contactNumber: clientProfile.contactNumber || '',
      representative,
      status: clientProfile.status || 'PENDING',
      verified: clientProfile.status === 'ACCEPTED',
      completedCampaigns: realCampaigns.length,
      rating,
      reviewCount,
      accentColor: '#08D9D6',
      services: realCampaigns.length > 0
        ? realCampaigns.map((camp) => ({
            title: camp.campaignName || camp.campaignType || 'Active Campaign',
            desc: `Channels: ${camp.selectedChannels || 'Digital'} | Price: Rs. ${Number(camp.campaignPrices || 0).toLocaleString()} (${camp.status || 'ACTIVE'})`,
          }))
        : [
            {
              title: 'Primary Business Offerings',
              desc: bio,
            },
            {
              title: 'Multi-Channel Advertising',
              desc: 'Custom promotional placements across print, digital, and social networks.',
            },
          ],
    };

    return {
      connected: true,
      company: enriched,
      reviews: reviewsList,
      summary: summary || {
        clientId: Number(clientId),
        brandName: name,
        averageRating: rating,
        totalReviews: reviewCount,
        starBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        reviews: reviewsList,
      },
      campaigns: realCampaigns,
      isDemo: false,
    };
  } catch (err) {
    console.warn('Backend connection error in getRealCompanyById:', err?.message);
    if (allowDemoFallback) {
      const demoComp = DEFAULT_COMPANIES.find((c) => String(c.clientID) === String(clientId)) || DEFAULT_COMPANIES[0];
      return {
        connected: false,
        company: demoComp,
        reviews: [],
        summary: {
          clientId: Number(clientId),
          brandName: demoComp.companyName,
          averageRating: demoComp.rating || 4.8,
          totalReviews: demoComp.reviewCount || 4,
          starBreakdown: { 5: 3, 4: 1, 3: 0, 2: 0, 1: 0 },
          reviews: [],
        },
        campaigns: [],
        isDemo: true,
        error: err.message,
      };
    }
    throw err;
  }
}
