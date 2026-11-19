# «АЛЛО, РОУД!» — ASCII CHAOS (Telegram Bot)

Юмористическая ретро-игра для двух друзей прямо внутри **Telegram**. Когда один друг не поднимает телефон, второй нажимает кнопку `🥊 ОН НЕ ПОДНЯЛ ТЕЛЕФОН` — бот отправляет одно моноширинное сообщение `<pre>` и покадрово анимирует через `editMessageText` случайную абсурдную ASCII-сцену (30+ сценариев: от нашествия скакунов и динозавра до похищения НЛО и падающего шкафа), завершает всё экраном `F A T A L I T Y !`, удаляет временную анимацию и оставляет в чате позорную карточку с актуальным счётом!

> Без сайта, PWA, GIF, видео, картинок и Mini App — вся игра работает исключительно на чистом тексте и Inline-кнопках обычного Telegram.

---

## 📁 Структура проекта

- `api/telegram/webhook.ts` — Vercel Serverless Function для входящих обновлений Telegram (`maxDuration: 60s`).
- `api/telegram/setup.ts` — автоматическая регистрация Webhook и списка команд бота (`setWebhook` + `setMyCommands`).
- `api/telegram/cleanup.ts` — резервная очистка зависших временных сообщений (подключена к Vercel Cron).
- `api/health.ts` — проверка статуса бота, базы данных и каталога ASCII-сцен.
- `lib/bot/asciiUtils.ts` — движок выравнивания (`32×11` символов для смартфонов), HTML `<pre>`-экранирования и автоматического зеркалирования направления удара.
- `lib/bot/asciiScenesPart1.ts` — 15 базовых сцен хаоса (классическая драка, табун лошадей, динозавр, поезд, ниндзя, армия мини-бойцов, метеорит, НЛО, сумо, цунами, маг-лягушка, гигантская курица, красная кнопка, боксёрский ринг, люк в полу).
- `lib/bot/asciiScenesPart2.ts` — 15 дополнительных абсурдных сцен (падающий шкаф, восстание роботов, снежный ком, щупальца, вулкан, гигантский паук, падение со скалы, пиратская пушка, привидение, ракета, рояль, кот с лазерами, перекати-поле, смертельное диско, безумный пылесос).
- `lib/bot/asciiScenes.ts` — менеджер сцен (`pickRandomAsciiScene` без повтора подряд + финальная сцена `GAME OVER`).
- `lib/bot/botEngine.ts` — логика команд (`/start`, `/miss`, `/score`, `/history`, `/settings`, `/join`, `/bind`, `/menu`), Inline-кнопок и покадрового ASCII-проигрывателя с обработкой `retry_after` и `"message is not modified"`.
- `lib/bot/botStore.ts` — хранение данных в **Supabase PostgreSQL** (с историей `recent_scenes` на пару и локальным fallback для тестов).
- `lib/bot/messages.ts` — форматирование сообщений и клавиатур Telegram.
- `lib/bot/telegramApi.ts` — обёртка над Telegram Bot API (`sendMessage`, `editMessageText`, `deleteMessage` с поддержкой `parse_mode: 'HTML'` и `429 retry_after`).
- `supabase/schema.sql` и `supabase/migrations/004_ascii_chaos.sql` — SQL-схема и триггеры Supabase PostgreSQL.
- `server.ts` — локальный Express-сервер для разработки и тестирования.

---

## 1. Создание бота через @BotFather

1. Откройте в Telegram официального бота **[@BotFather](https://t.me/BotFather)**.
2. Отправьте команду `/newbot`.
3. Введите отображаемое имя бота, например: `АЛЛО, РОУД!`.
4. Введите username бота (должен заканчиваться на `bot`), например: `AlloRoadFatalityBot`.
5. Скопируйте выданный **Bot Token** (`123456789:ABC...`) — **никогда не публикуйте его в коде или GitHub**, сохраните в `TELEGRAM_BOT_TOKEN`.
6. *(Для игры в общем групповом чате)* Отправьте в `@BotFather`:
   - `/mybots` → выберите своего бота → **Bot Settings** → **Group Privacy** → **Turn off**.
   - Выдайте боту право **удаления сообщений** в вашей общей группе, чтобы он мог автоматически удалять временную ASCII-анимацию после финала (даже без этого права бот корректно продолжит игру и отправит итоговое сообщение).

---

## 2. Настройка базы данных Supabase PostgreSQL

1. Создайте проект на [supabase.com](https://supabase.com).
2. Перейдите в **SQL Editor → New Query**.
3. Выполните `supabase/schema.sql` (или примените `supabase/migrations/004_ascii_chaos.sql`, если база уже была развёрнута ранее).
4. В **Project Settings → API** скопируйте `Project URL` → `SUPABASE_URL` и `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY`.

---

## 3. Деплой через GitHub и Vercel + Настройка Webhook

1. Залейте проект в репозиторий на GitHub (убедитесь, что `.env` / `.env.local` не закоммичены).
2. Импортируйте репозиторий в [vercel.com](https://vercel.com).
3. В **Project Settings → Environment Variables** добавьте переменные (см. `.env.example`):
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_BOT_USERNAME`
   - `TELEGRAM_WEBHOOK_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `APP_URL` — ваш домен на Vercel, например `https://allo-road-bot.vercel.app`
4. Сделайте **Deploy**.
5. Зарегистрируйте Webhook и меню команд:

```bash
curl -X POST "https://your-project.vercel.app/api/telegram/setup" \
  -H "x-setup-secret: YOUR_TELEGRAM_WEBHOOK_SECRET"
```

Проверить статус бота и список 30+ сцен: `https://your-project.vercel.app/api/health`.

---

## 4. Как добавить новую ASCII-сцену

1. Откройте `lib/bot/asciiScenesPart2.ts`.
2. Добавьте новый объект `AsciiSceneDefinition` (7–11 сюжетных кадров через `compileDirectionalScene`, 32 символа в ширину, до 11 строк в высоту, финальный кадр `F A T A L I T Y !` добавляется автоматически).
3. Сцена сразу появится в ротации `pickRandomAsciiScene` и в `/api/health`.
