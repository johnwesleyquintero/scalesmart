import { Award, Calendar, CheckCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
const CERTIFICATION_SECTION_HEADING = 'Certifications';
// Then use CERTIFICATION_TITLE instead of repeating the string
const certifications = [
  {
    name: 'Amazon Advertising',
    issuer: 'Amazon',
    date: '2023',
    status: 'Active',
    credentialId: '-',
  },
  {
    name: 'Data Modeling',
    issuer: 'Pragmatic Works',
    date: '2024',
    status: 'Active',
    credentialId: 'PW-2024-DM',
  },
  {
    name: 'Catalog Management',
    issuer: 'MAG School',
    date: '2024',
    status: 'Active',
    credentialId: '66a7c61defaf90db750bde04',
  },
  {
    name: 'Design & Conversion',
    issuer: 'MAG School',
    date: '2024',
    status: 'Active',
    credentialId: '66a7c65840e6a05d9005d5eb',
  },
  {
    name: 'Launching on Amazon',
    issuer: 'MAG School',
    date: '2024',
    status: 'Active',
    credentialId: '66a7ce36b87e351e77072f99',
  },
  {
    name: 'Main Image CTR Course',
    issuer: 'MAG School',
    date: '2024',
    status: 'Active',
    credentialId: '66a7c5d70ef423bb240bd554',
  },
  {
    name: 'SEO Optimization',
    issuer: 'MAG School',
    date: '2024',
    status: 'Active',
    credentialId: '66a7c4f76b8386f0560b9407',
  },
  {
    name: 'Licensed Teacher',
    issuer: 'PRC',
    date: '2021',
    status: 'Active',
    credentialId: 'LPT-2021-05',
  },
];

export default function CertificationsSection() {
  return (
    <section id="certifications" className="py-20">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="section-heading">{CERTIFICATION_SECTION_HEADING}</h2>
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
                    <span className="text-green-600 dark:text-green-400">
                      {cert.status}
                    </span>
                  </div>
                  {cert.credentialId !== '-' && (
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
