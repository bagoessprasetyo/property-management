-- InnSync PMS Database Schema
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE booking_status AS ENUM ('confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show');
CREATE TYPE room_status AS ENUM ('clean', 'dirty', 'inspected', 'out_of_order');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('credit_card', 'debit_card', 'cash', 'bank_transfer', 'digital_wallet');
CREATE TYPE expense_category AS ENUM ('maintenance', 'utilities', 'supplies', 'marketing', 'staff', 'insurance', 'other');

-- Create Tables

-- 1. Properties Table
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(100) NOT NULL DEFAULT 'US',
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    description TEXT,
    total_rooms INTEGER NOT NULL DEFAULT 0,
    amenities JSONB DEFAULT '[]'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- 2. Rooms Table
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    room_number VARCHAR(10) NOT NULL,
    room_type VARCHAR(50) NOT NULL,
    floor INTEGER,
    capacity INTEGER NOT NULL DEFAULT 2,
    base_rate DECIMAL(10,2) NOT NULL,
    amenities JSONB DEFAULT '[]'::jsonb,
    status room_status DEFAULT 'clean',
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    UNIQUE(property_id, room_number)
);

-- 3. Guests Table
CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    date_of_birth DATE,
    identification_type VARCHAR(50),
    identification_number VARCHAR(100),
    preferences JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- 4. Reservations Table
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    confirmation_number VARCHAR(20) UNIQUE NOT NULL DEFAULT UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10)),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    adults INTEGER NOT NULL DEFAULT 1,
    children INTEGER DEFAULT 0,
    total_nights INTEGER GENERATED ALWAYS AS (check_out_date - check_in_date) STORED,
    rate_per_night DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    status booking_status DEFAULT 'confirmed',
    special_requests TEXT,
    notes TEXT,
    source VARCHAR(50) DEFAULT 'direct',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    CHECK (check_out_date > check_in_date),
    CHECK (adults > 0),
    CHECK (children >= 0),
    CHECK (total_amount >= 0)
);

-- 5. Payments Table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method payment_method NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status payment_status DEFAULT 'pending',
    transaction_id VARCHAR(255),
    payment_gateway VARCHAR(50),
    gateway_response JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    CHECK (amount > 0)
);

-- 6. Housekeeping Table
CREATE TABLE housekeeping (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    assigned_to VARCHAR(255),
    task_type VARCHAR(50) NOT NULL DEFAULT 'cleaning',
    priority INTEGER DEFAULT 1,
    estimated_duration INTEGER, -- in minutes
    actual_duration INTEGER, -- in minutes
    status VARCHAR(20) DEFAULT 'pending',
    scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE,
    scheduled_time TIME,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    checklist JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    CHECK (priority BETWEEN 1 AND 5)
);

-- 7. Staff Table
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id UUID, -- Reference to auth.users
    employee_id VARCHAR(20) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL,
    department VARCHAR(50),
    hire_date DATE,
    hourly_rate DECIMAL(8,2),
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{}'::jsonb,
    schedule JSONB DEFAULT '{}'::jsonb,
    emergency_contact JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- 8. Expenses Table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    category expense_category NOT NULL,
    subcategory VARCHAR(100),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    vendor VARCHAR(255),
    description TEXT NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    approved_by UUID REFERENCES staff(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    is_recurring BOOLEAN DEFAULT false,
    recurring_pattern JSONB DEFAULT '{}'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    CHECK (amount > 0)
);

-- Create Indexes for Performance
CREATE INDEX idx_properties_active ON properties(id) WHERE id IS NOT NULL;
CREATE INDEX idx_rooms_property_status ON rooms(property_id, status);
CREATE INDEX idx_rooms_property_active ON rooms(property_id, is_active);
CREATE INDEX idx_guests_email ON guests(email);
CREATE INDEX idx_guests_phone ON guests(phone);
CREATE INDEX idx_reservations_property_dates ON reservations(property_id, check_in_date, check_out_date);
CREATE INDEX idx_reservations_guest ON reservations(guest_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_confirmation ON reservations(confirmation_number);
CREATE INDEX idx_payments_reservation ON payments(reservation_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_housekeeping_property_date ON housekeeping(property_id, scheduled_date);
CREATE INDEX idx_housekeeping_room_status ON housekeeping(room_id, status);
CREATE INDEX idx_staff_property_active ON staff(property_id, is_active);
CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_expenses_property_date ON expenses(property_id, expense_date);
CREATE INDEX idx_expenses_category ON expenses(category, subcategory);

-- Create Updated At Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_housekeeping_updated_at BEFORE UPDATE ON housekeeping FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create Version Control Triggers for Optimistic Updates
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply version triggers
CREATE TRIGGER increment_properties_version BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION increment_version();
CREATE TRIGGER increment_rooms_version BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION increment_version();
CREATE TRIGGER increment_guests_version BEFORE UPDATE ON guests FOR EACH ROW EXECUTE FUNCTION increment_version();
CREATE TRIGGER increment_reservations_version BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION increment_version();
CREATE TRIGGER increment_payments_version BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION increment_version();
CREATE TRIGGER increment_housekeeping_version BEFORE UPDATE ON housekeeping FOR EACH ROW EXECUTE FUNCTION increment_version();
CREATE TRIGGER increment_staff_version BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION increment_version();
CREATE TRIGGER increment_expenses_version BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION increment_version();