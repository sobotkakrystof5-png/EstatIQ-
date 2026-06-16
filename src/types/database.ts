// Auto-generated Supabase types placeholder — regenerate with:
// npx supabase gen types typescript --project-id <project_id> > src/types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'landlord' | 'tenant' | 'manager'
export type PropertyStatus = 'active' | 'vacant' | 'maintenance' | 'archived'
export type LeaseStatus = 'active' | 'upcoming' | 'expired' | 'terminated'
export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'canceled'
export type PaymentType = 'rent' | 'deposit' | 'utilities' | 'repair' | 'other'
export type DocumentCategory = 'lease' | 'protocol' | 'insurance' | 'invoice' | 'correspondence' | 'other'
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'paused'
export type BillingCycle = 'monthly' | 'yearly'
export type SubscriptionTier =
  | 'free'
  | 'starter'
  | 'growth'
  | 'pro'
  | 'portfolio'
  | 'b2b_start'
  | 'b2b_growth'
  | 'b2b_scale'
  | 'enterprise'
export type OrgMemberRole = 'admin' | 'manager' | 'accountant' | 'viewer'
export type NotificationChannel = 'email' | 'push' | 'sms'
export type EnergyType = 'electricity' | 'gas' | 'water' | 'heating' | 'other'

// ── User ──────────────────────────────────────────────────────────────────────
export interface User {
  id: string                   // uuid, FK → auth.users
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  role: UserRole
  locale: string               // e.g. "cs"
  currency: string             // e.g. "CZK"
  date_format: string          // e.g. "dd.MM.yyyy"
  theme: 'light' | 'dark' | 'system'
  two_factor_enabled: boolean
  created_at: string
  updated_at: string
}

// ── Organization ──────────────────────────────────────────────────────────────
export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  owner_id: string             // FK → users.id
  subscription_id: string | null
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string      // FK → organizations.id
  user_id: string              // FK → users.id
  role: OrgMemberRole
  invited_by: string | null
  joined_at: string | null
  created_at: string
  updated_at: string
}

// ── Subscription ──────────────────────────────────────────────────────────────
export interface Subscription {
  id: string
  user_id: string | null         // FK → profiles.id (B2C)
  organization_id: string | null // FK → organizations.id (B2B)
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  tier: SubscriptionTier
  status: SubscriptionStatus
  billing_cycle: BillingCycle
  unit_limit: number             // property cap enforced by DB trigger
  unit_count: number             // denormalised count, updated by trigger
  current_period_start: string | null
  current_period_end: string | null
  canceled_at: string | null
  created_at: string
  updated_at: string
}

// Unit limits per tier (mirrors DB defaults enforced in Edge Functions)
export const TIER_UNIT_LIMITS: Record<SubscriptionTier, number | null> = {
  free: 1,
  starter: 3,
  growth: 7,
  pro: 15,
  portfolio: 30,
  b2b_start: 50,
  b2b_growth: 150,
  b2b_scale: 400,
  enterprise: null, // unlimited
}

// Monthly prices in CZK
export const TIER_MONTHLY_PRICES: Record<SubscriptionTier, number> = {
  free: 0,
  starter: 199,
  growth: 349,
  pro: 549,
  portfolio: 999,
  b2b_start: 2900,
  b2b_growth: 8500,
  b2b_scale: 18500,
  enterprise: 25000,
}

// Yearly prices in CZK (10 months = 2 months free)
export const TIER_YEARLY_PRICES: Record<SubscriptionTier, number> = {
  free: 0,
  starter: 1990,
  growth: 3490,
  pro: 5490,
  portfolio: 9990,
  b2b_start: 29000,
  b2b_growth: 85000,
  b2b_scale: 185000,
  enterprise: 0, // negotiated
}

// ── ČÚZK / Cadastre ───────────────────────────────────────────────────────────
export interface CadastreOwner {
  name: string
  share: string  // e.g. "1/2"
}

// ── Property ──────────────────────────────────────────────────────────────────
export interface Property {
  id: string
  owner_id: string             // FK → users.id
  organization_id: string | null
  name: string
  address_street: string
  address_city: string
  address_zip: string
  address_country: string
  floor_area_m2: number | null
  rooms: number | null
  floor: number | null
  photos: string[]             // Storage URLs
  status: PropertyStatus
  monthly_rent: number
  currency: string
  notes: string | null
  archived_at: string | null   // soft delete
  created_at: string
  updated_at: string
  // ČÚZK / katastr
  cadastral_number: string | null       // původní pole — odkaz na LV nebo parcelu
  cadastre_lv: string | null            // číslo listu vlastnictví
  cadastre_ku: string | null            // název katastrálního území
  cadastre_ku_code: string | null       // kód katastrálního území
  cadastre_parcel: string | null        // parcelní číslo
  cadastre_owners: CadastreOwner[] | null
  cadastre_encumbrances: string[] | null
  cadastre_refreshed_at: string | null
}

// ── Lease ─────────────────────────────────────────────────────────────────────
export interface Lease {
  id: string
  property_id: string          // FK → properties.id
  tenant_id: string            // FK → users.id
  start_date: string
  end_date: string | null      // null = indefinite
  monthly_rent: number
  deposit: number
  currency: string
  payment_day: number          // 1–28 day of month
  status: LeaseStatus
  terms: string | null         // free-text or structured JSON
  signed_at: string | null
  terminated_at: string | null
  termination_reason: string | null
  created_at: string
  updated_at: string
}

// ── Tenant ────────────────────────────────────────────────────────────────────
export interface Tenant {
  id: string
  user_id: string | null       // FK → users.id (null if invitation not yet accepted)
  owner_id: string             // FK → users.id (the landlord)
  lease_id: string | null      // FK → leases.id
  property_id: string          // FK → properties.id
  email: string
  full_name: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

// ── Invitation ────────────────────────────────────────────────────────────────
export interface Invitation {
  id: string
  owner_id: string             // FK → users.id
  property_id: string          // FK → properties.id
  email: string
  token: string                // unique, hashed
  status: InvitationStatus
  expires_at: string           // created_at + 72h
  accepted_at: string | null
  created_at: string
  updated_at: string
}

// ── Payment ───────────────────────────────────────────────────────────────────
export interface Payment {
  id: string
  lease_id: string             // FK → leases.id
  tenant_id: string            // FK → users.id
  property_id: string          // FK → properties.id
  owner_id: string             // FK → users.id
  amount: number
  currency: string
  due_date: string
  paid_at: string | null
  status: PaymentStatus
  type: PaymentType
  note: string | null
  stripe_payment_intent_id: string | null
  variable_symbol: string | null  // CZ QR payment
  created_at: string
  updated_at: string
}

// ── Expense ───────────────────────────────────────────────────────────────────
export interface Expense {
  id: string
  property_id: string          // FK → properties.id
  owner_id: string             // FK → users.id
  category: string             // e.g. "repair", "insurance", "tax"
  description: string
  amount: number
  currency: string
  date: string
  receipt_url: string | null
  tax_deductible: boolean
  created_at: string
  updated_at: string
}

// ── EnergyReading ─────────────────────────────────────────────────────────────
export interface EnergyReading {
  id: string
  property_id: string          // FK → properties.id
  lease_id: string | null
  type: EnergyType
  value: number
  unit: string                 // kWh, m³, etc.
  reading_date: string
  notes: string | null
  photo_url: string | null
  created_at: string
  updated_at: string
}

// ── Document ──────────────────────────────────────────────────────────────────
export interface Document {
  id: string
  owner_id: string             // FK → users.id
  property_id: string | null   // FK → properties.id
  tenant_id: string | null     // FK → users.id
  lease_id: string | null
  category: DocumentCategory
  name: string
  file_url: string             // Storage URL
  file_size_bytes: number | null
  mime_type: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

// ── Notification ──────────────────────────────────────────────────────────────
export interface Notification {
  id: string
  user_id: string              // FK → users.id (recipient)
  channel: NotificationChannel
  title: string
  body: string
  data: Json | null
  read_at: string | null
  sent_at: string | null
  created_at: string
  updated_at: string
}

// ── View helpers ──────────────────────────────────────────────────────────────
export interface PaymentWithContext extends Payment {
  tenant: Pick<User, 'id' | 'full_name' | 'avatar_url'>
  property: Pick<Property, 'id' | 'name' | 'address_city'>
}

export interface DocumentWithContext extends Document {
  property: Pick<Property, 'id' | 'name' | 'address_city'> | null
  tenant: Pick<User, 'id' | 'full_name' | 'avatar_url'> | null
}

export interface PropertyWithStats extends Property {
  active_lease: Lease | null
  tenant_count: number
  unpaid_count: number
  last_payment_at: string | null
}
