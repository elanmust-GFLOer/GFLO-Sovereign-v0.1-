# Hozzájárulási XP-mag — review-tervezet

## Kapcsolat a README céljával

A ContributionLedger a hozzájárulási folyamat elszámolási részét valósítja meg. Nem a teljes PIECore és nem kész protokollkiadás. A main ág dokumentációs állapota és e fejlesztési ág prototípusa külön értékelendő.

| README / alap | E munkacsomag | Határ |
|---|---|---|
| Felhasználó nem adhat magának tetszőleges XP-t | Explicit grantor szerep szükséges minden credit híváshoz | Admin kinevezhet grantort; a grantor megbízható szereplő, saját címére is adhat pontot |
| Egyszeri hozzájárulás-jutalom | Globálisan egyszer felhasználható bytes32 azonosító ezen a telepítésen | Ugyanazon munka új ID-val vagy más telepítésen történő beadását nem ismeri fel |
| Egységes XP-egység | Egész pontok; 1 tárolt egység = 1 XP | Nincs tier vagy külső modul integráció |
| Bizonyítható adminátadás | Kétlépcsős átadás, régi admin explicit grantor szerepének visszavonása | Más korábbi grantorokat nem von vissza automatikusan; nincs timelock |
| Nyomon követhetőség | ID, címzett, grantor és mennyiség az eseményben | A bizonyíték valódisága off-chain ellenőrzési feladat |

## Kísérleti interfész

- constructor(initialOwner): nem nulla admin, lehet multisig szerződés is.
- setGrantor(address,bool): owner által kiosztott/visszavont jóváírói jogosultság.
- credit(contributionId,recipient,amount): jogosult jóváírás; pozitív összeg, nem nulla ID és érvényes cím; egy ID egyszer használható.
- transferOwnership(proposedOwner), acceptOwnership(): kétlépcsős átadás. Új javaslat felülírja a korábbit.
- xp(address), credited(bytes32): elszámolási állapot lekérdezése.

Az admin nem kap implicit jóváírási jogot, de kioszthatja saját magának. A szabály a véletlen jogösszemosást akadályozza, nem szünteti meg az adminba vetett bizalmat. Nincs grant-összegplafon, szignatúrás belépési pont, korrekció vagy felhasználói regisztráció. A token/stake/burn, path és tier nem része ennek az izolált tesztmodulnak; a róluk szóló javaslatokat ez nem véglegesíti.

## Bizonyítékazonosító és határok

A canonical ID kiadását és a munka ismételt benyújtásának ellenőrzését a későbbi validációs folyamatnak kell meghatároznia. A bytes32 érték ne közvetlen személyes adat legyen. A címzett és a jutalom nyilvános láncadat lesz telepítés esetén. A prototípus nem állít emberenkénti Sybil-védelmet, decentralizált ellenőrzést vagy a hozzájárulás minőségének automatikus igazolását.

## Ellenőrzés

2026-10-12: helyi, memóriában futó Ganache EVM-en 9/9 teszt sikeres. Solidity 0.8.20, optimizer 200, Shanghai; Node 24.19.0. Az opcionális natív µWS modul helyett a Ganache JavaScript fallbackje futott.

Tesztelt: illetéktelen hívások, pontos egészpontos elszámolás és eseményadatok, más grantor/címzett által ismételt ID, visszavont grantor, hibás paraméterek, túlcsordulás atomi visszagörgetése, adminátadás, hibás admincímek és felülírt átadási javaslat.

Futtatás: `npm ci --ignore-scripts --no-audit --no-fund`, majd `npm test`.

A lockfile a Ganache beágyazott, csak macOS-re való fsevents csomagját opcionálisként jelöli, összhangban a chokidar optionalDependencies deklarációjával. Enélkül az npm 11 tiszta Linux-telepítése EBADPLATFORM hibával leállt. Függőségfrissítésnél a tiszta telepítést újra ellenőrizni kell.

A tesztek kontrollált, friss telepítéseken futnak. Ez nem teljes biztonsági audit. Nem történt nyilvános hálózati telepítés, migráció vagy tokenművelet. A mainbe olvasztás előtt a prototípus interfésze, az off-chain ellenőrzési szabályok és a nyitott doktrínadöntések reviewja szükséges.
