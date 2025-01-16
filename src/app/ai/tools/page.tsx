'use client'

import { useEffect } from 'react';
import { redirect } from 'next/navigation';

const Redirect = () => {
  redirect('/ai');
};

export default Redirect;