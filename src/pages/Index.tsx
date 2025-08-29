import React from 'react';
import WalletConnection from '@/components/WalletConnection';
import SwapInterface from '@/components/SwapInterface';
import SEOHead from '@/components/SEOHead';

const Index = () => {
  return (
    <>
      <SEOHead />
      <main className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Gala DEX
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Trade your favorite Gala ecosystem tokens with lightning speed and minimal fees
            </p>
          </header>

          <section className="flex flex-col lg:flex-row gap-8 items-start justify-center" aria-label="Trading Interface">
            <aside className="order-2 lg:order-1" aria-label="Wallet Connection">
              <WalletConnection />
            </aside>
            
            <section className="order-1 lg:order-2" aria-label="Token Swap">
              <SwapInterface />
            </section>
          </section>

          <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center" aria-label="Platform Features">
            <article className="p-6 bg-card rounded-lg border">
              <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground">Execute swaps in seconds with our optimized smart contracts</p>
            </article>
            <article className="p-6 bg-card rounded-lg border">
              <h3 className="text-lg font-semibold mb-2">Low Fees</h3>
              <p className="text-muted-foreground">Trade with minimal fees and maximum value for your transactions</p>
            </article>
            <article className="p-6 bg-card rounded-lg border">
              <h3 className="text-lg font-semibold mb-2">Secure</h3>
              <p className="text-muted-foreground">Your funds are protected by battle-tested smart contracts</p>
            </article>
          </section>
        </div>
      </main>
    </>
  );
};

export default Index;
