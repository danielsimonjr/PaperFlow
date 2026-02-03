/**
 * Booklet Print Wizard
 *
 * Step-by-step wizard for booklet printing with binding options,
 * page ordering, and fold guides.
 */

import { useState, useMemo } from 'react';
import { useDocumentStore } from '@stores/documentStore';
import { usePrintStore } from '@stores/printStore';
import { BookletLayout, type BindingType } from '@lib/print/bookletLayout';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';

/**
 * Wizard step
 */
type WizardStep = 'binding' | 'layout' | 'options' | 'preview';

interface BookletWizardProps {
  onComplete?: (settings: BookletSettings) => void;
  onCancel?: () => void;
  className?: string;
}

/**
 * Booklet settings
 */
export interface BookletSettings {
  bindingType: BindingType;
  bindingEdge: 'left' | 'right' | 'top';
  includeFoldGuides: boolean;
  includeCropMarks: boolean;
  duplex: boolean;
}

export function BookletWizard({ onComplete, onCancel, className }: BookletWizardProps) {
  const { pageCount } = useDocumentStore();
  usePrintStore(); // Use print store for potential future settings

  const [step, setStep] = useState<WizardStep>('binding');
  const [settings, setSettings] = useState<BookletSettings>({
    bindingType: 'saddleStitch',
    bindingEdge: 'left',
    includeFoldGuides: true,
    includeCropMarks: false,
    duplex: true,
  });

  // Get binding recommendation
  const recommendation = useMemo(() => {
    return BookletLayout.recommendBindingType(pageCount);
  }, [pageCount]);

  // Calculate booklet info
  const bookletInfo = useMemo(() => {
    return BookletLayout.calculate({
      pageCount,
      sheetSize: { width: 612, height: 792 }, // Letter size
      bindingType: settings.bindingType,
      bindingEdge: settings.bindingEdge,
      includeFoldGuides: settings.includeFoldGuides,
      includeCropMarks: settings.includeCropMarks,
    });
  }, [pageCount, settings]);

  const steps: { id: WizardStep; label: string }[] = [
    { id: 'binding', label: 'Binding' },
    { id: 'layout', label: 'Layout' },
    { id: 'options', label: 'Options' },
    { id: 'preview', label: 'Preview' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      const nextStep = steps[nextIndex];
      if (nextStep) {
        setStep(nextStep.id);
      }
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      const prevStep = steps[prevIndex];
      if (prevStep) {
        setStep(prevStep.id);
      }
    }
  };

  const handleComplete = () => {
    onComplete?.(settings);
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Progress steps */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => (
            <div key={s.id} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  index <= currentStepIndex
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                )}
              >
                {index + 1}
              </div>
              <span
                className={cn(
                  'ml-2 text-sm hidden sm:inline',
                  index === currentStepIndex ? 'font-medium' : 'text-gray-500'
                )}
              >
                {s.label}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-12 h-0.5 mx-2',
                    index < currentStepIndex
                      ? 'bg-primary-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-auto p-6">
        {step === 'binding' && (
          <BindingStep
            settings={settings}
            onChange={setSettings}
            recommendation={recommendation}
          />
        )}
        {step === 'layout' && (
          <LayoutStep settings={settings} onChange={setSettings} />
        )}
        {step === 'options' && (
          <OptionsStep settings={settings} onChange={setSettings} />
        )}
        {step === 'preview' && (
          <PreviewStep settings={settings} info={bookletInfo.info} />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 dark:bg-gray-800">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex gap-2">
          {currentStepIndex > 0 && (
            <Button variant="secondary" onClick={goBack}>
              Back
            </Button>
          )}
          {currentStepIndex < steps.length - 1 ? (
            <Button variant="primary" onClick={goNext}>
              Next
            </Button>
          ) : (
            <Button variant="primary" onClick={handleComplete}>
              Print Booklet
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Binding step
 */
function BindingStep({
  settings,
  onChange,
  recommendation,
}: {
  settings: BookletSettings;
  onChange: (s: BookletSettings) => void;
  recommendation: ReturnType<typeof BookletLayout.recommendBindingType>;
}) {
  const bindingTypes: { id: BindingType; name: string; description: string }[] = [
    {
      id: 'saddleStitch',
      name: 'Saddle Stitch',
      description: 'Pages folded and stapled through the spine. Best for smaller booklets.',
    },
    {
      id: 'perfectBind',
      name: 'Perfect Binding',
      description: 'Pages glued to a cover spine. Professional look for larger documents.',
    },
    {
      id: 'coilBind',
      name: 'Coil Binding',
      description: 'Plastic or metal coil through punched holes. Lays flat when open.',
    },
    {
      id: 'threePunchBind',
      name: '3-Hole Punch',
      description: 'Standard binder holes. Use with ring binders.',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-2">Choose Binding Type</h2>
        <p className="text-sm text-gray-500">
          Select how your booklet will be bound together.
        </p>
      </div>

      {/* Recommendation */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="text-blue-500 mt-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-100">
              Recommended: {bindingTypes.find((b) => b.id === recommendation.recommended)?.name}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {recommendation.reason}
            </p>
          </div>
        </div>
      </div>

      {/* Binding options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {bindingTypes.map((type) => (
          <label
            key={type.id}
            className={cn(
              'flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-colors',
              settings.bindingType === type.id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            )}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="bindingType"
                checked={settings.bindingType === type.id}
                onChange={() => onChange({ ...settings, bindingType: type.id })}
                className="mt-1"
              />
              <div>
                <div className="font-medium">{type.name}</div>
                <p className="text-sm text-gray-500 mt-1">{type.description}</p>
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

/**
 * Layout step
 */
function LayoutStep({
  settings,
  onChange,
}: {
  settings: BookletSettings;
  onChange: (s: BookletSettings) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-2">Binding Edge</h2>
        <p className="text-sm text-gray-500">
          Choose which edge the booklet will be bound on.
        </p>
      </div>

      <div className="flex gap-4">
        {(['left', 'right', 'top'] as const).map((edge) => (
          <label
            key={edge}
            className={cn(
              'flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-colors',
              settings.bindingEdge === edge
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            )}
          >
            <input
              type="radio"
              name="bindingEdge"
              checked={settings.bindingEdge === edge}
              onChange={() => onChange({ ...settings, bindingEdge: edge })}
              className="sr-only"
            />
            <div
              className={cn(
                'w-12 h-16 border-2 rounded relative',
                settings.bindingEdge === edge
                  ? 'border-primary-500'
                  : 'border-gray-300'
              )}
            >
              <div
                className={cn(
                  'absolute bg-primary-500',
                  edge === 'left' && 'left-0 top-0 w-1 h-full',
                  edge === 'right' && 'right-0 top-0 w-1 h-full',
                  edge === 'top' && 'top-0 left-0 w-full h-1'
                )}
              />
            </div>
            <span className="mt-2 text-sm capitalize">{edge}</span>
          </label>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium mb-3">Two-sided printing</h3>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.duplex}
            onChange={(e) => onChange({ ...settings, duplex: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm">
            Enable duplex printing (recommended for booklets)
          </span>
        </label>
      </div>
    </div>
  );
}

/**
 * Options step
 */
function OptionsStep({
  settings,
  onChange,
}: {
  settings: BookletSettings;
  onChange: (s: BookletSettings) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-2">Additional Options</h2>
        <p className="text-sm text-gray-500">
          Configure fold guides and crop marks.
        </p>
      </div>

      <div className="space-y-4">
        <label className="flex items-start gap-3 p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800">
          <input
            type="checkbox"
            checked={settings.includeFoldGuides}
            onChange={(e) =>
              onChange({ ...settings, includeFoldGuides: e.target.checked })
            }
            className="rounded mt-1"
          />
          <div>
            <div className="font-medium">Include fold guides</div>
            <p className="text-sm text-gray-500 mt-1">
              Print small marks to show where to fold the paper.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800">
          <input
            type="checkbox"
            checked={settings.includeCropMarks}
            onChange={(e) =>
              onChange({ ...settings, includeCropMarks: e.target.checked })
            }
            className="rounded mt-1"
          />
          <div>
            <div className="font-medium">Include crop marks</div>
            <p className="text-sm text-gray-500 mt-1">
              Print registration marks for professional trimming.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}

/**
 * Preview step
 */
function PreviewStep({
  settings,
  info,
}: {
  settings: BookletSettings;
  info: ReturnType<typeof BookletLayout.calculate>['info'];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-2">Preview & Summary</h2>
        <p className="text-sm text-gray-500">
          Review your booklet settings before printing.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-sm text-gray-500">Sheets needed</div>
          <div className="text-2xl font-bold">{info.sheetsNeeded}</div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-sm text-gray-500">Total pages</div>
          <div className="text-2xl font-bold">{info.totalPages}</div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-sm text-gray-500">Final size</div>
          <div className="text-lg font-medium">
            {Math.round(info.finalSize.width / 72)}" x{' '}
            {Math.round(info.finalSize.height / 72)}"
          </div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-sm text-gray-500">Binding</div>
          <div className="text-lg font-medium capitalize">
            {settings.bindingEdge} {settings.bindingType.replace(/([A-Z])/g, ' $1')}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {info.recommendations.length > 0 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h3 className="font-medium text-yellow-800 dark:text-yellow-100 mb-2">
            Tips & Recommendations
          </h3>
          <ul className="text-sm text-yellow-700 dark:text-yellow-200 space-y-1">
            {info.recommendations.map((rec, i) => (
              <li key={i}>- {rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default BookletWizard;
