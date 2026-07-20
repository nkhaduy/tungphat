import Image from "next/image";
import { ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { TrackedLink } from "@/components/TrackedLink";

export type ContactPhone = {
  display: string;
  href: string;
};

export type BranchLocationData = {
  id: string;
  shortId: string;
  address: string;
  image: string;
  imageAlt: string;
  embedSrc: string;
  directionsUrl: string;
};

type BranchLocationProps = {
  location: BranchLocationData;
  phones: ContactPhone[];
  email: string;
};

export function BranchLocation({
  location,
  phones,
  email,
}: BranchLocationProps) {
  const branchNumber = location.shortId.replace(/\D/g, "");

  return (
    <section
      id={location.id}
      aria-labelledby={`${location.id}-title`}
      className="scroll-mt-28 border-t border-forest-900/12 py-16 lg:py-24"
    >
      <div className="container-shell">
        <div className="grid items-start gap-x-12 lg:grid-cols-[minmax(0,.82fr)_minmax(0,1.18fr)] xl:gap-x-16">
          <div className="lg:col-start-2 lg:row-start-1">
            <h2
              id={`${location.id}-title`}
              className="text-balance text-3xl font-extrabold leading-tight tracking-[-.02em] text-forest-950 sm:text-4xl"
            >
              Chi nhánh {branchNumber}
            </h2>
            <address className="mt-5 not-italic">
              <p className="flex items-start gap-3 text-base font-semibold leading-7 text-slate-700">
                <MapPin
                  size={20}
                  className="mt-0.5 shrink-0 text-wood-600"
                  aria-hidden="true"
                />
                {location.address}
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6">
                {phones.map((phone) => (
                  <TrackedLink
                    key={phone.href}
                    href={phone.href}
                    eventName="click_phone"
                    eventProperties={{ location: location.shortId }}
                    className="inline-flex min-h-11 items-center gap-2 font-bold text-forest-900 transition-colors hover:text-wood-600"
                  >
                    <Phone size={17} aria-hidden="true" />
                    {phone.display}
                  </TrackedLink>
                ))}
                <a
                  href={`mailto:${email}`}
                  className="inline-flex min-h-11 items-center gap-2 font-bold text-forest-900 transition-colors hover:text-wood-600"
                >
                  <Mail size={17} aria-hidden="true" />
                  {email}
                </a>
              </div>
            </address>
          </div>

          <div className="relative mt-8 aspect-[4/5] overflow-hidden bg-[#eef1ed] lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:mt-0">
            {/* Ảnh được quản lý từ business.json để có thể thay riêng từng chi nhánh. */}
            <Image
              src={location.image}
              alt={location.imageAlt}
              fill
              sizes="(max-width: 1023px) calc(100vw - 24px), 40vw"
              className="object-cover"
            />
          </div>

          <div className="mt-7 lg:col-start-2 lg:row-start-2">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold text-forest-950">
                Bản đồ chi nhánh {branchNumber}
              </p>
              <TrackedLink
                href={location.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                eventName="click_directions"
                eventProperties={{ location: location.shortId }}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 border border-forest-900/22 px-5 text-sm font-bold text-forest-900 transition-colors hover:border-forest-900 hover:bg-forest-900 hover:text-white sm:w-auto"
              >
                Mở Google Maps
                <ExternalLink size={17} aria-hidden="true" />
              </TrackedLink>
            </div>
            <div className="aspect-[4/3] w-full overflow-hidden border border-forest-900/12 bg-[#eef1ed] sm:aspect-[16/9] lg:aspect-auto lg:h-[360px]">
              <iframe
                src={location.embedSrc}
                title={`Google Maps – Chi nhánh ${branchNumber} Tùng Phát`}
                loading="lazy"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="block h-full w-full"
                style={{ border: 0 }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
