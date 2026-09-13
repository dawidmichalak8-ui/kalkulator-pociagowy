export default async function handler(req, res) {
    const { start, end } = req.query;
    const API_KEY = "2F5Gl9fZrtPMhqHaKmixbFlFw-6Qp06kS3oCpK-i8QDLxYSQsNsL9buoRMbC8RagyjUQY6y0KGKnDuNosbKDSw";

    if (!start || !end) {
        return res.status(400).json({ error: 'Podaj stację początkową i końcową' });
    }

    // Pobranie dzisiejszej daty w formacie YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    try {
        // Budujemy strukturę DOKŁADNIE taką, jak na Twoim screenie
        const payload = {
            scheduleDate: today,
            searchParameters: 106, 
            exclusionRoute: [],
            railRoute: [
                { lp: 1, stationName: start },
                { lp: 2, stationName: end }
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
            // Zależnie od tego, jak PLK nazywa wynikowy dystans w JSON (np. totalDistance, routeLength)
            // Zabezpieczamy się, próbując wyciągnąć wynik.
            const dist = data.distance || data.totalDistance || data.length || JSON.stringify(data);
            return res.status(200).json({ distance: dist });
        } else {
            return res.status(plkResponse.status).json({ 
                error: `Serwer PLK odrzucił POST. Kod: ${plkResponse.status}. Treść: ${text}` 
            });
        }
    } catch (error) {
        return res.status(500).json({ error: `Błąd Vercel: ${error.message}` });
    }
}