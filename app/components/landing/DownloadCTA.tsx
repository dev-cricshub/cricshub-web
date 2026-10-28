import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { cn } from "@/app/components/ui";
import { EXPLORE_HREF, PLAY_STORE_URL } from "@/lib/site";
import { PlayStoreButton, ghostCta, h2, lead } from "./primitives";

export default async function DownloadCTA() {
  // Rendered on the server from the real Play Store link, so the code never drifts from the URL.
  const qrSvg = await QRCode.toString(PLAY_STORE_URL, {
    type: "svg",
    margin: 0,
    width: 96,
    color: { dark: "#060A14", light: "#FFFFFF" },
  });

  return (
    <section
      id="download"
      data-anim="scale"
      className="ch-gl relative flex scroll-mt-28 flex-wrap items-center gap-10 overflow-hidden rounded-[32px] border border-white/[0.18] bg-white/[0.08] p-[clamp(28px,5vw,56px)] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
    >
      <Image
        src="/images/hero-ground.jpg"
        alt=""
        fill
        sizes="(min-width: 1200px) 1200px, 100vw"
        className="object-cover object-[center_70%] opacity-35 mix-blend-luminosity [filter:blur(2px)_brightness(0.7)]"
      />
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,10,20,0.85)_0%,rgba(6,10,20,0.45)_60%,rgba(6,10,20,0.2)_100%)]" />
      <div aria-hidden className="ch-home-orb-a absolute -right-20 -top-[120px] h-[360px] w-[360px] rounded-full bg-[#5AA9F0] opacity-35 blur-[80px]" />

      <div className="relative flex min-w-0 flex-[1_1_420px] flex-col gap-[18px]">
        <h2 className={h2}>Your next match starts here.</h2>
        <p className={lead}>Download CricsHub free on Android, or explore Stream Studio and Auctions in your browser.</p>
        <div className="flex flex-wrap gap-3">
          <PlayStoreButton withIcon={false} />
          <Link href={EXPLORE_HREF} className={ghostCta()}>
            Explore on the web
          </Link>
        </div>
      </div>

      <div className="relative hidden items-center gap-4 rounded-[20px] border border-white/[0.16] bg-white/[0.08] p-4 min-[900px]:flex">
        <div
          role="img"
          aria-label="QR code linking to CricsHub on Google Play"
          className={cn("flex h-28 w-28 items-center justify-center rounded-xl bg-white p-2 [&>svg]:h-full [&>svg]:w-full")}
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <div className="flex max-w-[160px] flex-col gap-1">
          <strong className="text-[15px] text-white">Scan to download</strong>
          <span className="text-[13px] leading-normal text-[#C3CEE0]">Point your phone camera here to open the Play Store.</span>
        </div>
      </div>
    </section>
  );
}
