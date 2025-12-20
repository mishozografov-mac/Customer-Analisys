
import { ProductGroup } from './types';

export const DEFAULT_PRODUCT_GROUPS: ProductGroup[] = [
  {
    id: 'shop-equipment',
    name: 'Оборудване за магазини',
    description: `Target: Physical Stores (Brick-and-Mortar).
CRITERIA: Must have a physical location where customers enter to buy from shelves.
IDEAL: Supermarkets, Grocery, Pharmacy, Pet shops, Bookstores, Hardware stores, Auto parts.
NEGATIVE: Pure E-commerce (no showroom), Office-only businesses, Service providers (Hairdressers).`
  },
  {
    id: 'plexiglass-displays',
    name: 'Плексигласови изделия (Дистрибутори)',
    description: `Target: Brand Owners & Distributors.
CRITERIA: Manufacturers/Importers with their own brand who distribute small/impulse products to retail networks.
IDEAL: Cosmetics, Vape & Tobacco, Phone accessories, Impulse sweets/gum.
NEGATIVE: Retailers selling other brands, Heavy machinery.`
  },
  {
    id: 'wood-displays',
    name: 'Дървени стелажи (Bio/Eco)',
    description: `Target: Eco/Bio/Craft Brands.
CRITERIA: Brands marketing "Natural", "Bio", "Eco", or "Craft" image.
IDEAL: Wineries, Craft Breweries, Honey/Tea/Coffee producers, Bio cosmetics, Souvenirs & Art.
NEGATIVE: High-tech electronics, Industrial parts.`
  },
  {
    id: 'metal-showroom',
    name: 'Метални стелажи & Шоурум',
    description: `Target: Heavy Duty & Showrooms.
CRITERIA: Large manufacturers/importers of heavy items or those building showroom corners.
IDEAL: Construction materials (tiles, flooring), Power tools, Auto parts (tires, oil), Large FMCG (Beverages/Water).`
  },
  {
    id: 'store-accessories',
    name: 'Аксесоари за магазини (Универсални)',
    description: `Target: EVERYONE with physical goods.
CRITERIA: Universal application. From market stalls to large warehouses. Needs hooks, label holders, baskets.
IDEAL: Retail (All types), Warehouses (Labeling/Organization), Micro-business (Market stalls), Archives.
NEGATIVE: Pure Digital/Software companies with no physical goods.`
  },
  {
    id: 'advertising-equipment',
    name: 'Рекламно оборудване (Офиси & Събития)',
    description: `Target: Visual Communication & Events.
CRITERIA: 1. Stationary (Banks, Offices for posters/frames). 2. Mobile (Exhibitors at fairs/conferences).
IDEAL: Banks, Insurance, Real Estate, HORECA (Menu boards), B2B Exhibitors (Trade fairs), Universities.
NEGATIVE: Hidden factories without visitors, Home office.`
  },
  {
    id: 'warehouse-archive',
    name: 'Склад и Архив',
    description: `Target: Storage & Organization (Back-office).
CRITERIA: Organizations storing documents or goods not for direct customer access. Focus on capacity.
IDEAL: Accountants/Lawyers (Heavy documentation), E-commerce picking zones, Hospital archives, Back-store areas.
NEGATIVE: Heavy pallet logistics (Forklift only), Virtual offices.`
  },
  {
    id: 'office-furniture',
    name: 'Офис мебели',
    description: `Target: Admin Personnel & Workstations.
CRITERIA: Focus on number of people working at desks/computers and document storage.
IDEAL: Accountants, Lawyers, IT Companies, Call Centers, Educational centers, Admin departments of factories.
NEGATIVE: Micro-retail stalls, Heavy manual labor (construction crews), Restaurants (except manager office).`
  }
];
