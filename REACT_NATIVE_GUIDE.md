# React Native Implementation Guide

This guide explains how to build the React Native host app that loads the React Web Blockly engine.

## 1. Project Structure (Hybrid)

You will have two repositories (or a monorepo):

1.  **Web Project** (Current): Serves the Scratch/Blockly engine.
2.  **Mobile Project** (New): Your main React Native app.

## 2. React Native Setup

Install required dependencies in your Expo/React Native project:

```bash
npx create-expo-app ct-mobile-app
cd ct-mobile-app
npx expo install react-native-webview @supabase/supabase-js @react-native-async-storage/async-storage
```

## 3. WebView Integration Code

Create a file `src/screens/ScratchScreen.tsx` in your React Native project:

```tsx
import React, { useRef, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

// URL of your deployed Web App
// Local dev (Android): http://10.0.2.2:5173/embed/chapter7
// Local dev (iOS): http://localhost:5173/embed/chapter7
// Production: https://your-vercel-app.com/embed/chapter7
const WEB_APP_URL = 'http://10.0.2.2:5173/embed/chapter7'; 

export default function ScratchScreen() {
  const webViewRef = useRef(null);

  // Handle messages from Web App
  const onMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'ACTIVITY_COMPLETE':
          console.log('✅ Activity Complete:', message.data);
          // TODO: Update Supabase or Local State here
          // handleLevelComplete(message.data.score);
          break;
          
        case 'LOG_DEBUG':
          console.log('web_log:', message.data.message);
          break;
      }
    } catch (e) {
      console.error('Failed to parse bridge message', e);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_APP_URL }}
        onMessage={onMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => <ActivityIndicator size="large" color="#0000ff" />}
      />
    </View>
  );
}
```

## 4. Chapter 2 (Bead Pattern) in React Native

Since drag-and-drop is native-specific, use these libraries:
- `react-native-gesture-handler` -> For smooth gestures
- `react-native-reanimated` -> For fluid animations
- `react-native-drax` (Simpler) or `@shopify/react-native-skia` (Advanced canvas)

Recommended: **react-native-drax** for simpler bead dropping.

## 5. Sharing Supabase Auth

1.  **Login in React Native**: Use Supabase JS client.
2.  **Pass Token to WebView**:
    
    When loading the WebView, pass the access token in the header or via URL query parameter.

```tsx
// React Native
<WebView 
  source={{ 
    uri: WEB_APP_URL + '?token=' + session.access_token,
  }}
/>
```

Then strictly speaking you don't need to re-login in web if you just pass the User ID via query param, but for security, passing the token is better.

## 6. Development Workflow

1.  Run Web App: `npm run dev` (Ensure it runs on port 5173).
2.  Run Android Emulator.
3.  Open React Native App.
4.  Navigate to Scratch Screen -> It loads the local web view.

This architecture gives you the **best of both worlds**:
- Native performance for navigation & simple games.
- Full web power for Blockly/Scratch.
