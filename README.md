# trn-azure-webapp-nosql

NodeJS webapp, NoSQL adatbázis

## JSON generálás

https://json-generator.com/

Séma:

```bash
[
  '{{repeat(1, 1)}}',
  {
    id: '{{objectId()}}',
    kor: '{{integer(18, 75)}}',
    nev: {
      vezeteknev: '{{random("Nagy","Kovács","Horváth","Tóth","Szabó","Kiss","Molnár","Varga","Farkas","Pap")}}',
        keresztnev: '{{random("Gergő","Petra","Balázs","Krisztián","Anikó","Márton","Zsófia","Bence","Dóra","Gábor",)}}'}
    }
]
```
