'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteHeader from '@/app/components/layout/SiteHeader';
import SiteFooter from '@/app/components/layout/SiteFooter';
import { cn } from '@/app/components/ui';
import { Eyebrow } from '@/app/components/landing/primitives';

const SECTIONS = [
  { id: "definitions", title: "1. Definitions" },
  { id: "user-accounts", title: "2. User Accounts" },
  { id: "prohibited-uses", title: "3. Prohibited Uses" },
  { id: "intellectual-property", title: "4. Intellectual Property" },
  { id: "links-to-other-websites", title: "5. Links to Other Websites" },
  { id: "termination", title: "6. Termination" },
  { id: "limitation-of-liability", title: "7. Limitation of Liability" },
  { id: "governing-law", title: "8. Governing Law" },
  { id: "changes-to-these-terms-of-service", title: "9. Changes to These Terms of Service" },
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

export default function TermsOfService() {
  const active = useActiveSection(SECTION_IDS);

  return (
    <>
      <SiteHeader />
      <main className="container-page pb-20 pt-12 sm:pt-16">
        <header className="border-b border-line pb-8 animate-fade-up">
          <Eyebrow className="mb-5">Legal</Eyebrow>
          <h1 className="max-w-4xl font-display text-[2.4rem] font-bold uppercase leading-[0.92] tracking-[-0.01em] text-fg sm:text-5xl lg:text-6xl">
            Terms of Service for Cricshub
          </h1>
          <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
            <span className="inline-flex items-center gap-1.5">
              <i className="ri-calendar-line text-fg-subtle" aria-hidden />
              Last updated: {LAST_UPDATED}
            </span>
            <span aria-hidden className="text-fg-subtle">·</span>
            <Link href="/privacy-policy" className="rounded font-medium text-primary underline-offset-2 hover:text-primary-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Privacy Policy
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
              Welcome to Cricshub! These Terms of Service ("Terms") govern your use of the Cricshub website located at www.cricshub.com (the "Service"). Please read these Terms carefully before using our Service.
            </p>
            <p>
              By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
            </p>
            <h2 id="definitions">1. Definitions</h2>
            <ul>
              <li>
                <strong>Account:</strong> A unique account created for You to access our Service or parts of our Service.
              </li>
              <li>
                <strong>Company:</strong> Refers to Cricshub ("We", "Us", "Our").
              </li>
              <li>
                <strong>Service:</strong> Refers to the Website.
              </li>
              <li>
                <strong>Website:</strong> Refers to Cricshub, accessible from www.cricshub.com
              </li>
              <li>
                <strong>You:</strong> Means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.
              </li>
            </ul>
            <h2 id="user-accounts">2. User Accounts</h2>
            <p>
              When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
            </p>
            <p>
              You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party social media Service.
            </p>
            <h2 id="prohibited-uses">3. Prohibited Uses</h2>
            <p>
              You may use the Service only for lawful purposes and in accordance with these Terms. You agree not to use the Service:
            </p>
            <ul>
              <li>In any way that violates any applicable national or international law or regulation.</li>
              <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way by exposing them to inappropriate content or otherwise.</li>
              <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail," "chain letter," "spam," or any other similar solicitation.</li>
              <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity.</li>
              <li>In any way that infringes upon the rights of others, or in any way is illegal, threatening, fraudulent, or harmful, or in connection with any unlawful, illegal, fraudulent, or harmful purpose or activity.</li>
            </ul>
            <h2 id="intellectual-property">4. Intellectual Property</h2>
            <p>
              The Service and its original content (excluding content provided by you or other users), features, and functionality are and will remain the exclusive property of Cricshub and its licensors. The Service is protected by copyright, trademark, and other laws of both the country and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Cricshub.
            </p>
            <h2 id="links-to-other-websites">5. Links to Other Websites</h2>
            <p>
              Our Service may contain links to third-party web sites or services that are not owned or controlled by Cricshub.
            </p>
            <p>
              Cricshub has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services. You further acknowledge and agree that Cricshub shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with use of or reliance on any such content, goods or services available on or through any such web sites or services.
            </p>
            <p>
              We strongly advise you to read the terms and conditions and privacy policies of any third-party web sites or services that you visit.
            </p>
            <h2 id="termination">6. Termination</h2>
            <p>
              We may terminate or suspend your Account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms of Service.
            </p>
            <p>
              Upon termination, your right to use the Service will immediately cease. If you wish to terminate your Account, you may simply discontinue using the Service.
            </p>
            <h2 id="limitation-of-liability">7. Limitation of Liability</h2>
            <p>
              Notwithstanding any damages that you might incur, the entire liability of the Company and any of its suppliers under any provision of this Terms and Your exclusive remedy for all of the foregoing shall be limited to the amount actually paid by You through the Service or 100 USD if You haven't purchased anything through the Service.
            </p>
            <p>
              To the maximum extent permitted by applicable law, in no event shall the Company or its suppliers be liable for any special, incidental, indirect, or consequential damages whatsoever (including, but not limited to, damages for loss of profits, loss of data or other information, for business interruption, for personal injury, loss of privacy arising out of or in any way related to the use of or inability to use the Service, third-party software and/or third-party hardware used with the Service, or otherwise in connection with any provision of this Terms), even if the Company or any supplier has been advised of the possibility of such damages and even if the remedy fails of its essential purpose.
            </p>
            <h2 id="governing-law">8. Governing Law</h2>
            <p>
              The laws of India, excluding its conflicts of law rules, shall govern this Terms and Your use of the Service. Your use of the Application may also be subject to other local, state, national, or international laws.
            </p>
            <h2 id="changes-to-these-terms-of-service">9. Changes to These Terms of Service</h2>
            <p>
              We reserve the right, at Our sole discretion, to modify or replace these Terms at any time. If a revision is material We will make reasonable efforts to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at Our sole discretion.
            </p>
            <p>
              By continuing to access or use Our Service after those revisions become effective, You agree to be bound by the revised terms. If You do not agree to the new terms, in whole or in part, please stop using the website and the Service.
            </p>
            <h2 id="contact-us">10. Contact Us</h2>
            <p>
              If you have any questions about these Terms of Service, you can contact us:
            </p>
            <ul>
              <li>By email: support@cricshub.com</li>
              <li>By visiting this page on our website: www.cricshub.com/contact</li>
            </ul>
          </article>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
