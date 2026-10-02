import { AuthGate } from '@/components/admin/AuthGate';
import { StudioShell } from '@/components/admin/StudioShell';

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <StudioShell>{children}</StudioShell>
    </AuthGate>
  );
}
