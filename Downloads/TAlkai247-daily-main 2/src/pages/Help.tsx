"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HelpCircle, MessageSquare } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function HelpTab() {
  const faqs = [
    { 
      question: 'How do I set up my first AI assistant?',
      answer: 'To set up your first AI assistant, go to the Assistants tab and click on "Create new assistant". Follow the wizard to configure your assistant\'s name, capabilities, and other settings.'
    },
    {
      question: 'What types of calls can the AI handle?',
      answer: 'Our AI can handle a wide range of calls including customer support, sales inquiries, appointment scheduling, and more. You can customize the AI\'s capabilities based on your specific needs.'
    },
    {
      question: 'How do I integrate Talkai247 with my existing phone system?',
      answer: 'Talkai247 offers various integration options. You can use our API to connect with your existing phone system, or use our provided phone numbers. For detailed integration instructions, please refer to our API documentation in the Resources section.'
    },
    {
      question: 'What measures are in place to ensure call quality and accuracy?',
      answer: 'We use advanced natural language processing and machine learning algorithms to ensure high call quality and accuracy. Additionally, you can set up human fallback options and monitor calls in real-time to maintain quality standards.'
    },
    {
      question: 'How does billing work for Talkai247?',
      answer: 'Billing is based on your chosen plan and usage. You can view your current plan, billing cycle, and payment method in the Billing tab. We offer both monthly and annual billing options.'
    }
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement contact form submission logic here
    console.log('Contact form submitted:', contactForm);
    setIsContactModalOpen(false);
    setContactForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-teal-400 flex items-center">
          <HelpCircle className="mr-2 h-8 w-8" />
          Help & Support
        </h2>
        <p className="text-gray-400">Find answers to common questions and get support</p>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search FAQs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-gray-800 text-white border-gray-700"
        />
      </div>

      <Card className="bg-gray-800 border-gray-700 mb-6">
        <CardHeader>
          <CardTitle className="text-white">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-700 pb-4">
                <h3 className="text-lg font-semibold text-teal-400 mb-2">{faq.question}</h3>
                <p className="text-gray-300">{faq.answer}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Need More Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-300">If you couldn't find the answer you were looking for, our support team is here to help.</p>
            <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700 text-white">
                <DialogHeader>
                  <DialogTitle>Contact Support</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Fill out the form below and we'll get back to you as soon as possible.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleContactSubmit}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-white">Name</Label>
                      <Input
                        id="name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="bg-gray-700 text-white border-gray-600"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-white">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="bg-gray-700 text-white border-gray-600"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="message" className="text-white">Message</Label>
                      <Textarea
                        id="message"
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className="bg-gray-700 text-white border-gray-600"
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter className="mt-4">
                    <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
                      Send Message
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}