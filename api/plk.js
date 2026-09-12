// plik: api/plk.js
export default async function handler(req, res) {
    const { start, end } = req.query;

    // Zabezpieczony w backendzie Klucz API podany przez Ciebie
    const API_KEY = "2F5Gl9fZrtPMhqHaKmixbFlFw-6Qp06kS3oCpK-i8QDLxYSQsNsL9buoRMbC8RagyjUQY6y0KGKnDuNosbKDSw";

    if (!start || !end) {
        return res.status(400).json({ error: 'Podaj stację początkową i końcową' });
    }

    try {
        /*
        * ZAPYTANIE DO PKP PLK
        * UWAGA: Systemy PLK (SKRJ) często wymagają podania ID punktów. 
        * Poniższe zapytanie fetch to proxy. Jeśli PLK odrzuci request 
        * z powodu nieznanych nazw (zamiast ID), mechanizm try/catch przechwyci 
        * błąd i na potrzeby demonstracyjne wygeneruje mockowy dystans, 
        * by aplikacja działała płynnie w wersji prezentacyjnej.
        */
        const plkResponse = await fetch(`https://kalkulacja.plk-sa.pl/api/routes/calculate?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (plkResponse.ok) {
            const data = await plkResponse.json();
            // Zwracamy dystans jeśli API odpowiedziało sukcesem
            return res.status(200).json({ distance: data.distance });
        } else {
            throw new Error(`API PLK zwróciło błąd: ${plkResponse.status}`);
        }

    } catch (error) {
        console.warn("Błąd połączenia z rzeczywistym API PLK, uruchamiam tryb awaryjny (Mock).", error.message);
        
        // MOCK/FALLBACK: Generowanie realistycznego dystansu dla podanych stacji w razie braku autoryzacji
        // Działa to znakomicie na czas prototypowania aplikacji zanim system zostanie wpięty pod słowniki ID stacji PLK.
        const mockDistance = Math.floor(Math.random() * (600 - 150 + 1)) + 150;
        
        return res.status(200).json({ 
            distance: mockDistance, 
            warning: 'Wynik symulowany (błąd autoryzacji w API PLK)' 
        });
    }
}