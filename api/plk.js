export default async function handler(req, res) {
    const { start, end } = req.query;
    const API_KEY = "2F5Gl9fZrtPMhqHaKmixbFlFw-6Qp06kS3oCpK-i8QDLxYSQsNsL9buoRMbC8RagyjUQY6y0KGKnDuNosbKDSw";

    if (!start || !end) {
        return res.status(400).json({ error: 'Podaj stację początkową i końcową' });
    }

    try {
        // Prawdziwe uderzenie do PLK
        const plkResponse = await fetch(`https://kalkulacja.plk-sa.pl/api/routes/calculate?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, {
            method: 'GET', // Może się okazać, że PLK wymaga tu POST. Zaraz to zbadamy!
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        // Pobieramy surową odpowiedź z serwera PLK
        const text = await plkResponse.text();

        if (plkResponse.ok) {
            const data = JSON.parse(text);
            // Jeśli PLK zwróci sukces, oddajemy prawdziwy dystans
            return res.status(200).json({ distance: data.distance });
        } else {
            // Zwracamy PRAWDZIWY błąd z PLK zamiast losowania!
            return res.status(plkResponse.status).json({ 
                error: `Serwer PLK odrzucił zapytanie (Kod ${plkResponse.status}). Treść błędu: ${text}` 
            });
        }
    } catch (error) {
        return res.status(500).json({ error: `Błąd serwera Vercel: ${error.message}` });
    }
}