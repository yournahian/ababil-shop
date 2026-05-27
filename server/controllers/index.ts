import { Request, Response } from 'express';

export interface Product {
  id: number;
  title: string;
  image: string;
  price: string;
  isWeb3: boolean;
}

// Placeholder controller for products
export const getProducts = (req: Request, res: Response): void => {
  try {
    // In a real app, this would fetch from a database
    const sampleProducts: Product[] = [
      {
        id: 1,
        title: 'Neon Synchronizer',
        image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
        price: '2.5 ETH',
        isWeb3: true,
      },
      {
        id: 2,
        title: 'Quantum Headset',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
        price: '$299',
        isWeb3: false,
      },
      {
        id: 3,
        title: 'Cyber Deck V2',
        image: 'https://images.unsplash.com/photo-1600861194942-f883de0dfe96?auto=format&fit=crop&q=80&w=800',
        price: '0.8 ETH',
        isWeb3: true,
      },
      {
        id: 4,
        title: 'Haptic Gloves',
        image: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&q=80&w=800',
        price: '$149',
        isWeb3: false,
      }
    ];
    res.status(200).json({ success: true, data: sampleProducts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
