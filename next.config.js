/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    styledComponents: true,
  },
  // Configure for hybrid deployment: static pages + serverless API routes
  output: (process.env.NODE_ENV === 'production' && process.env.BUILD_TYPE === 'static') ? 'export' : undefined,
  trailingSlash: true,
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  // API routes configuration for Netlify Functions (only for non-static builds)
  async rewrites() {
    if (process.env.NODE_ENV === 'production' && process.env.BUILD_TYPE === 'static') {
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: '/.netlify/functions/api/:path*',
      },
    ];
  },
  // Environment variables for API routes
  env: {
    CUSTOM_KEY: 'my-value',
  },
  // Disable server-side features for static export in production
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Exclude legacy React files from Next.js build
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Exclude src directory from webpack compilation
    config.externals = config.externals || {};
    config.externals = [...config.externals, 'src/**/*'];
    
    // Handle Node.js modules for API routes
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    return config;
  },
  // Build configuration
  generateBuildId: async () => {
    return process.env.NODE_ENV === 'production' ? 'static-build' : 'dev-build'
  },
  // Performance optimizations
  swcMinify: true,
  poweredByHeader: false,
  
  // Configure static export exclusions (exclude API routes from static build)
  ...((process.env.NODE_ENV === 'production' && process.env.BUILD_TYPE === 'static') ? {
    trailingSlash: true,
  } : {})
}

export default nextConfig;