import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function EntityDetailPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/entities');
  }, [router]);

  return null;
}
