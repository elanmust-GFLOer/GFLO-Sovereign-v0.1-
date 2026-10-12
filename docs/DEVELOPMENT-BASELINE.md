# Fejlesztési alap — 2026-10-12

Státusz: tervezet. A repó kijelölése elfogadott; az alábbi doktrínát érintő változtatások javaslatok, nem végleges protokollszabályok.

## Cél és határ

Első mérföldkő: Verified Contribution Core.

Felhasználói regisztráció → hozzájárulás benyújtása → jogosult ellenőrző döntése → egyszeri XP-jóváírás → visszakereshető eredmény.

Az első kör a specifikáció és a szerződésmag helyessége. AI-alapú értékelés, staking, tokenes governance és régi állapot migrációja külön munkacsomag. Nincs automatikus mainnet- vagy Sepolia-telepítés.

## Javasolt fogalmi modell — megerősítendő

- Path: Sovereign / Reformer / Praxis, egymással nem rangsorolt irányok.
- Tier: ellenőrzött hozzájárulásból származó fejlődési szint; küszöbök még nincsenek véglegesítve.
- XP: nem átruházható hozzájárulási pont, egységes egészpontos mértékegységgel.
- Stake és burn: az első mag XP-jét nem módosítja; esetleges későbbi előnyük külön specifikációt igényel.
- A path későbbi változtathatósága, az XP-korrekció/visszavonás és a vitakezelés szabálya még nyitott.

Ezek az ajánlott alapok eltérnek néhány korábbi szerződés path-alapú előrelépésétől. A szabályokat implementáció előtt véglegesíteni kell.

## Bizalmi határok

- Felhasználó: saját regisztráció és bizonyíték benyújtása; tetszőleges XP kibocsátására nincs jogosultsága.
- Ellenőrző: a meghatározott jutalmazási szabály szerint fogad el hozzájárulást. Az engedélyezett hívó státusz önmagában nem bizonyítja a munka valódiságát.
- Admin: ellenőrzői jogosultságok kezelése. A biztonságos adminátadásnak tényleges szerződésfunkciónak kell lennie.
- Szerződés: jogosultság, állapotátmenet, egyszeri elszámolás és események kikényszerítése.
- Felület/backend: nem lehet kizárólagos biztonsági védelem egy közvetlenül hívható szerződésfunkció előtt.

Személyes adat és a bizonyíték teljes tartalma ne kerüljön automatikusan nyilvános on-chain tárolásba. A bizonyítékazonosító és az off-chain tárolás kapcsolatát külön definiálni kell.

## Javítási sorrend és elfogadási feltételek

| ID | Munka | Kötelező ellenőrzés |
|---|---|---|
| CORE-01 | Minden XP-jóváírási útvonal védelme | Normál felhasználó saját vagy más cím XP-jét sem növelheti; visszavont ellenőrző hívása elutasított. |
| CORE-02 | Egységes XP-egység és küszöbök | Modulok között 1 XP ugyanazt jelenti; küszöb alatt/pontosan/felett célzott tesztek. |
| CORE-03 | Egyszeri hozzájárulás-elszámolás | Azonos hozzájárulás újraküldve, más ellenőrzőn vagy más belépési útvonalon sem jutalmazható újra. |
| CORE-04 | Path és tier konzisztencia | A végleges modell minden megengedett és tiltott állapotátmenete tesztelt. |
| CORE-05 | Adminátadás | Csak jogosult admin kezdeményezhet; az új admin elfogadása és a régi admin jogvesztése tesztelt. |
| CORE-06 | Modulkapcsolatok | Az engedélyezés külön adminlépés; jogosulatlan önengedélyezés és upgrade elutasított. |
| CORE-07 | Nyomon követhetőség | Jóváírásból visszakereshető a címzett, ellenőrző, pontmennyiség és hozzájárulásazonosító. |

A CORE-03 tervezésénél külön kell választani a tranzakció/aláírás újrajátszását és ugyanazon munka új azonosítóval történő benyújtását. Az előbbit a nonce/idempotencia kezeli; az utóbbihoz ellenőrzési és vitakezelési eljárás is szükséges. A címenkénti limit nem emberenkénti Sybil-védelem.

## Korábbi audit megállapításai — forrásállapot, nem élő hálózati igazolás

- GasFeeLoop- @ 16f5e5a: nyilvános gainXP/addXP és upgradeTier; XP- és burn-feltételek megkerülhetők.
- gflo-pie @ a559519, contracts/PIECore.sol: gainXP nyilvános. A gyökérben lévő PIECore.sol eltérő változat; ezeket nem szabad összekeverni.
- gfloV1-00 @ 92fb2c0: XP-függvények jogosultsághoz kötöttek; aláírt grant és nonce szerepel. Kiindulópontként vizsgálható, kész alapnak nem minősített.
- gfloV1-00: README szerinti utólagos multisig-átadáshoz nincs tulajdonosváltó függvény a vizsgált PIECore-ban.
- GasFeeLoop-/GFLOIgnition: konstruktorból történő önengedélyezés nem kompatibilis a vizsgált PIECore-változatokkal.
- GasFeeLoop-/GasFeeLoop: 10^18 skálázású XP-konvenció; PIECore-küszöbök 1000/5000 nyers egységek. Együttes használatkor egységhiba veszélye.
- A stake-szorzó korlátozza, de nem szünteti meg a tőke előnyét; a korábbi általános „csak ~33%” állítás nem következik a képletből.

Az audit statikus forrásvizsgálat és képletszámítás volt. EVM-futtatási eredmény és deployed-bytecode egyezés nem áll rendelkezésre.

## Fejlesztési és kiadási kapu

1. A nyitott működési szabályok véglegesítése és verziózása.
2. Elkülönített fejlesztési ág, a hibákat tiltó regressziós tesztek és minimális implementáció.
3. Rögzített fordító-/függőségverziók, reprodukálható build és sikeres CI.
4. Review: kritikus/magas hibák rendezése; megmaradó bizalmi feltételezések dokumentálása.
5. Külön teszthálózati telepítés: chain ID, címek, commit, fordítóbeállítások és adminjogok nyilvántartása.
6. A régi állapot importját vagy migrációját csak külön megtervezett és ellenőrzött folyamat végezheti.

## Ellenőrzési napló

- Dokumentáció létrehozva.
- Izolált ContributionLedger prototípus implementálva ezen az ágon; teljes PIECore még nincs.
- Solidity 0.8.20 fordítás és 9 helyi EVM-teszt sikeres (2026-10-12); részletek: [CORE-LEDGER-DRAFT.md](CORE-LEDGER-DRAFT.md).
- CI sikeres: még nincs.
- Telepítés vagy migráció: nem.
