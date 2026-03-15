import { Button } from '@/components';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import React from 'react';

interface QuoteButtonProps {
  onClick?: () => void;
  contained?: boolean;
}

export const QuoteButton: React.FC<QuoteButtonProps> = ({
  onClick,
  contained = false,
}) => {
  if (contained) {
    return (
      <div className="max-w-xl mx-auto md:max-w-2xl lg:max-w-3xl px-4 pb-4">
        <div className="bg-neutral-900/90 backdrop-blur-md rounded-lg p-3">
          <Button onClick={onClick} variant="primary" className="w-full">
            <ChatBubbleLeftRightIcon className="h-6 w-6 mr-2" />
            Request Quote
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 inset-x-0 p-4 bg-neutral-900/80 backdrop-blur-md z-50">
      <div className="max-w-xl mx-auto">
        <Button onClick={onClick} variant="primary" className="w-full">
          <ChatBubbleLeftRightIcon className="h-6 w-6 mr-2" />
          Request Quote
        </Button>
      </div>
    </div>
  );
};
