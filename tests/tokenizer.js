'use strict';

const tokenizer = require('../lib/tokenizer');

const sample = `
ACTION CalculerHeure
	Var	Heure, Minute, Seconde : Numérique
	Var test : Booléen % Et un petit commentaire pour la route ;) %
	Var autreTest, lol(200) : Chaine de caractères
	PROCEDURE EntrerTemps(Var HH : Numérique, Var MM : Numérique, Var SS : Numérique)
		Var encoreUnTest : Booléen
	DEBUT
		Entrer HH, MM, SS
	FINPROCEDURE
DEBUT
	EntrerTemps(Heure, Minute, Seconde)
	Pour i allant de 1 à 5
		Sortir i
	FinPour
	Sortir Heure * 3600 + Minute * 60 + Seconde
FINACTION
`.trim();

console.info(JSON.stringify([ ...(tokenizer(sample, '(test_tokenizer)')) ], null, 2));
