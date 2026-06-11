import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Typed routes disabled: the generated .next/types route union made <Link>
  // hrefs fragile across clean checkouts / cache clears. Plain string hrefs are fine here.
  typedRoutes: false,
};

export default nextConfig;
