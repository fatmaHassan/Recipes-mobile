# React Native iOS with Expo - Tutorial Guide

## 📚 What You Need to Know

### What is React Native?
React Native lets you build mobile apps (iOS and Android) using JavaScript and React. You write code once and it works on both platforms!

### What is Expo?
Expo is a framework that makes React Native development easier by providing:
- **File-based routing** (like Next.js) - your `app/` folder structure becomes your navigation
- Pre-built native modules (camera, location, etc.)
- Easy testing with Expo Go app
- Simple deployment process

## 🎯 Key Concepts in Your Project

### 1. File-Based Routing (Expo Router)
Your `app/` folder structure automatically creates routes:

```
app/
  _layout.tsx          → Root layout (wraps everything)
  (tabs)/              → Tab group (doesn't affect URL)
    _layout.tsx        → Tab navigator layout
    index.tsx          → Home tab (/)
    explore.tsx        → Explore tab (/explore)
    profile.tsx        → Profile tab (/profile)
  login.tsx            → Login screen (/login)
  register.tsx         → Register screen (/register)
```

**Key Points:**
- `_layout.tsx` files define navigation structure (Stack, Tabs, etc.)
- `(tabs)` is a route group - parentheses mean it doesn't appear in the URL
- `index.tsx` is the default route for that folder

### 2. Navigation
Your app uses:
- **Stack Navigation** - for login/register screens (slides in/out)
- **Tab Navigation** - for main app screens (bottom tabs)

### 3. Running on iOS

#### Option 1: iOS Simulator (Mac only)
```bash
npm run ios
# or
npx expo start --ios
```
This opens the iOS Simulator automatically.

#### Option 2: Physical iPhone
1. Install **Expo Go** from the App Store
2. Run: `npm start` or `npx expo start`
3. Scan the QR code with your iPhone camera
4. Opens in Expo Go app

#### Option 3: Development Build
For testing native features, create a development build:
```bash
npx expo run:ios
```

## 📖 Recommended Tutorials

### Official Expo Tutorial (Best Starting Point)
**Link:** https://docs.expo.dev/tutorial/introduction
- **Duration:** ~2 hours
- **What you'll learn:**
  - Creating screens with Expo Router
  - Building tab navigation
  - Using modals and gestures
  - Platform-specific code
  - Styling with React Native

### Expo Router Documentation
**Link:** https://docs.expo.dev/router/introduction
- Complete guide to file-based routing
- Navigation patterns
- Deep linking
- Authentication flows

### React Native Basics
**Link:** https://reactnative.dev/docs/getting-started
- Core React Native concepts
- Components and APIs
- Styling guide
- Platform differences

## 🎓 Step-by-Step Learning Path

### Week 1: Basics
1. ✅ Complete Expo's official tutorial
2. ✅ Understand your project structure
3. ✅ Learn React Native components (View, Text, ScrollView, etc.)

### Week 2: Navigation
1. ✅ Master Expo Router file structure
2. ✅ Learn Stack vs Tab navigation
3. ✅ Implement navigation in your app

### Week 3: Styling & Layout
1. ✅ Learn Flexbox (React Native uses Flexbox by default)
2. ✅ Understand StyleSheet API
3. ✅ Practice responsive layouts

### Week 4: Advanced Features
1. ✅ API integration (you already have `services/api.ts`)
2. ✅ State management (Context API - you have `AuthContext`)
3. ✅ Platform-specific code (iOS vs Android)

## 🔧 Common Commands

```bash
# Start development server
npm start

# Start iOS simulator
npm run ios

# Start Android emulator
npm run android

# Clear cache and restart
npx expo start --clear

# Check for updates
npx expo install --check

# Build for iOS (requires Apple Developer account)
npx expo build:ios
```

## 📱 Running the App - Complete Guide

### Prerequisites

Before running the app, make sure:
1. **Laravel backend is running** (see below)
2. **Your iPhone and Mac are on the same WiFi network** (for physical device)

---

### Step 1: Start Laravel Backend

Open a terminal and navigate to your Laravel project:

```bash
cd /path/to/your/laravel/project
php artisan serve --host=0.0.0.0 --port=8000
```

> **Important:** The `--host=0.0.0.0` flag is required for your phone to connect!

Keep this terminal open.

---

### Step 2A: Run on Physical iPhone

1. **Open a NEW terminal** (keep Laravel running)

2. **Navigate to the Expo project:**
   ```bash
   cd /Users/fatmahassan/Sites/Reciepes-Mobile
   ```

3. **Start Expo in LAN mode:**
   ```bash
   npx expo start --lan --clear
   ```

4. **Wait for the QR code** to appear in terminal

5. **On your iPhone:**
   - Open the **Camera** app
   - Point at the QR code
   - Tap the notification banner to open in Expo Go

6. **App loads!** You should see your app running.

---

### Step 2B: Run on iOS Simulator

1. **Open a NEW terminal** (keep Laravel running)

2. **Navigate to the Expo project:**
   ```bash
   cd /Users/fatmahassan/Sites/Reciepes-Mobile
   ```

3. **Start Expo:**
   ```bash
   npx expo start --clear
   ```

4. **Wait for the QR code** to appear

5. **Press `i`** to open in iOS Simulator

6. **Simulator opens** and loads your app

---

### Closing Everything Gracefully

#### Close Expo:
- In the Expo terminal, press `Ctrl + C`

#### Close Laravel:
- In the Laravel terminal, press `Ctrl + C`

#### Close iOS Simulator (if used):
- Press `Cmd + Q` in the Simulator
- Or: Menu → Simulator → Quit Simulator

#### Kill stuck processes (if needed):
```bash
killall node
killall Simulator
```

---

### Quick Reference Table

| Task | Command |
|------|---------|
| Start Laravel (network) | `php artisan serve --host=0.0.0.0 --port=8000` |
| Start Expo (physical device) | `npx expo start --lan --clear` |
| Start Expo (simulator) | `npx expo start --clear` |
| Open iOS Simulator | Press `i` in Expo terminal |
| Reload app | Press `r` in Expo terminal |
| Stop Expo | `Ctrl + C` |
| Stop Laravel | `Ctrl + C` |
| Kill all Node processes | `killall node` |

---

### Common Scenarios

#### "Network error" on phone
- Make sure Laravel is running with `--host=0.0.0.0`
- Check both devices are on same WiFi
- Verify your IP in `constants/api.ts` matches your Mac's IP

#### Find your Mac's IP address:
```bash
ipconfig getifaddr en0
```

#### "Cannot connect" in Simulator
- Make sure Expo server is fully started (QR code visible)
- Try: `killall node && killall Simulator`
- Restart with: `npx expo start --clear`

#### App stuck or not updating
- Press `r` in Expo terminal to reload
- Or shake your phone → tap "Reload"

---

## 🐛 Troubleshooting iOS Issues

### Simulator won't open?
- Make sure Xcode is installed: `xcode-select --install`
- Check if simulator is available: `xcrun simctl list devices`

### App won't load on iPhone?
- Make sure iPhone and computer are on same WiFi
- Try tunnel mode: `npx expo start --tunnel`
- Check firewall settings

### Build errors?
- Clear cache: `npx expo start --clear`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

## 📱 Understanding Your Current Project

### Authentication Flow
Your app has:
- `AuthContext` - manages login state
- `login.tsx` and `register.tsx` - auth screens
- Protected routes - redirects to login if not authenticated

### Tab Navigation
- `(tabs)/index.tsx` - Home screen
- `(tabs)/explore.tsx` - Explore screen  
- `(tabs)/profile.tsx` - Profile screen

### API Integration
- `services/api.ts` - API client setup
- `services/auth.ts` - Authentication service
- `constants/api.ts` - API configuration

## 🎥 Video Tutorials (YouTube)

1. **Expo Official Channel**
   - Search: "Expo Router tutorial"

2. **React Native School**
   - Great beginner-friendly content

3. **Programming with Mosh**
   - React Native crash course

## 📚 Additional Resources

- **Expo Documentation:** https://docs.expo.dev
- **React Native Docs:** https://reactnative.dev
- **Expo Discord:** Community support
- **Stack Overflow:** Tag `expo` or `react-native`

## 💡 Quick Tips

1. **Hot Reload** - Changes appear instantly (enabled by default)
2. **Fast Refresh** - Preserves component state during development
3. **Debugging** - Shake device or press `Cmd+D` in simulator to open dev menu
4. **Console Logs** - Use `console.log()` - shows in terminal where you ran `expo start`

## 🚀 Next Steps

1. Start with the official Expo tutorial
2. Experiment with your existing screens
3. Add new features one at a time
4. Test on both iOS simulator and physical device
5. Join the Expo community for help!

---

**Need help with something specific?** Ask about:
- Navigation between screens
- Styling components
- API calls and data fetching
- Authentication flows
- Platform-specific features
