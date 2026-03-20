-- ============================================================
-- StageWard Complete Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ── DISTRICTS ──────────────────────────────────────────────
create table if not exists districts (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  state       text not null default 'CA',
  plan        text not null default 'Standard',
  contact_name  text,
  contact_email text,
  contact_phone text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── FACILITIES ─────────────────────────────────────────────
create table if not exists facilities (
  id            uuid primary key default uuid_generate_v4(),
  district_id   uuid not null references districts(id) on delete cascade,
  name          text not null,
  type          text not null default 'High School',
  enrollment    int default 0,
  contact_name  text,
  contact_email text,
  contact_phone text,
  address       text,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ── FACILITY SHARING SETTINGS ──────────────────────────────
create table if not exists facility_share_settings (
  id                  uuid primary key default uuid_generate_v4(),
  owner_facility_id   uuid not null references facilities(id) on delete cascade,
  peer_facility_id    uuid not null references facilities(id) on delete cascade,
  can_view            boolean not null default false,
  can_request_loan    boolean not null default false,
  auto_approve        boolean not null default false,
  unique(owner_facility_id, peer_facility_id)
);

-- ── USER PROFILES ──────────────────────────────────────────
create table if not exists user_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text,
  role          text not null default 'facility_manager'
                  check (role in ('sysadmin','district_manager','facility_manager')),
  district_id   uuid references districts(id),
  facility_id   uuid references facilities(id),
  created_at    timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into user_profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'facility_manager')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── LOCATIONS ──────────────────────────────────────────────
create table if not exists locations (
  id            uuid primary key default uuid_generate_v4(),
  facility_id   uuid not null references facilities(id) on delete cascade,
  parent_id     uuid references locations(id) on delete set null,
  name          text not null,
  type          text not null default 'Area'
                  check (type in ('Building','Room','Area','Shelf/Bin','Other')),
  icon          text not null default '📦',
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

-- ── DROPDOWN LISTS ─────────────────────────────────────────
create table if not exists dropdown_lists (
  id            uuid primary key default uuid_generate_v4(),
  facility_id   uuid not null references facilities(id) on delete cascade,
  list_key      text not null,
  values        text[] not null default '{}',
  updated_at    timestamptz not null default now(),
  unique(facility_id, list_key)
);

-- ── INVENTORY ITEMS ────────────────────────────────────────
create table if not exists inventory_items (
  id                    uuid primary key default uuid_generate_v4(),
  facility_id           uuid not null references facilities(id) on delete cascade,
  tag_id                text not null,
  name                  text not null,
  item_type             text not null check (item_type in ('Costume','Prop','Wig','Jewelry','Equipment')),
  status                text not null default 'Available',
  condition             text not null default 'Good',
  needs_repair          boolean not null default false,
  repair_description    text,
  ok_to_loan            boolean not null default false,
  rental_fee            numeric(10,2),
  total_cost            numeric(10,2),
  replacement_cost      numeric(10,2),
  description           text,
  notes                 text,
  storage_location_id   uuid references locations(id),
  current_location_id   uuid references locations(id),
  date_entered_db       date,
  photo_file_name       text,
  used_in_productions   text[] not null default '{}',

  -- Costume fields
  costume_type          text,
  costume_group         text,
  time_period           text,
  gender                text,
  adult_child           text,
  size                  text,
  color                 text,
  colors                text[] not null default '{}',
  color_pattern         text,
  fabric                text,
  design_style          text,
  special_effects       text,
  cleaning_code         text,
  hem                   text,
  sleeves_detail        text,
  costume_designer      text,
  source                text,
  date_acquired         date,
  disposable            boolean not null default false,
  multiple              boolean not null default false,
  qty                   int not null default 1,
  dc_fee                numeric(10,2),

  -- Measurements
  meas_chest            text,
  meas_waist            text,
  meas_hips             text,
  meas_girth            text,
  meas_neck             text,
  meas_sleeves          text,
  meas_inseam           text,
  meas_outseam          text,
  meas_neck_to_waist    text,
  meas_waist_to_hem     text,
  meas_waist_to_floor   text,
  meas_hat_circ         text,
  meas_shoe_size        text,
  meas_dress_size       text,
  meas_bra_size         text,
  meas_extra_desc       text,
  meas_extra            text,

  -- Prop fields
  prop_type             text,
  prop_item_name        text,
  material              text,
  prop_maker            text,
  prop_designer         text,
  borrowed_from         text,
  due_back_to_owner     date,
  is_on_loan            boolean not null default false,
  dim_h                 text,
  dim_w                 text,
  dim_d                 text,
  dim_wt                text,
  can_be_painted        boolean not null default false,
  can_be_stood_on       boolean not null default false,
  is_functional         boolean not null default false,
  can_be_controlled_remotely boolean not null default false,
  part_of_package       boolean not null default false,
  package_details       text,

  unique(facility_id, tag_id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger inventory_items_updated_at
  before update on inventory_items
  for each row execute function update_updated_at();

-- ── ITEM PHOTOS ────────────────────────────────────────────
create table if not exists item_photos (
  id            uuid primary key default uuid_generate_v4(),
  item_id       uuid not null references inventory_items(id) on delete cascade,
  facility_id   uuid not null references facilities(id) on delete cascade,
  storage_path  text not null,
  public_url    text,
  label         text,
  is_primary    boolean not null default false,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

-- ── LOAN REQUESTS ──────────────────────────────────────────
create table if not exists loan_requests (
  id                uuid primary key default uuid_generate_v4(),
  from_facility_id  uuid not null references facilities(id),
  to_facility_id    uuid not null references facilities(id),
  item_id           uuid not null references inventory_items(id),
  requested_by      text not null,
  request_date      date not null default current_date,
  need_date         date not null,
  return_date       date not null,
  production        text,
  purpose           text,
  status            text not null default 'Pending'
                      check (status in ('Pending','Approved','Checked-Out','Returned','Declined')),
  notes             text,
  approved_by       text,
  checkout_date     date,
  checkin_date      date,
  created_at        timestamptz not null default now()
);

-- ── CHECKOUT RECORDS ───────────────────────────────────────
create table if not exists checkout_records (
  id                uuid primary key default uuid_generate_v4(),
  facility_id       uuid not null references facilities(id) on delete cascade,
  item_id           uuid not null references inventory_items(id) on delete cascade,
  person_name       text not null,
  person_role       text,
  production        text,
  out_date          date not null default current_date,
  due_date          date,
  return_date       date,
  status            text not null default 'Out'
                      check (status in ('Out','Returned','Overdue')),
  loan_request_id   uuid references loan_requests(id),
  notes             text,
  created_at        timestamptz not null default now()
);

-- ── ACTIVITY LOG ───────────────────────────────────────────
create table if not exists activity_log (
  id            uuid primary key default uuid_generate_v4(),
  facility_id   uuid references facilities(id),
  district_id   uuid references districts(id),
  user_id       uuid references auth.users(id),
  user_name     text,
  action        text not null,
  entity_type   text,
  entity_id     uuid,
  details       jsonb,
  created_at    timestamptz not null default now()
);

-- ══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════
alter table districts              enable row level security;
alter table facilities             enable row level security;
alter table facility_share_settings enable row level security;
alter table user_profiles          enable row level security;
alter table locations              enable row level security;
alter table dropdown_lists         enable row level security;
alter table inventory_items        enable row level security;
alter table item_photos            enable row level security;
alter table loan_requests          enable row level security;
alter table checkout_records       enable row level security;
alter table activity_log           enable row level security;

-- Helper: get current user's profile
create or replace function get_my_profile()
returns user_profiles language sql security definer as $$
  select * from user_profiles where id = auth.uid();
$$;

-- ── Districts: sysadmin sees all, others see their own ──
create policy "districts_select" on districts for select using (
  (select role from user_profiles where id = auth.uid()) = 'sysadmin'
  or id in (
    select district_id from user_profiles where id = auth.uid()
  )
  or id in (
    select district_id from facilities
    where id = (select facility_id from user_profiles where id = auth.uid())
  )
);
create policy "districts_insert" on districts for insert
  with check ((select role from user_profiles where id = auth.uid()) = 'sysadmin');
create policy "districts_update" on districts for update
  using ((select role from user_profiles where id = auth.uid()) in ('sysadmin','district_manager'));
create policy "districts_delete" on districts for delete
  using ((select role from user_profiles where id = auth.uid()) = 'sysadmin');

-- ── Facilities ──
create policy "facilities_select" on facilities for select using (
  (select role from user_profiles where id = auth.uid()) = 'sysadmin'
  or district_id = (select district_id from user_profiles where id = auth.uid())
  or id = (select facility_id from user_profiles where id = auth.uid())
  -- also visible if sharing with my facility
  or id in (
    select owner_facility_id from facility_share_settings
    where peer_facility_id = (select facility_id from user_profiles where id = auth.uid())
    and can_view = true
  )
);
create policy "facilities_insert" on facilities for insert with check (
  (select role from user_profiles where id = auth.uid()) in ('sysadmin','district_manager')
);
create policy "facilities_update" on facilities for update using (
  (select role from user_profiles where id = auth.uid()) in ('sysadmin','district_manager')
  or id = (select facility_id from user_profiles where id = auth.uid())
);

-- ── Locations ──
create policy "locations_select" on locations for select using (
  facility_id = (select facility_id from user_profiles where id = auth.uid())
  or (select role from user_profiles where id = auth.uid()) in ('sysadmin','district_manager')
);
create policy "locations_all" on locations for all using (
  facility_id = (select facility_id from user_profiles where id = auth.uid())
  or (select role from user_profiles where id = auth.uid()) = 'sysadmin'
);

-- ── Dropdown Lists ──
create policy "dropdowns_select" on dropdown_lists for select using (
  facility_id = (select facility_id from user_profiles where id = auth.uid())
  or (select role from user_profiles where id = auth.uid()) in ('sysadmin','district_manager')
);
create policy "dropdowns_all" on dropdown_lists for all using (
  facility_id = (select facility_id from user_profiles where id = auth.uid())
  or (select role from user_profiles where id = auth.uid()) = 'sysadmin'
);

-- ── Inventory Items ──
create policy "items_select" on inventory_items for select using (
  facility_id = (select facility_id from user_profiles where id = auth.uid())
  or (select role from user_profiles where id = auth.uid()) in ('sysadmin','district_manager')
  -- shared items
  or facility_id in (
    select owner_facility_id from facility_share_settings
    where peer_facility_id = (select facility_id from user_profiles where id = auth.uid())
    and can_view = true
  )
);
create policy "items_insert" on inventory_items for insert with check (
  facility_id = (select facility_id from user_profiles where id = auth.uid())
  or (select role from user_profiles where id = auth.uid()) = 'sysadmin'
);
create policy "items_update" on inventory_items for update using (
  facility_id = (select facility_id from user_profiles where id = auth.uid())
  or (select role from user_profiles where id = auth.uid()) = 'sysadmin'
);
create policy "items_delete" on inventory_items for delete using (
  facility_id = (select facility_id from user_profiles where id = auth.uid())
  or (select role from user_profiles where id = auth.uid()) = 'sysadmin'
);

-- ── Item Photos ──
create policy "photos_select" on item_photos for select using (
  facility_id = (select facility_id from user_profiles where id = auth.uid())
  or (select role from user_profiles where id = auth.uid()) in ('sysadmin','district_manager')
  or facility_id in (
    select owner_facility_id from facility_share_settings
    where peer_facility_id = (select facility_id from user_profiles where id = auth.uid()) and can_view = true
  )
);
create policy "photos_all" on item_photos for all using (
  facility_id = (select facility_id from user_profiles where id = auth.uid())
  or (select role from user_profiles where id = auth.uid()) = 'sysadmin'
);

-- ── Loan Requests ──
create policy "loans_select" on loan_requests for select using (
  from_facility_id = (select facility_id from user_profiles where id = auth.uid())
  or to_facility_id = (select facility_id from user_profiles where id = auth.uid())
  or (select role from user_profiles where id = auth.uid()) in ('sysadmin','district_manager')
);
create policy "loans_insert" on loan_requests for insert with check (
  from_facility_id = (select facility_id from user_profiles where id = auth.uid())
);
create policy "loans_update" on loan_requests for update using (
  from_facility_id = (select facility_id from user_profiles where id = auth.uid())
  or to_facility_id = (select facility_id from user_profiles where id = auth.uid())
  or (select role from user_profiles where id = auth.uid()) in ('sysadmin','district_manager')
);

-- ── Checkout Records ──
create policy "checkouts_select" on checkout_records for select using (
  facility_id = (select facility_id from user_profiles where id = auth.uid())
  or (select role from user_profiles where id = auth.uid()) in ('sysadmin','district_manager')
);
create policy "checkouts_all" on checkout_records for all using (
  facility_id = (select facility_id from user_profiles where id = auth.uid())
  or (select role from user_profiles where id = auth.uid()) = 'sysadmin'
);

-- ── User Profiles ──
create policy "profiles_select" on user_profiles for select using (
  id = auth.uid()
  or (select role from user_profiles where id = auth.uid()) in ('sysadmin','district_manager')
);
create policy "profiles_update" on user_profiles for update using (id = auth.uid());

-- ── Activity Log ──
create policy "activity_select" on activity_log for select using (
  facility_id = (select facility_id from user_profiles where id = auth.uid())
  or (select role from user_profiles where id = auth.uid()) in ('sysadmin','district_manager')
);
create policy "activity_insert" on activity_log for insert with check (true);

-- ══════════════════════════════════════════════════════════
-- STORAGE BUCKET
-- ══════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', true)
on conflict (id) do nothing;

create policy "item_photos_upload" on storage.objects for insert
  with check (bucket_id = 'item-photos' and auth.role() = 'authenticated');
create policy "item_photos_read" on storage.objects for select
  using (bucket_id = 'item-photos');
create policy "item_photos_delete" on storage.objects for delete
  using (bucket_id = 'item-photos' and auth.role() = 'authenticated');

-- ══════════════════════════════════════════════════════════
-- SEED DATA (Demo District + Facility)
-- ══════════════════════════════════════════════════════════
do $$
declare
  v_district_id uuid := uuid_generate_v4();
  v_facility_id uuid := uuid_generate_v4();
  v_loc_building uuid := uuid_generate_v4();
  v_loc_shop     uuid := uuid_generate_v4();
  v_loc_rack_a   uuid := uuid_generate_v4();
  v_loc_bin_a1   uuid := uuid_generate_v4();
  v_loc_props    uuid := uuid_generate_v4();
begin
  insert into districts (id, name, state, plan, contact_name, contact_email)
  values (v_district_id, 'Metro Arts School District', 'CA', 'Professional', 'Sarah Okafor', 'sokafar@masd.edu')
  on conflict do nothing;

  insert into facilities (id, district_id, name, type, enrollment, contact_name, contact_email, address)
  values (v_facility_id, v_district_id, 'Lincoln High School', 'High School', 1840, 'Dana Park', 'dpark@lincoln.masd.edu', '400 Lincoln Ave, SF, CA 94102')
  on conflict do nothing;

  insert into locations (id, facility_id, parent_id, name, type, icon, sort_order) values
    (v_loc_building, v_facility_id, null,           'Main Building',        'Building',  '🏫', 0),
    (v_loc_shop,     v_facility_id, v_loc_building, 'Costume Shop',         'Room',      '🧵', 0),
    (v_loc_rack_a,   v_facility_id, v_loc_shop,     'Rack Row A',           'Area',      '👗', 0),
    (v_loc_bin_a1,   v_facility_id, v_loc_rack_a,   'Bin A-1 (Formal)',     'Shelf/Bin', '🗃️', 0),
    (v_loc_props,    v_facility_id, v_loc_building, 'Props Storage',        'Room',      '🎭', 1)
  on conflict do nothing;

  -- Default dropdown lists for the demo facility
  insert into dropdown_lists (facility_id, list_key, values) values
    (v_facility_id, 'costumeTypes',    ARRAY['Accessories','Apron','Belt','Blouse','Cape','Coat','Crown/Tiara','Dance Dress','Frock Coat','Hat','Jacket','Pants/Slacks','Petticoat','Robe','Scarf','Shirt','Shoes','Skirt','Suit Coat','Tights','Tutu','Unitard/Jumpsuit','Vest','Wedding Dress','Wig']),
    (v_facility_id, 'timePeriods',     ARRAY['Ancient','Medieval','Renaissance','Regency Era','Early Victorian','Late Victorian','Edwardian','1920s','1930s','1940s','1950s','1960s','1970s','Contemporary','Fantasy','Sci-Fi']),
    (v_facility_id, 'conditions',      ARRAY['Excellent','Very Good','Good','Fair','Poor','Needs Repair']),
    (v_facility_id, 'fabrics',         ARRAY['Brocade','Canvas','Chiffon','Cotton','Denim','Felt','Jersey','Lace','Leather','Linen','Lycra','Muslin','Organza','Polyester','Satin','Silk','Taffeta','Velvet','Wool','Synthetic']),
    (v_facility_id, 'propTypes',       ARRAY['Drapery','Furniture','Hand Prop','Instruments','Personal Prop','Rehearsal','Set Piece','Weapon','Flat/Backdrop','Breakaway']),
    (v_facility_id, 'sources',         ARRAY['Built In-House','Purchased New','Purchased Used','Donated','Rented','Borrowed','Thrift Store','Online','Theatrical Supplier']),
    (v_facility_id, 'specialEffects',  ARRAY['None','Blood Effect','Breakaway','Light-Up','Sound Effect','Battery Operated','Remote Control','Water Effect']),
    (v_facility_id, 'cleaningCodes',   ARRAY['Hand Wash','Machine Wash','Dry Clean Only','Spot Clean','Air Dry Only','Do Not Wash']),
    (v_facility_id, 'colors',          ARRAY['Black','Blue','Bronze','Brown','Burgundy','Clear','Cream','Gold','Green','Grey','Multicolor','Orange','Pink','Purple','Red','Silver','Tan/Nude','Turquoise','White','Yellow'])
  on conflict (facility_id, list_key) do nothing;
end;
$$;
