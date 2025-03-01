import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface RegistrationFlowProps {
  step: number;
  type: 'personal' | 'business' | null;
  data: any;
  onStepChange: (step: number) => void;
  onTypeChange: (type: 'personal' | 'business') => void;
  onDataChange: (data: any) => void;
  onComplete: (data: any) => void;
}

export function RegistrationFlow({
  step,
  type,
  data,
  onStepChange,
  onTypeChange,
  onDataChange,
  onComplete,
}: RegistrationFlowProps) {
  const steps = [
    'Select Use Type',
    'Basic Information',
    'Address Details',
    'Business Details',
    'Review & Terms'
  ];

  const handleNext = () => {
    if (step === steps.length - 1) {
      onComplete(data);
    } else {
      onStepChange(step + 1);
    }
  };

  const handleBack = () => {
    onStepChange(step - 1);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">How will you use this number?</h2>
            <RadioGroup
              value={type || ''}
              onValueChange={(value: 'personal' | 'business') => onTypeChange(value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="personal" id="personal" />
                <Label htmlFor="personal">Personal Use</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="business" id="business" />
                <Label htmlFor="business">Business Use (10DLC)</Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Basic Information</h2>
            <div>
              <Label>Full Name</Label>
              <Input
                value={data.fullName || ''}
                onChange={(e) => onDataChange({ ...data, fullName: e.target.value })}
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={data.email || ''}
                onChange={(e) => onDataChange({ ...data, email: e.target.value })}
                className="bg-gray-700 border-gray-600"
              />
            </div>
            {type === 'business' && (
              <div>
                <Label>Business Name</Label>
                <Input
                  value={data.businessName || ''}
                  onChange={(e) => onDataChange({ ...data, businessName: e.target.value })}
                  className="bg-gray-700 border-gray-600"
                />
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Address Details</h2>
            <div>
              <Label>Street Address</Label>
              <Input
                value={data.address || ''}
                onChange={(e) => onDataChange({ ...data, address: e.target.value })}
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  value={data.city || ''}
                  onChange={(e) => onDataChange({ ...data, city: e.target.value })}
                  className="bg-gray-700 border-gray-600"
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={data.state || ''}
                  onChange={(e) => onDataChange({ ...data, state: e.target.value })}
                  className="bg-gray-700 border-gray-600"
                />
              </div>
            </div>
            <div>
              <Label>ZIP Code</Label>
              <Input
                value={data.zip || ''}
                onChange={(e) => onDataChange({ ...data, zip: e.target.value })}
                className="bg-gray-700 border-gray-600"
              />
            </div>
          </div>
        );

      case 3:
        return type === 'business' ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Business Details</h2>
            <div>
              <Label>Business Type</Label>
              <Input
                value={data.businessType || ''}
                onChange={(e) => onDataChange({ ...data, businessType: e.target.value })}
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <Label>Tax ID / EIN</Label>
              <Input
                value={data.taxId || ''}
                onChange={(e) => onDataChange({ ...data, taxId: e.target.value })}
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <Label>Website</Label>
              <Input
                value={data.website || ''}
                onChange={(e) => onDataChange({ ...data, website: e.target.value })}
                className="bg-gray-700 border-gray-600"
              />
            </div>
          </div>
        ) : (
          <div className="text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white">Personal Details Complete</h2>
            <p className="text-gray-400 mt-2">You can proceed to review your information.</p>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Review & Terms</h2>
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="font-medium text-white mb-2">Your Information</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-gray-400">Name:</dt>
                  <dd className="text-white">{data.fullName}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Email:</dt>
                  <dd className="text-white">{data.email}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Address:</dt>
                  <dd className="text-white">{`${data.address}, ${data.city}, ${data.state} ${data.zip}`}</dd>
                </div>
              </dl>
            </div>
            <div className="bg-yellow-900/20 border border-yellow-900/30 p-4 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mb-2" />
              <p className="text-sm text-yellow-300">
                By proceeding, you agree to our terms of service and acknowledge that all information provided is accurate.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-2xl text-white">Phone Number Registration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((stepName, index) => (
              <React.Fragment key={stepName}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index < step
                        ? 'bg-teal-600 text-white'
                        : index === step
                        ? 'bg-white text-gray-900'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-xs mt-2 text-gray-400">{stepName}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-[2px] mx-2 ${
                      index < step ? 'bg-teal-600' : 'bg-gray-700'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="min-h-[300px]">{renderStep()}</div>

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 0}
          >
            Back
          </Button>
          <Button
            className="bg-teal-600 hover:bg-teal-700"
            onClick={handleNext}
            disabled={!type}
          >
            {step === steps.length - 1 ? 'Complete' : 'Next'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}