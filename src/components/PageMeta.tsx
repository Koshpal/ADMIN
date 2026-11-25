import { useEffect } from 'react';
import { matchPath, useLocation } from 'react-router-dom';

/**
 * Per-page metadata for the admin portal. The portal is a single-page app, so the browser tab, link
 * previews and search results would otherwise all show the one title from index.html. This sets the
 * <title>, description, canonical URL and Open Graph / Twitter tags for whichever route is on screen.
 * Add a row to PAGES when you add a route.
 */
const ORIGIN = 'https://admin.koshpal.com';
const PORTAL = 'Koshpal Admin Portal';

interface PageMetaEntry {
  /** react-router path pattern */
  path: string;
  title: string;
  description: string;
}

const DEFAULT_ENTRY: PageMetaEntry = {
  path: '/',
  title: 'Admin Portal',
  description: 'Koshpal admin portal: manage companies, coaches, employees, sessions and the coaching programme.',
};

export const PAGES: PageMetaEntry[] = [
  { path: '/login', title: 'Admin Login', description: 'Sign in to the Koshpal admin portal to manage companies, coaches, employees and coaching sessions.' },
  { path: '/dashboard', title: 'Dashboard', description: 'Platform-wide overview of companies, coaches, employees, sessions and activity across Koshpal.' },
  { path: '/companies', title: 'Companies', description: 'Add and manage the companies on Koshpal, their HR contacts, employee counts and plans.' },
  { path: '/coaches', title: 'Coaches', description: 'Review, onboard and manage the certified financial coaches on the Koshpal platform.' },
  { path: '/users', title: 'Users', description: 'Search and manage employee, HR and coach accounts across every company.' },
  { path: '/sessions', title: 'Sessions', description: 'See every coaching session across Koshpal, with status, coach, employee and outcome.' },
  { path: '/coaching/assignments', title: 'Coach Assignments', description: 'Assign employees to coaches and review the status of every coaching assignment.' },
  { path: '/coaching/programs', title: 'Coaching Programs', description: 'Edit the coaching programme, its session templates and the content coaches follow in each session.' },
  { path: '/coaching/operations', title: 'Coaching Operations', description: 'Monitor day-to-day coaching operations: follow-ups, overdue tasks and sessions that need attention.' },
  { path: '/coaching/escalations', title: 'Escalations', description: 'Review and resolve escalations raised by coaches, including welfare and safety concerns.' },
  { path: '/coaching/playbook', title: 'Coach Playbook', description: 'Write, review, approve and publish the playbook articles that coaches use in sessions.' },
  { path: '/coaching/quality', title: 'Coaching Quality', description: 'Review coaching quality scorecards and session feedback to keep standards high.' },
  { path: '/coaching/learning', title: 'Coach Learning', description: 'Manage coach training modules, progress and certification status.' },
  { path: '/coaching/content', title: 'Coaching Content', description: 'Manage worksheets, homework templates and financial tools shown to coaches and employees.' },
  { path: '/coaching/consent', title: 'Consent Management', description: 'Manage coaching consent text and versions, and see which employees have given consent.' },
  { path: '/analytics', title: 'Analytics', description: 'Platform analytics: adoption, session volume, engagement and outcomes across all companies.' },
  { path: '/onboarding', title: 'Onboarding', description: 'Onboard new companies and bulk-add employees to Koshpal.' },
  { path: '/settings', title: 'Settings', description: 'Admin account, security and platform settings for the Koshpal admin portal.' },
];

/** Set (or create) a <meta> in <head>. */
function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string | null) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!href) { el?.remove(); return; }
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function resolvePageMeta(pathname: string): { entry: PageMetaEntry; canonical: string | null } {
  const entry = PAGES.find((p) => matchPath({ path: p.path, end: true }, pathname));
  if (!entry) return { entry: DEFAULT_ENTRY, canonical: null };
  // A canonical URL must not carry a record id or a reset token, so parameterised routes get none.
  return { entry, canonical: entry.path.includes(':') ? null : `${ORIGIN}${entry.path}` };
}

export default function PageMeta() {
  const { pathname } = useLocation();
  useEffect(() => {
    const { entry, canonical } = resolvePageMeta(pathname);
    const title = entry === DEFAULT_ENTRY ? 'Koshpal Admin Portal' : `${entry.title} | ${PORTAL}`;
    document.title = title;
    setMeta('name', 'description', entry.description);
    setMeta('name', 'robots', 'index, follow');
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', entry.description);
    setMeta('property', 'og:url', canonical ?? ORIGIN);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', entry.description);
    setCanonical(canonical);
  }, [pathname]);
  return null;
}
