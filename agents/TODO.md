# Możliwe kierunki rozwoju

Lista planów, nie deklaracja dostępnych funkcji. Przenoś wykonane zadania do DONE.md z datą.

## Wysoki priorytet

- [ ] Zweryfikować na testowym Supabase cały cykl rejestracja → e-mail → zmiana/reset hasła → usunięcie konta; sprawdzić kaskady i izolację drugiego konta. Testy Jest używają atrap usług.
- [ ] Przejrzeć i zaktualizować podatne zależności: instalacja 2026-10-12 zgłosiła 29 ostrzeżeń npm audit (21 moderate, 7 high, 1 critical). Zweryfikować aktualny raport, rozdzielić runtime/dev i przeprowadzić aktualizację z testami; nie stosować bez przeglądu `--force`.
- [ ] Przenieść zapis treningu i rutyny do transakcyjnych funkcji PostgreSQL: obecnie seria żądań może pozostawić częściowy zapis po awarii.
- [ ] Ujednolicić callback potwierdzania i odzyskiwania kont na pełny przepływ PKCE/SSR; dodać scenariusze wygasłego linku i innej przeglądarki.
- [ ] Dodać testy integracyjne polityk RLS i kaskadowego usuwania w izolowanej bazie Supabase.

## Wydajność i jakość

- [ ] Wprowadzić stronicowanie historii oraz agregacje statystyk w bazie przy większej liczbie treningów.
- [ ] Zmierzyć plan zapytań i dodać indeksy dla właściciela/daty i kluczy obcych na podstawie wyników.
- [ ] Skonfigurować ESLint oraz CI uruchamiające Jest, TypeScript i build.
- [ ] Dodać przeglądarkowe testy E2E na mobile i desktop, w tym klawiaturę, fokus modali i sieć offline.
- [ ] Uzupełnić tłumaczenia komunikatów technicznych PL/EN.
- [ ] Zastąpić `any` typami wygenerowanymi ze schematu Supabase.
- [ ] Rozważyć lokalne fonty i pomiar Web Vitals przed dalszymi optymalizacjami.
- [ ] Zastąpić globalne czyszczenie localStorage w „Reset danych lokalnych” operacją ograniczoną do danych aplikacji i dodać potwierdzenie.

## Funkcje do rozważenia

- [ ] Eksport/import dziennika CSV/JSON z walidacją.
- [ ] Cele treningowe, statystyki objętości i rekordów powtórzeniowych.
- [ ] Timer odpoczynku oraz powiadomienia opcjonalne.
- [ ] Tryb PWA/offline z kontrolowaną synchronizacją i rozwiązywaniem konfliktów.

Przy dodaniu nowej kluczowej funkcji uaktualnij również PERSONAL.md. Zwykłe poprawki nie są powodem jego zmiany.
