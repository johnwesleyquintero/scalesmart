import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { Box, Database, Folder, Code, Zap, TrendingUp } from 'lucide-react';

export default function FeatureHighlightsSection() {
  const features = [
    { 
      icon: Code, 
      title: "Full-Stack Development", 
      desc: "Next.js, Supabase, Vercel deployments with modern architecture",
      color: "from-blue-500 to-cyan-500"
    },
    { 
      icon: Database, 
      title: "Data-Driven Solutions", 
      desc: "Analytics, automation, and optimization for business intelligence",
      color: "from-purple-500 to-pink-500"
    },
    { 
      icon: Zap, 
      title: "E-commerce Operations", 
      desc: "Brand management with scalable systems",
      color: "from-orange-500 to-red-500"
    },
    { 
      icon: TrendingUp, 
      title: "Strategic Growth", 
      desc: "Building independent, sovereign digital systems for long-term success",
      color: "from-green-500 to-teal-500"
    },
    { 
      icon: Box, 
      title: "Operations Management", 
      desc: "Overseeing eCommerce brands with expertise",
      color: "from-indigo-500 to-blue-500"
    },
    { 
      icon: Folder, 
      title: "Project Portfolio", 
      desc: "Diverse range of successful digital products and platforms",
      color: "from-yellow-500 to-orange-500"
    }
  ];

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
          Core <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Expertise</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Leveraging technology to build scalable systems and drive operational excellence
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card 
              key={index} 
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              <CardContent className="p-6 text-center relative z-10">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} mb-4 group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-xl`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="mb-2 text-xl group-hover:text-primary transition-colors">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.desc}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="text-center mt-12">
        <Button asChild size="lg" className="group">
          <Link href="#projects">
            View All Projects
            <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">
              →
            </span>
          </Link>
        </Button>
      </div>
    </section>
  );
}
