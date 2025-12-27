import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CatalogSearchPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/catalog');
  }, [router]);

  return null;
}
