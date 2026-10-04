export type SchemaObject = Record<string, unknown>;

export function breadcrumbSchema(items: Array<{ name: string; url: string }>): SchemaObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export function softwareSchema(input: {
  name: string;
  url: string;
  description: string;
  featureList?: string[];
}): SchemaObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${input.url}#software`,
    name: input.name,
    url: input.url,
    description: input.description,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    browserRequirements: 'Requires a modern web browser with JavaScript enabled.',
    isAccessibleForFree: true,
    publisher: { '@id': 'https://voxelcurve.com/#organization' },
    isPartOf: { '@id': 'https://voxelcurve.com/#website' },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    ...(input.featureList?.length ? { featureList: input.featureList.join(', ') } : {})
  };
}

export function articleSchema(input: {
  headline: string;
  url: string;
  description: string;
}): SchemaObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    url: input.url,
    description: input.description,
    author: { '@id': 'https://voxelcurve.com/#organization' },
    publisher: { '@id': 'https://voxelcurve.com/#organization' },
    isPartOf: { '@id': 'https://voxelcurve.com/#website' },
    mainEntityOfPage: input.url
  };
}
