import { useEffect } from 'react';
import Head from 'next/head';

const PREVIEW_URL = '/preview/agent-matrix/project/index.html';

export default function MatrixCloudPreview() {
  useEffect(() => {
    window.location.replace(PREVIEW_URL);
  }, []);

  return (
    <>
      <Head>
        <title>Matrix Cloud Admin — design preview</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#07090a',
          color: '#c2cdc4',
          fontFamily:
            '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 13,
          letterSpacing: '0.02em',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 12 }}>opening matrix cloud preview…</div>
          <a href={PREVIEW_URL} style={{ color: '#7be09d' }}>
            click here if it does not redirect
          </a>
        </div>
      </main>
    </>
  );
}
