import Link from "next/link";
import QRCode from "qrcode";
import { cn } from "@/app/components/ui";
import { PLAY_STORE_URL } from "@/lib/site";
import { PlayStoreButton, Section, ghostCta } from "./primitives";

export default async function DownloadCTA() {
  // Rendered on the server from the real Play Store link, so the code never drifts from the URL.
  const qrSvg = await QRCode.toString(PLAY_STORE_URL, {
    type: "svg",
    margin: 0,
    width: 96,
    color: { dark: "#0A0E17", light: "#E8EDF5" },
  });

  return (
    <Section id="download" className="pb-20 pt-5">
      <div className="relative flex flex-wrap items-center justify-between gap-10 overflow-hidden rounded-[36px] border border-line-accent bg-[#0F1626] p-[clamp(32px,5vw,64px)]">
        <div
          aria-hidden
          className="absolute left-1/2 top-[-280px] -ml-[500px] h-[560px] w-[1000px] rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(74,158,224,0.5), rgba(74,158,224,0) 100%)" }}
        />
        <div className="relative flex min-w-0 flex-[1_1_420px] flex-col gap-5">
          <h2 className="m-0 font-display text-[clamp(2.6rem,5.6vw,4.4rem)] font-extrabold uppercase leading-[0.95]">
            Your next match
            <br />
            <span className="text-accent">starts here.</span>
          </h2>
          <p className="m-0 max-w-[480px] text-[17px] leading-relaxed text-[#C9D3E2]">
            Download CricsHub free on Android, or open Stream Studio in your browser to go live on YouTube.
          </p>
          <div className="flex flex-wrap gap-3">
            <PlayStoreButton />
            <Link href="/dashboard" className={cn("flex h-[60px] items-center rounded-full px-6 text-base text-primary-soft-fg", ghostCta)}>
              Log in to Stream Studio
            </Link>
          </div>
        </div>

        <div className="relative hidden items-center gap-[18px] rounded-[26px] border border-accent-soft/20 bg-[rgba(22,30,48,0.75)] py-[18px] pl-[18px] pr-[22px] min-[900px]:flex">
          <div
            role="img"
            aria-label="QR code linking to CricsHub on Google Play"
            className="flex h-[120px] w-[120px] items-center justify-center rounded-2xl bg-[#E8EDF5]"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <span className="flex max-w-[150px] flex-col gap-1">
            <span className="text-[15px] font-extrabold">Scan to download</span>
            <span className="text-[13px] leading-[1.45] text-fg-muted">Point your phone camera here to open the Play Store.</span>
          </span>
        </div>
      </div>
    </Section>
  );
}
