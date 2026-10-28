import antmicroIconDarkSvg from '$lib/assets/common/antmicro-logotype/antmicro-icon-mono-white-without-bg.svg?raw';
import antmicroIconLightSvg from '$lib/assets/common/antmicro-logotype/antmicro-icon-color-without-bg.svg?raw';
import antmicroLogoDarkSvg from '$lib/assets/common/antmicro-logotype/antmicro-logo-mono-white-without-bg.svg?raw';
import antmicroLogoLightSvg from '$lib/assets/common/antmicro-logotype/antmicro-logo-color-without-bg.svg?raw';
import kenningIconDarkSvg from '$lib/assets/common/kenning-logotype/kenning-icon-mono-white-without-bg.svg?raw';
import kenningIconLightSvg from '$lib/assets/common/kenning-logotype/kenning-icon-color-without-bg.svg?raw';
import kenningLogoDarkSvg from '$lib/assets/common/kenning-logotype/kenning-logo-mono-white-horizontal.svg?raw';
import kenningLogoLightSvg from '$lib/assets/common/kenning-logotype/kenning-logo-color-horizontal-1.svg?raw';
import rdfmIconDarkSvg from '$lib/assets/common/rdfm-logotype/rdfm-icon-mono-white-without-bg.svg?raw';
import rdfmIconLightSvg from '$lib/assets/common/rdfm-logotype/rdfm-icon-color-without-bg.svg?raw';
import rdfmLogoDarkSvg from '$lib/assets/common/rdfm-logotype/rdfm-logo-mono-white-horizontal.svg?raw';
import rdfmLogoLightSvg from '$lib/assets/common/rdfm-logotype/rdfm-logo-color-horizontal-1.svg?raw';
import renodeIconDarkSvg from '$lib/assets/common/renode-logotype/renode-icon-mono-white-without-bg.svg?raw';
import renodeIconLightSvg from '$lib/assets/common/renode-logotype/renode-icon-color-without-bg.svg?raw';
import renodeLogoDarkSvg from '$lib/assets/common/renode-logotype/renode-logo-mono-white-horizontal.svg?raw';
import renodeLogoLightSvg from '$lib/assets/common/renode-logotype/renode-logo-color-horizontal-1.svg?raw';
import svevnIconDarkSvg from '$lib/assets/common/svevn-logotype/svevn-icon-mono-white-without-bg.svg?raw';
import svevnIconLightSvg from '$lib/assets/common/svevn-logotype/svevn-icon-color-without-bg.svg?raw';
import svevnLogoDarkSvg from '$lib/assets/common/svevn-logotype/svevn-logo-mono-white-horizontal-without-bg.svg?raw';
import svevnLogoLightSvg from '$lib/assets/common/svevn-logotype/svevn-logo-color-horizontal-without-bg.svg?raw';
import verksIconDarkSvg from '$lib/assets/common/verks-logotype/verks-mark--white.svg?raw';
import verksIconLightSvg from '$lib/assets/common/verks-logotype/verks-mark--color.svg?raw';
import verksLogoDarkSvg from '$lib/assets/common/verks-logotype/verks--logo-dark.svg?raw';
import verksLogoLightSvg from '$lib/assets/common/verks-logotype/verks--logo-light.svg?raw';
import { brandDownloadHref } from './brand-downloads.js';

const buildAsset = ({ brand, slug, svg, theme, type }) => ({
  id: `${slug}-${type}-${theme}`,
  svg,
  theme,
  type,
  copyLabel: `${brand} ${type} ${theme}`
});

export const brandSections = [
  {
    name: 'Antmicro',
    slug: 'antmicro',
    description: 'The Antmicro trademark includes the Antmicro name and logo, and any word, phrase, image, or other designation that identifies Antmicro products.',
    downloadHref: brandDownloadHref('antmicro-logotype.zip'),
    downloadName: 'antmicro-logotype.zip',
    assets: [
      buildAsset({ brand: 'Antmicro', slug: 'antmicro', svg: antmicroLogoLightSvg, theme: 'light', type: 'logo' }),
      buildAsset({ brand: 'Antmicro', slug: 'antmicro', svg: antmicroLogoDarkSvg, theme: 'dark', type: 'logo' }),
      buildAsset({ brand: 'Antmicro', slug: 'antmicro', svg: antmicroIconLightSvg, theme: 'light', type: 'icon' }),
      buildAsset({ brand: 'Antmicro', slug: 'antmicro', svg: antmicroIconDarkSvg, theme: 'dark', type: 'icon' })
    ]
  },
  {
    name: 'Renode',
    slug: 'renode',
    description: 'Brand guidelines and usage for Renode.',
    downloadHref: brandDownloadHref('renode-logotype.zip'),
    downloadName: 'renode-logotype.zip',
    assets: [
      buildAsset({ brand: 'Renode', slug: 'renode', svg: renodeLogoLightSvg, theme: 'light', type: 'logo' }),
      buildAsset({ brand: 'Renode', slug: 'renode', svg: renodeLogoDarkSvg, theme: 'dark', type: 'logo' }),
      buildAsset({ brand: 'Renode', slug: 'renode', svg: renodeIconLightSvg, theme: 'light', type: 'icon' }),
      buildAsset({ brand: 'Renode', slug: 'renode', svg: renodeIconDarkSvg, theme: 'dark', type: 'icon' })
    ]
  },
  {
    name: 'Kenning',
    slug: 'kenning',
    description: 'Brand guidelines and usage for Kenning.',
    downloadHref: brandDownloadHref('kenning-logotype.zip'),
    downloadName: 'kenning-logotype.zip',
    assets: [
      buildAsset({ brand: 'Kenning', slug: 'kenning', svg: kenningLogoLightSvg, theme: 'light', type: 'logo' }),
      buildAsset({ brand: 'Kenning', slug: 'kenning', svg: kenningLogoDarkSvg, theme: 'dark', type: 'logo' }),
      buildAsset({ brand: 'Kenning', slug: 'kenning', svg: kenningIconLightSvg, theme: 'light', type: 'icon' }),
      buildAsset({ brand: 'Kenning', slug: 'kenning', svg: kenningIconDarkSvg, theme: 'dark', type: 'icon' })
    ]
  },
  {
    name: 'RDFM',
    slug: 'rdfm',
    description: 'Brand guidelines and usage for RDFM.',
    downloadHref: brandDownloadHref('rdfm-logotype.zip'),
    downloadName: 'rdfm-logotype.zip',
    assets: [
      buildAsset({ brand: 'RDFM', slug: 'rdfm', svg: rdfmLogoLightSvg, theme: 'light', type: 'logo' }),
      buildAsset({ brand: 'RDFM', slug: 'rdfm', svg: rdfmLogoDarkSvg, theme: 'dark', type: 'logo' }),
      buildAsset({ brand: 'RDFM', slug: 'rdfm', svg: rdfmIconLightSvg, theme: 'light', type: 'icon' }),
      buildAsset({ brand: 'RDFM', slug: 'rdfm', svg: rdfmIconDarkSvg, theme: 'dark', type: 'icon' })
    ]
  },
  {
    name: 'Svevn',
    slug: 'svevn',
    description: 'Brand guidelines and usage for Svevn.',
    downloadHref: brandDownloadHref('svevn-logotype.zip'),
    downloadName: 'svevn-logotype.zip',
    assets: [
      buildAsset({ brand: 'Svevn', slug: 'svevn', svg: svevnLogoLightSvg, theme: 'light', type: 'logo' }),
      buildAsset({ brand: 'Svevn', slug: 'svevn', svg: svevnLogoDarkSvg, theme: 'dark', type: 'logo' }),
      buildAsset({ brand: 'Svevn', slug: 'svevn', svg: svevnIconLightSvg, theme: 'light', type: 'icon' }),
      buildAsset({ brand: 'Svevn', slug: 'svevn', svg: svevnIconDarkSvg, theme: 'dark', type: 'icon' })
    ]
  },
  {
    name: 'verks.ai',
    slug: 'verks',
    description: 'Brand guidelines and usage for verks.ai.',
    downloadHref: brandDownloadHref('verks-logotype.zip'),
    downloadName: 'verks-logotype.zip',
    assets: [
      buildAsset({ brand: 'verks.ai', slug: 'verks', svg: verksLogoLightSvg, theme: 'light', type: 'logo' }),
      buildAsset({ brand: 'verks.ai', slug: 'verks', svg: verksLogoDarkSvg, theme: 'dark', type: 'logo' }),
      buildAsset({ brand: 'verks.ai', slug: 'verks', svg: verksIconLightSvg, theme: 'light', type: 'icon' }),
      buildAsset({ brand: 'verks.ai', slug: 'verks', svg: verksIconDarkSvg, theme: 'dark', type: 'icon' })
    ]
  }
];
