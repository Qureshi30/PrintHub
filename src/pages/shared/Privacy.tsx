import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Shield, ArrowLeft, Download, Eye, Lock } from "lucide-react";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="text-muted-foreground">
              Last updated: December 15, 2024
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>

        {/* Privacy Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 text-center">
              <Lock className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-medium text-green-900">Data Protection</h3>
              <p className="text-sm text-green-700">Your documents are encrypted and secure</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 text-center">
              <Eye className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-medium text-blue-900">No Content Access</h3>
              <p className="text-sm text-blue-700">We don't read or access your documents</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-4 text-center">
              <Shield className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-medium text-purple-900">GDPR Compliant</h3>
              <p className="text-sm text-purple-700">Full compliance with privacy regulations</p>
            </CardContent>
          </Card>
        </div>

        {/* Privacy Policy Content */}
        <Card>
          <CardHeader>
            <CardTitle>PrintMate Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                PrintMate ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains 
                how we collect, use, disclose, and safeguard your information when you use our printing service. 
                Please read this policy carefully to understand our practices regarding your personal data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Personal Information</h3>
                  <p className="text-gray-700 mb-2">We collect information you provide directly to us, including:</p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Name and email address (required for account creation)</li>
                    <li>Educational institution information</li>
                    <li>Payment information (processed securely through third-party providers)</li>
                    <li>Support communications and feedback</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Document Information</h3>
                  <p className="text-gray-700 mb-2">When you use our printing service:</p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Document files you upload for printing</li>
                    <li>Print job specifications (copies, paper size, etc.)</li>
                    <li>Print history and job status information</li>
                    <li>File metadata (name, size, type, upload timestamp)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Usage Information</h3>
                  <p className="text-gray-700 mb-2">We automatically collect certain information about your use of our service:</p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Log data (IP address, browser type, access times)</li>
                    <li>Device information (operating system, screen resolution)</li>
                    <li>Service usage patterns and preferences</li>
                    <li>Error reports and diagnostic information</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-3">We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Provide, maintain, and improve our printing services</li>
                <li>Process your print jobs and handle payments</li>
                <li>Send you service-related notifications and updates</li>
                <li>Provide customer support and respond to your inquiries</li>
                <li>Analyze usage patterns to enhance user experience</li>
                <li>Detect and prevent fraud or unauthorized access</li>
                <li>Comply with legal obligations and enforce our terms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Document Privacy and Security</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-green-900 mb-2">🔒 Your Document Content is Private</h4>
                <p className="text-green-800 text-sm">
                  We do not access, read, scan, or analyze the content of your documents. Your files are processed 
                  automatically for printing purposes only.
                </p>
              </div>
              
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Encryption:</strong> All document uploads are encrypted in transit using TLS 1.3 and 
                  stored encrypted on our servers using AES-256 encryption.
                </p>
                <p>
                  <strong>Access Controls:</strong> Only automated systems necessary for print processing have 
                  access to your documents. No human employees access document content.
                </p>
                <p>
                  <strong>Retention:</strong> Documents are automatically deleted from our servers after printing 
                  is complete or within 30 days of upload, whichever comes first.
                </p>
                <p>
                  <strong>Backup and Recovery:</strong> Document backups are encrypted and deleted according to 
                  the same schedule as primary storage.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Information Sharing and Disclosure</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We do not sell, trade, or otherwise transfer your personal information to third parties except in 
                the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li><strong>Service Providers:</strong> Third-party vendors who assist in providing our services (payment processing, cloud hosting)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
                <li><strong>Safety and Security:</strong> To protect against fraud, security threats, or harm to rights and property</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (with notice to users)</li>
                <li><strong>Consent:</strong> When you explicitly consent to sharing specific information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Your Privacy Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Depending on your location, you may have the following rights regarding your personal information:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal obligations)</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service provider</li>
                <li><strong>Objection:</strong> Object to processing of your personal information for certain purposes</li>
                <li><strong>Restriction:</strong> Request limitation of how we process your information</li>
              </ul>
              <p className="text-gray-700 mt-3">
                To exercise these rights, please contact us at privacy@printmate.com. We will respond to your request 
                within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cookies and Tracking Technologies</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Essential Cookies:</strong> Required for the service to function, including authentication 
                  and security cookies.
                </p>
                <p>
                  <strong>Analytics Cookies:</strong> Help us understand how users interact with our service to 
                  improve performance and user experience.
                </p>
                <p>
                  <strong>Preference Cookies:</strong> Remember your settings and preferences across sessions.
                </p>
                <p>
                  You can control cookie settings through your browser preferences. Note that disabling certain 
                  cookies may affect service functionality.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We implement appropriate technical and organizational security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and vulnerability testing</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Employee training on data protection practices</li>
                <li>Incident response procedures for security breaches</li>
                <li>Compliance with industry security standards</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed">
                Your information may be transferred to and stored on servers located outside your country of residence. 
                We ensure appropriate safeguards are in place for international transfers, including standard contractual 
                clauses and adequacy decisions where applicable.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal 
                information from children under 13. If you are a parent or guardian and believe your child has provided 
                us with personal information, please contact us to have the information removed.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the 
                new Privacy Policy on this page and updating the "Last updated" date. For significant changes, we may 
                also send you a direct notification via email.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Contact Us</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 mb-2">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <ul className="space-y-1 text-gray-700">
                  <li><strong>Email:</strong> privacy@printmate.com</li>
                  <li><strong>Data Protection Officer:</strong> dpo@printmate.com</li>
                  <li><strong>Phone:</strong> +1 (555) 123-4567</li>
                  <li><strong>Address:</strong> 123 University Ave, Suite 100, College Town, ST 12345</li>
                </ul>
              </div>
            </section>

            <div className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-500 text-center">
                © 2024 PrintMate. All rights reserved. This privacy policy is effective as of December 15, 2024.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Button onClick={() => navigate('/terms')} variant="outline">
            View Terms of Service
          </Button>
          <Button onClick={() => navigate('/support')} variant="outline">
            Contact Support
          </Button>
          <Button onClick={() => navigate('/')} className="bg-gradient-hero">
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
