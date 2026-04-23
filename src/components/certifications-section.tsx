import { Award, Calendar, CheckCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import educationData from '@/data/portfolio-data/education.json';

interface Certification {
  name: string;
  issuer: string;
  date: string;
  status: string;
  credentialId?: string;
}

const certifications = (educationData.certifications as Certification[]) || [];

export default function CertificationsSection() {
  return (
    <section id="certifications" className="py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="section-heading">Certifications</h2>

          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Professional certifications and credentials in Amazon, data
            analytics, and e-commerce.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {certifications.map((cert, index) => (
            <Card
              key={index}
              className="overflow-hidden transition-all duration-300 hover:shadow-lg"
            >
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{cert.name}</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Issuer:</span>
                    <span>{cert.issuer}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{cert.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-success dark:text-green-400">
                      {cert.status}
                    </span>
                  </div>
                  {cert.credentialId && cert.credentialId !== '-' && (
                    <div className="pt-2">
                      <Badge variant="secondary" className="text-xs">
                        ID: {cert.credentialId}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
