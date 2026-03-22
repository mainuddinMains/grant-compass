import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { readUsers, readSearches } from '@/lib/auth-db';
import Dashboard from '@/components/Dashboard';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;
  const [allUsers, allSearches] = await Promise.all([readUsers(), readSearches()]);

  const user = allUsers.find((u) => u.id === userId);
  const userSearches = allSearches
    .filter((s) => s.userId === userId)
    .sort((a, b) => b.timestamp - a.timestamp);

  const totalSearches = userSearches.length;
  const grantsFound = userSearches.reduce((acc, s) => acc + s.grantsFound, 0);
  const lettersGenerated = user?.lettersGenerated ?? 0;
  const bestMatchScore =
    userSearches.length > 0
      ? Math.max(...userSearches.map((s) => s.topMatchScore))
      : 0;
  const recentSearches = userSearches.slice(0, 5);

  return (
    <Dashboard
      userName={session.user.name ?? 'Researcher'}
      totalSearches={totalSearches}
      grantsFound={grantsFound}
      lettersGenerated={lettersGenerated}
      bestMatchScore={bestMatchScore}
      recentSearches={recentSearches}
    />
  );
}
