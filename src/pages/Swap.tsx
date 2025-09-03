import SwapInterface from '@/components/SwapInterface';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Swap = () => {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Navigation */}
        <div className="flex justify-start mb-6">
          <Button asChild variant="outline" className="bg-background/50 backdrop-blur-sm">
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Token Swap
          </h1>
          <p className="text-lg text-muted-foreground">
            Trade your favorite Gala ecosystem tokens
          </p>
        </div>

        <div className="flex justify-center">
          <SwapInterface />
        </div>
      </div>
    </main>
  );
};

export default Swap;