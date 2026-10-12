# GYM PROGRESS

Aplikacja do planowania i rejestrowania treningów siłowych, rozwijana z pomocą narzędzi AI (w tym Codex). Łączy dziennik treningowy, bibliotekę ćwiczeń, kalendarz i wykresy postępów. Interfejs jest dostosowany do telefonu i komputera, z jasnym i ciemnym motywem oraz tłumaczeniami PL/EN.

AI wspiera analizę kodu, implementację, dokumentowanie zmian i przygotowanie testów. Nie jest funkcją aplikacji: projekt nie wysyła dziennika treningów do modelu AI i nie wymaga klucza API do modelu. Zmiany wygenerowane z pomocą AI podlegają tym samym testom i przeglądowi kodu co pozostałe zmiany.

## Funkcje

- **Dashboard:** podsumowanie aktywności, historia i szybki start treningu.
- **Plany:** własne rutyny z ćwiczeniami, seriami i docelowymi powtórzeniami. Edycja planu predefiniowanego tworzy prywatną kopię; jego usunięcie ukrywa go tylko dla danego użytkownika.
- **Ćwiczenia:** wyszukiwanie, kategorie, własne ćwiczenia i prywatne notatki. Zmiany ćwiczeń predefiniowanych są zapisywane jako prywatne nadpisania; ukryte pozycje można przywrócić.
- **Dziennik:** trening na żywo ze stoperem, ciężarem, powtórzeniami i RPE; ręczny zapis oraz edycja historycznych sesji. Szkic aktywnego treningu jest zapisywany w przeglądarce osobno dla każdego konta.
- **Kalendarz i progres:** historia miesięczna, wykres maksymalnego ciężaru dla ćwiczenia, rekord i trend.
- **Konto:** rejestracja, potwierdzenie e-maila, logowanie, odzyskiwanie i zmiana hasła oraz usunięcie konta.
- **Animacje animejs:** wejście widoków i okien modalnych, z obsługą `prefers-reduced-motion`.

## Stos i struktura

Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Supabase Auth/PostgreSQL/RLS, Recharts, animejs 4, Lucide i Vercel Analytics. Testy: Jest, React Testing Library i jsdom. Dokładne wersje instalacji zapisuje `package-lock.json`.

```text
src/app/                       strony, layout i style globalne
  api/account/route.ts         serwerowe usunięcie konta
  auth/callback/route.ts       obsługa token_hash z potwierdzenia e-maila
  reset-password/page.tsx      formularz ustawiania odzyskanego hasła
src/components/                widoki domenowe i wspólne elementy UI
src/lib/repository.ts          operacje danych, Auth i wariant lokalny
src/lib/supabase/client.ts     klient Supabase i stan odzyskiwania hasła
src/lib/hooks/                 współdzielone zachowania, m.in. animacje
src/lib/{types,seedData,i18n,theme}.ts
supabase/schema.sql            schemat nowej bazy, RLS i dane startowe
supabase/migrations/           aktualizacje istniejącego schematu
agents/                       opis projektu, backlog i dziennik prac
tests/                         testy regresji
```

## Uruchomienie

Wymagane Node.js 22 LTS i npm. Polecenia wykonuj w katalogu projektu:

```bash
npm ci
cp .env.local.example .env.local
npm run dev
```

Otwórz `http://localhost:3000`. Pozostawienie przykładowej konfiguracji Supabase uruchamia tryb demonstracyjny. Jeśli masz już `.env.local`, zachowaj jego konfigurację zamiast nadpisywać plik.

```bash
npm run typecheck       # sprawdzenie typów
npm test                # jednorazowy przebieg Jest
npm run test:watch      # praca nad testami
npm run test:coverage   # raport w coverage/
npm run build           # kompilacja produkcyjna
npm start               # start zbudowanej aplikacji
```

Historyczny skrypt `npm run lint` wymaga jeszcze skonfigurowania ESLint; obecnie kontrolę zmian zapewniają TypeScript, Jest i build. Nie uruchamiaj równocześnie `next dev` i `next build` w tym samym katalogu `.next`.

## Dwa tryby przechowywania danych

### Demo lokalne

Bez poprawnych publicznych zmiennych Supabase aplikacja korzysta z `localStorage`. Pierwsze uruchomienie udostępnia konto `demo@gymapp.io` / `demo1234`. Można też utworzyć inne konto; potwierdzenie i reset hasła są symulowane w UI.

Każde konto otrzymuje własny identyfikator. Hasło zmienione w ustawieniach pozostaje zmienione po ponownym logowaniu. Usunięcie ostatniego konta nie odtwarza konta demo. Reset pamięci lokalnej przywraca stan pierwszego uruchomienia.

To tryb demonstracyjny, nie uwierzytelnianie produkcyjne: hasła i dane są przechowywane w przeglądarce, bez szyfrowania haseł. Nie używaj rzeczywistych haseł. Dane nie synchronizują się między urządzeniami. Starsze wersje współdzieliły identyfikator lokalny; migracja zachowuje go dla aktualnie zalogowanego konta, ale nie może odtworzyć historycznego właściciela wcześniej wymieszanych danych.

### Supabase

1. Utwórz projekt Supabase. Dla nowej bazy uruchom `supabase/schema.sql` w SQL Editor. Plik jest schematem inicjalnym, nie migracją do wielokrotnego uruchamiania.
2. Dla istniejącej starszej instalacji zastosuj właściwe, jeszcze niewykonane pliki z `supabase/migrations/`; nie odtwarzaj całego schematu nad danymi.
3. Włącz potwierdzanie e-maila w konfiguracji dostawcy Email.
4. Ustaw Site URL i dozwolone Redirect URLs dla używanych domen, uwzględniając `/auth/callback` i `/reset-password` (także lokalny adres podczas developmentu).
5. Uzupełnij konfigurację:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://twoj-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=publiczny-klucz-anon
SUPABASE_SERVICE_ROLE_KEY=prywatny-klucz-serwerowy
```

Dwie pierwsze zmienne są publiczne. `SUPABASE_SERVICE_ROLE_KEY` jest wykorzystywany wyłącznie przez endpoint serwerowy; nie dodawaj prefiksu `NEXT_PUBLIC_`, nie umieszczaj wartości w repozytorium ani w kodzie przeglądarki. Na hostingu ustaw go jako zmienną środowiskową i ponownie uruchom/wdróż aplikację. Hosting musi obsługiwać serwer Next.js; sam eksport statyczny nie obsłuży endpointu kont.

Konto demo nie jest automatycznie tworzone w Supabase. W trybie chmurowym zarejestruj własne konto. Błędy połączenia z chmurą nie przełączają odczytów na lokalne dane.

Potwierdzenie e-maila zależy także od szablonu wiadomości: obecny callback obsługuje `token_hash` i `type` (np. link `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=signup` w szablonie potwierdzenia). Po potwierdzeniu użytkownik loguje się w aplikacji. Pełny przepływ PKCE/cookie SSR pozostaje w backlogu.

## Hasło i usuwanie konta

**Zmiana hasła:** Ustawienia → Bezpieczeństwo. Wymagane są bieżące hasło, nowe hasło (minimum 6 znaków; Supabase może wymagać więcej) i potwierdzenie. Formularz zachowuje fokus podczas pisania, działa po wysłaniu Enterem i pokazuje wynik operacji. Bieżące hasło jest weryfikowane przed zmianą.

**Odzyskiwanie:** link z wiadomości otwiera `/reset-password`. W chmurze wymagane jest posiadanie sesji z Supabase; sam lokalny znacznik resetu nie autoryzuje zmiany. Odrzucenie nowego hasła przez politykę nie jest przedstawiane jako wygaśnięcie linku. Po pomyślnym resecie chmurowym użytkownik loguje się ponownie. Lokalny znacznik kieruje przeglądarkę do resetu — nie unieważnia starego hasła globalnie na innych urządzeniach.

**Usunięcie:** Ustawienia → Strefa niebezpieczna → wpisanie `DELETE`. Przeglądarka wysyła token sesji do `DELETE /api/account`. Serwer sprawdza token przez `auth.getUser`, a następnie wywołuje `auth.admin.deleteUser` wyłącznie dla zweryfikowanego użytkownika. Nie przyjmuje identyfikatora konta od klienta. Klucze obce `ON DELETE CASCADE` usuwają profil i powiązane dane treningowe; wspólne plany i ćwiczenia pozostają. Dopiero sukces usuwa sesję i lokalny szkic. Błąd jest widoczny w formularzu i pozwala ponowić operację.

Brak klucza serwerowego powoduje odpowiedź 503, a nieważny token — 401. Testy nie zastępują sprawdzenia poprawności relacji CASCADE w konkretnej wdrożonej bazie. Supabase opisuje też ograniczenia usuwania kont, m.in. czas ważności już wydanych JWT i własność plików Storage, w [dokumentacji zarządzania użytkownikami](https://supabase.com/docs/guides/auth/managing-user-data).

## Wydajność i dostępność

- **Wykresy na żądanie:** `ProgressView` i Recharts są ładowane przez `next/dynamic` po otwarciu Progresu, zmniejszając zakres JavaScript potrzebnego przy wejściu do aplikacji.
- **Jeden cykl pobierania po logowaniu:** usunięto drugi, równoległy start `loadUserData`. Niezależne odczyty nadal korzystają z `Promise.all`.
- **Ochrona przed spóźnionymi odpowiedziami:** wyniki starszego pobrania nie zastępują danych nowszego konta ani stanu po wylogowaniu.
- **Stabilne formularze:** sekcja ustawień nie jest definiowana ponownie jako nowy komponent przy każdym znaku; pola zachowują element DOM i fokus. Etykiety są powiązane z polami.
- **Lekki ruch:** animejs animuje tylko `opacity` i `transform`, sprząta animacje przy zmianie widoku/odmontowaniu i reaguje na zmianę `prefers-reduced-motion`. Preferencja obejmuje też istniejące animacje CSS.

Wzorce integracji opisują oficjalne dokumentacje [animejs](https://animejs.com/documentation/getting-started/using-with-react) i [testowania Next.js z Jest](https://nextjs.org/docs/14/app/building-your-application/testing/jest).

## Testy i weryfikacja zmian

Jest sprawdza logikę kont lokalnych, zmianę i reset hasła, rozdzielenie danych, błędy pamięci przeglądarki, fokus i komunikaty formularza, autoryzację endpointu usuwania oraz cykl życia animacji. Supabase i żądania sieciowe są zastępowane atrapami — testy nie łączą się z produkcyjną bazą i nie usuwają rzeczywistych użytkowników.

Przed wdrożeniem na testowym projekcie Supabase sprawdź rejestrację/potwierdzenie, odzyskiwanie hasła z wiadomości, zmianę hasła oraz usunięcie jednorazowego konta wraz z jego danymi. Zachowaj także drugie konto kontrolne i potwierdź, że jego dane pozostały nienaruszone.

## Dokumentacja pracy z AI

- [`agents/PERSONAL.md`](agents/PERSONAL.md) — stała tożsamość, architektura i kluczowe zasady produktu; zmieniany **wyłącznie przy dodaniu nowych kluczowych funkcjonalności**.
- [`agents/TODO.md`](agents/TODO.md) — priorytety i możliwe dalsze usprawnienia.
- [`agents/DONE.md`](agents/DONE.md) — wykonane zadania z datą i zakresem weryfikacji, najnowsze na górze.

Codzienne poprawki, refaktoryzacje i aktualizacje zależności opisuj w DONE, bez zmiany PERSONAL. Planowane funkcje oznaczaj jako plany, nie jako funkcje już dostępne. Nie zapisuj sekretów, danych prawdziwych użytkowników ani wyników testów, które nie zostały wykonane.
