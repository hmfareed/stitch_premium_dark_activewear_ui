import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/vendor/', '/checkout/', '/confirmation/'],
      },
    ],
    sitemap: 'https://africart.vercel.app/sitemap.xml',
  };
}
