# Live Tracking Test Guide

## How to Test Real-Time Tracking

### Prerequisites
1. **Start MongoDB**: `mongod`
2. **Start Backend**: `cd backend && npm run dev` (port 3001)
3. **Start Frontend**: `npm run dev` (port 5173)

### Test Steps

#### 1. Setup Test Environment
- Open two browser windows/tabs
- **Window 1**: Driver Dashboard - http://localhost:5173/driver
- **Window 2**: Customer Dashboard - http://localhost:5173/customer

#### 2. Login as Driver
1. In Window 1, login with any email (e.g., `driver@test.com`)
2. Select "Driver" role
3. Navigate to "My Deliveries" tab
4. You should see sample deliveries with different statuses

#### 3. Login as Customer  
1. In Window 2, login with customer email that matches a delivery
2. Select "Customer" role
3. Navigate to "Live Tracking" tab
4. You should see active deliveries on the map

#### 4. Test Live Tracking Flow
1. **In Driver Dashboard**:
   - Find a delivery with "Accepted" status
   - Click "Start Journey" button
   - Status should change to "Started"
   - Check browser console for location tracking logs

2. **In Customer Dashboard**:
   - Refresh or check "Live Tracking" tab
   - Should see delivery status updated to "Started"
   - Map should show driver location (if GPS permission granted)
   - Look for "Live tracking active" indicator

#### 5. Test Status Progression
Continue in Driver Dashboard:
1. Click "Mark In Transit" → Status: "In Transit"
2. Click "Mark Arrived" → Status: "Arrived"  
3. Click "Complete Delivery" → Status: "Delivered"

Each status change should be reflected in real-time on the Customer Dashboard.

### Expected Behavior

#### ✅ When Driver Starts Delivery:
- Driver location tracking begins
- Socket.IO emits location updates
- Customer can see live location on map
- Status updates in real-time

#### ✅ Real-Time Features:
- GPS location tracking (with fallback to NYC coordinates)
- Socket.IO communication between driver and customer
- Live map updates
- Status change notifications
- Delivery progress tracking

#### ✅ Map Integration:
- **Driver Dashboard**: Shows own location and delivery routes
- **Customer Dashboard**: Shows driver location for their deliveries
- **Admin Dashboard**: Shows all drivers and deliveries

### Troubleshooting

#### No Live Tracking?
1. Check browser console for errors
2. Verify Socket.IO connection in Network tab
3. Allow location permissions when prompted
4. Check backend logs for socket events

#### Location Not Updating?
1. GPS permission might be denied
2. Fallback coordinates (NYC) should still work
3. Check console for geolocation errors

#### Status Not Syncing?
1. Verify backend server is running
2. Check MongoDB connection
3. Look for socket connection errors

### Console Logs to Look For

#### Driver Side:
```
Location updated: {lat: 40.7128, lng: -74.0060}
Started delivery 1 - Live tracking activated
Emitted delivery location update for delivery 1
```

#### Customer Side:
```
Live location update for customer delivery 1: {lat: 40.7128, lng: -74.0060}
Delivery 1 status changed to started
```

#### Backend:
```
Driver 1 connected
Live location update for delivery 1: {lat: 40.7128, lng: -74.0060}
Active driver 1 location broadcasted to 1 deliveries
```

### Success Criteria

✅ **Driver can start delivery and see live tracking active**
✅ **Customer receives real-time location updates**  
✅ **Map shows live driver location**
✅ **Status changes propagate in real-time**
✅ **Socket.IO connection established successfully**
✅ **GPS tracking works (or fallback coordinates used)**

The system now provides complete real-time tracking from driver start to delivery completion!
