import React from 'react';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-heading',
});

export const metadata = {
  title: 'Ababil Shop — Production-Grade Vendor Dashboard',
  description: 'Manage items, track ledger orders, and analyze XP prestige metrics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="bg-black text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
