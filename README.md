# Montavimo darbų valdymo prototipas

Power Apps stiliaus internetinis prototipas projektų, brigadų ir darbo laiko valdymui. Tikra Power Apps aplikacija ir Microsoft duomenų šaltiniai neprijungti.

## Išbandymas

1. Projektų vadovo vaidmeniu peržiūrėti projektų etapus ir brigadų planą.
2. Registruoti lapkričio 26 d. laiką pasirinktiems darbuotojams. Pateikti įrašus tvirtinti.
3. Tvirtinime patvirtinti arba grąžinti įrašą su priežastimi. Peržiūrėti atsinaujinusias suvestines.
4. Pakeisti vaidmenį į brigadininką arba darbuotoją ir išbandyti atitinkamą ekraną.

Duomenys išsaugomi tik naršyklės localStorage. Tai nėra bendras duomenų šaltinis ar tikra prieigos kontrolė. Demonstraciniai darbuotojai ir projektai išgalvoti. Atlikti kiekiai nepriklauso nuo darbuotojų valandų skaičiaus. Darbo laiko persidengimai ir brigados priskyrimų persidengimai tikrinami.

## Veiklos kontekstas

Pritaikyta saulės elektrinių montavimo veiklai Vokietijoje, pagal viešai skelbiamus darbų etapus: aikštelės paruošimas, tranšėjos, konstrukcijos, moduliai, elektros darbai ir aikštelės tvarkymas. Šaltiniai: https://pvmount.lt/ ir https://pvmount.lt/atliekami-darba/ (peržiūrėta 2026-11-25).

## Failai

`index.html`, `style.css`, `app.js` – statinė aplikacija be išorinių priklausomybių. Paleidžiama per bet kurį statinių failų serverį.

Lokaliai: `python -m http.server 8000`, tada atidarykite `http://localhost:8000`. GitHub Pages naudokite `main` šaką ir šakninį katalogą `/ (root)`.


## Įdiegimas kaip programėlės (PWA)

Aplikacijoje paspauskite „Įdiegti programėlę“. Edge ir Chrome gali parodyti naršyklės įdiegimo dialogą. Jei jis dar nepasiekiamas, mygtukas pateikia instrukcijas. Android sistemoje taip pat naudokite naršyklės meniu „Įdiegti programėlę“ / „Pridėti prie pagrindinio ekrano“. iPhone / iPad Safari: bendrinimo meniu → „Pridėti prie pradžios ekrano“.

Naudokite HTTPS adresą (GitHub Pages arba demo nuorodą), lokaliam kūrimui tinka localhost. Manifestas ir service worker naudoja santykinius kelius, todėl veikia ir GitHub Pages saugyklos pakatalogyje.

Programėlė atsidaro atskirame lange ir turi savo piktogramą. Jai paleisti reikia interneto; be ryšio rodomas aiškus pranešimas. Service worker nekaupia autentifikuotų puslapių ar valandų įrašų ir nekeičia prisijungimo kontrolės. Demo įrašai išlieka naršyklės localStorage ir nesinchronizuojami tarp įrenginių.

PWA failai: `manifest.webmanifest`, `pwa.js`, `pwa.css`, `sw.js`, `offline.html`, `icons/`.
