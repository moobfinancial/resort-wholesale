import React, { useState } from 'react';
import { Collapse } from 'antd';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

const { Panel } = Collapse;

export default function FAQ() {
  const [activeKey, setActiveKey] = useState<string[]>([]);

  const handleChange = (key: string[] | string) => {
    // Handle both string and string[] types that might come from antd Collapse
    const keyArray = Array.isArray(key) ? key : [key];
    setActiveKey(keyArray);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-teal-500 py-24">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Find answers to common questions about our wholesale services
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center mb-8">
            <HelpCircle className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Resort Accessories Limited - Frequently Asked Questions</h2>
          </div>
          
          <Collapse 
            activeKey={activeKey} 
            onChange={handleChange}
            className="faq-collapse"
            expandIcon={({ isActive }) => (
              isActive ? <ChevronUp className="text-blue-600" /> : <ChevronDown className="text-blue-600" />
            )}
          >
        <Panel header="What type of business does Resort Accessories Limited cater to?" key="1">
          <p>We specialize in providing a wide range of tourist merchandise, including clothing, jewelry, souvenirs, and accessories, specifically for wholesale business customers like gift shops, resorts, and other retailers who cater to the tourist market.</p>
        </Panel>
        <Panel header="Is there a minimum order quantity (MOQ) for wholesale purchases?" key="2">
          <p>Yes, some products may have minimum order quantities (MOQs) to qualify for wholesale pricing. These MOQs will be clearly indicated on the product pages.</p>
        </Panel>
        <Panel header="How do I register for a business account to access wholesale pricing?" key="3">
          <p>To register for a business account, visit our website's registration page and provide the required business information, including your business name, address, tax ID, and business license. We will review your application and notify you of your approval status.</p>
        </Panel>
        <Panel header="What shipping methods do you offer, and what are the estimated delivery times?" key="4">
          <p>We offer a variety of shipping methods through carriers like Knutsford Express, FedEx, UPS, DHL, Jamaica Post. Shipping costs and estimated delivery times vary based on the order size, destination, and carrier. You will see the shipping options and costs during the checkout process.</p>
        </Panel>
        <Panel header="Do you ship internationally?" key="5">
          <p>We ship worldwide. Please note that customers are responsible for complying with all import regulations and paying any applicable customs duties, taxes, or fees.</p>
        </Panel>
        <Panel header="What payment methods do you accept for wholesale orders?" key="6">
          <p>We accept various payment methods, including Credit Card, Bank Transfer, and CryptoCurrency. You can select your preferred payment method during the checkout process.</p>
        </Panel>
        <Panel header="What is your return and exchange policy for wholesale orders?" key="7">
          <p>We accept returns and exchanges only for products that are defective, damaged, or incorrectly shipped. Requests must be made within 14 days of the delivery date. Please refer to our Returns and Exchange Policy for complete details.</p>
        </Panel>
        <Panel header="Who is responsible for return shipping costs?" key="8">
          <p>If the product is defective, damaged, or incorrectly shipped, Resort Accessories Limited will cover the return shipping costs. In all other cases, the customer is responsible for the return shipping costs.</p>
        </Panel>
        <Panel header="Where can I find your complete Terms and Conditions?" key="9">
          <p>Our complete Terms and Conditions can be found on our website. These terms govern your use of our platform and your purchases from us.</p>
        </Panel>
        <Panel header="How do you protect my privacy and personal information?" key="10">
          <p>Resort Accessories Limited is committed to protecting your privacy. Please refer to our Privacy Policy to learn how we collect, use, and disclose your personal information.</p>
        </Panel>
          </Collapse>
        </div>
      </div>
    </div>
  );
}
