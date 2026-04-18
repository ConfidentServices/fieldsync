import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FieldSync — Field Service Intelligence',
  description: 'Connect your existing CRM in 10 minutes. See insights you\'ve never had. Automate the work that\'s costing you money every day.',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%2322c55e'/><text y='22' x='6' font-size='18' font-weight='bold' fill='black'>FS</text></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0f] text-slate-100 antialiased">{children}</body>
    </html>
  );
}
