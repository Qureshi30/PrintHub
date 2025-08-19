import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useUser } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";
import { 
  HelpCircle, 
  MessageCircle, 
  Mail, 
  Phone, 
  Search,
  FileText,
  Printer,
  CreditCard,
  Clock,
  Send,
  ExternalLink
} from "lucide-react";

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  helpful?: number;
}

export default function Support() {
  const { user } = useUser();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("general");

  const faqs: FAQ[] = [
    {
      id: "1",
      category: "printing",
      question: "Why is my file not printing?",
      answer: "Common reasons include: unsupported file format, file corruption, printer queue issues, or insufficient account balance. Try re-uploading your file in PDF format and ensure your account has sufficient credits.",
      helpful: 24
    },
    {
      id: "2", 
      category: "printing",
      question: "What file formats are supported?",
      answer: "We support PDF, DOC, DOCX, TXT, and most image formats (JPG, PNG, GIF). For best results, we recommend converting your documents to PDF before uploading.",
      helpful: 18
    },
    {
      id: "3",
      category: "payment",
      question: "My payment is stuck or failed. What should I do?",
      answer: "If your payment fails, check your card details and try again. For stuck payments, contact support with your transaction ID. Payments typically process within 2-3 minutes.",
      helpful: 12
    },
    {
      id: "4",
      category: "payment", 
      question: "How do I get a refund?",
      answer: "Refunds are available for unprinted jobs or technical issues on our end. Submit a support ticket with your job ID and reason for refund. Processing takes 3-5 business days.",
      helpful: 15
    },
    {
      id: "5",
      category: "account",
      question: "How do I reset my password?",
      answer: "Click 'Forgot Password' on the login page, enter your email, and follow the reset instructions. If you don't receive the email, check your spam folder or contact support.",
      helpful: 8
    },
    {
      id: "6",
      category: "account",
      question: "Can I change my registered email?",
      answer: "Yes, go to User Settings > Profile Information > Manage Profile to update your email address through your account dashboard.",
      helpful: 6
    },
    {
      id: "7",
      category: "general",
      question: "Where do I collect my printed documents?",
      answer: "Documents can be collected from the printer location shown in your job confirmation. Bring your student ID and job confirmation code. Jobs are held for 24 hours.",
      helpful: 22
    },
    {
      id: "8",
      category: "general",
      question: "What are your operating hours?",
      answer: "Our printing services are available 24/7 through the web portal. Physical printer locations operate Monday-Friday 8:00 AM - 6:00 PM, Saturday 9:00 AM - 4:00 PM.",
      helpful: 11
    }
  ];

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleSubmitTicket = () => {
    if (!ticketSubject || !ticketMessage) {
      toast({
        title: "Missing information",
        description: "Please fill in both subject and message fields.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Support ticket submitted!",
      description: "We'll respond to your inquiry within 24 hours via email.",
    });

    setTicketSubject("");
    setTicketMessage("");
  };

  const filteredFAQs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (selectedCategory !== "all" && faq.category === selectedCategory)
  );

  const categories = [
    { id: "all", name: "All Topics", icon: HelpCircle },
    { id: "printing", name: "Printing Issues", icon: Printer },
    { id: "payment", name: "Payment & Billing", icon: CreditCard },
    { id: "account", name: "Account Settings", icon: FileText },
    { id: "general", name: "General", icon: MessageCircle }
  ];

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <HelpCircle className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
              <p className="text-muted-foreground">
                Find answers to common questions or get help from our support team
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4 text-center">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-medium text-blue-900">Live Chat</h3>
                <p className="text-sm text-blue-700 mb-3">Get instant help</p>
                <Button size="sm" variant="outline" className="border-blue-300">
                  Start Chat
                </Button>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4 text-center">
                <Mail className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-medium text-green-900">Email Support</h3>
                <p className="text-sm text-green-700 mb-3">Response in 24h</p>
                <Button size="sm" variant="outline" className="border-green-300">
                  Send Email
                </Button>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4 text-center">
                <Phone className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-medium text-purple-900">Phone Support</h3>
                <p className="text-sm text-purple-700 mb-3">Mon-Fri 9AM-5PM</p>
                <Button size="sm" variant="outline" className="border-purple-300">
                  Call Now
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* FAQ Section */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Frequently Asked Questions
                  </CardTitle>
                  
                  {/* Search */}
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search for help..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Category Filter */}
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => {
                        const Icon = category.icon;
                        return (
                          <Button
                            key={category.id}
                            variant={selectedCategory === category.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(category.id)}
                          >
                            <Icon className="h-3 w-3 mr-1" />
                            {category.name}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="space-y-2">
                    {filteredFAQs.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id} className="border rounded-lg px-4">
                        <AccordionTrigger className="text-left hover:no-underline">
                          <span className="font-medium">{faq.question}</span>
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-600 pb-4">
                          {faq.answer}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t">
                            <span className="text-xs text-gray-500">
                              {faq.helpful} people found this helpful
                            </span>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" className="text-xs">
                                👍 Helpful
                              </Button>
                              <Button size="sm" variant="ghost" className="text-xs">
                                👎 Not helpful
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  {filteredFAQs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No FAQs found matching your search.</p>
                      <p className="text-sm mt-1">Try different keywords or browse by category.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Submit a Ticket
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ticketCategory">Category</Label>
                    <select 
                      id="ticketCategory"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="printing">Printing Issues</option>
                      <option value="payment">Payment & Billing</option>
                      <option value="account">Account Settings</option>
                      <option value="technical">Technical Problems</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ticketSubject">Subject</Label>
                    <Input
                      id="ticketSubject"
                      placeholder="Brief description of your issue"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ticketMessage">Message</Label>
                    <Textarea
                      id="ticketMessage"
                      placeholder="Please describe your issue in detail..."
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      rows={5}
                    />
                  </div>

                  {user && (
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      <p><strong>Contact Info:</strong></p>
                      <p>{user.firstName} {user.lastName}</p>
                      <p>{user.primaryEmailAddress?.emailAddress}</p>
                    </div>
                  )}

                  <Button onClick={handleSubmitTicket} className="w-full bg-gradient-hero">
                    <Send className="h-4 w-4 mr-2" />
                    Submit Ticket
                  </Button>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="font-medium">Email Support</p>
                        <p className="text-sm text-gray-600">support@printmate.com</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="font-medium">Phone Support</p>
                        <p className="text-sm text-gray-600">+1 (555) 123-4567</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="font-medium">Business Hours</p>
                        <p className="text-sm text-gray-600">Mon-Fri: 9:00 AM - 5:00 PM EST</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit Help Center
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
