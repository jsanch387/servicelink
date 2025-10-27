import { Logo } from '@/components/shared';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-neutral-900 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Left Side - Logo and Description */}
          <div>
            <div className="mb-4">
              <Logo size="lg" href="/" />
            </div>
            <p className="text-gray-300 text-base leading-relaxed">
              The professional business profile that gets you more customers.
              Stop paying for expensive websites and start growing your service
              business today.
            </p>
          </div>

          {/* Right Side - Contact */}
          <div className="text-left md:text-right">
            <h4 className="text-white font-semibold mb-3">Contact</h4>
            <a
              href="mailto:hello@servicelink.com"
              className="inline-flex items-center text-orange-400 hover:text-orange-300 transition-colors text-base font-medium"
            >
              <EnvelopeIcon className="w-4 h-4 mr-2" />
              app.servicelink@gmail.com
            </a>
          </div>
        </div>

        {/* Copyright - Full Width */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-gray-400 text-sm text-center">
            © 2024 ServiceLink. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
