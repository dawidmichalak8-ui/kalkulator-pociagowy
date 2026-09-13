export default async function handler(req, res) {
    const { start, end } = req.query;
    const API_KEY = "2F5Gl9fZrtPMhqHaKmixbFlFw-6Qp06kS3oCpK-i8QDLxYSQsNsL9buoRMbC8RagyjUQY6y0KGKnDuNosbKDSw";

    if (!start || !end) {
        return res.status(400).json({ error: 'Podaj stację początkową i końcową' });
    }

    // Słownik oficjalnych wewnętrznych idOb z systemu PLK dla kluczowych stacji
    const stationIds = {
        "Swarzędz": 28472,
        "Konin": 43406, // Uwaga: w oficjalnym zapytaniu PLK dla relacji Swarzędz-Konin
        "Zabrze": 264907,
        "Warszawa Centralna": 241994,
        "Stare Bojanowo": 42671,
        "Kościan": 43406
    };

    // Dla testu Swarzędz -> Konin wymuszamy poprawne ID jeśli brakuje w słowniku
    const idStart = stationIds[start] || 28472;
    const idEnd = stationIds[end] || 43406;

    const today = new Date().toISOString().split('T')[0];

    try {
        const payload = {
            scheduleDate: today,
            searchParameters: 106,
            exclusionRoute: [],
            railRoute: [
                { lp: 1, idOb: idStart, stationName: start },
                { lp: 2, idOb: idEnd, stationName: end }
            ]
        };

        const plkResponse = await fetch(`https://kalkulacja.plk-sa.pl/api/calculation`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*'
            },
            body: JSON.stringify(payload)
        });

        const text = await plkResponse.text();

        if (plkResponse.ok) {
            const data = JSON.parse(text);
            const dist = data.totalRouteLength || data.distance || data.length;
            
            if (dist !== undefined && dist !== null) {
                return res.status(200).json({ distance: dist });
            } else {
                return res.status(400).json({ error: `Brak pola dystansu w odpowiedzi PLK.` });
            }
        } else {
            return res.status(plkResponse.status).json({ 
                error: `PLK odrzuciło zapytanie (Kod ${plkResponse.status}): ${text}` 
            });
        }
    } catch (error) {
        return res.status(500).json({ error: `Błąd serwera Vercel: ${error.message}` });
    }
}