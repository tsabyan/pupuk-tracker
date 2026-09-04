import { AppShell } from '@/components/shell/app-shell'

export default function LayoutAplikasi({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
