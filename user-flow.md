# AfriCart User Flows

This document outlines the detailed user flows for each user type in the AfriCart multi-vendor e-commerce marketplace, specifically designed for the Ghanaian market.

## Overview

AfriCart supports five distinct user types, each with their own registration process, dashboard, and workflow:

1. **Customer** - Shops for products across multiple vendor stores
2. **Vendor Owner** - Manages a storefront business and staff
3. **Vendor Staff** - Handles order processing and fulfillment operations
4. **Rider** - Delivers customer orders
5. **Super Admin** - Manages platform operations and verifications

---

## 1. Customer Flow

### 1.1 Registration & Onboarding

#### Step 1: Email Verification
```
1. Customer visits AfriCart website/app
2. Clicks "Sign Up" → Selects "Customer"
3. Enters email address
4. System generates 6-digit OTP
5. OTP sent to email
6. Customer enters OTP code
7. Email verified ✓
```

**Database Actions:**
- Create record in `EmailVerifications` table
- Send OTP via email service
- Validate OTP and mark `verified_at`

#### Step 2: Phone Number Verification
```
1. Customer enters phone number
2. System generates 6-digit SMS OTP
3. OTP sent via SMS
4. Customer enters OTP code
5. Phone number verified ✓
```

**Database Actions:**
- Create record in `PhoneVerifications` table
- Send SMS via Ghana SMS gateway (Hubtel/mNotify)
- Validate OTP and mark `verified_at`

#### Step 3: Location Setup
```
Option A - GPS Location:
1. Request location permission
2. Get current coordinates
3. Reverse geocode to address
4. Customer confirms/edits address details

Option B - Manual Selection:
1. Show map interface
2. Customer searches or pins location
3. Enter address details (landmark, area, etc.)
4. Save location
```

**Database Actions:**
- Create `Users` record with `user_type: 'customer'`
- Create `UserProfiles` record
- Create `UserLocations` record with Ghana-specific fields

#### Step 4: Account Completion
```
1. Set password (optional - can use OTP login)
2. Add profile photo (optional)
3. Set shopping preferences (favorite categories)
4. Account setup complete
5. Redirect to marketplace discovery
```

### 1.2 Shopping & Ordering Flow

#### Step 1: Marketplace Discovery
```
1. System shows vendor stores/products near customer location
2. Filters by:
   - Distance (within delivery zones)
   - Product category
   - Store rating
   - Delivery time
   - Minimum order amount
3. Customer browses store and product listings
```

**Database Queries:**
- Get customer's `UserLocations`
- Find vendor stores within `DeliveryZones`
- Sort by proximity and rating
- Filter by `operating_hours` and `is_active`

#### Step 2: Store & Product Browsing
```
1. Customer selects a vendor store
2. View store details (rating, delivery fee, minimum order)
3. Browse product categories (sorted by `sort_order`)
4. View products with:
   - Photos and descriptions
   - Prices and variants
   - Product attributes (size, color, condition, etc.)
```

#### Step 3: Cart Management
```
1. Customer adds products to cart
2. Select product variants (size, color, quantity option)
3. Specify quantity
4. Add special instructions (e.g., gift wrap, delivery notes)
5. View cart summary with:
   - Subtotal
   - Delivery fee
   - Tax
   - Total amount
```

#### Step 4: Checkout Process
```
1. Verify delivery address
2. Select payment method:
   - Mobile Money (MTN, Vodafone, AirtelTigo)
   - Credit/Debit Card
   - Bank Transfer
3. Add tip for rider (optional)
4. Review order summary
5. Place order
```

**Database Actions:**
- Create `Orders` record with unique `order_number`
- Generate 4-digit `delivery_code` and `qr_code`
- Create `OrderItems` and `OrderItemOptions` records
- Process payment via Paystack (split to vendor subaccount)
- Create `Payments` record

#### Step 5: Order Tracking
```
1. Order confirmation screen with order number
2. Real-time status updates:
   - Pending → Confirmed → Processing → Ready for Pickup → Picked Up → Delivered
3. Estimated delivery time
4. Rider details (when assigned)
5. Live tracking (when out for delivery)
```

#### Step 6: Delivery & Completion
```
1. Rider arrives at location
2. Customer provides:
   - 4-digit delivery code OR
   - Shows QR code for scanning
3. Rider confirms delivery
4. Order marked as delivered
5. Customer receives delivery confirmation
```

#### Step 7: Post-Order Actions
```
1. Rate and review vendor store (1-5 stars)
2. Rate and review rider (1-5 stars)
3. Add photos to review (optional)
4. Save favorite products/stores
5. Reorder functionality
```

### 1.3 Customer Dashboard Features

#### Order History
```
- View all past orders
- Reorder favorite items
- Track current orders
- Download receipts
```

#### Profile Management
```
- Update personal information
- Manage delivery addresses
- Set shopping preferences
- Update payment methods
```

#### Favorites & Recommendations
```
- Favorite vendor stores
- Favorite products
- Personalized recommendations
- Recently viewed/ordered items
```

---

## 2. Vendor Owner Flow

### 2.1 Registration & Verification

#### Step 1: Business Registration
```
1. Vendor owner visits platform
2. Clicks "Register Store"
3. Provides business information:
   - Store name
   - Business registration number
   - Owner details
   - Contact information
4. Email and phone verification (same as customer)
```

#### Step 2: Business Details
```
1. Upload business documents:
   - Business registration certificate
   - Ghana TIN (tax identification)
   - Product-category-specific certification (if applicable)
2. Store details:
   - Product category/niche
   - Description
   - Operating hours
   - Delivery preferences
3. Location and delivery zones setup
```

#### Step 3: Product Catalog Setup
```
1. Create product categories
2. Add products with:
   - Photos
   - Descriptions
   - Prices
   - Variants (size, color, etc.)
   - Stock levels
3. Set availability and processing times
```

#### Step 4: Payment & Delivery Setup
```
1. Set delivery fees and minimum order
2. Define delivery zones
3. Choose delivery method:
   - Use platform riders
   - Own delivery staff
4. Set up Paystack subaccount and Mobile Money payout details
```

#### Step 5: Verification Process
```
1. Submit application for review
2. Super admin reviews documents
3. Verification status updates:
   - Pending → Under Review → Approved/Rejected
4. Once approved, store goes live
```

**Database Actions:**
- Create `Users` record with `user_type: 'vendor_owner'`
- Create `VendorStores` record with `is_verified: false`
- Create `ProductCategories` and `Products`
- Create `DeliveryZones` polygons
- Super admin updates verification status

### 2.2 Daily Operations

#### Order Management
```
1. Receive order notifications (in-app, SMS, email)
2. Review order details
3. Confirm or reject order
4. Update order status:
   - Confirmed → Processing → Ready for Pickup
5. Notify rider when ready (if using platform delivery)
```

#### Product Catalog Management
```
1. Update product availability/stock
2. Modify prices and descriptions
3. Add seasonal/new products
4. Manage product variants
5. Upload new photos
```

#### Staff Management
```
1. Create staff accounts
2. Assign roles and permissions:
   - Manager: Full access except financials
   - Order Staff: Order management only
   - Fulfillment Staff: Packing/inventory operations only
3. Monitor staff performance
4. Manage work schedules
```

#### Analytics & Reports
```
1. View sales analytics:
   - Daily/weekly/monthly revenue
   - Popular products
   - Order volume trends
   - Customer ratings
2. Financial reports (Paystack payout ledger)
3. Performance metrics
4. Customer feedback analysis
```

### 2.3 Vendor Owner Dashboard

#### Order Dashboard
```
- Real-time order queue
- Order history and search
- Revenue tracking
- Customer feedback
```

#### Product Catalog Management
```
- Category and product management
- Bulk price updates
- Inventory tracking
- Promotional items
```

#### Staff Portal
```
- Staff account management
- Role assignments
- Performance monitoring
- Schedule management
```

#### Business Analytics
```
- Sales reports
- Customer analytics
- Popular products analysis
- Financial summaries
```

---

## 3. Vendor Staff Flow

### 3.1 Account Setup

#### Staff Onboarding
```
1. Vendor owner creates staff account
2. Staff receives login credentials
3. First login setup:
   - Change password
   - Complete profile
   - Review assigned permissions
4. Dashboard orientation
```

**Database Actions:**
- Owner creates `Users` record with `user_type: 'vendor_staff'`
- Create `VendorStaff` record with role and permissions
- Link to specific vendor store

### 3.2 Daily Operations

#### Order Processing Workflow
```
1. Staff logs into dashboard
2. Views incoming orders in real-time
3. For each new order:
   - Review order details
   - Check stock availability
   - Confirm order (status: pending → confirmed)
   - Print packing slip
4. Fulfillment:
   - Update status to "processing"
   - Monitor packing progress
   - Update status to "ready for pickup" when complete
5. Handoff to delivery:
   - If platform delivery: notify rider
   - If own delivery: coordinate with delivery staff
   - Update status to "picked up"
```

#### Fulfillment & Inventory Management
```
1. View order queue by processing time
2. Manage stock levels
3. Update processing times
4. Handle special requests
5. Quality control checks
```

#### Customer Communication
```
1. Handle order modifications
2. Communicate delays
3. Process cancellations
4. Respond to special instructions
```

### 3.3 Staff Dashboard Features

#### Order Queue
```
- Live order feed
- Priority sorting by time
- Status management
- Packing slip printing
```

#### Catalog Updates
```
- Mark items out of stock
- Update processing times
- Manage daily promotions
- Inventory alerts
```

#### Performance Metrics
```
- Orders processed
- Average processing time
- Customer ratings
- Efficiency metrics
```

---

## 4. Rider Flow

### 4.1 Registration & Verification

#### Step 1: Personal Registration
```
1. Rider visits platform
2. Selects "Become a Rider"
3. Personal information:
   - Full name
   - Phone number
   - Email address
   - National ID
4. Email and phone verification
```

#### Step 2: Vehicle & Document Upload
```
1. Vehicle information:
   - Type (bicycle, motorcycle, car, walking)
   - Model and registration
   - Insurance details
2. Document uploads:
   - Driver's license (if applicable)
   - Vehicle registration
   - Insurance certificate
   - Passport photo
```

#### Step 3: Background Check
```
1. Identity verification
2. Criminal background check
3. Reference checks
4. Vehicle inspection (if applicable)
```

#### Step 4: Payment Setup
```
1. Mobile money account details:
   - Phone number
   - Network (MTN, Vodafone, AirtelTigo)
   - Account name verification
2. Bank account (optional backup)
```

#### Step 5: Verification & Approval
```
1. Super admin reviews application
2. Document verification
3. Background check results
4. Approval decision
5. Rider onboarding and training
```

**Database Actions:**
- Create `Users` record with `user_type: 'rider'`
- Create `Riders` record with `verification_status: 'pending'`
- Create `RiderDocuments` records
- Super admin updates verification status

### 4.2 Daily Operations

#### Going Online
```
1. Rider opens app
2. Sets status to "online"
3. Enables location sharing
4. System tracks current location
5. Becomes available for order assignments
```

#### Order Assignment Process
```
1. New order becomes available
2. System notifies nearby available riders
3. Rider receives notification with:
   - Vendor store details
   - Delivery address
   - Estimated distance and time
   - Delivery fee
4. Rider accepts or declines
5. First to accept gets the order
```

#### Pickup Process
```
1. Navigate to vendor store
2. Confirm arrival at store
3. Show order details to vendor staff
4. Collect order and verify items
5. Update status to "picked up"
6. Begin delivery journey
```

#### Delivery Process
```
1. Navigate to customer location
2. Update status to "out for delivery"
3. Contact customer if needed
4. Arrive at delivery location
5. Request delivery confirmation:
   - Customer provides 4-digit code OR
   - Scan customer's QR code
6. Confirm delivery in app
7. Order marked as delivered
```

#### Earnings & Payments
```
1. View daily earnings
2. Track completed deliveries
3. Receive weekly payments via mobile money
4. View payment history
5. Performance bonuses
```

### 4.3 Rider Dashboard Features

#### Active Delivery
```
- Current order details
- Navigation assistance
- Customer contact info
- Delivery instructions
```

#### Earnings Tracker
```
- Daily/weekly earnings
- Delivery count
- Average per delivery
- Payment history
```

#### Performance Metrics
```
- Delivery rating
- On-time delivery rate
- Customer feedback
- Completion rate
```

#### Schedule Management
```
- Set availability hours
- View delivery history
- Performance analytics
- Goal tracking
```

---

## 5. Super Admin Flow

### 5.1 Platform Management

#### Vendor Verification
```
1. Review new vendor store applications
2. Verify business documents:
   - Business registration
   - Ghana TIN
   - Category-specific certifications
3. Check store location and details
4. Approve or reject application
5. Send notification to vendor owner
```

#### Rider Verification
```
1. Review rider applications
2. Verify identity documents
3. Check background check results
4. Verify vehicle documentation
5. Approve or reject application
6. Send notification to rider
```

#### User Management
```
1. View all platform users
2. Suspend/activate accounts
3. Handle user disputes
4. Manage user roles and permissions
5. Process account deletions
```

### 5.2 System Configuration

#### Platform Settings
```
1. Configure delivery fees and taxes
2. Set platform commission/split rates
3. Manage promotional campaigns
4. Update terms and conditions
5. Configure notification templates
```

#### Analytics & Reporting
```
1. Platform performance metrics
2. Revenue analytics
3. User growth tracking
4. Order volume analysis
5. Geographic performance
```

#### Content Management
```
1. Manage homepage content
2. Update promotional banners
3. Manage help documentation
4. Configure email/SMS templates
5. System announcements
```

### 5.3 Super Admin Dashboard

#### Verification Queue
```
- Pending vendor applications
- Pending rider applications
- Document review interface
- Bulk approval tools
```

#### Platform Analytics
```
- Real-time platform metrics
- Revenue dashboards
- User activity monitoring
- Performance KPIs
```

#### System Management
```
- Configuration settings
- User management tools
- Content management
- System health monitoring
```

#### Support & Disputes
```
- Customer support tickets
- Dispute resolution
- Refund processing
- Platform communications
```

---

## Cross-User Interactions

### Order Lifecycle Interactions

```
Customer Places Order
    ↓
Vendor Staff Receives Notification
    ↓
Staff Confirms Order
    ↓
Fulfillment Team Packs Order
    ↓
Staff Marks Order Ready for Pickup
    ↓
IF vendor has own delivery:
    Vendor delivers directly
ELSE:
    System notifies available riders
    ↓
    Rider accepts order
    ↓
    Rider picks up from vendor store
    ↓
    Rider delivers to customer
    ↓
Customer confirms delivery with code/QR
    ↓
Customer rates vendor store and rider
```

### Notification Flow

```
Order Status Change
    ↓
System creates OrderNotifications
    ↓
Send to relevant parties:
- Customer: Order updates
- Vendor: New orders, rider assigned
- Rider: New delivery opportunities
    ↓
Track delivery status in database
```


This comprehensive user flow documentation provides the foundation for implementing the AfriCart platform with clear understanding of each user journey and their interactions within the system.