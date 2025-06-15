import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { Box, Database, Folder } from 'lucide-react';

export default function FeatureHighlightsSection() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <h2 className="mb-12 text-center text-3xl font-bold tracking-tight sm:text-4xl">
        Key Features
      </h2>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Amazon Seller Tools Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="mb-4 flex items-center justify-center rounded-md bg-primary/10 p-3 text-primary">
              <Box className="h-6 w-6" />
            </div>
            <CardTitle>Amazon Seller Tools</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-grow flex-col justify-between">
            <CardDescription className="mb-6">
              Optimize your Amazon business with powerful tools for keyword
              analysis, PPC management, profit calculation, and more.
            </CardDescription>
            <Button asChild className="w-full">
              <Link href="/amazon-seller-tools">
                Learn More about Amazon Seller Tools
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* CRM Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="mb-4 flex items-center justify-center rounded-md bg-green-500/10 p-3 text-green-600 dark:text-green-400">
              <Database className="h-6 w-6" />
            </div>
            <CardTitle>CRM</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-grow flex-col justify-between">
            <CardDescription className="mb-6">
              Manage your customer relationships effectively with our integrated
              CRM system. Track leads, interactions, and sales pipelines.
            </CardDescription>
            <Button asChild className="w-full">
              <Link href="/crm">Learn More about CRM</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Project Management Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="mb-4 flex items-center justify-center rounded-md bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400">
              <Folder className="h-6 w-6" />
            </div>
            <CardTitle>Project Management</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-grow flex-col justify-between">
            <CardDescription className="mb-6">
              Organize your tasks, projects, and team collaborations in one
              place. Streamline your workflow and boost productivity.
            </CardDescription>
            <Button asChild className="w-full">
              <Link href="/project-management">
                Learn More about Project Management
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
