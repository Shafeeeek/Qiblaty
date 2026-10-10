# قبلتي — Qiblaty

تطبيق عربي لمواقيت الصلاة واتجاه القبلة ومتابعة العبادات، مبني بـ React وVite.

## التشغيل محلياً

استخدم Node.js 24 (أو `nvm use`)، ثم:

```sh
npm ci
npm run dev
```

لإنشاء نسخة الإنتاج ومعاينتها:

```sh
npm run build
npm run preview
```

## الرفع على Vercel

1. ارفع ملفات المشروع إلى مستودع Git، بما فيها `package.json` و`package-lock.json` و`vercel.json` ومجلدات `src` و`public` و`api` وملف `index.html`.
2. في Vercel اختر **Add New → Project** واستورد المستودع.
3. اجعل **Root Directory** المجلد الذي يحتوي على `package.json` (إذا كان المشروع داخل مجلد فرعي، اختر هذا المجلد).
4. الإعدادات محددة في `vercel.json`: **Framework = Vite**، **Install = npm ci**، **Build = npm run build**، **Output = dist**. إصدار Node.js هو **24.x**.
5. اضغط **Deploy**. لا تحتاج متغيرات بيئة لتشغيل مواقيت الصلاة والقبلة والمتابعة.

لا ترفع `node_modules` أو `.env` أو `dist`؛ Vercel يثبت الحزم ويبني الموقع. التنقل الحالي يستخدم روابط مثل `/#qibla`، لذلك لا يحتاج تحويل كل المسارات إلى `index.html`، ويظل `/api/chat` متاحاً للخادم.

## تفعيل المساعد الذكي (اختياري)

أُضيفت دالة Vercel في `api/chat.js`، تستخدم OpenAI Responses API. في إعدادات المشروع على Vercel أضف إلى **Environment Variables**:

| المتغير | القيمة |
| --- | --- |
| `OPENAI_API_KEY` | مفتاح API لمشروعك على OpenAI |
| `OPENAI_MODEL` | اسم موديل نصي متاح لحسابك ويدعم Responses API |

اختر بيئة **Production** (و**Preview** عند الحاجة)، ثم أعد النشر بعد تعديل المتغيرات. اترك `VITE_API_BASE_URL` فارغاً لاستخدام الدالة الموجودة في نفس المشروع. لا تضع المفتاح في أي متغير يبدأ بـ `VITE_` لأن هذه المتغيرات تصل للمتصفح.

بدون المفتاح والموديل، تعرض صفحة المساعد رسالة تعذر الاتصال، وباقي الموقع يعمل. المساعد يستخدم API منفصلة بفوترة حسب الاستخدام. المسار عام ولا يتضمن تسجيل دخول أو حد طلبات موزعاً؛ عند تفعيله للعامة اضبط حدود الطلبات في Vercel Firewall وفق حجم الاستخدام.

`npm run dev` و`npm run preview` يشغلان الواجهة فقط. لتجربة الدالة محلياً انسخ `.env.example` إلى `.env.local`، وأكمل القيم، ثم استخدم `npx vercel dev` بعد ربط مشروع Vercel. أو استخدم `VITE_API_BASE_URL` مع خادم خارجي يدعم `POST /api/chat` وCORS ويعيد `{ "reply": "..." }`.

## الاختبارات

```sh
npm test
npx playwright install chromium --no-shell
npm run build
npm run test:e2e
```

بعد تثبيت Chromium، يمكن تشغيل الفحص الكامل بـ `npm run check`. اختبارات المساعد تستخدم ردوداً محاكية ولا تستهلك API مدفوعة. اختبارات المتصفح تفحص نسخة الإنتاج.

البيانات الشخصية والإعدادات والحلقات تُحفظ في المتصفح باستخدام `localStorage`؛ لا توجد قاعدة بيانات أو مزامنة بين الأجهزة. الموقع والبوصلة يعتمدان على صلاحيات الجهاز ودعم المتصفح.

## المراجع

- [إعدادات Vercel الرسمية](https://vercel.com/docs/project-configuration/vercel-json)
- [OpenAI Docs: إنشاء الردود النصية](https://developers.openai.com/api/docs/guides/text)
