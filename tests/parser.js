'use strict';

const tokenizer = require('../lib/tokenizer');
const parser = require('../lib/parser');

const sample = `
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
`.trim();

const tokens = [ ...(tokenizer(sample, '(test_parser)')) ];
const ast = parser(tokens, '(test_parser)');

console.info(JSON.stringify(ast, null, 2));
