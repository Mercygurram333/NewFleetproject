# 🚀 Fleet Management Application - Startup Guide

## ⚠️ IMPORTANT: Backend Server Must Be Running

The error **"Unable to connect to server. Please check if the backend is running on port 3001"** means the backend server is not started.

---

## 🎯 Quick Start (Easiest Method)

### **Option 1: Start Both Servers Automatically**

**Double-click this file:**
```
START_BOTH_SERVERS.bat
```

This will open **two command windows**:
- ✅ **Backend Server** (Port 3001)
- ✅ **Frontend Server** (Port 5177)

**Keep both windows open!**

---

## 🔧 Manual Start (If Batch File Doesn't Work)

### **Step 1: Start Backend Server**

Open **Command Prompt** or **PowerShell** and run:

```bash
cd "C:\Users\Mercy\OneDrive\Documents\Desktop\New-fleet-project\backend"
node simple-auth-server.js
```

**You should see:**
```
✓ Authentication server running on port 3001
✓ Socket.IO server initialized
✓ CORS enabled for frontend
```

**Keep this window open!**

---

### **Step 2: Start Frontend Server**

Open **another Command Prompt** or **PowerShell** and run:

```bash
cd "C:\Users\Mercy\OneDrive\Documents\Desktop\New-fleet-project"
npm run dev
```

**You should see:**
```
VITE v7.1.11  ready in XXX ms
➜  Local:   http://localhost:5177/
```

**Keep this window open too!**

---

## ✅ Verify Backend is Running

### **Method 1: Check Command Window**
Look for this output in the backend window:
```
✓ Authentication server running on port 3001
```

### **Method 2: Test in Browser**
Open: http://localhost:3001/api/health

You should see:
```json
{"status":"ok","message":"Server is running"}
```

### **Method 3: Check Network Tab**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to login
4. You should see requests to `http://localhost:3001`

---

## 🎯 Application URLs

Once both servers are running:

- **Frontend**: http://localhost:5177
- **Backend API**: http://localhost:3001
- **WebSocket**: ws://localhost:3001

---

## 👤 Test Login Credentials

### **Admin**
- Email: `admin@fleet.com`
- Password: `admin123`

### **Driver**
- Email: `driver@fleet.com`
- Password: `driver123`

### **Customer**
- Email: `customer@fleet.com`
- Password: `customer123`

---

## 🐛 Troubleshooting

### **Error: "Unable to connect to server"**

**Solution:**
1. ✅ Make sure backend server is running
2. ✅ Check backend window shows "running on port 3001"
3. ✅ Test http://localhost:3001/api/health in browser
4. ✅ Restart backend server if needed

### **Error: "Port 3001 is already in use"**

**Solution:**
1. Close any existing backend server windows
2. Or use Task Manager to kill node.exe processes
3. Restart the backend server

### **Error: "Cannot find module"**

**Solution:**
```bash
cd backend
npm install
node simple-auth-server.js
```

---

## 📋 Server Status Checklist

Before using the application, verify:

- [ ] Backend server window is open
- [ ] Backend shows "running on port 3001"
- [ ] Frontend server window is open
- [ ] Frontend shows "Local: http://localhost:5177"
- [ ] Browser can access http://localhost:5177
- [ ] No error message about backend connection

---

## 🎉 Success!

When both servers are running correctly:

✅ **No error messages**
✅ **Login page loads**
✅ **Can login successfully**
✅ **Dashboard displays correctly**
✅ **Profile navigation works**
✅ **All features functional**

---

## 💡 Pro Tips

1. **Keep both terminal windows visible** so you can see any errors
2. **Don't close the terminal windows** while using the app
3. **If you see errors**, check both terminal windows for messages
4. **Restart both servers** if something stops working

---

## 🆘 Still Having Issues?

If the backend still won't start:

1. **Check Node.js is installed**: `node --version`
2. **Check npm is installed**: `npm --version`
3. **Install backend dependencies**: 
   ```bash
   cd backend
   npm install
   ```
4. **Try running directly**:
   ```bash
   node backend/simple-auth-server.js
   ```

---

**Remember: Both servers must be running for the application to work!** 🚀
