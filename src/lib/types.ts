export type Role = 'sysadmin' | 'district_manager' | 'facility_manager'
export type ItemType = 'Costume' | 'Prop' | 'Wig' | 'Jewelry' | 'Equipment'
export type ItemStatus = 'Available' | 'Checked Out' | 'In Repair' | 'In Storage' | 'On Loan' | 'Retired'
export type LoanStatus = 'Pending' | 'Approved' | 'Checked-Out' | 'Returned' | 'Declined'

export interface District {
  id: string
  name: string
  state: string
  plan: string
  contact_name: string
  contact_email: string
  contact_phone: string
  active: boolean
  created_at: string
}

export interface Facility {
  id: string
  district_id: string
  name: string
  type: string
  enrollment: number
  contact_name: string
  contact_email: string
  contact_phone: string
  address: string
  active: boolean
  created_at: string
}

export interface FacilityShareSetting {
  id: string
  owner_facility_id: string
  peer_facility_id: string
  can_view: boolean
  can_request_loan: boolean
  auto_approve: boolean
}

export interface Location {
  id: string
  facility_id: string
  parent_id: string | null
  name: string
  type: 'Building' | 'Room' | 'Area' | 'Shelf/Bin' | 'Other'
  icon: string
  sort_order: number
  created_at: string
}

export interface DropdownList {
  id: string
  facility_id: string
  list_key: string
  values: string[]
  updated_at: string
}

export interface InventoryItem {
  id: string
  facility_id: string
  tag_id: string
  name: string
  item_type: ItemType
  status: ItemStatus
  condition: string
  needs_repair: boolean
  repair_description: string | null
  ok_to_loan: boolean
  rental_fee: number | null
  total_cost: number | null
  replacement_cost: number | null
  description: string | null
  notes: string | null
  storage_location_id: string | null
  current_location_id: string | null
  date_entered_db: string | null
  photo_file_name: string | null
  used_in_productions: string[]
  // Costume-specific
  costume_type: string | null
  costume_group: string | null
  time_period: string | null
  gender: string | null
  adult_child: string | null
  size: string | null
  color: string | null
  colors: string[]
  color_pattern: string | null
  fabric: string | null
  design_style: string | null
  special_effects: string | null
  cleaning_code: string | null
  hem: string | null
  sleeves_detail: string | null
  costume_designer: string | null
  source: string | null
  date_acquired: string | null
  disposable: boolean
  multiple: boolean
  qty: number
  dc_fee: number | null
  // Measurements
  meas_chest: string | null
  meas_waist: string | null
  meas_hips: string | null
  meas_girth: string | null
  meas_neck: string | null
  meas_sleeves: string | null
  meas_inseam: string | null
  meas_outseam: string | null
  meas_neck_to_waist: string | null
  meas_waist_to_hem: string | null
  meas_waist_to_floor: string | null
  meas_hat_circ: string | null
  meas_shoe_size: string | null
  meas_dress_size: string | null
  meas_bra_size: string | null
  meas_extra_desc: string | null
  meas_extra: string | null
  // Prop-specific
  prop_type: string | null
  prop_item_name: string | null
  material: string | null
  prop_maker: string | null
  prop_designer: string | null
  borrowed_from: string | null
  due_back_to_owner: string | null
  is_on_loan: boolean
  dim_h: string | null
  dim_w: string | null
  dim_d: string | null
  dim_wt: string | null
  can_be_painted: boolean
  can_be_stood_on: boolean
  is_functional: boolean
  can_be_controlled_remotely: boolean
  part_of_package: boolean
  package_details: string | null
  created_at: string
  updated_at: string
  // joined
  photos?: ItemPhoto[]
  storage_location?: Location
  current_location?: Location
}

export interface ItemPhoto {
  id: string
  item_id: string
  facility_id: string
  storage_path: string
  public_url: string | null
  label: string | null
  is_primary: boolean
  sort_order: number
  created_at: string
}

export interface LoanRequest {
  id: string
  from_facility_id: string
  to_facility_id: string
  item_id: string
  requested_by: string
  request_date: string
  need_date: string
  return_date: string
  production: string | null
  purpose: string | null
  status: LoanStatus
  notes: string | null
  approved_by: string | null
  checkout_date: string | null
  checkin_date: string | null
  created_at: string
  // joined
  item?: InventoryItem
  from_facility?: Facility
  to_facility?: Facility
}

export interface CheckoutRecord {
  id: string
  facility_id: string
  item_id: string
  person_name: string
  person_role: string | null
  production: string | null
  out_date: string
  due_date: string | null
  return_date: string | null
  status: 'Out' | 'Returned' | 'Overdue'
  loan_request_id: string | null
  notes: string | null
  created_at: string
  item?: InventoryItem
}

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: Role
  district_id: string | null
  facility_id: string | null
  created_at: string
}
