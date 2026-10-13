'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteHeader from '@/app/components/layout/SiteHeader';
import SiteFooter from '@/app/components/layout/SiteFooter';
import { cn } from '@/app/components/ui';
import { Eyebrow } from '@/app/components/landing/primitives';

const SECTIONS = [
  { id: "information-we-collect", title: "1. Information We Collect" },
  { id: "how-we-use-your-information", title: "2. How We Use Your Information" },
  { id: "how-we-share-your-information", title: "3. How We Share Your Information" },
  { id: "data-retention", title: "4. Data Retention" },
  { id: "your-data-protection-rights", title: "5. Your Data Protection Rights" },
  { id: "security-of-your-personal-information", title: "6. Security of Your Personal Information" },
  { id: "links-to-other-websites", title: "7. Links to Other Websites" },
  { id: "children-s-privacy", title: "8. Children's Privacy" },
  { id: "changes-to-this-privacy-policy", title: "9. Changes to This Privacy Policy" },
  { id: "contact-us", title: "10. Contact Us" },
];

const LAST_UPDATED = 'August 4, 2025';

/** Tracks the last section heading that has scrolled past the sticky header. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 120) current = id;
      }
      // At the very bottom the last sections can't reach the top — highlight the final one.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = ids[ids.length - 1];
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ids]);
  return active;
}

const SECTION_IDS = SECTIONS.map((s) => s.id);

export default function PrivacyPolicy() {
  const active = useActiveSection(SECTION_IDS);

  return (
    <>
      <SiteHeader />
      <main className="container-page pb-20 pt-12 sm:pt-16">
        <header className="border-b border-line pb-8 animate-fade-up">
          <Eyebrow className="mb-5">Legal</Eyebrow>
          <h1 className="max-w-4xl font-display text-[2.4rem] font-bold uppercase leading-[0.92] tracking-[-0.01em] text-fg sm:text-5xl lg:text-6xl">
            Privacy Policy for Cricshub App and Website
          </h1>
          <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
            <span className="inline-flex items-center gap-1.5">
              <i className="ri-calendar-line text-fg-subtle" aria-hidden />
              Last updated: {LAST_UPDATED}
            </span>
            <span aria-hidden className="text-fg-subtle">·</span>
            <Link href="/terms-of-service" className="rounded font-medium text-primary underline-offset-2 hover:text-primary-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Terms of Service
            </Link>
          </p>
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
          {/* Table of contents */}
          <aside className="lg:order-none">
            <details className="group rounded-card border border-line bg-surface shadow-xs lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-card px-4 py-3 text-sm font-medium text-fg transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                On this page
                <i className="ri-arrow-down-s-line text-lg text-fg-subtle transition-transform duration-200 group-open:rotate-180" aria-hidden />
              </summary>
              <ol className="space-y-0.5 border-t border-line px-2 py-2">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="block rounded-lg px-2 py-1.5 text-sm text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg active:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </details>

            <nav aria-label="On this page" className="sticky top-24 hidden lg:block">
              <p className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-fg">On this page</p>
              <ol className="space-y-px border-l border-line">
                {SECTIONS.map((s) => {
                  const isActive = active === s.id;
                  return (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        aria-current={isActive ? 'location' : undefined}
                        className={cn(
                          '-ml-px block border-l py-1.5 pl-4 text-sm leading-snug transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                          isActive
                            ? 'border-primary font-medium text-primary'
                            : 'border-transparent text-fg-muted hover:border-line-strong hover:text-fg',
                        )}
                      >
                        {s.title}
                      </a>
                    </li>
                  );
                })}
              </ol>
              <a
                href="#top"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="mt-6 inline-flex items-center gap-1.5 rounded pl-4 text-xs font-medium text-fg-subtle transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <i className="ri-arrow-up-line" aria-hidden />
                Back to top
              </a>
            </nav>
          </aside>

          {/* Section headings use the display face (h2 scale) — overrides the .prose-legal default */}
          <article className="prose-legal max-w-3xl">
            <p>
              This Privacy Policy describes how Cricshub ("we," "us," or "our") collects, uses, and discloses your information when you use our mobile application (the "App") and our website, www.cricshub.com (the "Website"). By accessing or using the App or Website, you agree to the collection and use of information in accordance with this policy.
            </p>
            <h2 id="information-we-collect">1. Information We Collect</h2>
            <h3>1.1. Information Collected by the Cricshub App</h3>
            <p>
              When you use the Cricshub App, we collect several types of information from and about users, including:
            </p>
            <ul>
              <li>
                <strong>Personal Information:</strong> Information that can be used to identify you, such as your name, email address, and any other information you provide when you register for an account, subscribe to our newsletter, or contact us.
              </li>
              <li>
                <strong>Usage Data:</strong> Information about how you access and use the App, such as your device IP address, device type, operating system, app features accessed, and the dates and times of your sessions.
              </li>
              <li>
                <strong>Cookies and Tracking Technologies:</strong> We use cookies and similar tracking technologies (like web beacons and pixels) to track activity on our App and hold certain information. Cookies are files with a small amount of data that may include an anonymous unique identifier.
              </li>
            </ul>
            <h3>1.2. Information Collected by the Cricshub Website (www.cricshub.com)</h3>
            <p>
              When you visit our website, www.cricshub.com, we primarily collect information you voluntarily provide through forms, such as:
            </p>
            <ul>
              <li>
                <strong>Name:</strong> When you submit inquiries or sign up for newsletters.
              </li>
              <li>
                <strong>Email Address:</strong> When you submit inquiries or sign up for newsletters.
              </li>
            </ul>
            <p>
              The website's data collection is limited to these purposes to respond to your requests and manage subscriptions.
            </p>
            <h2 id="how-we-use-your-information">2. How We Use Your Information</h2>
            <p>
              We use the collected information for various purposes, including to:
            </p>
            <ul>
              <li>Provide and maintain our App.</li>
              <li>Improve, personalize, and expand our App.</li>
              <li>Understand and analyze how you use our App.</li>
              <li>Develop new products, services, features, and functionality.</li>
              <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the App and Website, and for marketing and promotional purposes.</li>
              <li>Send you emails.</li>
              <li>Find and prevent fraud.</li>
            </ul>
            <h2 id="how-we-share-your-information">3. How We Share Your Information</h2>
            <p>
              We may share your information in the following situations:
            </p>
            <ul>
              <li>
                <strong>With Service Providers:</strong> We may share your personal information with service providers to monitor and analyze the use of our App and Website, and to contact you.
              </li>
              <li>
                <strong>For Business Transfers:</strong> We may share or transfer your personal information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.
              </li>
              <li>
                <strong>With Affiliates:</strong> We may share your information with our affiliates, in which case we will require those affiliates to honor this Privacy Policy. Affiliates include our parent company and any other subsidiaries, joint venture partners, or other companies that we control or that are under common control with us.
              </li>
              <li>
                <strong>With Business Partners:</strong> We may share your information with our business partners to offer you certain products, services, or promotions.
              </li>
              <li>
                <strong>With Other Users:</strong> When you share personal information or otherwise interact in the public areas of the App, such information may be viewed by all users and may be publicly distributed outside.
              </li>
              <li>
                <strong>With Your Consent:</strong> We may disclose your personal information for any other purpose with your consent.
              </li>
            </ul>
            <h2 id="data-retention">4. Data Retention</h2>
            <p>
              We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations (for example, if we are required to retain your data to comply with applicable laws), resolve disputes, and enforce our legal agreements and policies.
            </p>
            <h2 id="your-data-protection-rights">5. Your Data Protection Rights</h2>
            <p>
              Depending on your location, you may have the following rights regarding your personal data:
            </p>
            <ul>
              <li>
                <strong>The right to access</strong> – You have the right to request copies of your personal data.
              </li>
              <li>
                <strong>The right to rectification</strong> – You have the right to request that we correct any information you believe is inaccurate or complete information you believe is incomplete.
              </li>
              <li>
                <strong>The right to erasure</strong> – You have the right to request that we erase your personal data, under certain conditions.
              </li>
              <li>
                <strong>The right to restrict processing</strong> – You have the right to request that we restrict the processing of your personal data, under certain conditions.
              </li>
              <li>
                <strong>The right to object to processing</strong> – You have the right to object to our processing of your personal data, under certain conditions.
              </li>
              <li>
                <strong>The right to data portability</strong> – You have the right to request that we transfer the data that we have collected to another organization, or directly to you, under certain conditions.
              </li>
            </ul>
            <h2 id="security-of-your-personal-information">6. Security of Your Personal Information</h2>
            <p>
              The security of your personal information is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
            </p>
            <h2 id="links-to-other-websites">7. Links to Other Websites</h2>
            <p>
              Our App and Website may contain links to other websites that are not operated by us. If you click on a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
            </p>
            <h2 id="children-s-privacy">8. Children's Privacy</h2>
            <p>
              Our App and Website do not address anyone under the age of 13. We do not knowingly collect personally identifiable information from anyone under the age of 13. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us. If we become aware that we have collected personal information from anyone under the age of 13 without verification of parental consent, we take steps to remove that information from our servers.
            </p>
            <h2 id="changes-to-this-privacy-policy">9. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. We will let you know via email and/or a prominent notice on our App or Website, prior to the change becoming effective and update the "Last updated" date at the top of this Privacy Policy. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
            </p>
            <h2 id="contact-us">10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, you can contact us:
            </p>
            <ul>
              <li>By email: support@cricshub.com</li>
              <li>By visiting this page on our website: <a href="https://www.cricshub.com">www.cricshub.com</a></li>
            </ul>
          </article>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
