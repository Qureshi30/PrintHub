import { Shield, Lock, Eye, Trash2, FileText, Server, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SecurityPrivacy() {
  const securityFeatures = [
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "All documents are encrypted using AES-256 encryption during upload, storage, and transmission."
    },
    {
      icon: Trash2,
      title: "Auto-Deletion",
      description: "Documents are automatically deleted from our servers within 24 hours after printing."
    },
    {
      icon: Eye,
      title: "Access Control",
      description: "Only you and authorized printing staff can access your documents with secure authentication."
    },
    {
      icon: Server,
      title: "Secure Storage",
      description: "Documents stored on encrypted servers with regular security audits and compliance monitoring."
    }
  ];

  const complianceStandards = [
    "SOC 2 Type II Compliant",
    "GDPR Compliant",
    "HIPAA Ready Infrastructure",
    "ISO 27001 Certified",
    "Regular Security Audits"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mb-8 shadow-2xl">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Secure & Private
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Your documents deserve the highest level of security. We employ enterprise-grade encryption, 
              automatic deletion, and strict access controls to protect your sensitive information.
            </p>
          </div>
        </div>
      </div>

      {/* Security Features */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Security Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Multi-layered security approach to keep your documents safe at every step.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {securityFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={feature.title} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <IconComponent className="w-6 h-6 text-blue-600" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">How Your Data is Protected</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">1. Secure Upload</h3>
              <p className="text-muted-foreground">
                Files are encrypted immediately upon upload using military-grade AES-256 encryption.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-6">
                <Server className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">2. Secure Storage</h3>
              <p className="text-muted-foreground">
                Encrypted files are stored on secure servers with restricted access and constant monitoring.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">3. Auto-Deletion</h3>
              <p className="text-muted-foreground">
                Files are automatically and permanently deleted within 24 hours after successful printing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Standards */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Compliance & Certifications</h2>
            <p className="text-lg text-muted-foreground">
              We meet the highest industry standards for data protection and security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {complianceStandards.map((standard) => (
              <div key={standard} className="flex items-center gap-3 p-4 rounded-lg border bg-card">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="font-medium">{standard}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Print Securely?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students who trust PrintHub with their important documents.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
              Start Printing Securely
            </button>
            <button className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
