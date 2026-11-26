# Kryptis po techninio susitikimo

Individualiai programuojama sistema pakeičia Excel ir nuotraukomis siunčiamas valandų suvestines. Pagrindas – darbuotojų valandos objektuose ir dvigubų įrašų kontrolė.

## Poreikiai

- Dabar apie 70 darbuotojų, augimas dar apie 50. Jie patys prie sistemos nesijungia.
- 10 darbų vadovų, 3 užbaigimo komandų ir 2 elektrikų komandų atstovai, 3 administratoriai: apie 18 paskyrų, vertinimui planuoti iki 20.
- Vadovas pasirenka objektą, žmones, intervalą ir automobilį. Tas pats darbuotojas per dieną gali dirbti keliuose objektuose be sutampančių intervalų. Tą patį objektą pildo keli vadovai.
- Vadovas mato tik savo komandos valandas jam priskirtuose objektuose; administracija mato visas.
- Automatinė 30 min. pietų pertrauka. Faktas lieka matomas atskirai nuo vadovo siūlomos korekcijos ir komentaro.
- Neatvykimo priežastis ir 0 faktinių valandų. Nepateisinto neatvykimo atveju atskiras dienos vidurkiu pagrįstas siūlymas peržiūrai.
- Komandos dienos žiniaraštyje dalyvavimas ir rezultatas įvedami kiekvienam darbuotojui atskirai. Galimas dienos juodraštis ir jo tęsimas vakare. Pateiktų įrašų taisymas dviem įgaliotiems asmenims, su prieš/po istorija. Vadovas teikia taisymo prašymą.
- Darbuotojo ataskaita administracijai: dienos, objektai, faktas, siūlymas, skirtumas, komentaras.
- 27 automobiliai, priskyrimai komandoms, TA terminai ir priminimai atsakingam asmeniui.
- Savaitės ir mėnesio suvestinės, eksportas buhalterijai. Objekto suvestinė pagal pavadinimą apima ir užbaigimo bei elektrikų komandų valandas.
- Būsto ir kitos išlaidos prie objekto: įvesti, keisti ir matyti gali tik įmonės vadovas. Kitoms rolėms išlaidų duomenys ir jų pakeitimų istorija nerodomi.

## Įgyvendinti dienos darbo patogumai

1. Kelių pažymėtų darbuotojų perkėlimas nuo pasirinkto laiko į kitą objektą, išlaikant tą patį darbų vadovą, komandą ir transportą. Darbuotojai ir jų valandos kitam vadovui neperduodami. Perkeliami tik leistini juodraščiai; intervalai padalijami, pietūs ir dienos sumos nedubliuojami.
2. Bendra darbuotojo diena su kelių objektų intervalais, faktinėmis ir atlikto darbo valandomis. Darbų vadovui galioja priskirtų objektų ir savo komandos įrašų matomumo riba.
3. Pravaikštos neigiamas siūlymas atskirtas nuo atlikto darbo įvertinimo, taip pat eksporte. Faktinės valandos dėl siūlymo nesikeičia.
4. Administracijos dienos užpildymo kontrolė: nepažymėti žmonės, neatvykimų rūšys, juodraščiai ir pateiktos komandos.
5. Ankstesnės dirbusios komandos kopijavimas, neperkeliant jos neatvykimų, komentarų ir įvertinimų; naujas dalyvavimas pažymimas iš naujo.
6. Telefonui pritaikytos darbuotojų kortelės su atskirais dalyvavimo, darbo laiko ir dienos rezultato laukais.

## Neįtraukiama

Darbų etapai, procentinė pažanga, kiekiai, GPS, kilometrai ir kelionės laiko apskaita. Klientas jų nereikalauja arba naudoja kitur. Įkainiai ir darbo užmokesčio formulės galėtų būti vėlesnis etapas.

## Patikslinti prieš pasiūlymą

1. Faktinių valandų ir siūlomų korekcijų taikymo taisyklė bei atskiras korekcijų tinkamumo taikyti darbo užmokesčiui įvertinimas. Tikrasis darbo laikas turi išlikti.
2. Dienos vidurkio grupė, įtraukiami asmenys ir elgesys, kol ne visi įrašai pateikti.
3. Pietų pradžia, trumpa diena, intervalai per vidurnaktį.
4. Du valandų taisymui įgalioti asmenys ir trečio administratoriaus teisės.
5. Buhalterijos eksporto pavyzdys ir laiškų siuntimo paskyra.
6. Būsto ir kitų išlaidų dokumentai ir paskirstymas keliems objektams.

Pageidaujama pradžia – apie 2027-01-10; terminas tikslinamas pagal galutinę apimtį.

## Darbų vadovo supaprastinimas

Pagrindinis ekranas – „Mano diena“, visame puslapyje rodantis savo komandos įrašus visuose leidžiamuose dienos objektuose. Vadovo meniu sudaro tik „Mano diena“, „Mano objektai“, „Suvestinės“ ir „Taisymo prašymai“.

Dalyvavimas ir rezultatas įvedami kompaktiškose eilutėse. Laikas, pietūs, automobilis ir komentarai prieinami per bendrus nustatymus arba darbuotojo detales. Bendrus pakeitimus galima taikyti pažymėtiems žmonėms. Išsaugojimo / pateikimo juosta nuolat pasiekiama; rodoma, kiek trūksta dalyvavimo ar rezultato įvertinimų.

„Visi dirbo“ išlaiko jau pažymėtus neatvykimus. „Atlikta = dirbta“ išlaiko jau įvestus individualius įvertinimus ir užpildo likusius. Dienos pateikimas neleidžiamas, kol dirbusių žmonių rezultatas nepatvirtintas. Pravaikštos korekcijos lieka atskiros nuo darbo rezultato.

Perkėlimo veiksmas pradedamas pažymėjus žmones jų dienos sąraše. Dienos ir pradinio objekto iš naujo rinktis nereikia. Vadovas, komanda, dienos sumos ir vienkartiniai pietūs išlieka. Administracijai išlaikomas išsamus valdymas.
