# GFLO Sovereign v0.1

A GFLO Sovereign javítási és fejlesztési munkáinak központi repója.

## Állapot

**Előkészítés / specifikáció.** Ebben a repóban jelenleg nincs implementált, tesztelt vagy telepített szerződés. A v0.1 a fejlesztési cél neve, nem kész kiadás.

Első cél: egy ellenőrizhető hozzájárulási folyamat, amelyben a felhasználó nem adhat magának tetszőleges XP-t, és ugyanaz a hozzájárulás nem jutalmazható kétszer.

## Munkamódszer

- Architecture-first: a szerepek, függőségek és bizalmi határok tisztázása a kód előtt.
- A doktrína, specifikáció, implementáció, teszteredmény és telepítési állapot külön kezelése.
- Objektív, kritikus, bizonyítékalapú audit; a bizonytalanságok jelölése.
- No hype: csak ténylegesen elvégzett ellenőrzés szerepelhet sikeresként.

## Első munkacsomag

A [fejlesztési alap és elfogadási feltételek](docs/DEVELOPMENT-BASELINE.md) rögzítik a javítások sorrendjét és a nyitott tervezési döntéseket.

A szerződésmódosításokat külön fejlesztési ágon, tesztekkel és reviewzható pull requestben kell vezetni. A telepítés külön művelet, külön verzió- és hálózati nyilvántartással.

## Előzmények

A korábbi repók auditforrások; nem tekintendők ennek a repónak automatikusan átvett vagy jóváhagyott implementációinak:

- [gfloV1-00](https://github.com/elanmust-GFLOer/gfloV1-00/tree/92fb2c0be29b9d14dd7af4ccb3aaf08e9888bcdb)
- [gflo-pie](https://github.com/elanmust-GFLOer/gflo-pie/tree/a5595198ea064cad37d54e089eb7f96ba2db667c)
- [GasFeeLoop-](https://github.com/elanmust-GFLOer/GasFeeLoop-/tree/16f5e5aaa52d8022d33cee46cdcbba4e5e49fa7c)

A korábbi szerződések állapotát az új repó létrehozása nem változtatja meg. A migráció és a telepített bytecode ellenőrzése későbbi, külön feladat.
