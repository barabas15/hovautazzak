type Props = {
  /** Destination city name, e.g. "Tokió". */
  city: string;
  /** ISO check-in date (flight departure). */
  checkIn: string;
  /** ISO check-out date (check-in + nights). */
  checkOut: string;
  /** Optional pre-built URL from backend; if absent we build a Booking.com link. */
  browseUrl?: string;
};

/** Build a Booking.com search deep link. */
export function buildBookingUrl(city: string, checkIn: string, checkOut: string) {
  const params = new URLSearchParams({
    ss: city,
    checkin: checkIn,
    checkout: checkOut,
    group_adults: "2",
    lang: "hu",
  });
  return `https://www.booking.com/searchresults.html?${params.toString()}`;
}

export function BookingLink({ city, checkIn, checkOut, browseUrl }: Props) {
  const href = browseUrl || buildBookingUrl(city, checkIn, checkOut);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 rounded-xl py-3 text-center text-text-primary transition-colors mt-4 inline-flex items-center justify-center gap-1"
    >
      Szállások böngészése →
    </a>
  );
}
