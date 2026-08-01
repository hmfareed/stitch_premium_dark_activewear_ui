import type { Metadata } from "next";
import "./globals.css";
import { Layout } from "@/components/Layout";

export const metadata: Metadata = {
  title: {
    default: "AfriCart — Africa's Premium Online Marketplace",
    template: "%s | AfriCart",
  },
  description: "Shop the best in electronics, fashion, home essentials, beauty & groceries. Fast delivery across Ghana. Join thousands of satisfied customers on AfriCart.",
  keywords: ["AfriCart", "online shopping", "Ghana marketplace", "electronics", "fashion", "mobile money", "MTN MoMo", "buy online Ghana", "African marketplace"],
  authors: [{ name: "AfriCart" }],
  creator: "AfriCart",
  publisher: "AfriCart",
  metadataBase: new URL("https://africart.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: "https://africart.vercel.app",
    siteName: "AfriCart",
    title: "AfriCart — Africa's Premium Online Marketplace",
    description: "Shop the best in electronics, fashion, home essentials, beauty & groceries. Fast delivery across Ghana.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AfriCart - Africa's Premium Online Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AfriCart — Africa's Premium Online Marketplace",
    description: "Shop the best in electronics, fashion, home essentials, beauty & groceries.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block" rel="stylesheet" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('africart-theme');
                  var theme = savedTheme || 'system';
                  var root = document.documentElement;
                  
                  if (theme === 'system') {
                    var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
                    root.setAttribute('data-theme', darkQuery.matches ? 'dark' : 'light');
                  } else {
                    root.setAttribute('data-theme', theme);
                  }

                  var savedAccent = localStorage.getItem('africart-accent-color');
                  if (savedAccent) {
                    root.style.setProperty('--lime-400', savedAccent);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    reg.update();
                  }).catch(function(err) {
                    console.log('SW registration error:', err);
                  });
                });
              }
            `,
          }}
        />
        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "AfriCart",
              url: "https://africart.vercel.app",
              logo: "https://africart.vercel.app/favicon.ico",
              description: "Africa's Premium Online Marketplace",
              sameAs: [],
            }),
          }}
        />
        {/* Structured Data - WebSite with SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "AfriCart",
              url: "https://africart.vercel.app",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: "https://africart.vercel.app/shop?search={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
