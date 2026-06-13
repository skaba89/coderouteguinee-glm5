import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function main() {
  const zai = await ZAI.create();
  
  // Build questions list manually from what we know
  const questions = [
    { id: 1, texte: "Que signifie ce panneau ?", options: ["Arrêt obligatoire", "Cédez le passage", "Sens interdit", "Priorité à droite"], explication: "Le panneau STOP impose un arrêt absolu avant de continuer." },
    { id: 2, texte: "Que signifie ce panneau ?", options: ["Interdiction", "Obligation", "Indication", "Danger"], explication: "Un panneau circulaire avec bord rouge indique une interdiction." },
    { id: 3, texte: "Que signifie ce panneau ?", options: ["Arrêt", "Cédez le passage", "Priorité à droite", "Danger"], explication: "Le panneau triangulaire inversé impose de laisser passer les autres véhicules." },
    { id: 4, texte: "Que signifie ce panneau ?", options: ["Interdiction", "Obligation", "Indication", "Priorité"], explication: "Le panneau en losange indique une priorité." },
    { id: 5, texte: "Que signifie ce panneau ?", options: ["Vitesse limitée à 50 km/h", "Vitesse minimale 50 km/h", "Vitesse recommandée 50 km/h", "Fin de limitation"], explication: "Un panneau circulaire avec bord rouge et chiffre indique une limitation de vitesse." },
    { id: 6, texte: "Que signifie ce panneau ?", options: ["Interdiction de dépasser", "Sens interdit aux camions", "Danger poids lourd", "Fin d'interdiction"], explication: "Ce panneau interdit le dépassement." },
    { id: 7, texte: "Que signifie ce panneau ?", options: ["Passage piétons", "Zone scolaire", "Parking", "Arrêt de bus"], explication: "Le panneau bleu indique un passage pour piétons." },
    { id: 8, texte: "Que signifie ce panneau ?", options: ["Obligation de tourner à droite", "Sens obligatoire à droite", "Danger virage à droite", "Interdiction de tourner"], explication: "Le panneau rond bleu avec flèche indique une direction obligatoire." },
    { id: 9, texte: "Que signifie ce panneau ?", options: ["Virage dangereux", "Rond-point", "Carrefour", "Route glissante"], explication: "Le triangle rouge avec flèche courbe signale un virage dangereux." },
    { id: 10, texte: "Que signifie ce panneau ?", options: ["Sens interdit", "Rond-point", "Carrefour à 4 voies", "Cédez le passage"], explication: "Le panneau bleu avec flèches circulaires indique un rond-point." },
  ];
  
  const prompt = `Tu es un traducteur professionnel expert en langues nationales guinéennes. Traduis les questions suivantes du code de la route en 3 langues : SOUSSOU (Sossoxui), POULAR (Pulaar/Fulfulde), et MALINKÉ (Maninka).

RÈGLES IMPORTANTES :
- Utilise l'orthographe standard de chaque langue
- Pour le Soussou : vocabulaire authentique de la région de Conakry/Kindia/Boké
- Pour le Poular : orthographe latine standard avec ɓ, ɗ, ɲ, ŋ, ƴ
- Pour le Malinké : orthographe latine standard avec ɛ, ɔ, ɲ, ŋ
- Les termes techniques peuvent garder le mot français entre guillemets s'il n'y a pas d'équivalent
- Traduis le SENS, pas mot à mot
- Les options doivent correspondre EXACTEMENT aux 4 options françaises dans le même ordre

QUESTIONS :
${questions.map(q => `Q${q.id}: ${q.texte}\nOptions: ${q.options.join(' | ')}\nExplication: ${q.explication}`).join('\n\n')}

RÉPONSES AU FORMAT JSON UNIQUEMENT :
{"Q1":{"ss":{"texte":"...","options":["...","...","...","..."],"explication":"..."},"fu":{"texte":"...","options":["...","...","...","..."],"explication":"..."},"ml":{"texte":"...","options":["...","...","...","..."],"explication":"..."}}}`;

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'system', content: 'Tu es un linguiste expert en langues nationales de Guinée. Tu traduis en respectant la grammaire et le vocabulaire authentique. Réponds UNIQUEMENT en JSON.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2,
  });

  const responseText = completion.choices[0]?.message?.content || '';
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    fs.writeFileSync('/home/z/my-project/download/translations_batch1.json', jsonMatch[0]);
    console.log('Batch 1 saved successfully');
  } else {
    fs.writeFileSync('/home/z/my-project/download/translations_batch1_raw.txt', responseText);
    console.log('Batch 1 raw saved (no JSON found)');
  }
}

main().catch(console.error);
