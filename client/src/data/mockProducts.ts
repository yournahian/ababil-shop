export type ProductCategory = 'Tech Hardware' | 'Apparel' | 'Digital Assets' | 'NFTs' | 'Home & Living' | 'Gifts' | 'Toys';

export interface TieredPrice {
  minQuantity: number;
  maxQuantity: number | null;
  priceUSD: number;
  priceCrypto: number;
}

export interface Product {
  id: number;
  name: string;
  priceUSD: number;
  priceCrypto: number; // For Base network
  category: ProductCategory;
  image: string;
  description: string;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  moq?: number;
  tieredPricing?: TieredPrice[];
}

const generateMockProducts = (): Product[] => {
  const images = {
    'Tech Hardware': [
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1600861194942-f883de0dfe96?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800'
    ],
    'Apparel': [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1434389678232-040ee3df222d?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=800'
    ],
    'Digital Assets': [
      'https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800'
    ],
    'NFTs': [
      'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1638803040283-7a5ffa48bf0d?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1644361566696-3d442b5b482a?auto=format&fit=crop&q=80&w=800'
    ],
    'Home & Living': [
      'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1540932239986-30128078f3ea?auto=format&fit=crop&q=80&w=800'
    ],
    'Gifts': [
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&q=80&w=800'
    ],
    'Toys': [
      'https://images.unsplash.com/photo-1558060370-d644479cb6f7?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fit=crop&q=80&w=800'
    ]
  };

  const names = {
    'Tech Hardware': ['Neon Synchronizer', 'Quantum Headset', 'Cyber Deck V2', 'Haptic Gloves', 'Neural Interface Node', 'Holographic Display Unit', 'Crypto Hardware Wallet X', 'Mechanical Keyboard Z'],
    'Apparel': ['Cyberpunk Hoodie', 'Reflective Joggers', 'LED Sneakers', 'Anti-Surveillance Cap', 'Nano-Fiber Jacket', 'Metaverse Cargo Pants', 'Streetwear Utility Vest', 'Neon Thread Sneakers', 'Crypto Genesis Tee', 'Tech-Fleece Joggers'],
    'Digital Assets': ['Base Network Utility Pass', 'Ababil 3D Coin Asset', 'Metaverse Billboard Spot', 'Decentralized Domain Name', 'Virtual Real Estate - Sector 7'],
    'NFTs': ['Ababil Swallow Genesis NFT', 'Neon City Plot 42', 'Cyber Ape #1042', 'Mutant Cyborg Dog', 'Ethereal Sword of Base', 'Digital Gold Bar NFT'],
    'Home & Living': ['Minimalist Desk Lamp', 'Smart Coffee Maker', 'Ergonomic Office Chair', 'Floating Magnetic Planter', 'LED Smart Mirror', 'Ultrasonic Humidifier'],
    'Gifts': ['Premium Watch', 'Aromatherapy Diffuser', 'Silk Scarf', 'Luxury Spa Set', 'Custom Engraved Necklace', 'Leather Wallet'],
    'Toys': ['Retro Arcade Console', 'RC Drone', 'Lego Space Station', 'Smart Robot Dog', 'Magnetic Building Blocks', 'VR Gaming Headset']
  };

  const products: Product[] = [];
  let idCounter = 1;

  const categories: ProductCategory[] = ['Tech Hardware', 'Apparel', 'Digital Assets', 'NFTs', 'Home & Living', 'Gifts', 'Toys'];

  categories.forEach(category => {
    const categoryNames = names[category];
    const categoryImages = images[category];
    
    categoryNames.forEach((name, i) => {
      // Ensure "Home Arrivals under 50" gets cheap items
      // Max price is 5 USDC — generate between 0.50 and 5.00
      let priceUSD = parseFloat((Math.random() * 4.5 + 0.5).toFixed(2));
      if (category === 'Home & Living' && i < 2) {
        priceUSD = parseFloat((Math.random() * 2 + 0.5).toFixed(2)); // Slightly cheaper range
      }

      // priceCrypto = USDC (1:1 peg)
      const priceCrypto = priceUSD;
      
      const isB2B = category === 'Tech Hardware' || category === 'Apparel';
      const moq = isB2B ? Math.floor(Math.random() * 50) + 10 : undefined;
      
      let tieredPricing;
      if (isB2B && moq) {
        tieredPricing = [
          { minQuantity: moq, maxQuantity: moq + 49, priceUSD: Math.floor(priceUSD * 0.9), priceCrypto: parseFloat((priceCrypto * 0.9).toFixed(4)) },
          { minQuantity: moq + 50, maxQuantity: moq + 199, priceUSD: Math.floor(priceUSD * 0.8), priceCrypto: parseFloat((priceCrypto * 0.8).toFixed(4)) },
          { minQuantity: moq + 200, maxQuantity: null, priceUSD: Math.floor(priceUSD * 0.6), priceCrypto: parseFloat((priceCrypto * 0.6).toFixed(4)) },
        ];
      }

      products.push({
        id: idCounter++,
        name,
        priceUSD,
        priceCrypto,
        category,
        image: categoryImages[i % categoryImages.length],
        description: `Experience the pinnacle of ${category.toLowerCase()} with the ${name}. Crafted for the Ababil platform, delivering exceptional quality.`,
        inStock: Math.random() > 0.2,
        rating: parseFloat((Math.random() * (5.0 - 3.5) + 3.5).toFixed(1)),
        reviewCount: Math.floor(Math.random() * 500) + 10,
        tags: [category.toLowerCase().split(' ')[0], 'ababil', 'premium', Math.random() > 0.5 ? 'trending' : 'new'],
        ...(isB2B && { moq, tieredPricing })
      });
    });
  });

  return products;
};

export const mockProducts: Product[] = generateMockProducts();
