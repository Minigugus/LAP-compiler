# LAP Compiler

> A very simple LAP (pseudo-code) to multiple language (C or JS) compiler created for educationnal purpose.

The LAP compiled by this compiler does not follow a standard.

At the time of writing, the compiler handle token and syntax errors, but doesn't validate the document (it's possible to call an undefined function or variable). Thus, it's possible to use C or JS functions from LAP. In another hand, Expressions are not fully completed and use a work around making expressions compatible only with C-style language.

## Exemple

### Input

```lap
ACTION CalculerHeure
	Var	Heure, Minute, Seconde : Numérique
	Var test : Booléen % Et un petit commentaire pour la route ;) %
	Var autreTest, lol(200) : Chaine de caractères
	PROCEDURE EntrerTemps(Var HH : Numérique, Var MM : Numérique, Var SS : Numérique)
		Var encoreUnTest : Booléen
	DEBUT
		% Appel PROCEDURE SYSTÈME %
		ENTRER HH, MM, SS % Passage de variables par référence %
	FINPROCEDURE
	FONCTION Droite(a : Numérique, b: Numérique, x : Numérique) : Numérique
	DEBUT
		RETOURNER a * x + b
	FINFONCTION
DEBUT
	% Boucle TANT QUE %
	TANT QUE Seconde > 60 FAIRE

		% Affectation %
		Minute = Minute + 1 % Expressions %
		Seconde = Seconde - 60

	FINTANTQUE

	% Boucle POUR %
	POUR i ALLANT DE 1 À 5 PAS 2 FAIRE

		% Condition SI %
		SI i MOD 2 = 0 ET (i MOD 3 = 0 OU i MOD 4 = 0) ALORS % Opérateur MOD, ET et OU %

			% Appel PROCEDURE SYSTÈME %
			SORTIR i % Variable locale (i) %

		SINON

			% Appel PROCEDURE SYSTÈME %
			SORTIR 2 * Droite(2, 3, i) % Appel d'une fonction dans une expression %

		FSI

	FINPOUR

	% Appel PROCEDURE %
	EntrerTemps(Heure, Minute, Seconde)

	% Appel PROCEDURE SYSTÈME %
	SORTIR Heure * 3600 + Minute * 60 + Seconde
FINACTION

```

### Output

#### C

```c
#include <stdio.h>

void EntrerTemps(int* HH, int* MM, int* SS)
{
  // DÉCLARATION DES VARIABLES //
  int encoreUnTest;

  // INSTRUCTIONS //
  printf("HH : "); scanf("%d", &HH);
  printf("MM : "); scanf("%d", &MM);
  printf("SS : "); scanf("%d", &SS);
}

int Droite(int a, int b, int x)
{
  /* (Pas de variables locales) */

  // INSTRUCTIONS //
  return a * x + b;
}

void main()
{
  // DÉCLARATION DES VARIABLES //
  int Heure;
  int Minute;
  int Seconde;
  int test;
  char* autreTest;
  char lol[200];

  // INSTRUCTIONS //
  while (Seconde > 60)
  {
    Minute = Minute + 1;
    Seconde = Seconde - 60;
  }
  for (int i = 1; i < 5; i += 2)
  {
    if (i % 2 == 0 && (i % 3 == 0 || i % 4 == 0))
    {
      printf("i = %d", i);
    }
    else
    {
      printf("2 * Droite (2 , 3 , i) = %d", 2 * Droite (2 , 3 , i));
    }
  }
  EntrerTemps(Heure, Minute, Seconde);
  printf("Heure * 3600 + Minute * 60 + Seconde = %d", Heure * 3600 + Minute * 60 + Seconde);
}
```

#### JS

```js
function EntrerTemps(HH, MM, SS)
{
  // DÉCLARATION DES VARIABLES //
  let encoreUnTest;

  // INSTRUCTIONS //
  HH = prompt("HH : ");
  MM = prompt("MM : ");
  SS = prompt("SS : ");
}

function Droite(a, b, x)
{
  // DÉCLARATION DES VARIABLES //

  // INSTRUCTIONS //
  return a * x + b;
}

// DÉCLARATION DES VARIABLES //
let Heure;
let Minute;
let Seconde;
let test;
let autreTest;
let lol;

// INSTRUCTIONS //
while (Seconde > 60)
{
  Minute = Minute + 1;
  Seconde = Seconde - 60;
}
for (let i = 1; i < 5; i += 2)
{
  if (i % 2 == 0 && (i % 3 == 0 || i % 4 == 0))
  {
    console.log("i = ", i);
  }
  else
  {
    console.log("2 * Droite (2 , 3 , i) = ", 2 * Droite (2 , 3 , i));
  }
}
EntrerTemps(Heure, Minute, Seconde);
console.log("Heure * 3600 + Minute * 60 + Seconde = ", Heure * 3600 + Minute * 60 + Seconde);
```
