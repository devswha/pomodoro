'use client';

import { ClientAuthWrapper } from '../../lib/components/ClientAuthWrapper';

export default function DashboardLayout({ children }) {
  return (
    <ClientAuthWrapper requireAuth={true}>
      {children}
    </ClientAuthWrapper>
  );
}