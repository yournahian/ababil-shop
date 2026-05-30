-- Seed file for local development
-- Insert mock users into auth.users (enabling auth.uid() matching in RLS)
-- Password for all mock accounts is 'password123' (hashed using bcrypt)

INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'admin@ababilpay.xyz',
    '$2a$10$U5M5m/7aX6Z545vR5cWnZORXbUeZ47RFe8KkWmG7h0z2vHk0F0VDe', -- bcrypt hash of 'password123'
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Ababil Admin", "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}',
    NOW(),
    NOW(),
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    ''
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'cybercore@ababilpay.xyz',
    '$2a$10$U5M5m/7aX6Z545vR5cWnZORXbUeZ47RFe8KkWmG7h0z2vHk0F0VDe',
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "CyberCore Tech", "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"}',
    NOW(),
    NOW(),
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    ''
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'neonthreads@ababilpay.xyz',
    '$2a$10$U5M5m/7aX6Z545vR5cWnZORXbUeZ47RFe8KkWmG7h0z2vHk0F0VDe',
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Neon Threads", "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200"}',
    NOW(),
    NOW(),
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    ''
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '00000000-0000-0000-0000-000000000000',
    'buyer@ababilpay.xyz',
    '$2a$10$U5M5m/7aX6Z545vR5cWnZORXbUeZ47RFe8KkWmG7h0z2vHk0F0VDe',
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Alex Buyer", "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200"}',
    NOW(),
    NOW(),
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    ''
  )
ON CONFLICT (id) DO UPDATE SET
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = NOW(),
  confirmation_token = '',
  email_change = '',
  email_change_token_new = '',
  recovery_token = '';

-- Explicitly seed profiles to guarantee their existence even if auth.users already has these IDs (preventing trigger bypass)
INSERT INTO public.profiles (id, username, email, full_name, avatar_url, role, xp, level)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'admin',
    'admin@ababilpay.xyz',
    'Ababil Admin',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    'admin',
    5000,
    8
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'cybercore',
    'cybercore@ababilpay.xyz',
    'CyberCore Tech',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    'vendor',
    2500,
    6
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'neonthreads',
    'neonthreads@ababilpay.xyz',
    'Neon Threads',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    'vendor',
    1500,
    4
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'buyer',
    'buyer@ababilpay.xyz',
    'Alex Buyer',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    'customer',
    450,
    3
  )
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  xp = EXCLUDED.xp,
  level = EXCLUDED.level,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url;

-- Insert into public.vendors
INSERT INTO public.vendors (id, name, slug, description, banner_url, logo_url, rating, num_reviews, wallet_address, verified, xp, level)
VALUES
  (
    '22222222-2222-2222-2222-222222222222',
    'CyberCore Tech',
    'cybercore-tech',
    'Premium hardware, chips, and haptic systems for the metaverse.',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=200',
    5.00,
    0,
    '0x2222222222222222222222222222222222222222',
    true,
    2500,
    6
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Neon Threads',
    'neon-threads',
    'Vibrant high-performance wearable tech and streetwear.',
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=200',
    4.80,
    1,
    '0x3333333333333333333333333333333333333333',
    false,
    1500,
    4
  )
ON CONFLICT (id) DO NOTHING;

-- Insert Products under 5 USDC
INSERT INTO public.products (id, vendor_id, name, slug, description, price_usd, price_crypto, currency, category, images, in_stock, inventory, rating, num_reviews, tags, status, moq, tiered_pricing)
VALUES
  -- CyberCore Tech (Vendor 1) Products
  (
    'a1111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'Quantum Headset Spacer',
    'quantum-headset-spacer',
    'Ergonomic spacer made with nano-gel, providing max comfort during prolonged VR session.',
    2.50,
    2.50,
    'USDC',
    'Tech Hardware',
    ARRAY['https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&q=80&w=800'],
    true,
    150,
    4.90,
    12,
    ARRAY['tech', 'comfort', 'vr'],
    'active',
    10,
    '[{"minQuantity": 10, "maxQuantity": 49, "priceUSD": 2.25, "priceCrypto": 2.25}, {"minQuantity": 50, "maxQuantity": null, "priceUSD": 2.00, "priceCrypto": 2.00}]'::jsonb
  ),
  (
    'a2222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    'Haptic Finger Cot',
    'haptic-finger-cot',
    'Ultra-thin fingertip sensors mapping micro-movements to digital realms.',
    4.20,
    4.20,
    'USDC',
    'Tech Hardware',
    ARRAY['https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=800'],
    true,
    80,
    4.80,
    24,
    ARRAY['haptic', 'sensors', 'tech'],
    'active',
    5,
    '[{"minQuantity": 5, "maxQuantity": 19, "priceUSD": 4.00, "priceCrypto": 4.00}, {"minQuantity": 20, "maxQuantity": null, "priceUSD": 3.70, "priceCrypto": 3.70}]'::jsonb
  ),
  (
    'a3333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    'Ababil 3D Coin Asset',
    'ababil-3d-coin-asset',
    'Spinning high-poly 3D coin model, fully rigged for game engines and Web3 projects.',
    1.99,
    1.99,
    'USDC',
    'Digital Assets',
    ARRAY['https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&q=80&w=800'],
    true,
    999,
    5.00,
    45,
    ARRAY['3d', 'model', 'ababil'],
    'active',
    NULL,
    NULL
  ),
  -- Neon Threads (Vendor 2) Products
  (
    'b1111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    'Reflective Laces (Neon)',
    'reflective-laces-neon',
    'High-visibility glowing fiber-optic shoelaces, standard length.',
    3.00,
    3.00,
    'USDC',
    'Apparel',
    ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800'],
    true,
    200,
    4.70,
    18,
    ARRAY['streetwear', 'neon', 'apparel'],
    'active',
    20,
    '[{"minQuantity": 20, "maxQuantity": 99, "priceUSD": 2.70, "priceCrypto": 2.70}, {"minQuantity": 100, "maxQuantity": null, "priceUSD": 2.40, "priceCrypto": 2.40}]'::jsonb
  ),
  (
    'b2222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    'Base Network Swallow NFT',
    'base-network-swallow-nft',
    'Collectible Genesis Swallow art series on Base Sepolia.',
    4.99,
    4.99,
    'USDC',
    'NFTs',
    ARRAY['https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=800'],
    true,
    50,
    4.95,
    9,
    ARRAY['nft', 'art', 'swallow'],
    'active',
    NULL,
    NULL
  ),
  (
    'b3333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    'Cyber Glow Coaster',
    'cyber-glow-coaster',
    'Glow-in-the-dark premium silicon coaster with futuristic circuits design.',
    1.50,
    1.50,
    'USDC',
    'Home & Living',
    ARRAY['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800'],
    true,
    500,
    4.50,
    3,
    ARRAY['coaster', 'home', 'glow'],
    'active',
    NULL,
    NULL
  )
ON CONFLICT (id) DO NOTHING;

-- Insert a review to test trigger recalculations
INSERT INTO public.reviews (id, product_id, customer_id, rating, comment)
VALUES (
  '99999999-9999-9999-9999-999999999999',
  'b1111111-1111-1111-1111-111111111111',
  '44444444-4444-4444-4444-444444444444',
  5,
  'Incredible neon glow! Matches my LED sneakers perfectly.'
)
ON CONFLICT (id) DO NOTHING;

-- Insert some initial XP history
INSERT INTO public.xp_transactions (id, user_id, amount, source, description)
VALUES
  ('c1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 100, 'purchase', 'Earned from ordering Reflective Laces'),
  ('c2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 50, 'review', 'Earned from reviewing Reflective Laces')
ON CONFLICT (id) DO NOTHING;
