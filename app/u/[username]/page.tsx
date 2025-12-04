import UserProfileClient from './UserProfileClient';

// Static export compatibility: no pre-rendered usernames; everything loads client-side.
export const dynamic = 'force-static';
export const dynamicParams = false;
export const revalidate = 0;

export async function generateStaticParams() {
  // No pre-rendered usernames; client-side fetch handles all users.
  return [];
}

export default function UserProfilePageWrapper(props: { params: { username: string } }) {
  return <UserProfileClient params={props.params} />;
}
