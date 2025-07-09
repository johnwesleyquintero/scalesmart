'use client';

import React from 'react';
import { HeadingsSetter } from './HeadingsSetter';
import { Heading } from '@/lib/docs-data/get-headings';

interface ClientHeadingsSetterWrapperProps {
  headings: Heading[];
}

export function ClientHeadingsSetterWrapper({
  headings,
}: ClientHeadingsSetterWrapperProps) {
  return <HeadingsSetter headings={headings} />;
}
