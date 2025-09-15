import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-neutral-900 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          {/* Company Info */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">ServiceLink</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Better than Linktree, built for service businesses. Create a professional profile, 
              showcase your work, and let customers call you directly - all from one beautiful link.
            </p>
          </div>

          {/* Essential Links */}
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <a
              href="#features"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Features
            </a>
            <a
              href="#waitlist"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Waitlist
            </a>
            <a
              href="mailto:hello@servicelink.com"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Contact
            </a>
          </div>

          {/* Bottom Section */}
          <div className="pt-8 border-t border-neutral-800">
            <p className="text-gray-400 text-sm">
              © 2024 ServiceLink. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
