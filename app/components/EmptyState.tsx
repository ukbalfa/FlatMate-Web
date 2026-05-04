'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  emoji?: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

export function EmptyState({ icon, emoji, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {icon ? (
        <div className="w-16 h-16 rounded-2xl bg-[#F97316]/10 flex items-center justify-center mb-5">
          <div className="text-[#F97316] opacity-70">{icon}</div>
        </div>
      ) : emoji ? (
        <div className="text-5xl mb-5" aria-hidden="true">
          {emoji}
        </div>
      ) : null}

      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 max-w-xs leading-relaxed mb-6">
        {description}
      </p>

      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="inline-flex items-center gap-2 bg-[#F97316] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#188a65] transition-colors cursor-pointer"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 bg-[#F97316] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#188a65] transition-colors cursor-pointer"
          >
            {action.label}
          </button>
        )
      )}
    </motion.div>
  );
}