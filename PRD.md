Excellent. This is a perfect use case for this stack. Let's create a detailed Product Requirements Document (PRD) for your Professional Property Management System, which we'll call **"InnSync"**.

This PRD is designed to be a blueprint for development, keeping your chosen tech stack (Next.js 14, Supabase, Shadcn/ui) and modern UX principles at its core.

---

### **Product Requirements Document: InnSync PMS**

**Version:** 1.0
**Date:** October 26, 2023
**Author:** [Your Name/Team]

### 1. Introduction & Vision

**1.1. Product Name:** InnSync

**1.2. Vision Statement:** To create the most intuitive, fast, and aesthetically pleasing Property Management System for small to medium-sized boutique hotels and vacation rentals. InnSync will empower property managers to streamline their operations, reduce administrative overhead, and focus on providing exceptional guest experiences.

**1.3. The Problem:** Existing PMS solutions are often clunky, slow, expensive, and have a steep learning curve. They feel like legacy enterprise software, not modern web applications. This leads to user frustration, inefficient workflows, and a disconnect between the software and the hospitality it's meant to support.

**1.4. Our Solution:** InnSync will be a web-based PMS built with a modern tech stack that prioritizes speed, simplicity, and a superior user experience. By leveraging Supabase for a real-time backend and Shadcn/ui for a clean, customizable component library, we will deliver a product that is both powerful and a joy to use.

### 2. Target Audience & Personas

- **Primary Persona: Maria, The Boutique Hotel Owner (30-50 units)**
  - **Needs:** A central place to see everything at a glance. Wants to manage bookings, check-ins, and housekeeping without complex training. Values aesthetics and wants a tool that reflects the modern brand of her hotel.
  - **Pain Points:** Spends too much time on the phone and in spreadsheets. Overbookings are her biggest fear. Finds current systems visually unappealing and slow.
- **Secondary Persona: David, The Front Desk Manager**
  - **Needs:** Speed and efficiency are paramount. He needs to check a guest in, handle payments, and answer questions without being slowed down by the software. Keyboard shortcuts are a huge plus.
  - **Pain Points:** Laggy interfaces, too many clicks to perform a simple action, and difficulty finding guest information quickly.

### 3. Guiding Principles & UX Philosophy

- **Clarity Over Clutter:** Every screen will be designed with a clear purpose. We will use ample white space, clean typography (e.g., Inter font), and a minimalist aesthetic. Information density will be intentional, not overwhelming.
- **Speed as a Feature:** Interactions must feel instantaneous. Next.js 14's optimized build performance and Supabase's real-time capabilities will be leveraged to provide a snappy, responsive UI. No unnecessary page reloads.
- **Keyboard-First Navigation:** Power users (like David) should be able to perform core actions (search, new booking, check-in) entirely via the keyboard using command palettes (`Cmd+K`) and shortcuts.
- **Logical & Predictable UX:** The user flow for common tasks like creating a booking or checking a guest out will be linear and intuitive, requiring minimal cognitive load.
- **Responsive & Accessible:** The UI must be perfectly usable on a front-desk desktop, a manager's laptop, and a tablet for housekeeping updates.

### 4. Technical Stack (Revised)

- **Frontend Framework:** Next.js 14 (React)
- **Backend & Database:** **Supabase**
  - **Database:** Supabase Postgres for all data storage.
  - **Authentication:** Supabase Auth for secure user login (email/password for staff). Row Level Security (RLS) will be heavily utilized to ensure users can only access data for their assigned property.
  - **Storage:** Supabase Storage for hosting guest ID scans or property images.
  - **Edge Functions:** (Optional, for future use) Could be used for complex backend logic like generating nightly reports or processing payments without exposing keys on the client.
- **UI Components:** **shadcn/ui** - leveraging its composable, accessible, and aesthetically pleasing components.
- **Styling:** Tailwind CSS.
- **Icons:** Lucide Icons.
- **Data Fetching/State Management:** A robust client-side data fetching library like **React Query (TanStack Query)**. This is now **critical** to handle caching, data invalidation, and optimistic updates gracefully without real-time sockets.

### 5. Guiding Principles & UX Philosophy (Revised)

The core principles remain, but the interaction model shifts slightly.

- **Clarity Over Clutter:** Unchanged. Minimalist aesthetic remains a priority.
- **Speed as a Feature:** Still paramount. Achieved through Next.js 14's build performance, efficient data fetching with React Query, and smart component rendering. The feeling of "speed" comes from instant UI feedback and optimized database queries.
- **Deliberate & Predictable UX:** Since the UI won't update automatically in the background, the user is always in control. The application state only changes when the user performs an action (e.g., clicking a "Refresh" button, saving a form). This can reduce cognitive load and prevent unexpected layout shifts.
- **Optimistic Updates for a "Real-Time Feel":** To compensate for the lack of subscriptions, we will use optimistic UI updates. When David moves a booking on the grid, the UI will update instantly _before_ the API call completes. If the call fails, the change will be reverted with a **shadcn `Toast`** notification explaining the error. This provides a snappy user experience.
- **Smart Data Invalidation:** Using React Query, after a user creates a new booking, the system will automatically invalidate the cached data for the "reservations" query, triggering a fresh, silent refetch in the background. This ensures data is always up-to-date after an action is performed.

---

### 6. Core Features Breakdown (Revised UX/UI Details)

The features are the same, but the _implementation and user interaction_ change.

#### **Epic 1: Dashboard & Global UI**

- **User Story:** Unchanged.
- **Revised UX/UI Details:**
  - The Dashboard stats ("Arrivals Today," etc.) are fetched on page load.
  - A subtle, manual **"Refresh" button** (perhaps an icon in the top bar) will be present to allow Maria to fetch the latest data on demand. It could also have a timestamp: "Last updated: 10:35 AM".
  - The "Activity Feed" is no longer a live feed. It becomes a "Recent Activity" log showing the last 10-20 actions performed by staff, fetched on page load.

#### **Epic 2: The Reservation Grid (The "Tape Chart")**

- **User Story:** Unchanged.
- **Revised UX/UI Details:**
  - The initial grid data is fetched when the component mounts.
  - When David drags, drops, or resizes a booking:
    1.  The UI updates **optimistically** in the browser state _immediately_.
    2.  An API call is made to the Supabase backend to update the reservation.
    3.  On success: The change is permanent. React Query silently refetches the data to ensure consistency.
    4.  On failure (e.g., another user has already booked that room): The UI change reverts to its original state, and a **`Toast` notification** appears: "Error: Room is no longer available. Please refresh."
  - **Collaboration Handling:** Without real-time, we must handle potential conflicts. A simple strategy is to include a "version" or "last_updated_at" timestamp on reservations. The update API call would fail if the timestamp on the server is newer than the one the client has, preventing overwrites.

#### **Epic 3: Booking & Guest Management**

- **User Story:** Unchanged.
- **Revised UX/UI Details:**
  - The workflow is identical.
  - Upon successful creation of a new booking, the `Dialog` closes, and React Query is instructed to **invalidate the `reservations` query cache**. This triggers the Reservation Grid in the background to refetch its data, and the new booking appears seamlessly.

#### **Epic 4: Front Desk & Housekeeping**

- **User Story:** Unchanged.
- **Revised UX/UI Details:**
  - The Housekeeping `Table` fetches data on load.
  - When a manager changes a room's status using the `Select` dropdown:
    1.  The UI can show a subtle loading spinner inside the `Select` component.
    2.  The API call is made.
    3.  On success, the spinner disappears.
    4.  On failure, a `Toast` is shown, and the `Select` reverts to its original value.
  - A "Refresh List" button should be available on this page for the housekeeping manager to get the latest status before starting their shift.
  - When a guest is checked out, the subsequent API call to update the room status to "Dirty" is chained after the successful checkout API call.

### 5. Core Features Breakdown (MVP - Professional Tier)

This section outlines the epics and user stories for our professional-grade PMS.

#### **Epic 1: Dashboard & Global UI**

- **User Story:** As Maria, I want to see a real-time overview of my property's status the moment I log in, so I can quickly assess the day's business.
- **UX/UI Details:**
  - **Layout:** A clean grid layout using **shadcn `Card`** components.
  - **Components:**
    - `Card` for key stats: "Arrivals Today," "Departures," "Occupancy," "Revenue Today."
    - A simple `BarChart` (using `recharts` integrated with shadcn) for weekly occupancy.
    - An "Activity Feed" list showing recent bookings and check-ins, updated in real-time via Supabase subscriptions.
    - A persistent sidebar navigation using **shadcn `NavigationMenu`** or a custom layout.
    - A global search/command palette (`Cmd+K`) using **shadcn `Command`**.

#### **Epic 2: The Reservation Grid (The "Tape Chart")**

- **User Story:** As David, I need a visual calendar grid to see all my rooms and bookings over time, so I can manage availability and place new reservations effectively.
- **UX/UI Details:**
  - **Inspiration:** Modern calendar apps like Cron, Linear, or Fantastical.
  - **Functionality:**
    - Horizontal timeline (days/weeks/month). Vertical list of rooms grouped by room type.
    - Bookings are represented as colored blocks. The color indicates the booking status (e.g., Blue for Confirmed, Green for In-House).
    - **Click-and-drag** to create a new reservation.
    - Blocks are **resizable** to extend a stay and **draggable** to change a room assignment.
    - Clicking a block opens a **shadcn `Popover` or `Dialog`** with key booking details and quick actions ("Check In," "View Folio").
    - Real-time updates: If a colleague makes a booking, it should appear on the grid instantly without a refresh (via Supabase subscriptions on the `reservations` table).

#### **Epic 3: Booking & Guest Management**

- **User Story:** As David, I want to create a new booking in under 60 seconds, so I can handle phone inquiries efficiently without putting the customer on hold for too long.
- **UX/UI Details:**
  - **Flow:** Initiated from the Reservation Grid or a global "New Booking" button.
  - **Components:**
    - A multi-step **shadcn `Dialog` (modal)** to guide the user.
    - Step 1: Dates & Guest Count (using **`Calendar`** and **`Input`**). The system shows available room types.
    - Step 2: Guest Information (using a reusable **`Form`** with validation). An async search checks if the guest already exists in the database.
    - Step 3: Rate Selection & Confirmation (using **`RadioGroup`** or **`Card`** selection).
    - A clear summary `Card` is shown before final confirmation.

#### **Epic 4: Front Desk & Housekeeping**

- **User Story:** As Maria, I need a clear, real-time list of all room statuses so I can coordinate with my housekeeping team and ensure rooms are ready for arriving guests.
- **UX/UI Details:**
  - **Layout:** A dedicated "Housekeeping" page with a filterable **shadcn `Table`**.
  - **Columns:** Room #, Room Type, Status (e.g., Clean, Dirty, Inspected, Out of Order), Notes.
  - **Interactive Status:** The "Status" column should be a **shadcn `Select` or `DropdownMenu`** allowing for quick updates. Changes are saved instantly and broadcast in real-time.
  - **Check-in/Check-out:** On the Dashboard Arrivals list, a prominent "Check In" button next to each guest. This opens a modal to confirm details and process payment. Checking out a guest automatically changes their room status to "Dirty."

#### **Epic 5: Settings & Configuration**

- **User Story:** As Maria, I need to easily set up my property's rooms, rates, and taxes without needing technical help, so I can manage my business independently.
- **UX/UI Details:**
  - **Layout:** A settings page using **shadcn `Tabs`** for different sections ("Property," "Rooms," "Rates," "Users").
  - **Rooms Tab:** A `Table` listing all rooms. An "Add Room" button opens a `Dialog` with a `Form` to define Room Number, select Room Type, etc.
  - **Rates Tab:** A UI to create rate plans. Use `Card` components for each rate plan, showing its name and base price. Clicking a card opens a detailed view to manage prices by date.

### 6. Supabase Data Models (High-Level Schema)

A simplified schema to start with:

- **`profiles`**: (Linked to `auth.users`) Stores staff user info like `full_name`, `role` (Admin, Manager).
- **`properties`**: The top-level table if the PMS is multi-property.
- **`room_types`**: (`id`, `property_id`, `name`, `description`, `base_occupancy`).
- **`rooms`**: (`id`, `property_id`, `room_type_id`, `room_number`, `status` enum: 'clean', 'dirty', 'ooo').
- **`guests`**: (`id`, `full_name`, `email`, `phone`, `history_notes`).
- **`rate_plans`**: (`id`, `property_id`, `name`, `base_price`).
- **`reservations`**: (`id`, `room_id`, `guest_id`, `rate_plan_id`, `check_in_date`, `check_out_date`, `status` enum: 'confirmed', 'in_house', 'cancelled').
- **`folios`**: (`id`, `reservation_id`, `total_balance`).
- **`folio_entries`**: (`id`, `folio_id`, `description`, `amount`, `type` enum: 'debit', 'credit').

### 7. Out of Scope for MVP

- Full-blown Channel Manager integrations (API placeholders only).
- Direct POS integrations.
- Advanced group booking management.
- Automated guest emails (CRM functionality).
- Detailed financial reporting beyond a basic daily summary.

### Summary of Changes & Rationale

| Feature           | Real-Time Approach                             | **Corrected (No-Subscription) Approach**                                 | Rationale                                                                                                     |
| :---------------- | :--------------------------------------------- | :----------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------ |
| **Data Updates**  | UI updates automatically via WebSocket events. | UI updates on user action, page load, or manual refresh.                 | Simpler, more predictable, and reduces Supabase costs. Perfect for a private/internal app.                    |
| **UI Feedback**   | Reactive and instant.                          | **Optimistic updates** and **React Query caching/invalidation**.         | Mimics the feel of a real-time app without the backend complexity.                                            |
| **Collaboration** | Low risk of conflict as changes are broadcast. | Higher risk of conflict. Handled with data versioning or error messages. | A necessary trade-off for simplicity. The UX must clearly communicate when an action fails due to stale data. |
| **Core Library**  | Supabase JS Client (`subscribe()`)             | **React Query (TanStack Query)**                                         | React Query becomes the essential tool for managing server state on the client.                               |
