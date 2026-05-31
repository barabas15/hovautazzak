/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Google account avatars (Firebase Auth photoURL)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // restcountries / flag CDNs (when a country flag is a URL, not an emoji)
      { protocol: "https", hostname: "flagcdn.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
};

export default nextConfig;
