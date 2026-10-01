# ⚡ GYM PROGRESS PLATFORM

Nowoczesna aplikacja webowa w **Next.js (App Router) + TypeScript + Tailwind CSS** z backendem w chmurze **Supabase (PostgreSQL + RLS + Auth)**, dedykowana do planowania, rejestrowania, analizy oraz **uaktualniania (edycji)** swoich treningów siłowych.

Aplikacja w 100% odzwierciedla design z prototypu `base` (ciemny/jasny motyw, dynamiczne akcenty pomarańczowe i fioletowe, typografia *Barlow Condensed* + *Outfit* + *JetBrains Mono*, animacje i wykresy progresu) oraz została zbudowana w metodyce **mobile-first** z pełną responsywnością na smartfony i komputery PC.

---

## 📱 Responsywność & Mobile-First

- **Na smartfonie (Mobile)**:
  - Dolny pasek nawigacji (**Bottom Navigation Bar**) z ikonami dla szybkiego dostępu kciukiem (`DASHBOARD`, `RUTYNY`, `ĆWICZENIA`, `KALENDARZ`, `PROGRES`).
  - Pływający pasek aktywnego treningu (**Active Workout Banner**) z pulsującym wskaźnikiem na żywo — powrót do logowania serii 1 kliknięciem.
  - Dotykowo zoptymalizowane pola wpisywania ciężaru/powtórzeń (rozmiar min. 44px, zapobieganie niepożądanemu zoomowi iOS).
  - Modalne szuflady (Bottom Sheets) z animacją `slide-up`.
- **Na komputerze (PC / Tablet)**:
  - Górny pasek nawigacji (**Header**) z logo `GP`, zakładkami, statusem połączenia z chmurą Supabase, ustawieniami i wylogowaniem.
  - Wielokolumnowe układy dashboardu (3-kolumnowe kafelki statystyk, szybki start, harmonogram).
  - Dwukolumnowy Routine Builder (lista planów po lewej, szczegółowa tabela ćwiczeń po prawej).
  - Pełnowymiarowy interaktywny wykres progresu **Recharts** z linią rekordu (PR).

---

## 🎯 Główne Funkcjonalności

### 1. 📋 Planowanie Treningu (Routines & Planning)
- **Kreator planów treningowych**: Tworzenie nowych rutyn (np. *Push A*, *Pull A*, *Legs A*, *Góra Siła*).
- **Konfiguracja serii i powtórzeń docelowych**: Określanie liczby serii oraz zakresu powtórzeń dla każdego ćwiczenia.
- **Edycja i aktualizacja planów**: Dodawanie i usuwanie ćwiczeń z istniejących rutyn w dowolnym momencie.
- **Szybki start**: Rozpoczęcie sesji treningowej jednym kliknięciem na podstawie wybranego planu.

#### Widoczność planów treningowych
- **Plany predefiniowane** (wspólne dla wszystkich użytkowników) — każdy je widzi, może z nich startować trening.
  - **Usunięcie = ukrycie tylko dla siebie.** Plan znika z Twojej listy, ale pozostaje widoczny dla pozostałych użytkowników. Ukryte plany można przywrócić w sekcji `UKRYTE PLANY`.
  - **Edycja = prywatna kopia.** Zapisanie zmian tworzy Twój własny plan (oryginał pozostaje nietknięty i dostępny dla innych).
- **Plany własne** — tworzone samodzielnie, widoczne **wyłącznie** dla właściciela. Inni użytkownicy nie mogą ich zobaczyć ani otworzyć.

### 2. ⚡ Zapis Treningu (Workout Logger)
- **Aktywny Trening na Żywo**:
  - Automatyczny stoper czasu trwania sesji (minuty i sekundy).
  - Tabela serii dla każdego ćwiczenia: Ciężar (KG), Powtórzenia, wskaźnik RPE oraz odhaczanie serii (✓).
  - Możliwość dodania kolejnej serii (`+ DODAJ SERIĘ`) lub nowego ćwiczenia w trakcie trwania treningu.
  - Zakończenie sesji i automatyczny zapis do bazy danych Supabase.
- **Zapis Treningu Odbytego (Manual Log)**:
  - Opcja zapisania treningu wykonanego wcześniej bez uruchamiania stopera na żywo.

### 3. 🔄 Uaktualnienie Treningu (Workout Updating & Editing)
- **Pełna edycja każdego zapisanego treningu**:
  - Użytkownik może otworzyć dowolny trening z Dashboardu, Kalendarza lub Historii i wybrać opcję **"EDYTUJ" / "UAKTUALNIENIE TRENINGU"**.
  - Zmiana daty, czasu trwania oraz notatek treningowych.
  - Modyfikacja zarejestrowanych ciężarów, liczby powtórzeń, wartości RPE i statusu serii.
  - Dodawanie nowych ćwiczeń lub serii do historycznego treningu.
  - Usuwanie pomyłkowo wpisanych serii lub ćwiczeń.
  - Usunięcie całego treningu z bazy danych.

### 4. 📚 Baza Ćwiczeń (Exercises Library)
- Zestaw ćwiczeń startowych podzielonych na kategorie: `Pchające (push)`, `Ciągnące (pull)`, `Nogi (legs)`, `Core (core)`.
- Wyszukiwarka i filtry kategorii.
- Dodawanie własnych ćwiczeń (`CUSTOM`) z przypisaniem partii mięśniowej.

#### Widoczność ćwiczeń
- **Ćwiczenia predefiniowane** — widoczne dla wszystkich użytkowników.
  - **Edycja** zapisywana jest jako Twoja prywatna modyfikacja (`user_exercise_overrides`): zmieniasz je tylko u siebie, pozostali widzą oryginał. Zmodyfikowane ćwiczenie dostaje plakietkę `ZMODYFIKOWANE`.
  - **Usunięcie = ukrycie tylko dla siebie** — inne konta nadal widzą to ćwiczenie. Ukryte można przywrócić przyciskiem `UKRYTE`.
  - Notatki i wskazówki techniczne zawsze są prywatne (dotyczą tylko Twojego konta).
- **Ćwiczenia własne** — widoczne **wyłącznie** dla użytkownika, który je dodał; edycja i usunięcie dotyczą tylko jego kopii.

### 5. 📅 Kalendarz Treningów (Interactive Calendar)
- Widok siatki miesięcznej z oznaczeniem odbytych treningów (kropki aktywności) i dzisiejszego dnia.
- Kliknięcie w dowolny dzień wyświetla listę wykonanych treningów wraz z możliwością ich natychmiastowego podejrzenia i edycji.

### 6. 📈 Analiza Progresu (Progress Analysis)
- Interaktywny wykres liniowy z biblioteki **Recharts** przedstawiający maksymalne obciążenie na sesję w czasie.
- Statystyki: **Rekord życiowy (PR)**, **Średnia**, **Trend (+/- kg)**.
- Linia referencyjna rekordu na wykresie.

### 7. ⚙️ Motyw, Język i Bezpieczeństwo
- **Motyw**: Przełącznik ciemnego (Deep Space `#07071a`) i jasnego (Clean Athletic `#f0eff6`) motywu.
- **Wielojęzyczność**: Pełne wsparcie dla języka **polskiego (PL)** i **angielskiego (EN)**.
- **Autentykacja**: Rejestracja, Logowanie, Reset hasła, Usuwanie konta.
- **Obowiązkowe potwierdzenie e-maila**: Po rejestracji aplikacja **czeka na kliknięcie linku** wysłanego na adres e-mail. Dopiero potwierdzone konto może się zalogować — do tego czasu ekran logowania pokazuje prośbę o otwarcie linku (z opcją wysłania go ponownie). W trybie lokalnym (bez Supabase) link potwierdzający jest symulowany przyciskiem `OTWÓRZ LINK POTWIERDZAJĄCY (DEMO)`.

---

## 🗄️ Baza Danych Supabase

Struktura bazy danych została przygotowana w pliku [`supabase/schema.sql`](file:///Users/adrian/Desktop/Projects/work-out/supabase/schema.sql) i zawiera pełne zabezpieczenia **Row Level Security (RLS)**:

1. `profiles` — profile użytkowników powiązane z `auth.users`.
2. `exercises` — ćwiczenia predefiniowane (`user_id = null`, widoczne dla wszystkich) oraz własne użytkownika (`user_id`, widoczne tylko dla właściciela).
3. `user_exercise_overrides` — prywatne modyfikacje i ukrycia predefiniowanych ćwiczeń (dotyczą tylko jednego użytkownika).
4. `user_exercise_notes` — prywatne notatki użytkownika do ćwiczeń.
5. `routines` — plany treningowe: predefiniowane wspólne (`user_id = null`) i prywatne (`user_id = użytkownik`).
6. `user_routine_hides` — ukrycia predefiniowanych planów (plan znika tylko u tego użytkownika).
7. `routine_exercises` — ćwiczenia wchodzące w skład planów z seriami i powtórzeniami docelowymi.
8. `workouts` — zapisane sesje treningowe (data, czas trwania, status, notatki).
9. `workout_exercises` — ćwiczenia wykonane w danej sesji treningowej.
10. `workout_sets` — serie z wagą, powtórzeniami, RPE i statusem wykonania.

### Jak podłączyć swój projekt Supabase:

1. Załóż darmowy projekt na [supabase.com](https://supabase.com).
2. Otwórz **SQL Editor** w panelu Supabase, wklej zawartość pliku [`supabase/schema.sql`](file:///Users/adrian/Desktop/Projects/work-out/supabase/schema.sql) i kliknij **Run**.
   - Projekt, który już korzystał ze starej wersji schematu, zamiast tego jednorazowo uruchamia migrację z katalogu [`supabase/migrations/`](file:///Users/adrian/Desktop/Projects/work-out/supabase/migrations):
     ```bash
     npx supabase db push --skip-vault
     ```
     (albo wklej ten sam plik do **SQL Editor** i kliknij **Run**).
     Uwaga: komendy `npx supabase migrate` i `npx supabase migration up` dotyczą wyłącznie bazy **lokalnej** i wymagają Docker — na projekt online używa się `db push`.
3. W panelu Supabase przejdź do **Authentication → Sign In / Providers → Email** i upewnij się, że opcja **Confirm email** jest włączona (bez niej rejestracja nie wymaga kliknięcia linku).
4. W **Authentication → URL Configuration** ustaw **Site URL** na adres aplikacji (np. `http://localhost:3000`) oraz dodaj ten sam adres do listy **Redirect URLs** — dzięki temu link potwierdzający wraca do aplikacji i loguje użytkownika.
5. W panelu Supabase przejdź do **Project Settings → API** i skopiuj:
   - `Project URL`
   - `anon public key`
6. Wklej je do pliku `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://twoj-projekt.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=twoj-klucz-anon
   ```
7. Jeśli zmienne nie zostaną podane, aplikacja automatycznie uruchamia się w **trybie lokalnym (Demo)** z zachowaniem pełnej funkcjonalności i pamięci przeglądarki!

---

## 🚀 Uruchomienie Aplikacji

### Wymagania:
- Node.js 18+ (zalecany Node.js 20 lub 22)
- npm

### 1. Instalacja zależności (jeśli potrzebna):
```bash
npm install
```

### 2. Uruchomienie serwera deweloperskiego:
```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem: [http://localhost:3000](http://localhost:3000)

Domyślne konto demo (działa zarówno offline, jak i z bazą):
- **E-mail**: `demo@gymapp.io`
- **Hasło**: `demo1234`
(Można także zarejestrować nowe własne konto).

### 3. Zbudowanie wersji produkcyjnej:
```bash
npm run build
npm start
```
