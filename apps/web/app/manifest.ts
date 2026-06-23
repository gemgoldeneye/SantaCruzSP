import type { MetadataRoute } from 'next';
import { santaCruzConfig } from '@lgu/santacruz';

/** PWA manifest — installable on staff + citizen devices. Config-driven per LGU. */
export default function manifest(): MetadataRoute.Manifest {
  const staff = santaCruzConfig.apps.staff;
  return {
    name: staff.name,
    short_name: staff.shortName,
    description: staff.description,
    start_url: '/',
    display: 'standalone',
    background_color: staff.backgroundColor,
    theme_color: staff.themeColor,
    icons: [{ src: santaCruzConfig.municipality.sealSrc, sizes: 'any', type: 'image/svg+xml' }],
  };
}
