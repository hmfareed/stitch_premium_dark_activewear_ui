'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/register/customer');
  }, [router]);

  return null;
}
