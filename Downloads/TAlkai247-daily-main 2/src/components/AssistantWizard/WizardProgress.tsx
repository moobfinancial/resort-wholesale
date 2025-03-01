import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  number: number;
  title: string;
}

interface WizardProgressProps {
  steps: Step[];
  currentStep: number;
}

export default function WizardProgress({ steps, currentStep }: WizardProgressProps) {
  return (
    <div className="relative">
      <div className="flex justify-between items-center max-w-full px-2">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center relative">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step.number < currentStep
                    ? 'bg-teal-600 text-white'
                    : step.number === currentStep
                    ? 'bg-white text-gray-900'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {step.number < currentStep ? <Check className="h-6 w-6" /> : step.number}
              </div>
              <span className="absolute top-12 text-sm text-gray-400 whitespace-nowrap transform -translate-x-1/2 left-1/2">
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-[2px] mx-4 ${
                  step.number < currentStep ? 'bg-teal-600' : 'bg-gray-700'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}