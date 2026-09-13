export default async function handler(req, res) {
    const { start, end } = req.query;
    const API_KEY = "2F5Gl9fZrtPMhqHaKmixbFlFw-6Qp06kS3oCpK-i8QDLxYSQsNsL9buoRMbC8RagyjUQY6y0KGKnDuNosbKDSw";

    if (!start || !end) {
        return res.status(400).json({ error: 'Podaj stację początkową i końcową' });
    }

    const today = new Date().toISOString().split('T')[0];

    try {
        // Funkcja pomocnicza do pobrania idOb dla danej nazwy stacji z API PLK
        async function fetchStationId(stationName) {
            try {
                const searchRes = await fetch(`https://kalkulacja.plk-sa.pl/api/stations/search?query=${encodeURIComponent(stationName)}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                        'Accept': 'application/json'
                    }
                });
                if (searchRes.ok) {
                    const stations = await searchRes.json();
                    // Szukamy dokładnego dopasowania lub biorąc pierwszy wynik z listy podpowiedzi
                    if (Array.isArray(stations) && stations.length > 0) {
                        return stations[0].id || stations[0].objectId || stations[0].idOb;
                    }
                }
            } catch (e) {
                console.error("Błąd wyszukiwania stacji:", e);
            }
            return null;
        }

        // Krok 1: Pobieramy numery ID dla stacji A i B
        const [idStart, idEnd] = await Promise.all([
            fetchStationId(start),
            fetchStationId(end)
        ]);

        if (!idStart || !idEnd) {
            return res.status(404).json({ 
                error: `Nie udało się odnaleźć wewnętrznego ID w bazie PLK dla stacji: ${!idStart ? start : ''} ${!idEnd ? end : ''}` 
            });
        }

        // Krok 2: Wysyłamy właściwą kalkulację tras z użyciem ID
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
                return res.status(400).json({ error: `PLK przyjęło zapytanie, ale brak pola dystansu w odpowiedzi.` });
            }
        } else {
            return res.status(plkResponse.status).json({ 
                error: `Serwer PLK odrzucił zapytanie (Kod ${plkResponse.status}): ${text}` 
            });
        }
    } catch (error) {
        return res.status(500).json({ error: `Błąd serwera Vercel: ${error.message}` });
    }
}