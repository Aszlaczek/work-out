# Wykonane zadania

Najnowsze wpisy umieszczaj na górze. Każdy wpis zawiera datę, zakres i rzeczywiście przeprowadzoną weryfikację. PERSONAL.md aktualizujemy tylko przy dodaniu nowych kluczowych funkcjonalności.

## 2026-10-12

- Przejrzano architekturę Next.js, repozytorium danych, schemat Supabase, logikę Auth i widoki aplikacji.
- Naprawiono formularz zmiany hasła: stabilna definicja sekcji usuwa odtwarzanie pól i gubienie fokusu przy pisaniu; dodano wysyłanie formularza, autouzupełnianie, powiązania etykiet i komunikaty dostępne dla technologii asystujących.
- Naprawiono usuwanie konta w chmurze: endpoint `DELETE /api/account` weryfikuje token i wywołuje Supabase Admin tylko dla bieżącego użytkownika; usunięcie Auth uruchamia kaskady danych przewidziane w schemacie. Błędy nie udają sukcesu, UI pozwala ponowić operację.
- Dodano opis i przykład konfiguracji serwerowego `SUPABASE_SERVICE_ROLE_KEY`. Klucz nie trafia do bundla przeglądarki. Nie modyfikowano konfiguracji zdalnego wdrożenia.
- Naprawiono lokalne usuwanie kont, zapobieganie odtworzeniu skasowanego demo i czyszczenie danych przypisanych do konta. Rozdzielono identyfikatory lokalnych użytkowników; zachowano identyfikator aktualnie zalogowanego starszego konta podczas migracji.
- Przypisano szkice aktywnych treningów do użytkownika; wylogowanie czyści stan widoków. Wyniki nieaktualnych odczytów nie nadpisują nowszego stanu.
- Błędy zapisu localStorage są zgłaszane zamiast ukrywane. Reset w chmurze wymaga sesji; odrzucenie hasła przez politykę nie jest automatycznie traktowane jako wygasły link.
- Zainstalowano animejs 4 i wdrożono animacje wejścia widoków/modali z anulowaniem przy odmontowaniu oraz obsługą ograniczonego ruchu.
- Odroczono ładowanie Progresu/Recharts i usunięto podwójne pobieranie danych po logowaniu.
- Dodano Jest, React Testing Library i testy regresji formularzy, kont lokalnych/chmurowych (atrapy), autoryzacji usuwania oraz animacji; dodano skrypty testów i TypeScript.
- Utworzono PERSONAL.md, TODO.md i ten dziennik. Przepisano README: funkcje, architektura, uruchomienie, Supabase, praca z AI, usprawnienia i ograniczenia.

Weryfikacja: **26 testów Jest w 4 zestawach zakończonych sukcesem**, `npm run typecheck`, `npm run build` oraz `git diff --check`. Build wygenerował endpoint kont i strony; raport dla `/`: 38,2 kB kodu trasy / 203 kB First Load JS (bez pomiaru porównawczego sprzed zmian).

Granice weryfikacji: nie przeprowadzono rzeczywistego usunięcia użytkownika ani testu dostarczania e-maili na zdalnym Supabase. Testy używają atrap usług, a pełny test integracyjny wymaga konfiguracji serwerowego klucza i konta testowego. Instalacja zgłosiła podatności zależności; przegląd i aktualizacje zapisano w TODO.md.
