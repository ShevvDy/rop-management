# Быстрый старт (дев режим)

## Требования
- Node.js 22+
- npm / yarn / pnpm

## Клиент

```bash
cd client
npm install       # установить зависимости
npm run dev       # запустить на http://localhost:5173
```

> Авторизация временно отключена (`ProtectedRoute` всегда пропускает).
> Чтобы включить — раскомментировать строку в `src/components/ProtectedRoute.tsx`:
> ```tsx
> return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
> ```

## Сборка для продакшна

```bash
npm run build     # собрать в dist/
npm run preview   # локально посмотреть сборку
```

---

# Важно: что нужно сделать для работы авторизации

## 1. Зарегистрировать приложение у OAuth-провайдеров

### Google
- Перейти: https://console.cloud.google.com → APIs & Services → Credentials → Create OAuth 2.0 Client ID
- Тип: Web application
- Добавить в Authorized redirect URIs:
  - `http://localhost:5173/auth/callback` (dev)
  - `https://your-domain.com/auth/callback` (prod)
- Скопировать **Client ID**

### Яндекс
- Перейти: https://oauth.yandex.ru/client/new
- Платформы: Веб-сервисы
- Callback URI: `http://localhost:5173/auth/callback`
- Права доступа: login:email, login:info, login:avatar
- Скопировать **Client ID**

### ИТМО ID
- Обратиться в IT-отдел ИТМО с запросом на регистрацию OAuth-клиента
- Провайдер: Keycloak (`https://id.itmo.ru/auth/realms/itmo/...`)
- Указать redirect_uri: `http://localhost:5173/auth/callback`
- Получить **Client ID**

---

## 2. Создать файл `client/.env`

```
VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
VITE_YANDEX_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_ITMO_CLIENT_ID=your-itmo-client-id
```

> Файл `.env` не коммитить в git — добавить в `.gitignore`

---

## 3. Реализовать эндпоинт на бэкенде

```
POST /api/auth/callback
```

**Тело запроса:**
```json
{
  "code": "string",
  "provider": "google" | "yandex" | "itmo",
  "redirect_uri": "string"
}
```

**Ответ:**
```json
{
  "token": "jwt-string",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "avatar": "string | null",
    "role": "guest",
    "provider": "google" | "yandex" | "itmo"
  }
}
```

**Логика бэкенда:**
1. Обменять `code` на `access_token` у провайдера
2. Запросить профиль пользователя через userinfo endpoint провайдера
3. Найти пользователя в БД по email, или создать нового с `role = "guest"`
4. Выдать JWT-токен (хранить в `localStorage` на клиенте)

---

## 4. Добавить redirect_uri в whitelist у каждого провайдера

Убедиться, что `http://localhost:5173/auth/callback` (dev) и продовый URL прописаны в настройках каждого приложения у провайдера. Без этого OAuth вернёт ошибку `redirect_uri_mismatch`.

---

## 5. Настроить CORS на бэкенде

Разрешить запросы с `http://localhost:5173` (dev) и с продового домена клиента.
