import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function IngestPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/remotes');
  }, [router]);

  return null;
}
