import { GlassCard } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import type { GuideMeta } from '@/features/resources/data/guides';
import Link from 'next/link';
import React from 'react';

interface GuideCardProps {
  guide: GuideMeta;
}

export const GuideCard: React.FC<GuideCardProps> = ({ guide }) => {
  const href = ROUTES.RESOURCE_GUIDE(guide.slug);

  return (
    <Link href={href} className="block group">
      <GlassCard
        padding="lg"
        rounded="rounded-2xl"
        className="h-full transition-colors group-hover:border-white/20"
      >
        <h3 className="text-base font-semibold text-white mb-2">
          {guide.title}
        </h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          {guide.subheading}
        </p>
        <span className="inline-block mt-3 text-xs font-medium text-gray-400 group-hover:text-white transition-colors">
          Read guide →
        </span>
      </GlassCard>
    </Link>
  );
};
