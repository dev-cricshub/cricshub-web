'use client';

import { useState } from 'react';
import Link from 'next/link';
import SiteHeader from '@/app/components/layout/SiteHeader';
import SiteFooter from '@/app/components/layout/SiteFooter';
import { Alert, Button, Card, Field, IconTile, Input, Textarea, useToast } from '@/app/components/ui';
import { Eyebrow } from '@/app/components/landing/primitives';
import { SOCIAL_LINKS, SUPPORT_EMAIL } from '@/lib/site';

type FormData = { name: string; email: string; message: string };
type Errors = Partial<Record<keyof FormData, string>>;

const EMPTY: FormData = { name: '', email: '', message: '' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(data: FormData): Errors {
  const errors: Errors = {};
  if (!data.name.trim()) errors.name = 'Please enter your name.';
  if (!data.email.trim()) errors.email = 'Please enter your email address.';
  else if (!EMAIL_RE.test(data.email.trim())) errors.email = 'That email address doesn’t look right.';
  if (!data.message.trim()) errors.message = 'Please write a message.';
  else if (data.message.trim().length < 10) errors.message = 'Add a little more detail (at least 10 characters).';
  return errors;
}

export default function ContactUs() {
  const toast = useToast();
  const [formData, setFormData] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(formData);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsLoading(true);
    setSubmitStatus('idle');
    setSubmitMessage('');

    // API payload mapping message to 'phone' field as per existing schema
    const apiData = {
      name: formData.name,
      email: formData.email,
      phone: formData.message, // Using 'phone' field for the message content
    };

    try {
      const response = await fetch('https://userbasecrix.onrender.com/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setSubmitMessage('Your message has been sent successfully! We will get back to you soon.');
        setFormData(EMPTY);
        toast('Message sent', { tone: 'success', description: 'We’ll get back to you soon.' });
      } else {
        const errorText = await response.text();
        setSubmitStatus('error');
        setSubmitMessage(`Failed to send message: ${errorText}. Please try again.`);
      }
    } catch (error) {
      console.error('Error sending contact form:', error);
      setSubmitStatus('error');
      setSubmitMessage('A network error occurred. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitStatus('idle');
    setSubmitMessage('');
    setErrors({});
  };

  return (
    <>
      <SiteHeader />
      <main className="container-page py-12 sm:py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          {/* Aside */}
          <div className="animate-fade-up">
            <Eyebrow className="mb-5">Contact</Eyebrow>
            <h1 className="font-display text-[2.6rem] font-bold uppercase leading-[0.92] tracking-[-0.01em] text-fg sm:text-6xl">
              Get in touch
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-fg-muted">
              Have questions, feedback, or just want to say hello? We&apos;d love to hear from you. Fill out the
              form or reach out to us directly.
            </p>

            <div className="mt-8 space-y-3">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="group flex items-center gap-4 rounded-card border border-line bg-surface p-4 shadow-xs transition-[border-color,box-shadow] duration-200 hover:border-line-strong hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-surface-2"
              >
                <IconTile icon="ri-mail-line" tone="primary" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-fg">Email us</span>
                  <span className="block truncate text-sm text-fg-muted">{SUPPORT_EMAIL}</span>
                </span>
                <i
                  className="ri-arrow-right-up-line text-lg text-fg-subtle transition-colors group-hover:text-primary"
                  aria-hidden
                />
              </a>
              <div className="flex items-center gap-4 rounded-card border border-line bg-surface p-4 shadow-xs">
                <IconTile icon="ri-time-line" tone="neutral" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-fg">Response time</span>
                  <span className="block text-sm text-fg-muted">Within 24–48 business hours</span>
                </span>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-sm font-medium text-fg">Follow us</p>
              <div className="mt-3 flex gap-2">
                {SOCIAL_LINKS.map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Follow us on ${s.name}`}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-lg text-fg-muted shadow-xs transition-colors hover:border-line-strong hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-surface-2"
                  >
                    <i className={s.icon} aria-hidden />
                  </a>
                ))}
              </div>
            </div>

            <p className="mt-8 text-sm text-fg-muted">
              Have an idea to improve CricsHub?{' '}
              <Link href="/feedback" className="rounded font-medium text-primary underline-offset-2 hover:text-primary-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Share feedback
              </Link>
            </p>
          </div>

          {/* Form */}
          <Card padding="lg" className="animate-fade-up self-start [animation-delay:80ms]">
            {submitStatus === 'success' ? (
              <div className="flex flex-col items-center py-8 text-center animate-scale-in" role="status">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-2xl text-success">
                  <i className="ri-check-line" aria-hidden />
                </span>
                <h2 className="mt-5 font-display text-2xl font-bold uppercase leading-none text-fg">Message sent</h2>
                <p className="mt-2 max-w-sm text-sm text-fg-muted">{submitMessage}</p>
                <Button variant="secondary" icon="ri-add-line" className="mt-6" onClick={resetForm}>
                  Send another message
                </Button>
              </div>
            ) : (
              <>
                <h2 className="font-display text-lg font-bold uppercase tracking-wide text-fg sm:text-xl">Send us a message</h2>
                <p className="mt-1 text-sm text-fg-muted">All fields are required.</p>

                <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
                  {submitStatus === 'error' && (
                    <Alert tone="danger" title="Message not sent">
                      {submitMessage}
                    </Alert>
                  )}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Your name" error={errors.name}>
                      {({ id, describedBy, invalid }) => (
                        <Input
                          id={id}
                          aria-describedby={describedBy}
                          invalid={invalid}
                          type="text"
                          name="name"
                          autoComplete="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="John Doe"
                          required
                        />
                      )}
                    </Field>
                    <Field label="Your email" error={errors.email}>
                      {({ id, describedBy, invalid }) => (
                        <Input
                          id={id}
                          aria-describedby={describedBy}
                          invalid={invalid}
                          type="email"
                          name="email"
                          autoComplete="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="john.doe@example.com"
                          required
                        />
                      )}
                    </Field>
                  </div>
                  <Field label="Your message" error={errors.message}>
                    {({ id, describedBy, invalid }) => (
                      <Textarea
                        id={id}
                        aria-describedby={describedBy}
                        invalid={invalid}
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={6}
                        placeholder="How can we help?"
                        required
                      />
                    )}
                  </Field>
                  <Button type="submit" size="lg" block loading={isLoading} trailingIcon="ri-send-plane-line">
                    {isLoading ? 'Sending…' : 'Send message'}
                  </Button>
                </form>
              </>
            )}
          </Card>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
