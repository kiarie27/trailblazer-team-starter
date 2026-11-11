# Architecture sketch

Fill in "Our product" on Day 2. The worked example shows the practice card.

## Worked example: the Town forecast practice card

```
+------------------------------ the browser ------------------------------+
|                                                                         |
|   Interface                          Service module                     |
|   practice/index.html + app.js  -->  practice/forecast-service.js       |
|   shows the card, reads clicks       (runs in the browser for now)      |
|                                      checks the rules, fetches the      |
|                                      data, shapes the answer            |
|                                                                         |
+-------------------------------------------|-----------------------------+
                                            |  fetch over the internet
                                            v
                          +-----------------------------------+
                          |  Open-Meteo forecast API          |
                          |  a server whose rules you cannot  |
                          |  skip                             |
                          +-----------------------------------+
```

Everything inside the browser box was sent to the user's computer. The user can read it with View Source and can skip it.

- The town list is a rule inside the browser. Anyone can paste an Open-Meteo address with other coordinates, and it works.
- Open-Meteo's own rule (0 to 16 forecast days) lives on its server. Nobody can skip it: ask for 50 days and the server answers "400".

## Our product

Draw your own. Keep the interface and the service module inside the browser box. Put your data source outside it.

```
+------------------------------ the browser ------------------------------+
|                                                                         |
|   Interface                          Service module                     |
|   index.html + app.js           -->  src/service.js                     |
|   job:                               (runs in the browser for now)      |
|                                      job:                               |
|                                                                         |
+-------------------------------------------|-----------------------------+
                                            |
                                            v
                          +-----------------------------------+
                          |  Data source:                     |
                          |  a server whose rules you cannot  |
                          |  skip                             |
                          +-----------------------------------+
```

What must the browser never be trusted to decide in our product?

-

Which of our rules could a user skip, and does that matter?

-
