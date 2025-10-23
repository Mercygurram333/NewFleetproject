# 🚀 Fleet Management Application - Quick Start Guide

## ✅ Current Status

**Frontend Server**: ✅ ALREADY RUNNING on http://localhost:5177

**Backend Server**: ⚠️ NEEDS TO BE STARTED on port 3001

---

## 🎯 START BACKEND SERVER NOW

### **Method 1: Using File Explorer (EASIEST)**

1. **Open File Explorer**
2. **Navigate to**: `C:\Users\Mercy\OneDrive\Documents\Desktop\New-fleet-project`
3. **Double-click**: `START_BACKEND.bat`
4. **A command window will open** - Keep it open!
5. **Look for**: "Authentication server running on port 3001"

---

### **Method 2: Using Command Prompt**

1. **Press**: `Win + R`
2. **Type**: `cmd` and press Enter
3. **Copy and paste this command**:
```
cd C:\Users\Mercy\OneDrive\Documents\Desktop\New-fleet-project\backend && node simple-auth-server.js
```
4. **Press Enter**
5. **Keep the window open!**

---

### **Method 3: Using PowerShell**

1. **Press**: `Win + X`
2. **Select**: "Windows PowerShell"
3. **Copy and paste these commands one by one**:
```powershell
cd "C:\Users\Mercy\OneDrive\Documents\Desktop\New-fleet-project\backend"
node simple-auth-server.js
```
4. **Keep the window open!**

---

## ✅ Verify Backend is Running

### **You should see this output:**
```
✓ Authentication server running on port 3001
✓ Socket.IO server initialized
✓ CORS enabled for frontend
✓ In-memory database initialized
```

### **Test in Browser:**
Open: http://localhost:3001/api/health

Should show:
```json
{"status":"ok","message":"Server is running"}
```

---

## 🌐 Access the Application

Once backend is running:

**Open Browser**: http://localhost:5177

**Login Credentials:**
- **Admin**: admin@fleet.com / admin123
- **Driver**: driver@fleet.com / driver123
- **Customer**: customer@fleet.com / customer123

---

## 🎉 Success Checklist

- [ ] Backend command window is open
- [ ] Backend shows "running on port 3001"
- [ ] Frontend is accessible at http://localhost:5177
- [ ] No "Unable to connect" error on login page
- [ ] Can login successfully
- [ ] Dashboard loads correctly

---

## 🐛 Troubleshooting

### **Error: "Port 3001 is already in use"**
**Solution**: Close any existing backend windows and try again

### **Error: "Cannot find module"**
**Solution**: Run this first:
```
cd C:\Users\Mercy\OneDrive\Documents\Desktop\New-fleet-project\backend
npm install
```

### **Still showing connection error?**
1. Close backend window
2. Wait 5 seconds
3. Start backend again
4. Refresh browser (F5)

---

## 💡 Important Notes

1. **Keep backend window open** while using the app
2. **Don't close the window** or the app will stop working
3. **Frontend is already running** - no need to start it again
4. **Both servers must run** for the app to work

---

**Ready? Start the backend now using one of the methods above!** 🚀
