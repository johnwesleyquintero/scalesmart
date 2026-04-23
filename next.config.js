import path from 'path';
import crypto from 'crypto';

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['next-mdx-remote'],
  productionBrowserSourceMaps: false, // Disable source maps in production for smaller bundle size
  turbopack: {},

  // Core settings
  // output: 'standalone', // Keep if needed for Docker/standalone deployment

  // Build-time checks
  // --- ESLint block removed ---
  // Recommendation: Run 'npm run lint' separately in your workflow/CI pipeline.

  typescript: {
    // CRITICAL: Keep this false to ensure type safety in builds.
    ignoreBuildErrors: false,
  },

  // Headers for caching and security
  async headers() {
    const apolloDomains = 'https://assets.apollo.io https://api.apollo.io https://aplo-evnt.com';
    const csp =
      process.env.NODE_ENV === 'development'
        ? `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://assets.apollo.io; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.github.com ${apolloDomains};`
        : `default-src 'self'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://assets.apollo.io; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.github.com ${apolloDomains};`;

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/(.*).(css|js|webp|gif|png|jpg|jpeg|svg|woff2)$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Image Optimization (Looks good, keep as is unless specific needs arise)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wescode.vercel.app',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true, // Use with caution: Ensure SVGs are trusted/sanitized.
    contentDispositionType: 'inline',
  },

  // Experimental features & optimizations
  experimental: {
    // Enable optimizations for improved build performance
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    // Enable server actions for form submissions
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  // Compiler options
  compiler: {
    // Remove console logs in production builds
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Webpack customization
  webpack: (config, { webpack: webpackInstance, isServer, dev }) => {
    // Enable minification in production for better performance
    if (!dev) {
      config.optimization.minimize = true;
    }

    // CRITICAL: Exclude webpack cache from serverless functions to prevent 250MB+ size issues
    if (isServer && !dev) {
      config.externals.push({
        '.next/cache/webpack': 'commonjs .next/cache/webpack',
      });

      // Exclude large dependencies that cause serverless function size issues
      config.externals.push({
        'next/dist/compiled/webpack': 'commonjs next/dist/compiled/webpack',
        'next/dist/compiled/webpack-sources':
          'commonjs next/dist/compiled/webpack-sources',
        'next/dist/compiled/loader-utils':
          'commonjs next/dist/compiled/loader-utils',
        'next/dist/compiled/schema-utils':
          'commonjs next/dist/compiled/schema-utils',
      });
    }

    // Define environment variables (build-time/server-side)
    // Use NEXT_PUBLIC_ prefix for variables needed in the browser
    // Removed redundant DefinePlugin configuration

    // Alias for @/ imports (assuming source code is primarily in 'src')
    config.resolve.alias['@'] = path.resolve(process.cwd(), 'src');

    // Rule for handling SVGs as React components using @svgr/webpack
    // Ensure you have @svgr/webpack installed (`npm install --save-dev @svgr/webpack`)
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            // svgo: false, // Optionally disable SVGO optimization if causing issues
          },
        },
      ],
    });

    // Define environment variables (build-time/server-side)
    // Use NEXT_PUBLIC_ prefix for variables needed in the browser
    config.plugins.push(
      new webpackInstance.DefinePlugin({
        'process.env.IMAGE_DEBUG': JSON.stringify(
          process.env.IMAGE_DEBUG || 'false', // Provide default
        ),
      }),
    );

    config.externals = [
      ...(config.externals || []),
      isServer
        ? {
            '@next-auth/mongodb-adapter': 'commonjs @next-auth/mongodb-adapter',
            'mongodb-client-encryption': 'commonjs mongodb-client-encryption',
            aws4: 'commonjs aws4',
            snappy: 'commonjs snappy',
            kerberos: 'commonjs kerberos',
            dns: 'commonjs dns',
            fs: 'commonjs fs',
            net: 'commonjs net',
            tls: 'commonjs tls',
            child_process: 'commonjs child_process',
            path: 'commonjs path',
            util: 'commonjs util',
            stream: 'commonjs stream',
            crypto: 'commonjs crypto',
            os: 'commonjs os',
            http: 'commonjs http',
            https: 'commonjs https',
            zlib: 'commonjs zlib',
            process: 'commonjs process',
            // CRITICAL: Exclude large dependencies that cause serverless function size issues
            lighthouse: 'commonjs lighthouse',
            puppeteer: 'commonjs puppeteer',
            playwright: 'commonjs playwright',

            newrelic: 'commonjs newrelic',
            'datadog-lambda-js': 'commonjs datadog-lambda-js',
          }
        : [],
    ].flat();

    // CRITICAL: Optimize webpack cache for production builds to reduce serverless function size
    if (!dev) {
      config.cache = {
        type: 'filesystem',
        cacheDirectory: path.resolve(process.cwd(), '.next/cache/webpack'),
        // Prevent cache from being included in serverless functions
        store: 'pack',
        buildDependencies: {
          config: [path.resolve(process.cwd(), 'next.config.js')],
        },
      };
    }

    config.module.rules.push({
      test: /\.csv$/,
      use: ['csv-loader'],
    });

    // Optimize chunk loading
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|next)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test(module) {
              return (
                module.size() > 160000 &&
                /node_modules[/\\]/.test(module.identifier())
              );
            },
            name(module) {
              const hash = crypto.createHash('sha1');
              hash.update(module.identifier());
              return hash.digest('hex').slice(0, 8);
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
            priority: 20,
          },
          shared: {
            name(module, chunks) {
              return (
                crypto
                  .createHash('sha1')
                  .update(chunks.reduce((acc, chunk) => acc + chunk.name, ''))
                  .digest('hex') + '_shared'
              );
            },
            priority: 10,
            minChunks: 2,
            reuseExistingChunk: true,
          },
        },
      };
    }

    // CRITICAL: Optimize server-side bundle size for serverless functions
    if (isServer && !dev) {
      config.optimization.minimize = true;
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;

      // Remove source maps from serverless functions to reduce size
      config.devtool = false;

      // Tree shake unused code
      config.optimization.providedExports = true;
      config.optimization.innerGraph = true;
    }
    return config;
  },
};

import remarkGfm from 'remark-gfm';
import rehypePrism from 'rehype-prism-plus';

// Configure MDX with Turbopack compatibility
const nextConfigWithMDX = {
  ...nextConfig,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  experimental: {
    ...nextConfig.experimental,
    mdxRs: true, // Enable Rust-based MDX compilation for better performance
  },
};

export default nextConfigWithMDX;
