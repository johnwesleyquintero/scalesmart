import React from 'react';
import Link from 'next/link';

const Custom404 = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        backgroundColor: '#f8f8f8',
        color: '#333',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '4em', margin: '0.2em' }}>404</h1>
      <p style={{ fontSize: '1.2em' }}>Page Not Found</p>
      <p>
        The page you are looking for might have been removed, had its name
        changed, or is temporarily unavailable.
      </p>
      <Link
        href="/"
        style={{ color: '#0070f3', textDecoration: 'none', marginTop: '1em' }}
      >
        Go back to homepage
      </Link>
    </div>
  );
};

export default Custom404;
