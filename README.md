# Fleet Management System

A modern, responsive fleet management system built with React, TypeScript, Vite, TailwindCSS, and Zustand featuring **real-time GPS tracking**, **live delivery status updates**, and **comprehensive fleet oversight**.

## ✨ Key Features

- **🚀 Real-time GPS Tracking**: Live location tracking of vehicles and drivers with Socket.IO
- **📱 Enhanced Delivery Workflow**: Complete status flow (Pending → Accepted → Started → In Transit → Arrived → Delivered)
- **💾 Data Persistence**: Proper data storage that persists between app restarts (FIXED)
- **🗺️ Live Map Integration**: Real-time updates with interactive maps and route visualization
- **👥 Role-based Authentication**: Support for Admin, Driver, and Customer roles
- **📱 Responsive Design**: Mobile-first design that works on all devices
- **🎨 Modern UI**: Clean and intuitive interface using TailwindCSS
- **🔄 State Management**: Global state management with Zustand and persistence
- **🛣️ Routing**: Client-side routing with React Router DOM
- **📘 TypeScript**: Full TypeScript support for better development experience
- **Advanced Admin Dashboard**: Comprehensive management system with tabs for:
  - **Vehicle Management**: Add, edit, delete vehicles with capacity and status tracking
  - **Driver Management**: Manage drivers with ratings, contact info, and vehicle assignments
  - **Delivery Management**: Create and track deliveries with customer details and scheduling
- **Interactive Maps**: React Leaflet integration for route visualization
- **Form Validation**: Robust form validation using React Hook Form and Zod
- **Real-time Updates**: Live status updates and filtering across all management sections

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: Zustand with persistence
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Maps**: React Leaflet with OpenStreetMap
- **Form Handling**: React Hook Form
- **Validation**: Zod schema validation
- **Real-time**: Socket.IO Client

### Backend
- **Runtime**: Node.js with Express and TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.IO for live tracking
- **Security**: Helmet, CORS, Rate limiting
- **Authentication**: JWT tokens

## 🔧 Recent Fixes & Improvements

### ✅ Fixed Data Persistence Issues
- **Problem**: Vehicles and drivers disappeared when the app was refreshed
- **Solution**: Updated Zustand store configuration to properly handle persistence
- **Result**: All data now persists between app restarts

### ✅ Enhanced Live Tracking System  
- **Problem**: Map integration wasn't working with real GPS coordinates
- **Solution**: Implemented proper geolocation API with fallback coordinates
- **Result**: Real-time GPS tracking with improved error handling

### ✅ Complete Delivery Status Flow
- **Problem**: Missing delivery status transitions (only had pending → delivered)
- **Solution**: Added complete workflow: Pending → Accepted → Started → In Transit → Arrived → Delivered
- **Result**: Full delivery lifecycle management with proper status buttons

### ✅ Backend Server Implementation
- **Problem**: No actual backend server existed
- **Solution**: Created complete Express.js server with Socket.IO and MongoDB integration
- **Result**: Real-time communication and proper data persistence

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Installation

1. **Install Frontend Dependencies**:
   ```bash
   npm install
   ```

2. **Install Backend Dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

4. **Start Backend Server** (Terminal 1):
   ```bash
   cd backend
   npm run dev
   ```
   Backend will run on `http://localhost:3001`

5. **Start Frontend Development Server** (Terminal 2):
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

6. **Access the Application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Socket.IO: ws://localhost:3001

### Build for Production

```bash
npm run build
```

### Development Notes

- **TypeScript Configuration**: Properly configured for React JSX support
- **TailwindCSS**: Updated to use the latest PostCSS plugin
- **Real-time Features**: Socket.io client ready for backend integration
- **Maps**: React Leaflet integration with OpenStreetMap
- **Form Validation**: Zod schema validation with React Hook Form

## Usage

### Login

The application starts with a login page where users can:
- Enter their email and password
- Select their role (Admin, Driver, or Customer)
- For demo purposes, any email/password combination will work

### Dashboards

#### Admin Dashboard
- **Overview Tab**: Fleet statistics, recent activities, and status monitoring
- **Vehicle Management**: 
  - Add/edit/delete vehicles with validation
  - Track vehicle number, type, capacity, and status
  - Search and filter functionality
- **Driver Management**:
  - Manage driver profiles with contact information
  - Track ratings, total trips, and license details
  - Vehicle assignment tracking
- **Delivery Management**:
  - Create and manage deliveries with customer details
  - Interactive map with route visualization using React Leaflet
  - Priority and status tracking
  - Pickup and dropoff location management
  - Real-time delivery status updates

#### Driver Dashboard
- Today's trip schedule
- Trip status tracking
- Performance metrics
- Quick actions for trip management

#### Customer Dashboard
- Booking history
- Quick booking options
- Payment method management
- Trip ratings and reviews

### Navigation

- **Navbar**: Fixed top navigation with user info and logout
- **Sidebar**: Role-based navigation menu (hidden on mobile, accessible via hamburger menu)
- **Responsive**: Automatically adapts to different screen sizes

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main layout wrapper
│   ├── Navbar.tsx      # Top navigation bar
│   ├── Sidebar.tsx     # Side navigation menu
│   └── LoginForm.tsx   # Login form component
├── pages/              # Page components
│   ├── AdminDashboard.tsx
│   ├── DriverDashboard.tsx
│   └── CustomerDashboard.tsx
├── store/              # State management
│   └── authStore.ts    # Authentication store
├── App.tsx             # Main app component with routing
├── main.tsx           # Application entry point
└── style.css          # Global styles and TailwindCSS imports
```

## Features in Detail

### Authentication
- Mock authentication system (replace with real API in production)
- Role-based access control
- Persistent login state
- Automatic redirects based on user role

### Responsive Design
- Mobile-first approach
- Collapsible sidebar on mobile devices
- Responsive grid layouts
- Touch-friendly interface

### State Management
- Centralized authentication state
- Easy to extend for additional global state
- TypeScript support for type safety

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Customization

1. **Styling**: Modify `tailwind.config.js` for custom theme
2. **Authentication**: Replace mock auth in `authStore.ts` with real API calls
3. **Routes**: Add new routes in `App.tsx`
4. **Components**: Add new components in the `components/` directory

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is for demonstration purposes.
