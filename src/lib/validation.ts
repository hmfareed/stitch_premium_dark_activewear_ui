import Joi from 'joi';

// ── Ghana phone regex ──────────────────────────────────────────────────────────
// Accepts: +233XXXXXXXXX (12 chars) or 0XXXXXXXXX (10 chars)
// Network prefixes: 2, 3, 5 (MTN, Telecel, AirtelTigo)
const GHANA_PHONE_REGEX = /^(\+233|0)[235][0-9]{8}$/;

// ── Momo number: same format as Ghana phone ────────────────────────────────────
const MOMO_NUMBER_REGEX = GHANA_PHONE_REGEX;

// ── Base fields shared between customer and vendor ────────────────────────────
const baseFields = {
  name: Joi.string().trim().min(2).max(80).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 80 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().trim().email({ tlds: { allow: false } }).lowercase().required().messages({
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required',
  }),
  phone: Joi.string().trim().pattern(GHANA_PHONE_REGEX).required().messages({
    'string.pattern.base': 'Phone must be a valid Ghana number (e.g. 0501234567 or +233501234567)',
    'any.required': 'Phone number is required',
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'any.required': 'Password is required',
  }),
};

// ── Customer registration schema ───────────────────────────────────────────────
export const customerRegisterSchema = Joi.object({
  ...baseFields,
});

// ── Vendor registration schema ─────────────────────────────────────────────────
export const vendorRegisterSchema = Joi.object({
  ...baseFields,
  businessName: Joi.string().trim().min(3).max(100).required().messages({
    'string.min': 'Business name must be at least 3 characters',
    'string.max': 'Business name cannot exceed 100 characters',
    'any.required': 'Business name is required',
  }),
  businessCategory: Joi.string()
    .valid(
      'fashion_apparel',
      'electronics',
      'food_groceries',
      'health_beauty',
      'home_living',
      'sports_fitness',
      'arts_crafts',
      'books_media',
      'automotive',
      'other',
    )
    .required()
    .messages({
      'any.only': 'Please select a valid business category',
      'any.required': 'Business category is required',
    }),
  momoNumber: Joi.string().trim().pattern(MOMO_NUMBER_REGEX).required().messages({
    'string.pattern.base': 'MoMo number must be a valid Ghana number (e.g. 0241234567)',
    'any.required': 'MoMo number is required for payouts',
  }),
});

// ── Rider registration schema ───────────────────────────────────────────────
export const riderRegisterSchema = Joi.object({
  ...baseFields,
  vehicleType: Joi.string().required().messages({
    'any.required': 'Vehicle type is required',
  }),
  vehicleModel: Joi.string().allow('').optional(),
  vehicleRegistration: Joi.string().allow('').optional(),
  vehicleYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).optional()
    .messages({
      'number.base': 'Vehicle year must be a number',
      'number.min': 'Vehicle year is too old',
      'number.max': 'Vehicle year is in the future',
    }),
  preferredZones: Joi.array().items(Joi.string()).optional(),
  momoNumber: Joi.string().trim().pattern(MOMO_NUMBER_REGEX).required().messages({
    'string.pattern.base': 'MoMo number must be a valid Ghana number (e.g. 0241234567)',
    'any.required': 'MoMo number is required for payouts',
  }),
  momoNetwork: Joi.string().valid('MTN', 'AirtelTigo', 'Vodafone').optional().default('MTN'),
  documents: Joi.array().items(Joi.object()).optional(),
});

export const riderSignupSchema = riderRegisterSchema;

// ── Business categories list (used by frontend dropdowns) ─────────────────────
export const BUSINESS_CATEGORIES: { value: string; label: string }[] = [
  { value: 'fashion_apparel',  label: 'Fashion & Apparel' },
  { value: 'electronics',      label: 'Electronics & Gadgets' },
  { value: 'food_groceries',   label: 'Food & Groceries' },
  { value: 'health_beauty',    label: 'Health & Beauty' },
  { value: 'home_living',      label: 'Home & Living' },
  { value: 'sports_fitness',   label: 'Sports & Fitness' },
  { value: 'arts_crafts',      label: 'Arts & Crafts' },
  { value: 'books_media',      label: 'Books & Media' },
  { value: 'automotive',       label: 'Automotive' },
  { value: 'other',            label: 'Other' },
];

// ── Helper ─────────────────────────────────────────────────────────────────────
/**
 * Validate data against a Joi schema.
 * Returns { fields } with per-field error messages on failure, or null on success.
 */
export function validateRequest(
  schema: Joi.ObjectSchema,
  data: unknown,
  options: Joi.ValidationOptions = {},
): { fields: Record<string, string> } | null {
  const { error } = schema.validate(data, { abortEarly: false, ...options });
  if (!error) return null;

  const fields: Record<string, string> = {};
  for (const detail of error.details) {
    const key = detail.path[0] as string;
    if (!fields[key]) fields[key] = detail.message;
  }
  return { fields };
}
