import path from 'path';
import crypto from 'crypto';

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@react-pdf/renderer'],
  productionBrowserSourceMaps: false, // Disable source maps in production for smaller bundle size
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Core settings
  // output: 'standalone', // Keep if needed for Docker/standalone deployment

  // Build-time checks
  // --- ESLint block removed ---
  // Recommendation: Run 'npm run lint' separately in your workflow/CI pipeline.

  typescript: {
    // CRITICAL: Keep this false to ensure type safety in builds.
    ignoreBuildErrors: false,
  },

  // Image Optimization (Looks good, keep as is unless specific needs arise)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wescode.vercel.app',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      // Remove the empty hostname pattern below as it's invalid
      /* DELETE THIS ENTRY - CAUSING BUILD FAILURE
      {
        protocol: 'http',
        hostname: '', // Empty string is invalid
        pathname: '/public/**',
      },
      */
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true, // Use with caution: Ensure SVGs are trusted/sanitized.
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
          }
        : [],
    ].flat();

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
    return config;
  },
};

import remarkGfm from 'remark-gfm';
import rehypePrism from 'rehype-prism-plus';
import withMDX from '@next/mdx';

const config = {
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypePrism],
    providerImportSource: '@mdx-js/react',
  },
};

export default withMDX(config)(nextConfig);
