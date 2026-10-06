import React from 'react';
import { OrderStatus } from '../data/storeData';

interface StatusBadgeProps {
  status: OrderStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStyles = (st: string) => {
    const lower = st.toLowerCase();
    if (st.includes('បានកម្មង់') || lower === 'new') {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    if (lower === 'confirmed') {
      return 'bg-sky-50 text-sky-800 border-sky-200';
    }
    if (lower === 'packing') {
      return 'bg-amber-100/80 text-amber-900 border-amber-300';
    }
    if (st.includes('បានវិចខ្ចប់') || lower === 'packed') {
      return 'bg-blue-50 text-blue-800 border-blue-200';
    }
    if (st.includes('កំពុងដឹក') || lower === 'shipping') {
      return 'bg-purple-50 text-[#5B21D6] border-purple-200';
    }
    if (st.includes('ជោគជ័យ') || lower === 'delivered' || lower === 'done') {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (st.includes('បរាជ័យ') || lower === 'failed') {
      return 'bg-red-50 text-red-800 border-red-200';
    }
    if (st.includes('ដោះដូរ')) {
      return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    }
    if (st.includes('ខុសសាយ')) {
      return 'bg-orange-50 text-orange-800 border-orange-200';
    }
    return 'bg-neutral-100 text-neutral-700 border-neutral-200';
  };

  const getDisplayLabel = (st: string) => {
    const lower = st.toLowerCase();
    if (lower === 'done') return 'បានបញ្ចប់';
    if (lower === 'pending' || lower === 'new' || lower === 'confirmed' || lower === 'packing') {
      return 'កំពុងរង់ចាំ';
    }
    if (lower === 'shipping') return 'កំពុងដឹកជញ្ជូន';
    if (lower === 'success' || lower === 'delivered') return 'ជោគជ័យ';
    if (lower === 'failed') return 'បរាជ័យ';
    return st;
  };

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border whitespace-nowrap shrink-0 font-khmer ${sizeClass} ${getStyles(
        status
      )}`}
    >
      {getDisplayLabel(status)}
    </span>
  );
};
