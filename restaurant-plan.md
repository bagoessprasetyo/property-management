InnSync Hotel Property Management System

    🎯 Overview

    Comprehensive restaurant module that allows hotel guests to order food during their stay, with outstanding bills 
    integrated into the checkout process. The system will ensure no guest can check out without settling restaurant 
    bills.

    ---
    📋 Phase 1: Database Schema & Core Architecture

    1.1 New Database Tables

    -- Restaurant Categories (Appetizers, Mains, Desserts, Drinks)
    CREATE TABLE restaurant_categories (
        id UUID PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        display_order INTEGER,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Restaurant Menu Items
    CREATE TABLE restaurant_items (
        id UUID PRIMARY KEY,
        category_id UUID REFERENCES restaurant_categories(id),
        name VARCHAR(200) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'IDR',
        image_url TEXT,
        ingredients JSONB DEFAULT '[]'::jsonb,
        allergens JSONB DEFAULT '[]'::jsonb,
        dietary_info JSONB DEFAULT '[]'::jsonb, -- vegetarian, halal, etc
        preparation_time INTEGER, -- minutes
        is_available BOOLEAN DEFAULT true,
        availability_schedule JSONB, -- breakfast, lunch, dinner times
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Restaurant Orders
    CREATE TABLE restaurant_orders (
        id UUID PRIMARY KEY,
        reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
        guest_id UUID REFERENCES guests(id),
        room_number VARCHAR(10),
        order_number VARCHAR(20) UNIQUE,
        status order_status DEFAULT 'pending',
        order_type order_type DEFAULT 'room_service',
        total_amount DECIMAL(10,2) NOT NULL,
        special_instructions TEXT,
        delivery_time TIMESTAMP WITH TIME ZONE,
        estimated_ready_time TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Restaurant Order Items
    CREATE TABLE restaurant_order_items (
        id UUID PRIMARY KEY,
        order_id UUID REFERENCES restaurant_orders(id) ON DELETE CASCADE,
        item_id UUID REFERENCES restaurant_items(id),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        special_instructions TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Restaurant Bills (Outstanding bills linked to reservations)
    CREATE TABLE restaurant_bills (
        id UUID PRIMARY KEY,
        reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
        guest_id UUID REFERENCES guests(id),
        total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        outstanding_amount DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
        status bill_status DEFAULT 'outstanding',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- New Enums
    CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled');
    CREATE TYPE order_type AS ENUM ('room_service', 'dine_in', 'takeaway');
    CREATE TYPE bill_status AS ENUM ('outstanding', 'paid', 'void');

    1.2 Database Triggers & Functions

    - Auto-update restaurant bills when orders are created/cancelled
    - Auto-generate order numbers
    - Update reservation checkout status based on outstanding bills

    ---
    📋 Phase 2: Backend API & Hooks

    2.1 React Query Hooks (lib/hooks/)

    - use-restaurant-categories.ts - Menu category management
    - use-restaurant-items.ts - Menu item management  
    - use-restaurant-orders.ts - Order creation, status updates
    - use-restaurant-bills.ts - Outstanding bill tracking
    - use-restaurant-analytics.ts - Revenue and order analytics

    2.2 Integration Hooks

    - Extend use-reservations.ts to include restaurant bill checking
    - Extend use-payments.ts to handle restaurant bill payments
    - Add restaurant metrics to use-dashboard.ts

    ---
    📋 Phase 3: Frontend Components

    3.1 Core Restaurant Components (components/restaurant/)

    restaurant/
    ├── menu/
    │   ├── menu-category-list.tsx
    │   ├── menu-item-card.tsx
    │   ├── menu-item-form.tsx
    │   └── menu-management.tsx
    ├── orders/
    │   ├── order-form.tsx
    │   ├── order-list.tsx
    │   ├── order-detail.tsx
    │   ├── order-status-tracker.tsx
    │   └── kitchen-display.tsx
    ├── billing/
    │   ├── bill-summary.tsx
    │   ├── outstanding-bills.tsx
    │   └── bill-payment-form.tsx
    └── analytics/
        ├── restaurant-dashboard.tsx
        ├── order-analytics.tsx
        └── revenue-chart.tsx

    3.2 Guest Ordering Interface

    - Mobile-first design for tablet/phone ordering
    - Room service menu with category filtering
    - Cart functionality with quantity adjustments
    - Special instructions and dietary requirements
    - Order tracking with real-time status updates

    3.3 Kitchen Management Interface

    - Order queue display with preparation times
    - Status update controls (confirmed → preparing → ready → delivered)
    - Order history and analytics
    - Menu item availability toggle

    ---
    📋 Phase 4: Integration Points

    4.1 Navigation Integration

    - Add "Restoran" to sidebar navigation with ChefHat icon
    - Add restaurant metrics to main dashboard
    - Integrate with command palette (Cmd+K) shortcuts

    4.2 Checkout Process Enhancement

    // Modify checkout validation
    const checkOutstandingBills = async (reservationId: string) => {
      const bills = await getOutstandingRestaurantBills(reservationId)
      if (bills.length > 0) {
        throw new Error('Guest has outstanding restaurant bills')
      }
    }

    4.3 Dashboard Integration

    - Restaurant revenue cards and charts
    - Active orders counter in sidebar
    - Outstanding bills alerts
    - Popular menu items analytics

    ---
    📋 Phase 5: User Experience Flows

    5.1 Guest Ordering Flow

    1. Access: Guest scans QR code or uses in-room tablet
    2. Browse: Menu with categories, photos, prices
    3. Order: Add items to cart, specify room number
    4. Confirm: Review order, add special instructions
    5. Track: Real-time status updates
    6. Delivery: Room service delivery confirmation

    5.2 Kitchen Management Flow

    1. Receive: New order notification with details
    2. Confirm: Accept order and set preparation time
    3. Prepare: Update status as cooking progresses
    4. Complete: Mark ready for delivery
    5. Deliver: Confirm delivery to guest room

    5.3 Front Desk Checkout Flow

    1. Standard checkout process begins
    2. Bill verification: System checks outstanding restaurant bills
    3. Bill settlement: If bills exist, present payment options
    4. Completion: Only allow checkout after all bills paid

    ---
    📋 Phase 6: Advanced Features

    6.1 Real-time Features

    - Live order tracking using WebSocket connections
    - Kitchen display updates with order queue
    - Guest notifications when order is ready

    6.2 Business Intelligence

    - Revenue analytics by time periods
    - Popular items analysis
    - Order patterns by guest demographics
    - Kitchen efficiency metrics

    6.3 Mobile Optimization

    - Progressive Web App capabilities
    - Offline menu browsing 
    - Push notifications for order updates
    - QR code integration for contactless ordering

    ---
    📋 Phase 7: Technical Implementation

    7.1 File Structure

    app/dashboard/restaurant/
    ├── page.tsx                 # Main restaurant dashboard
    ├── menu/page.tsx           # Menu management
    ├── orders/page.tsx         # Order management  
    ├── bills/page.tsx          # Outstanding bills
    └── analytics/page.tsx      # Restaurant analytics

    components/restaurant/      # All restaurant components
    lib/hooks/use-restaurant-*  # Restaurant-specific hooks
    lib/types/restaurant.ts     # TypeScript definitions

    7.2 Security & Permissions

    - Guest access control: Only current hotel guests can order
    - Room verification: Match guest to current room assignment
    - Staff permissions: Kitchen vs. front desk access levels
    - Data validation: Prevent fraudulent orders

    7.3 Performance Considerations

    - Lazy loading for menu images
    - Cached menu data with stale-while-revalidate
    - Optimistic updates for order status changes
    - Background sync for offline order queue

    ---
    📋 Implementation Timeline

    Phase 1-2 (Database & API): 1-2 weeks
    Phase 3 (Core Components): 2-3 weeksPhase 4 (Integration): 1-2 weeks
    Phase 5 (UX Polish): 1-2 weeks
    Phase 6-7 (Advanced Features): 2-3 weeks

    Total Estimated Time: 7-12 weeks

    ---
    🎯 Success Metrics

    - Order Accuracy: 99%+ correct orders delivered
    - Guest Satisfaction: Seamless ordering experience
    - Revenue Integration: 100% bill collection at checkout
    - Kitchen Efficiency: Average 20-30 min preparation time
    - System Reliability: 99.9% uptime for ordering system

    This comprehensive plan ensures the restaurant module integrates seamlessly with the existing InnSync system 
    while providing a modern, efficient ordering and billing experience.