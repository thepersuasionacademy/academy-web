import ProfilePage from '@/app/profile/page';

// Server Component
export default function Page({ params }: { params: { id: string } }) {
  // Render the profile page with the specific user ID
  return <ProfilePage userId={params.id} />;
} 