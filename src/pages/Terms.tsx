import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileText, ArrowLeft, Download } from "lucide-react";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
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

        {/* Terms Content */}
        <Card>
          <CardHeader>
            <CardTitle>PrintMate Terms of Service Agreement</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using PrintMate ("the Service"), you accept and agree to be bound by the terms and 
                provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Service Description</h2>
              <p className="text-gray-700 leading-relaxed">
                PrintMate is a web-based printing service that allows users to upload, manage, and print documents 
                at designated printer locations. Our service includes:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
                <li>Document upload and file management</li>
                <li>Print job scheduling and management</li>
                <li>Payment processing for printing services</li>
                <li>Print queue monitoring and notifications</li>
                <li>Group printing capabilities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. User Account and Registration</h2>
              <p className="text-gray-700 leading-relaxed">
                To use PrintMate, you must register for an account using a valid email address. You are responsible for:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Providing accurate and up-to-date information</li>
                <li>Notifying us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Acceptable Use Policy</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                You agree not to use the service to:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Upload or print copyrighted material without permission</li>
                <li>Print illegal, offensive, or inappropriate content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the service</li>
                <li>Use the service for commercial purposes without authorization</li>
                <li>Share account credentials with others</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Payment and Billing</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Payment Terms:</strong> All printing services must be paid for in advance. We accept major 
                  credit cards and campus payment methods where available.
                </p>
                <p>
                  <strong>Pricing:</strong> Current pricing is displayed during the print job setup process. Prices 
                  may vary by location, paper type, and print specifications.
                </p>
                <p>
                  <strong>Refunds:</strong> Refunds are available for unprinted jobs or technical issues on our end. 
                  Refund requests must be submitted within 7 days of the original transaction.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Document Handling and Privacy</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Document Storage:</strong> Uploaded documents are temporarily stored on our secure servers 
                  for processing and printing. Documents are automatically deleted after 30 days or once printed, 
                  whichever comes first.
                </p>
                <p>
                  <strong>Privacy:</strong> We do not access, read, or share the content of your documents except 
                  as necessary to provide printing services or as required by law.
                </p>
                <p>
                  <strong>Security:</strong> All document uploads and account access are encrypted using industry-standard 
                  security protocols.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Service Availability</h2>
              <p className="text-gray-700 leading-relaxed">
                While we strive to maintain 24/7 service availability, PrintMate is provided "as is" without warranty 
                of uninterrupted service. We may experience temporary outages for maintenance, updates, or due to 
                circumstances beyond our control.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                PrintMate shall not be liable for any indirect, incidental, special, consequential, or punitive damages, 
                including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting 
                from your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed">
                The PrintMate service, including all content, features, and functionality, is owned by PrintMate and 
                is protected by copyright, trademark, and other intellectual property laws. You retain ownership of 
                all documents you upload to the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to terminate or suspend your account at any time for violation of these terms 
                or for any other reason at our sole discretion. You may terminate your account at any time by 
                contacting customer support.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these terms at any time. Changes will be effective immediately upon 
                posting to the service. Your continued use of PrintMate after changes are posted constitutes acceptance 
                of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These terms shall be governed by and construed in accordance with the laws of [State/Country], 
                without regard to its conflict of law provisions. Any disputes arising from these terms or use of 
                the service shall be resolved in the courts of [Jurisdiction].
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Contact Information</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 mb-2">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <ul className="space-y-1 text-gray-700">
                  <li><strong>Email:</strong> legal@printmate.com</li>
                  <li><strong>Phone:</strong> +1 (555) 123-4567</li>
                  <li><strong>Address:</strong> 123 University Ave, Suite 100, College Town, ST 12345</li>
                </ul>
              </div>
            </section>

            <div className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-500 text-center">
                © 2024 PrintMate. All rights reserved. These terms are effective as of December 15, 2024.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Button onClick={() => navigate('/privacy')} variant="outline">
            View Privacy Policy
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
