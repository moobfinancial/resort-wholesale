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
    <div className="flex justify-between">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step.number < currentStep
                  ? 'bg-teal-600 text-white'
                  : step.number === currentStep
                  ? 'bg-white text-gray-800'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              {step.number < currentStep ? <Check size={20} /> : step.number}
            </div>
            <span className="mt-2 text-sm text-gray-400">{step.title}</span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`h-[2px] w-24 mx-4 mt-5 ${
                step.number < currentStep ? 'bg-teal-600' : 'bg-gray-700'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
// Removing unused React import