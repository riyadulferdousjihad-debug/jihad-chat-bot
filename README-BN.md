# JIHAD CHAT BOT PERSONAL ASSISTANT

Gemini API-ভিত্তিক ব্যক্তিগত AI ওয়েব অ্যাপ। Capacitor দিয়ে একই ওয়েব প্রজেক্ট Android অ্যাপে প্যাকেজ করা যাবে।

## কী আছে
- বাংলা ও ইংরেজিতে Gemini chat
- কথোপকথনের ইতিহাস (এই ব্রাউজারের localStorage-এ)
- ছবি ও PDF বিশ্লেষণ; TXT/MD/CSV/JSON টেক্সট পড়া
- Google Search grounding (চ্যাট বক্সের নিচে Internet Search চালু করলে)
- ব্রাউজার Speech Recognition দিয়ে ভয়েস ইনপুট
- ডাবল-ক্লিক/ডাবল-ট্যাপ assistant উত্তরে text-to-speech
- Private password gate, API key server-side, rate limit
- Responsive web UI এবং Capacitor Android project setup

## ১. প্রয়োজন
- Node.js 22 LTS বা পরবর্তী সমর্থিত সংস্করণ
- Gemini API key: https://aistudio.google.com/apikey
- Android APK বানাতে Android Studio + Android SDK

## ২. লোকাল কম্পিউটারে চালু করা
এই ফোল্ডারে Terminal/CMD খুলুন:

```bash
npm install
```

`.env.example` কপি করে `.env` নামে রাখুন। `.env`-এ বসান:

```env
GEMINI_API_KEY=আপনার_GEMINI_API_KEY
APP_PASSWORD=আপনার_দীর্ঘ_ব্যক্তিগত_পাসওয়ার্ড
GEMINI_MODEL=gemini-3.8-flash
PORT=3000
```

তারপর:

```bash
npm start
```

ব্রাউজারে খুলুন: http://localhost:3000

**API Key কখনো public HTML, GitHub repository বা APK-তে দেবেন না। `.env` ফাইল GitHub-এ আপলোড করবেন না।**

## ৩. অনলাইনে প্রকাশ
এই অ্যাপটি শুধু GitHub Pages-এ চালানো যাবে না, কারণ Gemini API কল করার জন্য Node.js backend দরকার।

Render / Railway / অন্য Node.js hosting-এ পুরো project deploy করুন:
1. GitHub-এ project upload করুন; `.env` যেন বাদ থাকে।
2. Hosting-এ Node web service তৈরি করুন।
3. Build command: `npm install`
4. Start command: `npm start`
5. Environment Variables-এ `GEMINI_API_KEY`, `APP_PASSWORD`, `GEMINI_MODEL` এবং `PORT` যোগ করুন (PORT সাধারণত hosting নিজে দেয়)।
6. HTTPS domain চালু হলে ওয়েবসাইটে প্রবেশ করুন।

## ৪. Android অ্যাপ তৈরি
প্রথমে ওয়েব backend অনলাইনে deploy করুন এবং HTTPS URL নিন। তারপর Capacitor Android project তৈরি করুন:

```bash
npm install
npx cap add android
```

Android app-এ অনলাইন backend ব্যবহার করাতে `capacitor.config.json`-এ `server.url` যোগ করা যায় (নিজের HTTPS domain বসান):

```json
{
  "appId": "com.jihad.personalassistant",
  "appName": "JIHAD CHAT BOT",
  "webDir": "public",
  "server": {
    "url": "https://YOUR-BACKEND-DOMAIN",
    "cleartext": false,
    "androidScheme": "https"
  }
}
```

তারপর:

```bash
npx cap sync android
npx cap open android
```

Android Studio থেকে Build > Generate Signed Bundle / APK ব্যবহার করে APK তৈরি করুন।

**নোট:** `server.url` হলো দ্রুত remote-web wrapper পদ্ধতি। Production-এ নিজের app bundle embed করে API-র জন্য remote backend ব্যবহার করাও ভালো। Microphone/voice features Android WebView-এ permission চাইতে পারে; native permission handling লাগতে পারে।

## ৫. গুরুত্বপূর্ণ সীমাবদ্ধতা ও নিরাপত্তা
- Starter-এ chat history এই ডিভাইস/ব্রাউজারের localStorage-এ থাকে; অন্য ডিভাইসে sync হয় না।
- App password এখানে sessionStorage-এ রাখা হয়; logout বা tab বন্ধ হলে session শেষ হয়। Production-এ user authentication, HTTPS, database, CSRF/origin policy ও per-user rate limiting যোগ করুন।
- বর্তমান upload limit 20MB প্রতি ফাইল, সর্বোচ্চ 4টি ফাইল। PDF inline input-এ Gemini-এর সীমা 50MB; এই অ্যাপে আরও কম নিরাপদ সীমা রাখা হয়েছে।
- PDF ও image Gemini-তে পাঠানো হয়। ব্যক্তিগত/গোপন নথি আপলোড করার আগে Google API data policies ও account settings যাচাই করুন।
- Browser speech recognition-এর availability ও বাংলা ভাষা সমর্থন browser/device অনুযায়ী বদলাতে পারে।
- Google Search grounding এবং Gemini usage-এ আপনার API plan অনুযায়ী খরচ/limits থাকতে পারে।
- Model ID পরিবর্তন হলে `.env`-এর `GEMINI_MODEL`-এ AI Studio-তে উপলব্ধ model দিন।

## ৬. সাধারণ সমস্যা
- `Gemini API Key যাচাই করুন`: key ঠিক আছে কি না, API access ও billing/quota দেখুন।
- `APP_PASSWORD সেট করা হয়নি`: hosting environment-এ APP_PASSWORD যোগ করুন।
- CORS: `ALLOWED_ORIGIN`-এ আপনার app domain দিন।
- Android mic: HTTPS ব্যবহার করুন এবং Android Studio-তে microphone permission configure করুন।

## Official docs
- Gemini JavaScript SDK: https://googleapis.github.io/js-genai/
- Gemini Interactions API: https://ai.google.dev/gemini-api/docs/interactions-overview
- File input: https://ai.google.dev/gemini-api/docs/file-input-methods
- Google Search grounding: https://ai.google.dev/gemini-api/docs/google-search
- Capacitor Android: https://capacitorjs.com/docs/android
