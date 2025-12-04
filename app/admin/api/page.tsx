'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SwaggerPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to backend Swagger UI
    const swaggerUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.patreek.com'}/swagger-ui.html`;
    window.location.href = swaggerUrl;
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <p>Redirecting to Swagger UI...</p>
      <a 
        href={`${process.env.NEXT_PUBLIC_API_URL || 'https://api.patreek.com'}/swagger-ui.html`}
        style={{ color: '#2563eb', textDecoration: 'underline' }}
      >
        Click here if you're not redirected
      </a>
    </div>
  );
}

