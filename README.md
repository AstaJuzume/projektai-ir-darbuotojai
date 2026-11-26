# Projektai ir darbuotojai

PVMOUNT individualios programėlės vizualas pritaikytas pagal oficialų logotipą ir svetainės spalvas: tamsi navigacija, mėlyni akcentai ir mobilios darbuotojų kortelės. Prekės ženklo bei šriftų šaltiniai – `BRANDING.md`. Microsoft / Power Apps sąsajos antraštė nenaudojama.

Individualiai programuojamos darbo laiko, objektų, komandų ir transporto apskaitos sistemos PWA prototipas. Vardai, įrašai ir automobiliai demonstraciniai.

## Procesas

- Vadovas atidaro bendrą komandos dienos žiniaraštį. Kiekvienoje darbuotojo eilutėje pažymi „Dirbo“, „Pravaikšta“ arba pateisintą neatvykimą su priežastimi. Darbo intervalai ir atlikto darbo valandos įvedami kiekvienam atskirai; bendrą laiką galima pritaikyti visiems dirbantiems. Žmogus gali dirbti keliuose objektuose tą pačią dieną. Sutampantys intervalai blokuojami.
- 30 min. pietų intervalas paskirstomas pagal darbo intervalų persidengimą. Visuose to žmogaus dienos įrašuose pietų pradžia turi sutapti. Demo numatyta 12:00, dienos įvedime ją galima keisti.
- Faktinis laikas visada matomas. Vadovo siūlomos valandos ir skirtumas pateikiami atskirai su komentaru. Nepateisinto neatvykimo atveju skaičiuojamas kitų komandos darbuotojų dienos vidurkis, sujungiant jų objektus. Tai siūlymas administracinei peržiūrai, automatinės darbo užmokesčio išskaitos neskaičiuojamos.
- Vadovas gali išsaugoti dienos juodraštį ir grįžti dienos gale. Pateiktą dieną taiso tik du įgalioti administratoriai su priežastimi ir prieš/po istorija. Vadovas pateikia taisymo prašymą.
- Administracija mato visus įrašus, komandos atstovas – savo komandos įrašus jam priskirtuose objektuose. Darbuotojo ataskaitą atidaro administracija; darbuotojui paskyros nereikia.
- Objekto suvestinė apima montavimo, užbaigimo ir elektrikų komandų valandas. Būsto išlaidas įvesti, keisti ir matyti gali tik įmonės vadovas. Kiti administratoriai ir darbų vadovai nemato išlaidų skilties, sumų objektuose, suvestinėse ar finansinių įrašų istorijoje.

## Dienos pildymo patobulinimai

- „Perkelti darbuotojus“ padalija pasirinktų darbuotojų juodraščio intervalą nuo nurodyto laiko į kitą objektą. Darbuotojai, jų valandos, komanda, automobilis ir vairuotojas lieka prie to paties darbų vadovo; keičiasi tik objektas. Dienos faktinių bei įvertintų valandų suma ir vienkartinė pietų pertrauka išlieka; persidengimai blokuojami.
- „Dienos suvestinė“ sujungia žmogaus dienos objektus. Administracija mato visus įrašus, darbų vadovas – savo komandos valandas priskirtuose objektuose. Darbuotojo ataskaitoje išskleidžiami dienos intervalai ir objektai.
- Atlikto darbo valandos ir pravaikštos korekcija rodomos atskirai lentelėse, suvestinėse ir CSV. Neatvykusio žmogaus faktas ir atliktas darbas yra 0; neigiamas siūlymas lieka atskirame lauke.
- „Dienos kontrolė“ administracijai atskiria nepažymėtus darbuotojus, pateisintus bei nepateisintus neatvykimus, juodraščius ir pateiktas komandas.
- „Kopijuoti ankstesnę komandą“ paima paskutinės ankstesnės darbo dienos dirbusių žmonių sąrašą, objektą ir automobilį. Nekopijuoja neatvykimų, komentarų ar rezultato įvertinimų. Naujiems darbuotojų įrašams būtina pažymėti dalyvavimą.
- Telefone dienos žiniaraštis virsta atskiromis darbuotojų kortelėmis su dideliais dalyvavimo mygtukais, laiko ir atlikto darbo laukais.

## Demo sudėtis

70 darbuotojų, 10 montavimo, 3 užbaigimo ir 2 elektrikų komandos; Įmonės vadovo, 2 administratorių ir 15 komandų atstovų modelis (18 paskyrų, rezervas iki 20). Darbuotojų sąrašą galima didinti iki 120 ir daugiau. 27 automobiliai su TA datomis ir priminimų nustatymais.

Tai vietinis naršyklės prototipas: backend, tikras prisijungimas, bendras duomenų šaltinis ir automatinių el. laiškų siuntimas neprijungti. Vaidmenys imituojami. localStorage įrašai nesinchronizuojami tarp įrenginių ar naudotojų. Finansinės korekcijos nėra darbo užmokesčio skaičiavimo mechanizmas.

## Paleidimas ir PWA

GitHub kopijoje failai yra šakniniame kataloge. `python -m http.server 8000`, tada `http://localhost:8000`. GitHub Pages: `main`, `/ (root)`. Sites šaltinyje statiniai failai yra `dist/`.

Atidarykite HTTPS adresą ir pasirinkite „Įdiegti programėlę“. Edge / Chrome gali atverti diegimo dialogą, kitu atveju rodomos instrukcijos. Safari iPhone / iPad: bendrinimo meniu → „Pridėti prie pradžios ekrano“.

PWA naudoja santykinius kelius, turi savo piktogramą ir atskirą langą. Paleidimui reikia interneto. Service worker nekaupia autentifikuotų puslapių ar darbuotojų duomenų.

Skaičiavimai atskirti `work-rules.js`: faktinis intervalas, pietūs, komandos dienos vidurkis, siūlymas ir persidengimų kontrolė. Reikalavimų apimtis ir atviri klausimai – `REIKALAVIMAI.md`.

Dienos rezultato pavyzdys: intervalas 07:00–18:30 ir 30 min. pietūs = 11 dirbtų valandų; vadovas darbuotojui įrašo 8 atlikto darbo valandas ir skirtumo komentarą. Tikrasis intervalas ir 11 val. nesikeičia.
