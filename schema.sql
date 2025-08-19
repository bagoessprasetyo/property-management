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
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled');
CREATE TYPE order_type AS ENUM ('room_service', 'dine_in', 'takeaway');
CREATE TYPE bill_status AS ENUM ('outstanding', 'paid', 'void');
CREATE TYPE dietary_type AS ENUM ('vegetarian', 'vegan', 'halal', 'gluten_free', 'dairy_free', 'nut_free');

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

-- 9. Restaurant Categories Table
CREATE TABLE restaurant_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    UNIQUE(property_id, name)
);

-- 10. Restaurant Items Table
CREATE TABLE restaurant_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES restaurant_categories(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'IDR',
    image_url TEXT,
    ingredients JSONB DEFAULT '[]'::jsonb,
    allergens JSONB DEFAULT '[]'::jsonb,
    dietary_info JSONB DEFAULT '[]'::jsonb,
    preparation_time INTEGER, -- minutes
    is_available BOOLEAN DEFAULT true,
    availability_schedule JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    CHECK (price > 0),
    CHECK (preparation_time >= 0)
);

-- 11. Restaurant Orders Table
CREATE TABLE restaurant_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
    guest_id UUID REFERENCES guests(id),
    room_id UUID REFERENCES rooms(id),
    order_number VARCHAR(20) UNIQUE NOT NULL DEFAULT UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)),
    status order_status DEFAULT 'pending',
    order_type order_type DEFAULT 'room_service',
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'IDR',
    special_instructions TEXT,
    delivery_time TIMESTAMP WITH TIME ZONE,
    estimated_ready_time TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    CHECK (total_amount >= 0)
);

-- 12. Restaurant Order Items Table
CREATE TABLE restaurant_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES restaurant_orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES restaurant_items(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (quantity > 0),
    CHECK (unit_price >= 0)
);

-- 13. Restaurant Bills Table
CREATE TABLE restaurant_bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES guests(id),
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    outstanding_amount DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    status bill_status DEFAULT 'outstanding',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    CHECK (total_amount >= 0),
    CHECK (paid_amount >= 0),
    CHECK (paid_amount <= total_amount),
    UNIQUE(reservation_id) -- One bill per reservation
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

-- Restaurant module indexes
CREATE INDEX idx_restaurant_categories_property ON restaurant_categories(property_id, is_active);
CREATE INDEX idx_restaurant_categories_order ON restaurant_categories(property_id, display_order);
CREATE INDEX idx_restaurant_items_property ON restaurant_items(property_id, is_available);
CREATE INDEX idx_restaurant_items_category ON restaurant_items(category_id, is_available);
CREATE INDEX idx_restaurant_items_price ON restaurant_items(property_id, price);
CREATE INDEX idx_restaurant_orders_property ON restaurant_orders(property_id, status);
CREATE INDEX idx_restaurant_orders_reservation ON restaurant_orders(reservation_id);
CREATE INDEX idx_restaurant_orders_guest ON restaurant_orders(guest_id);
CREATE INDEX idx_restaurant_orders_room ON restaurant_orders(room_id);
CREATE INDEX idx_restaurant_orders_status ON restaurant_orders(status, created_at);
CREATE INDEX idx_restaurant_orders_number ON restaurant_orders(order_number);
CREATE INDEX idx_restaurant_order_items_order ON restaurant_order_items(order_id);
CREATE INDEX idx_restaurant_order_items_item ON restaurant_order_items(item_id);
CREATE INDEX idx_restaurant_bills_property ON restaurant_bills(property_id, status);
CREATE INDEX idx_restaurant_bills_reservation ON restaurant_bills(reservation_id);
CREATE INDEX idx_restaurant_bills_guest ON restaurant_bills(guest_id);
CREATE INDEX idx_restaurant_bills_outstanding ON restaurant_bills(status) WHERE status = 'outstanding';

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

-- Restaurant module triggers
CREATE TRIGGER update_restaurant_categories_updated_at BEFORE UPDATE ON restaurant_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_restaurant_items_updated_at BEFORE UPDATE ON restaurant_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_restaurant_orders_updated_at BEFORE UPDATE ON restaurant_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_restaurant_bills_updated_at BEFORE UPDATE ON restaurant_bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Restaurant module version triggers
CREATE TRIGGER increment_restaurant_categories_version BEFORE UPDATE ON restaurant_categories FOR EACH ROW EXECUTE FUNCTION increment_version();
CREATE TRIGGER increment_restaurant_items_version BEFORE UPDATE ON restaurant_items FOR EACH ROW EXECUTE FUNCTION increment_version();
CREATE TRIGGER increment_restaurant_orders_version BEFORE UPDATE ON restaurant_orders FOR EACH ROW EXECUTE FUNCTION increment_version();
CREATE TRIGGER increment_restaurant_bills_version BEFORE UPDATE ON restaurant_bills FOR EACH ROW EXECUTE FUNCTION increment_version();

-- Restaurant Automation Functions

-- Function to automatically update restaurant bills when orders are created/updated
CREATE OR REPLACE FUNCTION update_restaurant_bill()
RETURNS TRIGGER AS $$
DECLARE
    bill_exists BOOLEAN;
    current_total DECIMAL(10,2);
BEGIN
    -- Only process if order is not cancelled
    IF NEW.status != 'cancelled' AND (TG_OP = 'INSERT' OR OLD.status != NEW.status) THEN
        -- Check if reservation has a bill
        SELECT EXISTS(
            SELECT 1 FROM restaurant_bills 
            WHERE reservation_id = NEW.reservation_id
        ) INTO bill_exists;
        
        -- Calculate total amount for all non-cancelled orders for this reservation
        SELECT COALESCE(SUM(total_amount), 0) 
        FROM restaurant_orders 
        WHERE reservation_id = NEW.reservation_id AND status != 'cancelled'
        INTO current_total;
        
        IF bill_exists THEN
            -- Update existing bill
            UPDATE restaurant_bills 
            SET total_amount = current_total,
                updated_at = NOW()
            WHERE reservation_id = NEW.reservation_id;
        ELSE
            -- Create new bill if total > 0
            IF current_total > 0 THEN
                INSERT INTO restaurant_bills (
                    property_id, reservation_id, guest_id, total_amount
                ) 
                SELECT NEW.property_id, NEW.reservation_id, NEW.guest_id, current_total
                WHERE NEW.reservation_id IS NOT NULL AND NEW.guest_id IS NOT NULL;
            END IF;
        END IF;
    END IF;
    
    -- Handle cancelled orders
    IF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        -- Recalculate bill total
        SELECT COALESCE(SUM(total_amount), 0) 
        FROM restaurant_orders 
        WHERE reservation_id = NEW.reservation_id AND status != 'cancelled'
        INTO current_total;
        
        IF current_total = 0 THEN
            -- Delete bill if no outstanding orders
            DELETE FROM restaurant_bills WHERE reservation_id = NEW.reservation_id;
        ELSE
            -- Update bill total
            UPDATE restaurant_bills 
            SET total_amount = current_total,
                updated_at = NOW()
            WHERE reservation_id = NEW.reservation_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update order total when order items change
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
DECLARE
    new_total DECIMAL(10,2);
BEGIN
    -- Calculate new total for the order
    SELECT COALESCE(SUM(total_price), 0)
    FROM restaurant_order_items
    WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
    INTO new_total;
    
    -- Update the order total
    UPDATE restaurant_orders
    SET total_amount = new_total,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.order_id, OLD.order_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to prevent checkout if outstanding restaurant bills exist
CREATE OR REPLACE FUNCTION check_outstanding_restaurant_bills()
RETURNS TRIGGER AS $$
DECLARE
    outstanding_amount DECIMAL(10,2);
BEGIN
    -- Only check when status changes to checked_out
    IF NEW.status = 'checked_out' AND OLD.status != 'checked_out' THEN
        SELECT COALESCE(SUM(outstanding_amount), 0)
        FROM restaurant_bills
        WHERE reservation_id = NEW.id AND status = 'outstanding'
        INTO outstanding_amount;
        
        IF outstanding_amount > 0 THEN
            RAISE EXCEPTION 'Cannot check out guest with outstanding restaurant bills: %', outstanding_amount;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create automation triggers
CREATE TRIGGER restaurant_bill_automation
    AFTER INSERT OR UPDATE ON restaurant_orders
    FOR EACH ROW EXECUTE FUNCTION update_restaurant_bill();

CREATE TRIGGER restaurant_order_total_automation
    AFTER INSERT OR UPDATE OR DELETE ON restaurant_order_items
    FOR EACH ROW EXECUTE FUNCTION update_order_total();

CREATE TRIGGER check_restaurant_bills_on_checkout
    BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION check_outstanding_restaurant_bills();