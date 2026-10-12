# GYM PROGRESS — tożsamość projektu

> Ten plik zmieniamy TYLKO przy dodaniu nowych kluczowych funkcjonalności. Bieżące naprawy, testy, zmiany techniczne i wykonane zadania trafiają do DONE.md; pomysły do TODO.md.

## Cel i odbiorcy

GYM PROGRESS to osobisty dziennik treningów siłowych dla osób planujących rutyny, rejestrujących serie i obserwujących rozwój wyników. Najważniejsze są szybki zapis podczas treningu, czytelna historia i prywatność danych użytkownika. Projekt rozwijany jest z pomocą narzędzi AI, ale nie zawiera funkcji trenera opartego na AI.

## Charakter aplikacji

- Nazwa: GYM PROGRESS; znak skrócony: GP; motyw przewodni: trening i mierzalny progres.
- Styl: sportowy, kontrastowy, ciemny/jasny motyw z akcentem pomarańczowym, fioletowym i cyjanowym.
- Typografia: Barlow Condensed dla nagłówków, Outfit dla tekstu, JetBrains Mono dla danych.
- Układ: mobile-first, dolna nawigacja na telefonach, górna na komputerach, formularze w modalach.
- Języki: PL i EN; tłumaczenia w `src/lib/i18n.ts` (część komunikatów technicznych pozostaje po polsku).
- Animacje wspierają orientację w interfejsie i respektują ograniczenie ruchu ustawione w systemie.

## Kluczowe funkcjonalności

1. Konto: rejestracja, potwierdzenie adresu, logowanie, odzyskanie/zmiana hasła, usunięcie konta.
2. Dashboard z aktywnością, historią i szybkim rozpoczęciem treningu.
3. Rutyny: plany predefiniowane i prywatne; ćwiczenia, serie i powtórzenia docelowe.
4. Biblioteka ćwiczeń: wyszukiwarka, kategorie, prywatne ćwiczenia, nadpisania i notatki.
5. Rejestrowanie aktywnego treningu: stoper, ciężar, powtórzenia, RPE i wykonane serie; lokalny szkic przypisany do konta.
6. Ręczne dodawanie, edycja i usuwanie zapisanych treningów.
7. Kalendarz miesięczny i wykres progresu wybranego ćwiczenia.
8. Preferencje wyglądu i języka zapisywane w przeglądarce.

## Architektura i dane

- Next.js App Router + React + TypeScript, Tailwind, Recharts, animejs, Lucide.
- `src/app/page.tsx`: stan sesji, nawigacji, danych, aktywnego treningu i otwartych modali.
- `src/components/`: widoki dziedzinowe i wspólne komponenty interfejsu.
- `src/lib/repository.ts`: wspólna warstwa operacji Auth i danych dla Supabase oraz demo.
- Supabase: Auth, PostgreSQL, Row Level Security; administracyjne usunięcie konta przez serwerowy endpoint Next.js.
- Główne encje: profile, ćwiczenia, prywatne nadpisania/notatki, rutyny, ukrycia, ćwiczenia rutyn, treningi, ćwiczenia treningów i serie.
- Bez konfiguracji Supabase: lokalne demo w localStorage. Nie jest zabezpieczeniem danych produkcyjnych.
- Jest + React Testing Library: regresje formularzy, repozytorium, endpointu kont i animacji.

## Niezmienne zasady

Własne ćwiczenia, plany i treningi należą do konkretnego konta. Edycja wspólnego planu tworzy prywatną kopię; zmiany wspólnego ćwiczenia to prywatne nadpisanie. Usunięcie elementu predefiniowanego oznacza jego ukrycie dla użytkownika. Błąd zapisu nie może wyglądać jak sukces. Chmura nie może niejawnie zastępować swoich danych lokalnymi. Sekrety administracyjne pozostają wyłącznie na serwerze.

Nie ustalamy personaliów właściciela ani autorów na podstawie nazwy katalogu na komputerze. Role projektu: użytkownik prowadzący dziennik, opiekun konfigurujący wdrożenie i narzędzia AI wspierające rozwój pod kontrolą opiekuna.
