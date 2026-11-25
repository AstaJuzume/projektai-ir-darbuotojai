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
