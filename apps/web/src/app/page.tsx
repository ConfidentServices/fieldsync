import { redirect } from 'next/navigation';

// Root → dashboard (will go to auth in Week 3)
export default function RootPage() {
  redirect('/dashboard');
}
