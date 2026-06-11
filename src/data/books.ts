// Hardcoded book catalog for the Helm demo. Ships in the bundle so the storefront
// works without a Contentful/Sanity key. In a real deployment this would be
// fetched at build-time from a headless CMS and cached on the edge.

export type BookCategory =
  | 'fiction'
  | 'nonfiction'
  | 'science'
  | 'philosophy'
  | 'poetry'
  | 'history';

export interface CatalogBook {
  slug: string;
  isbn: string;
  title: string;
  author: string;
  priceCents: number;
  currency: 'CAD';
  imageUrl: string;
  description: string;
  categories: BookCategory[];
  featured?: boolean;
}

export const BOOKS: readonly CatalogBook[] = [
  {
    slug: 'the-overstory',
    isbn: '9780393635522',
    title: 'The Overstory',
    author: 'Richard Powers',
    priceCents: 2495,
    currency: 'CAD',
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780393635522-L.jpg',
    description:
      'Nine strangers, each summoned in different ways by trees, are brought together in a last stand to save the continent’s few remaining acres of virgin forest.',
    categories: ['fiction'],
    featured: true,
  },
  {
    slug: 'the-name-of-the-rose',
    isbn: '9780156001311',
    title: 'The Name of the Rose',
    author: 'Umberto Eco',
    priceCents: 2195,
    currency: 'CAD',
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780156001311-L.jpg',
    description:
      'A 14th-century Franciscan friar and his novice investigate a series of mysterious deaths in a remote Italian monastery.',
    categories: ['fiction', 'history'],
    featured: true,
  },
  {
    slug: 'the-left-hand-of-darkness',
    isbn: '9780441478125',
    title: 'The Left Hand of Darkness',
    author: 'Ursula K. Le Guin',
    priceCents: 1895,
    currency: 'CAD',
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780441478125-L.jpg',
    description:
      'A lone envoy from a galactic federation arrives on a frozen world whose inhabitants can choose their gender, and learns the meaning of allegiance.',
    categories: ['fiction'],
    featured: true,
  },
  {
    slug: 'a-brief-history-of-time',
    isbn: '9780553380163',
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    priceCents: 1995,
    currency: 'CAD',
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780553380163-L.jpg',
    description:
      'A clear, accessible tour through cosmology, from the Big Bang to black holes, from one of the great physicists of the twentieth century.',
    categories: ['science', 'nonfiction'],
    featured: true,
  },
  {
    slug: 'meditations',
    isbn: '9780812968255',
    title: 'Meditations',
    author: 'Marcus Aurelius',
    priceCents: 1495,
    currency: 'CAD',
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780812968255-L.jpg',
    description:
      'The private notebook of the philosopher-emperor of Rome, written in the field on military campaigns and never intended for publication.',
    categories: ['philosophy', 'history'],
  },
  {
    slug: 'sapiens',
    isbn: '9780062316097',
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    priceCents: 2395,
    currency: 'CAD',
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg',
    description:
      'A sweeping account of the rise of Homo sapiens, tracing the cognitive, agricultural, and scientific revolutions that shaped our species.',
    categories: ['history', 'nonfiction'],
    featured: true,
  },
  {
    slug: 'the-waste-land',
    isbn: '9780393974997',
    title: 'The Waste Land',
    author: 'T. S. Eliot',
    priceCents: 1395,
    currency: 'CAD',
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780393974997-L.jpg',
    description:
      'A 434-line modernist poem of fragments and quotations, widely considered one of the most important poems of the twentieth century.',
    categories: ['poetry'],
  },
  {
    slug: 'thinking-fast-and-slow',
    isbn: '9780374533557',
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    priceCents: 2295,
    currency: 'CAD',
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780374533557-L.jpg',
    description:
      'A Nobel laureate’s account of the two systems that drive the way we think, and the cognitive biases that follow from how they interact.',
    categories: ['nonfiction', 'science'],
  },
  {
    slug: 'the-road',
    isbn: '9780307387899',
    title: 'The Road',
    author: 'Cormac McCarthy',
    priceCents: 1795,
    currency: 'CAD',
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780307387899-L.jpg',
    description:
      'A father and his young son walk south through a burned and ashen America, carrying nothing but each other and an idea of fire.',
    categories: ['fiction'],
  },
  {
    slug: 'the-republic',
    isbn: '9780140455113',
    title: 'The Republic',
    author: 'Plato',
    priceCents: 1395,
    currency: 'CAD',
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780140455113-L.jpg',
    description:
      'A Socratic dialogue on justice, the just city-state, and the just life, written around 375 BCE and foundational to Western philosophy.',
    categories: ['philosophy'],
  },
  {
    slug: 'silent-spring',
    isbn: '9780618249060',
    title: 'Silent Spring',
    author: 'Rachel Carson',
    priceCents: 1895,
    currency: 'CAD',
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780618249060-L.jpg',
    description:
      'The 1962 book that documented the adverse effects of pesticides on the environment and launched the modern environmental movement.',
    categories: ['science', 'nonfiction', 'history'],
  },
  {
    slug: 'the-iliad',
    isbn: '9780140275360',
    title: 'The Iliad',
    author: 'Homer',
    priceCents: 1995,
    currency: 'CAD',
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780140275360-L.jpg',
    description:
      'An ancient Greek epic of the Trojan War, of Achilles and Hector and the wrath that brought countless griefs upon the Achaeans.',
    categories: ['poetry', 'history'],
  },
  {
    slug: 'the-structure-of-scientific-revolutions',
    isbn: '9780226458120',
    title: 'The Structure of Scientific Revolutions',
    author: 'Thomas S. Kuhn',
    priceCents: 1895,
    currency: 'CAD',
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780226458120-L.jpg',
    description:
      'The book that introduced “paradigm shift” to the language and reshaped how we think about the progress of science.',
    categories: ['philosophy', 'science'],
  },
  {
    slug: 'station-eleven',
    isbn: '9780385353304',
    title: 'Station Eleven',
    author: 'Emily St. John Mandel',
    priceCents: 1995,
    currency: 'CAD',
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780385353304-L.jpg',
    description:
      'A traveling Shakespeare troupe moves through a North America twenty years after a flu pandemic, in search of what survives a civilization.',
    categories: ['fiction'],
    featured: true,
  },
  {
    slug: 'a-room-of-ones-own',
    isbn: '9780156787338',
    title: "A Room of One's Own",
    author: 'Virginia Woolf',
    priceCents: 1295,
    currency: 'CAD',
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780156787338-L.jpg',
    description:
      'A 1929 extended essay arguing that a woman must have money and a room of her own if she is to write fiction, and reconstructing the history that made this difficult.',
    categories: ['nonfiction', 'philosophy'],
  },
] as const;

export function getBookBySlug(slug: string): CatalogBook | undefined {
  return BOOKS.find((b) => b.slug === slug);
}

export function getFeaturedBooks(): CatalogBook[] {
  return BOOKS.filter((b) => b.featured);
}

export function getBooksByCategory(category: BookCategory | 'all'): CatalogBook[] {
  if (category === 'all') return [...BOOKS];
  return BOOKS.filter((b) => b.categories.includes(category));
}

export const CATEGORIES: { value: BookCategory; labelKey: string }[] = [
  { value: 'fiction', labelKey: 'categories.fiction' },
  { value: 'nonfiction', labelKey: 'categories.nonfiction' },
  { value: 'science', labelKey: 'categories.science' },
  { value: 'philosophy', labelKey: 'categories.philosophy' },
  { value: 'history', labelKey: 'categories.history' },
  { value: 'poetry', labelKey: 'categories.poetry' },
];
