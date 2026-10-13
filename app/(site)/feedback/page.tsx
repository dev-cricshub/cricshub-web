'use client';

import { useState } from 'react';
import Link from 'next/link';
import SiteHeader from '@/app/components/layout/SiteHeader';
import SiteFooter from '@/app/components/layout/SiteFooter';
import { Alert, Button, Card, Field, IconTile, Input, Textarea, useToast } from '@/app/components/ui';
import { Eyebrow } from '@/app/components/landing/primitives';
import { API_BASE, SUPPORT_EMAIL } from '@/lib/site';

type FormData = { userName: string; userEmail: string; message: string };
type Errors = Partial<Record<keyof FormData, string>>;

const EMPTY: FormData = { userName: '', userEmail: '', message: '' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TOPICS = [
  { icon: 'ri-bug-line', title: 'Something broke', text: 'Bugs, glitches or anything that didn’t work as expected.' },
  { icon: 'ri-lightbulb-flash-line', title: 'An idea', text: 'Features you’d love to see in the app, dashboard or overlays.' },
  { icon: 'ri-broadcast-line', title: 'Your broadcast', text: 'How streaming and scoring went at your last match.' },
];

function validate(data: FormData): Errors {
  const errors: Errors = {};
  if (!data.userName.trim()) errors.userName = 'Please enter your name.';
  if (!data.userEmail.trim()) errors.userEmail = 'Please enter your email address.';
  else if (!EMAIL_RE.test(data.userEmail.trim())) errors.userEmail = 'That email address doesn’t look right.';
  if (!data.message.trim()) errors.message = 'Please share your feedback.';
  else if (data.message.trim().length < 10) errors.message = 'Add a little more detail (at least 10 characters).';
  return errors;
}

export default function FeedbackPage() {
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

    try {
      const response = await fetch(`${API_BASE}/api/v1/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setSubmitMessage('Thank you for your feedback!');
        setFormData(EMPTY);
        toast('Feedback sent', { tone: 'success', description: 'Thanks for helping us improve CricsHub.' });
      } else {
        const errorText = await response.text();
        setSubmitStatus('error');
        setSubmitMessage(`Failed to send feedback: ${errorText}`);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitStatus('error');
      setSubmitMessage('A network error occurred. Please try again.');
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
            <Eyebrow className="mb-5">Feedback</Eyebrow>
            <h1 className="font-display text-[2.6rem] font-bold uppercase leading-[0.92] tracking-[-0.01em] text-fg sm:text-6xl">
              Help us make CricsHub better
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-fg-muted">
              Share your thoughts, suggestions, or experiences with us. Every note is read by the team building the
              product.
            </p>

            <ul className="mt-8 space-y-5">
              {TOPICS.map((t) => (
                <li key={t.title} className="flex gap-4">
                  <IconTile icon={t.icon} tone="neutral" size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg">{t.title}</p>
                    <p className="mt-0.5 text-sm text-fg-muted">{t.text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-8 border-t border-line pt-6 text-sm text-fg-muted">
              Need a reply from support?{' '}
              <Link href="/contact-us" className="rounded font-medium text-primary underline-offset-2 hover:text-primary-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Contact us
              </Link>{' '}
              or email{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="rounded font-medium text-primary underline-offset-2 hover:text-primary-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </div>

          {/* Form */}
          <Card padding="lg" className="animate-fade-up self-start [animation-delay:80ms]">
            {submitStatus === 'success' ? (
              <div className="flex flex-col items-center py-8 text-center animate-scale-in" role="status">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-2xl text-success">
                  <i className="ri-heart-line" aria-hidden />
                </span>
                <h2 className="mt-5 font-display text-2xl font-bold uppercase leading-none text-fg">Feedback received</h2>
                <p className="mt-2 max-w-sm text-sm text-fg-muted">
                  {submitMessage} Your opinions matter — thank you for helping us improve CricsHub.
                </p>
                <Button variant="secondary" icon="ri-add-line" className="mt-6" onClick={resetForm}>
                  Send more feedback
                </Button>
              </div>
            ) : (
              <>
                <h2 className="font-display text-lg font-bold uppercase tracking-wide text-fg sm:text-xl">Share your feedback</h2>
                <p className="mt-1 text-sm text-fg-muted">All fields are required.</p>

                <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
                  {submitStatus === 'error' && (
                    <Alert tone="danger" title="Feedback not sent">
                      {submitMessage}
                    </Alert>
                  )}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Your name" error={errors.userName}>
                      {({ id, describedBy, invalid }) => (
                        <Input
                          id={id}
                          aria-describedby={describedBy}
                          invalid={invalid}
                          type="text"
                          name="userName"
                          autoComplete="name"
                          value={formData.userName}
                          onChange={handleChange}
                          placeholder="John Doe"
                          required
                        />
                      )}
                    </Field>
                    <Field label="Your email" error={errors.userEmail}>
                      {({ id, describedBy, invalid }) => (
                        <Input
                          id={id}
                          aria-describedby={describedBy}
                          invalid={invalid}
                          type="email"
                          name="userEmail"
                          autoComplete="email"
                          value={formData.userEmail}
                          onChange={handleChange}
                          placeholder="john.doe@example.com"
                          required
                        />
                      )}
                    </Field>
                  </div>
                  <Field label="Your feedback" error={errors.message}>
                    {({ id, describedBy, invalid }) => (
                      <Textarea
                        id={id}
                        aria-describedby={describedBy}
                        invalid={invalid}
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={6}
                        placeholder="Share your thoughts..."
                        required
                      />
                    )}
                  </Field>
                  <Button type="submit" size="lg" block loading={isLoading} trailingIcon="ri-send-plane-line">
                    {isLoading ? 'Submitting…' : 'Submit feedback'}
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
