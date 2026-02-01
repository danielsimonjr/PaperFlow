export {
  parseFormField,
  extractPageFormFields,
  extractAllFormFields,
  groupRadioButtons,
  sortFieldsByTabOrder,
  validateFormFields,
  areRequiredFieldsFilled,
} from './formParser';

export {
  validateField,
  validateForm,
  getValidationSummary,
  hasFieldError,
  getFieldErrors,
} from './validation';

export type { FieldValidationResult, FormValidationResult } from './validation';

export {
  exportToJSON,
  exportValuesToJSON,
  parseJSON,
  downloadFile,
  downloadFormDataAsJSON,
  readFileAsText,
  importFromJSONFile,
} from './exportImport';

export {
  generateFDF,
  downloadFormDataAsFDF,
  parseFDF,
} from './fdfExport';

export {
  generateXFDF,
  downloadFormDataAsXFDF,
  parseXFDF,
  generateXFDFWithAnnotations,
} from './xfdfExport';

export {
  parseFormData,
  importFormDataFromFile,
  validateImportedData,
  getImportAcceptString,
  createImportFileInput,
  triggerImportDialog,
} from './importData';

export type { ImportFormat } from './importData';

export {
  executeCalculation,
  createSumCalculation,
  createAverageCalculation,
  createMinCalculation,
  createMaxCalculation,
  createProductCalculation,
  createCustomCalculation,
  extractFieldReferences,
  validateFormula,
} from './calculations';

export type {
  CalculationOperator,
  CalculationDefinition,
  CalculationResult,
} from './calculations';

export {
  evaluateCondition,
  evaluateConditionGroup,
  evaluateRule,
  evaluateAllRules,
  getSourceFields,
  createShowWhenRule,
  createEnableWhenRule,
  createRequireWhenRule,
} from './conditionalLogic';

export type {
  ComparisonOperator,
  LogicalOperator,
  ConditionalAction,
  Condition,
  ConditionGroup,
  ConditionalRule,
  ActionDefinition,
  ConditionalResult,
  FieldStateChange,
} from './conditionalLogic';

export {
  formatNumber,
  parseFormattedNumber,
  formatDate,
  parseFormattedDate,
  formatText,
  applyMask,
  removeMask,
  PHONE_MASK,
  SSN_MASK,
  DATE_MASK,
  CREDIT_CARD_MASK,
  ZIP_MASK,
  ZIP_PLUS_4_MASK,
} from './formatting';

export type {
  NumberFormat,
  DateFormat,
  TextCase,
  NumberFormatOptions,
  DateFormatOptions,
  TextFormatOptions,
} from './formatting';

export {
  createFormAction,
  createShowFieldAction,
  createHideFieldAction,
  createEnableFieldAction,
  createDisableFieldAction,
  createSetValueAction,
  createNavigateToPageAction,
  createOpenURLAction,
  createRunScriptAction,
  executeAction,
  executeScript,
  validateScriptSyntax,
  getActionsForTrigger,
  executeActionsForTrigger,
  mergeActionResults,
  SCRIPT_TEMPLATES,
} from './formActions';

export type {
  ActionTrigger,
  BuiltInActionType,
  FormAction,
  ActionContext,
  ActionResult,
  FieldChange,
} from './formActions';

export {
  validateSubmitConfig,
  mergeSubmitConfig,
  prepareFieldValues,
  formatForSubmission,
  buildSubmitURL,
  submitForm,
  createPreSubmitValidator,
  getFieldsToReset,
  DEFAULT_SUBMIT_CONFIG,
  DEFAULT_RESET_CONFIG,
  DEFAULT_PRINT_CONFIG,
} from './formSubmit';

export type {
  SubmitFormat,
  SubmitMethod,
  SubmitConfig,
  SubmitResult,
  SubmitFieldValue,
  PreSubmitValidation,
  ResetConfig,
  PrintConfig,
} from './formSubmit';
