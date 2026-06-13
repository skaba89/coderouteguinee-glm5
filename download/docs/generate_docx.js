const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, PageBreak, Header, Footer, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  TableOfContents, TabStopType, TabStopPosition,
} = require("docx");
const fs = require("fs");
const path = require("path");

// ─── COLORS ──────────────────────────────────────────────────────
const C = {
  primary: "1A2332",
  red: "CE1126",
  yellow: "FCD116",
  green: "009460",
  accent: "2C5F8A",
  text: "1A2332",
  textMuted: "5A6270",
  textLight: "7A8290",
  bgPage: "FFFFFF",
  bgSection: "F7F8FA",
  border: "D0D5DD",
  tableStripe: "F5F7FA",
  tableHeader: "1A2332",
};

// ─── HELPERS ─────────────────────────────────────────────────────
function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200, line: 312 },
    children: [
      new TextRun({ text, bold: true, size: 28, font: "Calibri", color: C.primary }),
    ],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120, line: 312 },
    children: [
      new TextRun({ text, bold: true, size: 22, font: "Calibri", color: C.accent }),
    ],
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 160, after: 80, line: 312 },
    children: [
      new TextRun({ text, bold: true, size: 20, font: "Calibri", color: C.primary }),
    ],
  });
}

function bodyText(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: 312 },
    children: [
      new TextRun({ text, size: 21, font: "Calibri", color: C.text }),
    ],
  });
}

function bodyEN(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 140, line: 312 },
    indent: { left: 200 },
    children: [
      new TextRun({ text, size: 19, font: "Calibri", italics: true, color: C.textMuted }),
    ],
  });
}

function bulletItem(text) {
  return new Paragraph({
    spacing: { after: 60, line: 312 },
    indent: { left: 480, hanging: 240 },
    children: [
      new TextRun({ text: "\u2022 ", size: 21, font: "Calibri", color: C.green }),
      new TextRun({ text, size: 21, font: "Calibri", color: C.text }),
    ],
  });
}

function makeTable(headers, rows, colPercents) {
  const totalPct = colPercents || headers.map(() => 100 / headers.length);
  const borderStyle = {
    top: { style: BorderStyle.SINGLE, size: 1, color: C.border },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: C.border },
    left: { style: BorderStyle.SINGLE, size: 1, color: C.border },
    right: { style: BorderStyle.SINGLE, size: 1, color: C.border },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: C.border },
    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: C.border },
  };

  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map((h, i) =>
      new TableCell({
        width: { size: totalPct[i], type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: C.tableHeader },
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new Paragraph({
          children: [new TextRun({ text: h, bold: true, size: 19, font: "Calibri", color: "FFFFFF" })],
        })],
      })
    ),
  });

  const dataRows = rows.map((row, rowIdx) =>
    new TableRow({
      cantSplit: true,
      children: row.map((cell, i) =>
        new TableCell({
          width: { size: totalPct[i], type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: rowIdx % 2 === 0 ? "FFFFFF" : C.tableStripe },
          margins: { top: 50, bottom: 50, left: 100, right: 100 },
          children: [new Paragraph({
            children: [new TextRun({ text: String(cell), size: 19, font: "Calibri", color: C.text })],
          })],
        })
      ),
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderStyle,
    rows: [headerRow, ...dataRows],
  });
}

function imageIfExists(imgPath, caption, widthPx) {
  const fullPath = path.resolve(imgPath);
  if (!fs.existsSync(fullPath)) return [];
  const imgBuffer = fs.readFileSync(fullPath);
  // Simple approach: use fixed width, calculate height from PNG header
  let w = widthPx || 580;
  let h = 400;
  try {
    // Read PNG dimensions
    if (imgBuffer[0] === 0x89 && imgBuffer[1] === 0x50) {
      w = imgBuffer.readUInt32BE(16);
      h = imgBuffer.readUInt32BE(20);
      const displayW = widthPx || 580;
      const ratio = h / w;
      h = Math.round(displayW * ratio);
      w = displayW;
    }
  } catch (e) {}
  // Cap height
  if (h > 650) { const ratio2 = 650 / h; h = 650; w = Math.round(w * ratio2); }

  const result = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 80 },
      children: [new ImageRun({ data: imgBuffer, transformation: { width: w, height: h }, type: "png" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: caption, italics: true, size: 17, font: "Calibri", color: C.textLight })],
    }),
  ];
  return result;
}

function redLine() {
  return new Paragraph({
    spacing: { after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.red } },
    children: [],
  });
}

// ─── BUILD DOCUMENT ──────────────────────────────────────────────
const diagramsDir = path.join(__dirname, "..", "diagrams");

const doc = new Document({
  title: "CodeRoute Guin\u00e9e - Cahier des Charges",
  creator: "CodeRoute Guin\u00e9e",
  description: "Sp\u00e9cification technique de la plateforme CodeRoute Guin\u00e9e",
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 21, color: C.text },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: {
        run: { font: "Calibri", size: 28, bold: true, color: C.primary },
        paragraph: { spacing: { before: 360, after: 200 } },
      },
      heading2: {
        run: { font: "Calibri", size: 22, bold: true, color: C.accent },
        paragraph: { spacing: { before: 240, after: 120 } },
      },
      heading3: {
        run: { font: "Calibri", size: 20, bold: true, color: C.primary },
        paragraph: { spacing: { before: 160, after: 80 } },
      },
    },
  },
  numbering: {
    config: [{
      reference: "bullet-list",
      levels: [{
        level: 0,
        format: "bullet",
        text: "\u2022",
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 480, hanging: 240 } } },
      }],
    }],
  },
  sections: [
    // ─── COVER SECTION ──────────────────────────────────────────
    {
      properties: {
        page: {
          margin: { top: 0, bottom: 0, left: 0, right: 0 },
          size: { width: 11906, height: 16838 },
        },
      },
      children: [
        new Paragraph({ spacing: { before: 2000 } }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: { left: 1200 },
          children: [new TextRun({ text: "CAHIER DES CHARGES \u00b7 SP\u00c9CIFICATION TECHNIQUE", size: 20, font: "Calibri", color: C.red, characterSpacing: 80 })],
        }),
        new Paragraph({ spacing: { before: 400 } }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: { left: 1200 },
          children: [new TextRun({ text: "CodeRoute", size: 72, bold: true, font: "Calibri", color: C.primary })],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: { left: 1200 },
          children: [new TextRun({ text: "Guin\u00e9e", size: 80, bold: true, font: "Calibri", color: C.green })],
        }),
        new Paragraph({ spacing: { before: 400 } }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: { left: 1200 },
          children: [new TextRun({ text: "Plateforme num\u00e9rique nationale pour l\u2019examen th\u00e9orique du code de la route.", size: 22, font: "Calibri", color: C.textMuted })],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: { left: 1200 },
          children: [new TextRun({ text: "Syst\u00e8me s\u00e9curis\u00e9, tra\u00e7able et connect\u00e9 aux autorit\u00e9s.", size: 22, font: "Calibri", color: C.textMuted })],
        }),
        new Paragraph({ spacing: { before: 800 } }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: { left: 1200 },
          children: [
            new TextRun({ text: "Projet : ", size: 20, font: "Calibri", bold: true, color: C.primary }),
            new TextRun({ text: "CodeRoute Guin\u00e9e", size: 20, font: "Calibri", color: C.text }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: { left: 1200 },
          children: [
            new TextRun({ text: "Version : ", size: 20, font: "Calibri", bold: true, color: C.primary }),
            new TextRun({ text: "1.0", size: 20, font: "Calibri", color: C.text }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: { left: 1200 },
          children: [
            new TextRun({ text: "Date : ", size: 20, font: "Calibri", bold: true, color: C.primary }),
            new TextRun({ text: "Juin 2026", size: 20, font: "Calibri", color: C.text }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: { left: 1200 },
          children: [
            new TextRun({ text: "Statut : ", size: 20, font: "Calibri", bold: true, color: C.primary }),
            new TextRun({ text: "Brouillon pour validation", size: 20, font: "Calibri", color: C.text }),
          ],
        }),
        new Paragraph({ spacing: { before: 1600 } }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: { left: 1200 },
          children: [new TextRun({ text: "R\u00e9publique de Guin\u00e9e", size: 20, font: "Calibri", bold: true, color: C.primary })],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: { left: 1200 },
          children: [new TextRun({ text: "Minist\u00e8re des Transports \u00b7 Direction G\u00e9n\u00e9rale de la S\u00e9curit\u00e9 Routi\u00e8re", size: 18, font: "Calibri", color: C.textMuted })],
        }),
        // Page break after cover
        new Paragraph({ children: [new PageBreak()] }),
      ],
    },

    // ─── TOC + BODY SECTION ─────────────────────────────────────
    {
      properties: {
        page: {
          margin: { top: 1417, bottom: 1417, left: 1701, right: 1417 },
          size: { width: 11906, height: 16838 },
          pageNumbers: { start: 1 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "CodeRoute Guin\u00e9e \u2014 Cahier des Charges", size: 16, font: "Calibri", color: C.textLight, italics: true })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "R\u00e9publique de Guin\u00e9e  |  ", size: 16, font: "Calibri", color: C.textLight }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Calibri", color: C.textLight }),
            ],
          })],
        }),
      },
      children: [
        // ─── TABLE OF CONTENTS ────────────────────────────────
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "Table des mati\u00e8res", size: 32, bold: true, font: "Calibri", color: C.primary })],
        }),
        new TableOfContents("Table des mati\u00e8res", {
          hyperlink: true,
          headingStyleRange: "1-3",
        }),
        new Paragraph({
          spacing: { before: 200, after: 100 },
          children: [new TextRun({ text: "Pour mettre \u00e0 jour la table des mati\u00e8res : clic droit \u2192 \u00ab Mettre \u00e0 jour les champs \u00bb", size: 17, font: "Calibri", italics: true, color: C.textLight })],
        }),
        new Paragraph({ children: [new PageBreak()] }),

        // ═══════════════════════════════════════════════════════
        // SECTION 1: EXECUTIVE SUMMARY
        // ═══════════════════════════════════════════════════════
        heading1("1. R\u00e9sum\u00e9 ex\u00e9cutif"),
        redLine(),
        bodyText("CodeRoute Guin\u00e9e est une plateforme num\u00e9rique nationale con\u00e7ue pour moderniser et s\u00e9curiser le processus d\u2019examen th\u00e9orique du code de la route en R\u00e9publique de Guin\u00e9e. Ce projet strat\u00e9gique vise \u00e0 remplacer les proc\u00e9dures manuelles et opaques par un syst\u00e8me digitalis\u00e9, tra\u00e7able et connect\u00e9 aux autorit\u00e9s comp\u00e9tentes, dans le but de r\u00e9duire significativement la fraude, les faux permis, les lenteurs administratives et le manque de statistiques nationales sur la s\u00e9curit\u00e9 routi\u00e8re."),
        bodyText("La plateforme permettra aux candidats de s\u2019inscrire en ligne, de r\u00e9server une session d\u2019examen dans un centre agr\u00e9\u00e9, de payer via Mobile Money ou carte bancaire, de passer l\u2019examen sur des postes informatis\u00e9s s\u00e9curis\u00e9s, et de recevoir automatiquement leurs r\u00e9sultats. Le dispositif anti-fraude, au c\u0153ur du syst\u00e8me, int\u00e8gre la v\u00e9rification d\u2019identit\u00e9 par QR code, la photographie en temps r\u00e9el, le tirage al\u00e9atoire des questions, la surveillance par webcam et la d\u00e9tection automatique des anomalies."),
        bodyText("Le projet adopte un mod\u00e8le de partenariat public-priv\u00e9 (PPP), o\u00f9 l\u2019\u00c9tat assure la r\u00e9glementation et le contr\u00f4le, la plateforme fournit la technologie et la s\u00e9curit\u00e9, et les centres agr\u00e9\u00e9s assurent l\u2019accueil physique et la surveillance. Ce mod\u00e8le s\u2019inspire des bonnes pratiques fran\u00e7aises tout en int\u00e9grant des mesures anti-fraude renforc\u00e9es d\u00e8s la conception, \u00e9vitant les \u00e9cueils observ\u00e9s dans certains centres priv\u00e9s fran\u00e7ais."),
        bodyEN("Executive Summary \u2014 CodeRoute Guin\u00e9e is a national digital platform designed to modernize and secure the theoretical driving exam process in the Republic of Guinea. This strategic project aims to replace manual and opaque procedures with a digitalized, traceable system connected to the competent authorities, significantly reducing fraud, fake licenses, administrative delays, and the lack of national road safety statistics."),

        heading3("Chiffres cl\u00e9s estim\u00e9s"),
        makeTable(
          ["Indicateur", "Valeur cible"],
          [
            ["R\u00e9duction de la fraude", "> 90%"],
            ["Temps de d\u00e9livrance des r\u00e9sultats", "Imm\u00e9diat (vs. jours/semaines)"],
            ["Centres agr\u00e9\u00e9s (Phase 1)", "10-15 centres"],
            ["Candidats trait\u00e9s par an (objectif)", "> 50 000"],
            ["Taux de tra\u00e7abilit\u00e9 des examens", "100%"],
          ],
          [55, 45]
        ),

        // ═══════════════════════════════════════════════════════
        // SECTION 2: CONTEXTE ET PROBLEMATIQUE
        // ═══════════════════════════════════════════════════════
        heading1("2. Contexte et probl\u00e9matique"),
        redLine(),
        bodyText("La R\u00e9publique de Guin\u00e9e fait face \u00e0 des d\u00e9fis majeurs en mati\u00e8re de s\u00e9curit\u00e9 routi\u00e8re. Le syst\u00e8me actuel de d\u00e9livrance du permis de conduire souffre de lacunes structurelles importantes qui compromettent la s\u00e9curit\u00e9 des usagers de la route et la cr\u00e9dibilit\u00e9 de l\u2019administration. Les examens du code de la route sont encore largement organis\u00e9s de mani\u00e8re manuelle, sans tra\u00e7abilit\u00e9 num\u00e9rique, ce qui ouvre la porte \u00e0 de multiples formes de fraude et de corruption."),

        heading2("2.1 Probl\u00e8mes identifi\u00e9s"),
        heading3("Fraude et faux permis"),
        bodyText("L\u2019absence de syst\u00e8me num\u00e9rique s\u00e9curis\u00e9 permet la falsification des r\u00e9sultats, la substitution de candidats lors des examens, et la d\u00e9livrance de faux permis de conduire. Ces pratiques mettent en danger la vie des citoyens et minent la confiance dans les institutions."),
        heading3("Examens non trac\u00e9s"),
        bodyText("Aucun registre num\u00e9rique fiable ne permet de suivre les examens pass\u00e9s, les r\u00e9sultats obtenus, ou les centres o\u00f9 les examens ont \u00e9t\u00e9 effectu\u00e9s. Cette opacit\u00e9 rend tout audit ou contr\u00f4le quasiment impossible et facilite la corruption."),
        heading3("Lenteurs administratives"),
        bodyText("Les processus manuels de v\u00e9rification des dossiers, de planification des sessions, et de transmission des r\u00e9sultats aux autorit\u00e9s comp\u00e9tentes g\u00e9n\u00e8rent des d\u00e9lais inacceptables pour les candidats et un surcro\u00eet de travail pour les agents administratifs."),
        heading3("D\u00e9placements inutiles"),
        bodyText("Les candidats sont souvent contraints de se d\u00e9placer physiquement pour s\u2019inscrire, v\u00e9rifier leur dossier, ou obtenir leurs r\u00e9sultats. Ces d\u00e9placements repr\u00e9sentent un co\u00fbt significatif dans un pays o\u00f9 les infrastructures de transport restent limit\u00e9es."),
        heading3("Absence de statistiques nationales"),
        bodyText("Sans syst\u00e8me centralis\u00e9, il est impossible de produire des statistiques fiables sur le nombre de candidats, les taux de r\u00e9ussite par r\u00e9gion, ou les questions les plus \u00e9chou\u00e9es. Cette absence de donn\u00e9es emp\u00eache toute politique bas\u00e9e sur les preuves en mati\u00e8re de s\u00e9curit\u00e9 routi\u00e8re."),

        heading2("2.2 Justification de la digitalisation"),
        bodyText("La digitalisation du processus d\u2019examen du code de la route n\u2019est pas une simple modernisation technologique : c\u2019est une n\u00e9cessit\u00e9 strat\u00e9gique pour la s\u00e9curit\u00e9 routi\u00e8re en Guin\u00e9e. En s\u2019appuyant sur les technologies num\u00e9riques et mobiles, le pays peut r\u00e9sorber les failles du syst\u00e8me actuel tout en cr\u00e9ant un \u00e9cosyst\u00e8me de centres agr\u00e9\u00e9s g\u00e9n\u00e9rateur d\u2019emplois et de revenus. L\u2019exemple fran\u00e7ais, malgr\u00e9 ses propres d\u00e9fis en mati\u00e8re de fraude dans certains centres priv\u00e9s, d\u00e9montre que la d\u00e9l\u00e9gation \u00e0 des op\u00e9rateurs agr\u00e9\u00e9s fonctionne lorsqu\u2019elle est accompagn\u00e9e de mesures anti-fraude robustes d\u00e8s la conception."),
        bodyText("La Guin\u00e9e dispose d\u2019atouts consid\u00e9rables pour r\u00e9ussir cette transition : une p\u00e9n\u00e9tration mobile importante (Orange Money et MTN Mobile Money sont largement r\u00e9pandus), une jeunesse connect\u00e9e et dynamique, et une volont\u00e9 politique de modernisation administrative. Le projet CodeRoute Guin\u00e9e s\u2019inscrit dans cette dynamique en proposant une solution cl\u00e9 en main, s\u00e9curis\u00e9e et \u00e9volutive, adapt\u00e9e au contexte guin\u00e9en."),

        // ═══════════════════════════════════════════════════════
        // SECTION 3: OBJECTIFS
        // ═══════════════════════════════════════════════════════
        heading1("3. Objectifs du projet"),
        redLine(),
        heading2("3.1 Objectifs primaires"),
        bulletItem("\u00c9liminer la fraude lors des examens du code de la route gr\u00e2ce \u00e0 un dispositif anti-fraude int\u00e9gr\u00e9."),
        bulletItem("Garantir la tra\u00e7abilit\u00e9 compl\u00e8te de chaque examen, de l\u2019inscription \u00e0 la transmission du r\u00e9sultat."),
        bulletItem("R\u00e9duire les d\u00e9lais de d\u00e9livrance des r\u00e9sultats de plusieurs jours \u00e0 un traitement imm\u00e9diat."),
        bulletItem("Cr\u00e9er un r\u00e9seau national de centres agr\u00e9\u00e9s, g\u00e9ographiquement accessible et encadr\u00e9."),
        bulletItem("Produire des statistiques nationales fiables pour orienter la politique de s\u00e9curit\u00e9 routi\u00e8re."),

        heading2("3.2 Objectifs secondaires"),
        bulletItem("Connecter les r\u00e9sultats au syst\u00e8me de permis biom\u00e9trique national."),
        bulletItem("Faciliter l\u2019acc\u00e8s des candidats via le paiement Mobile Money (Orange Money, MTN)."),
        bulletItem("R\u00e9duire les d\u00e9placements physiques gr\u00e2ce \u00e0 l\u2019inscription et la r\u00e9servation en ligne."),
        bulletItem("Fournir aux auto-\u00e9coles des outils de suivi et de pr\u00e9paration de leurs \u00e9l\u00e8ves."),
        bulletItem("Cr\u00e9er un \u00e9cosyst\u00e8me \u00e9conomique autour des centres agr\u00e9\u00e9s (emplois, commissions)."),
        bulletItem("Sensibiliser \u00e0 la s\u00e9curit\u00e9 routi\u00e8re \u00e0 travers des tests d\u2019entra\u00eenement accessibles."),

        // ═══════════════════════════════════════════════════════
        // SECTION 4: ACTEURS
        // ═══════════════════════════════════════════════════════
        heading1("4. Acteurs du syst\u00e8me"),
        redLine(),
        bodyText("La plateforme CodeRoute Guin\u00e9e est con\u00e7ue autour de cinq acteurs principaux, chacun disposant d\u2019un espace d\u00e9di\u00e9 avec des fonctionnalit\u00e9s sp\u00e9cifiques adapt\u00e9es \u00e0 son r\u00f4le dans l\u2019\u00e9cosyst\u00e8me. Cette architecture multi-acteurs garantit la s\u00e9paration des responsabilit\u00e9s, la tra\u00e7abilit\u00e9 des actions et le contr\u00f4le crois\u00e9, \u00e9l\u00e9ments essentiels pour la pr\u00e9vention de la fraude."),

        heading2("4.1 Candidat"),
        bulletItem("Cr\u00e9er un compte avec pi\u00e8ces d\u2019identit\u00e9 et choisir une cat\u00e9gorie de permis (A, B, C, D, E)"),
        bulletItem("R\u00e9server une session d\u2019examen dans un centre agr\u00e9\u00e9"),
        bulletItem("Payer en ligne ou via Mobile Money et recevoir une convocation avec QR code"),
        bulletItem("Passer l\u2019examen dans un centre agr\u00e9\u00e9 et recevoir son r\u00e9sultat automatiquement"),

        heading2("4.2 Auto-\u00e9cole"),
        bulletItem("Inscrire ses \u00e9l\u00e8ves, suivre leur progression et r\u00e9server des cr\u00e9neaux"),
        bulletItem("Consulter les r\u00e9sultats et pr\u00e9parer les candidats avec des tests blancs"),
        bulletItem("G\u00e9rer ses paiements, commissions et facturation"),

        heading2("4.3 Centre agr\u00e9\u00e9"),
        bulletItem("G\u00e9rer les salles, postes d\u2019examen et planning des sessions"),
        bulletItem("V\u00e9rifier l\u2019identit\u00e9 du candidat (QR code, pi\u00e8ce d\u2019identit\u00e9)"),
        bulletItem("Surveiller l\u2019examen en temps r\u00e9el, lancer les sessions et transmettre les r\u00e9sultats"),

        heading2("4.4 Autorit\u00e9 nationale"),
        bulletItem("Agr\u00e9er ou suspendre un centre, auditer les sessions"),
        bulletItem("G\u00e9rer la banque officielle de questions et contr\u00f4ler les fraudes"),
        bulletItem("Suivre les statistiques nationales et connecter les r\u00e9sultats au permis"),

        heading2("4.5 Super administrateur"),
        bulletItem("G\u00e9rer les utilisateurs, r\u00f4les, centres et paiements"),
        bulletItem("Superviser les examens, logs, audits et alertes de fraude"),
        bulletItem("Configurer les param\u00e8tres nationaux"),

        // ═══════════════════════════════════════════════════════
        // SECTION 5: PARCOURS CANDIDAT
        // ═══════════════════════════════════════════════════════
        heading1("5. Parcours candidat complet"),
        redLine(),
        bodyText("Le parcours candidat constitue le c\u0153ur de l\u2019exp\u00e9rience utilisateur de la plateforme. Il a \u00e9t\u00e9 con\u00e7u pour \u00eatre \u00e0 la fois simple et s\u00e9curis\u00e9, en huit \u00e9tapes cl\u00e9s allant de l\u2019inscription \u00e0 la transmission du r\u00e9sultat au syst\u00e8me de permis biom\u00e9trique."),

        ...imageIfExists(path.join(diagramsDir, "candidate-journey.png"), "Figure 1 : Parcours complet du candidat"),

        heading2("\u00c9tape 1 : Inscription"),
        bodyText("Le candidat cr\u00e9e son compte avec : nom, pr\u00e9nom, date de naissance, num\u00e9ro d\u2019identit\u00e9, t\u00e9l\u00e9phone, email, ville, cat\u00e9gorie de permis, photo, justificatif d\u2019identit\u00e9. Le syst\u00e8me g\u00e9n\u00e8re un num\u00e9ro candidat unique, par exemple : GN-CODE-2026-000001."),
        heading2("\u00c9tape 2 : V\u00e9rification"),
        bodyText("Le dossier peut \u00eatre v\u00e9rifi\u00e9 par : une auto-\u00e9cole, un centre agr\u00e9\u00e9, l\u2019administration, ou automatiquement avec contr\u00f4le documentaire."),
        heading2("\u00c9tape 3 : Choix du centre"),
        bodyText("Le candidat choisit la r\u00e9gion, la ville, le centre agr\u00e9\u00e9, la date, l\u2019heure et la cat\u00e9gorie d\u2019examen. Exemple : Conakry > Kaloum > Centre Agr\u00e9\u00e9 RouteSafe Kaloum > 20 juin 2026 > 10h00."),
        heading2("\u00c9tape 4 : Paiement"),
        bodyText("Paiements possibles : Orange Money, MTN Mobile Money, carte bancaire, paiement bancaire, paiement guichet, bon de paiement auto-\u00e9cole."),
        heading2("\u00c9tape 5 : Convocation"),
        bodyText("Le candidat re\u00e7oit : un QR code, le centre, l\u2019heure, les consignes et les documents \u00e0 pr\u00e9senter."),
        heading2("\u00c9tape 6 : Passage de l\u2019examen"),
        bodyText("Dans le centre : v\u00e9rification pi\u00e8ce d\u2019identit\u00e9, scan QR code, photo instantan\u00e9e, affectation automatique \u00e0 un poste, questions tir\u00e9es al\u00e9atoirement, dur\u00e9e limit\u00e9e, correction automatique."),
        heading2("\u00c9tape 7 : R\u00e9sultat"),
        bodyText("Le r\u00e9sultat est g\u00e9n\u00e9r\u00e9 imm\u00e9diatement ou apr\u00e8s validation : admis/ajourn\u00e9, score, date, centre, r\u00e9f\u00e9rence d\u2019examen, certificat num\u00e9rique."),
        heading2("\u00c9tape 8 : Transmission au permis"),
        bodyText("Si le candidat est admis, son r\u00e9sultat est transmis au syst\u00e8me de permis biom\u00e9trique ou \u00e0 l\u2019administration comp\u00e9tente."),

        // ═══════════════════════════════════════════════════════
        // SECTION 6: FONCTIONNALITES
        // ═══════════════════════════════════════════════════════
        heading1("6. Fonctionnalit\u00e9s principales"),
        redLine(),
        bodyText("La plateforme est structur\u00e9e autour de sept modules fonctionnels couvrant l\u2019ensemble du processus, de l\u2019inscription du candidat \u00e0 la g\u00e9n\u00e9ration des statistiques nationales."),

        heading2("6.1 Module Candidat"),
        bulletItem("Inscription en ligne avec upload de documents"),
        bulletItem("Tableau de bord candidat personnalis\u00e9 et r\u00e9servation de session"),
        bulletItem("Paiement int\u00e9gr\u00e9 (Mobile Money, carte, virement)"),
        bulletItem("Convocation avec QR code s\u00e9curis\u00e9"),
        bulletItem("Historique des examens et r\u00e9sultats t\u00e9l\u00e9chargeables"),
        bulletItem("Tests d\u2019entra\u00eenement et notifications SMS / WhatsApp / email"),

        heading2("6.2 Module Examen"),
        bulletItem("Banque officielle de questions g\u00e9r\u00e9e par l\u2019administration"),
        bulletItem("Questions par cat\u00e9gorie (A, B, C, D, E) avec images, vid\u00e9os et audio"),
        bulletItem("Tirage al\u00e9atoire s\u00e9curis\u00e9 et chronom\u00e8tre configurable"),
        bulletItem("Correction automatique et verrouillage apr\u00e8s soumission"),

        heading2("6.3 Module Centre agr\u00e9\u00e9"),
        bulletItem("Gestion des salles, postes et planning des sessions"),
        bulletItem("Contr\u00f4le de pr\u00e9sence par scan QR code et supervision en temps r\u00e9el"),
        bulletItem("Rapport de session automatique et journal d\u2019incidents"),

        heading2("6.4 Module Auto-\u00e9cole"),
        bulletItem("Gestion des \u00e9l\u00e8ves, inscription group\u00e9e, tests blancs"),
        bulletItem("Suivi des r\u00e9sultats, statistiques de r\u00e9ussite et facturation"),

        heading2("6.5 Module Administration"),
        bulletItem("Agr\u00e9ment et suspension des centres, audit des sessions"),
        bulletItem("Statistiques nationales, suivi des fraudes et export Excel / PDF"),
        bulletItem("API vers le syst\u00e8me national de permis"),

        heading2("6.6 Module Paiement"),
        bulletItem("Paiement Mobile Money (Orange Money, MTN), bancaire, guichet"),
        bulletItem("Re\u00e7us automatiques, rapprochement financier et commissions"),

        // ═══════════════════════════════════════════════════════
        // SECTION 7: ANTI-FRAUDE
        // ═══════════════════════════════════════════════════════
        heading1("7. Module anti-fraude"),
        redLine(),
        bodyText("Le module anti-fraude constitue le pilier le plus critique de la plateforme CodeRoute Guin\u00e9e. Contrairement au mod\u00e8le fran\u00e7ais o\u00f9 les dispositifs anti-fraude ont \u00e9t\u00e9 ajout\u00e9s apr\u00e8s coup, la conception de CodeRoute Guin\u00e9e int\u00e8gre ces mesures d\u00e8s l\u2019origine. Cette approche proactive permet de pr\u00e9venir les failles plut\u00f4t que de les corriger, en s\u2019appuyant sur une combinaison de mesures techniques, organisationnelles et statistiques."),

        heading2("7.1 Mesures techniques"),
        heading3("Scan QR code obligatoire"),
        bodyText("Chaque candidat doit pr\u00e9senter son QR code de convocation \u00e0 l\u2019entr\u00e9e du centre. Le scan v\u00e9rifie l\u2019authenticit\u00e9 de la convocation, l\u2019identit\u00e9 du candidat et la validit\u00e9 de la r\u00e9servation."),
        heading3("Photographie le jour de l\u2019examen"),
        bodyText("Une photo est prise automatiquement lors de l\u2019entr\u00e9e dans la salle d\u2019examen et compar\u00e9e avec la photo du dossier d\u2019inscription. Toute diff\u00e9rence significative d\u00e9clenche une alerte."),
        heading3("Surveillance webcam"),
        bodyText("La webcam du poste d\u2019examen enregistre p\u00e9riodiquement des captures d\u2019\u00e9cran et des images du candidat pendant l\u2019examen, permettant une v\u00e9rification ult\u00e9rieure ou en temps r\u00e9el."),
        heading3("Verrouillage du navigateur"),
        bodyText("Le poste d\u2019examen est verrouill\u00e9 en mode kiosque : le candidat ne peut pas ouvrir d\u2019autres onglets, d\u2019applications, ou quitter l\u2019interface d\u2019examen sans que cela soit enregistr\u00e9."),
        heading3("Tirage al\u00e9atoire et ordre m\u00e9lang\u00e9"),
        bodyText("Chaque candidat re\u00e7oit un ensemble de questions tir\u00e9es al\u00e9atoirement dans la banque officielle, et l\u2019ordre des r\u00e9ponses propos\u00e9es est m\u00e9lang\u00e9 pour chaque candidat, emp\u00eachant la triche par position."),

        heading2("7.2 Mesures statistiques et d\u00e9tection"),
        bulletItem("D\u00e9tection des centres avec taux de r\u00e9ussite anormal (sup\u00e9rieur \u00e0 2 \u00e9carts-types de la moyenne nationale)."),
        bulletItem("D\u00e9tection des candidats inscrits plusieurs fois avec des identit\u00e9s diff\u00e9rentes."),
        bulletItem("Analyse des temps de r\u00e9ponse : des r\u00e9ponses anormalement rapides ou uniformes d\u00e9clenchent des alertes."),
        bulletItem("G\u00e9olocalisation du centre pour v\u00e9rifier que l\u2019examen se d\u00e9roule bien dans le centre d\u00e9clar\u00e9."),
        bulletItem("Comparaison crois\u00e9e des r\u00e9sultats entre centres, sessions et p\u00e9riodes."),

        heading2("7.3 Sanctions et tra\u00e7abilit\u00e9"),
        bulletItem("Logs de toutes les actions (connexion, r\u00e9ponses, soumission, tentatives de triche)."),
        bulletItem("Signature num\u00e9rique du r\u00e9sultat garantissant son int\u00e9grit\u00e9."),
        bulletItem("Audit vid\u00e9o ou capture p\u00e9riodique conserv\u00e9 pendant 5 ans."),
        bulletItem("Blacklist des fraudeurs avec interdiction de repasser l\u2019examen pendant une p\u00e9riode d\u00e9finie."),
        bulletItem("Suspension automatique d\u2019un centre en cas d\u2019anomalie grave."),

        // ═══════════════════════════════════════════════════════
        // SECTION 8: ARCHITECTURE TECHNIQUE
        // ═══════════════════════════════════════════════════════
        heading1("8. Architecture technique"),
        redLine(),
        bodyText("L\u2019architecture technique de CodeRoute Guin\u00e9e est con\u00e7ue pour r\u00e9pondre aux exigences de s\u00e9curit\u00e9, de disponibilit\u00e9 et d\u2019\u00e9volutivit\u00e9 d\u2019un syst\u00e8me national critique. Elle repose sur une architecture en microservices, une base de donn\u00e9es PostgreSQL segment\u00e9e par sch\u00e9mas m\u00e9tier, et un h\u00e9bergement hybride combinant infrastructure locale et scalabilit\u00e9 cloud."),

        heading2("8.1 Frontend"),
        makeTable(
          ["Composant", "Technologie", "Description"],
          [
            ["Web App", "React.js / Next.js", "Interface web responsive, 5 modes utilisateur"],
            ["Mobile App", "React Native", "Application mobile native iOS/Android"],
            ["UI Framework", "Tailwind CSS + Shadcn UI", "Composants accessibles et coh\u00e9rents"],
            ["Animations", "Framer Motion", "Transitions et interactions fluides"],
          ],
          [20, 25, 55]
        ),

        heading2("8.2 Backend"),
        makeTable(
          ["Service", "Technologie", "R\u00f4le"],
          [
            ["API", "FastAPI / NestJS", "API REST s\u00e9curis\u00e9e avec authentification JWT"],
            ["Auth", "OAuth2 + JWT", "Gestion des r\u00f4les et permissions"],
            ["T\u00e2ches async", "Celery / BullMQ + Redis", "Notifications, g\u00e9n\u00e9ration PDF"],
            ["Fichiers", "MinIO / S3", "Stockage photos, documents, certificats"],
          ],
          [20, 25, 55]
        ),

        heading2("8.3 Base de donn\u00e9es"),
        bodyText("PostgreSQL est le SGBD principal, organis\u00e9 en sch\u00e9mas s\u00e9par\u00e9s par domaine fonctionnel : identity (candidats, utilisateurs, auto-\u00e9coles), exam (questions, sessions, tentatives), payment (paiements, commissions), center (centres, salles, postes), audit (logs, alertes, incidents), reporting (statistiques journali\u00e8res). Redis est utilis\u00e9 pour le cache, les sessions et les files d\u2019attente."),

        heading2("8.4 S\u00e9curit\u00e9"),
        bulletItem("HTTPS obligatoire sur toutes les communications"),
        bulletItem("Chiffrement des donn\u00e9es sensibles (AES-256 au repos, TLS 1.3 en transit)"),
        bulletItem("Journal d\u2019audit complet et immuable"),
        bulletItem("Sauvegardes automatiques quotidiennes avec r\u00e9tention 30 jours"),
        bulletItem("Authentification forte pour les administrateurs (2FA)"),
        bulletItem("S\u00e9paration stricte des r\u00f4les (RBAC)"),

        heading2("8.5 H\u00e9bergement"),
        bodyText("Pour un projet national, une architecture hybride est recommand\u00e9e : les donn\u00e9es sensibles (identit\u00e9 des candidats, r\u00e9sultats, audit) sont h\u00e9berg\u00e9es dans un environnement contr\u00f4l\u00e9 (data center local en Guin\u00e9e ou VPS s\u00e9curis\u00e9), tandis que les services \u00e0 forte charge (examens, notifications, cache) b\u00e9n\u00e9ficient de la scalabilit\u00e9 cloud (Azure, AWS ou GCP)."),

        // ═══════════════════════════════════════════════════════
        // SECTION 9: DIAGRAMMES
        // ═══════════════════════════════════════════════════════
        heading1("9. Diagrammes d\u2019architecture"),
        redLine(),
        bodyText("Les diagrammes suivants illustrent l\u2019architecture globale du syst\u00e8me CodeRoute Guin\u00e9e, montrant les interactions entre les diff\u00e9rentes couches logicielles, les services backend, les bases de donn\u00e9es et les int\u00e9grations externes."),
        ...imageIfExists(path.join(diagramsDir, "architecture.png"), "Figure 2 : Architecture technique du syst\u00e8me CodeRoute Guin\u00e9e"),

        // ═══════════════════════════════════════════════════════
        // SECTION 10: MODELE DE DONNEES
        // ═══════════════════════════════════════════════════════
        heading1("10. Mod\u00e8le de donn\u00e9es"),
        redLine(),
        bodyText("Le mod\u00e8le de donn\u00e9es de CodeRoute Guin\u00e9e est structur\u00e9 autour de six sch\u00e9mas PostgreSQL couvrant les domaines fonctionnels du syst\u00e8me. Cette segmentation garantit la s\u00e9paration des donn\u00e9es, facilite les audits et permet une gestion fine des permissions d\u2019acc\u00e8s."),
        ...imageIfExists(path.join(diagramsDir, "data-model.png"), "Figure 3 : Mod\u00e8le entit\u00e9-relation de la base de donn\u00e9es CodeRoute Guin\u00e9e"),

        heading2("10.1 Sch\u00e9ma identity"),
        makeTable(["Entit\u00e9", "Colonnes cl\u00e9s", "Description"],
          [["Candidate", "id, candidate_number, last_name, first_name, national_id, permit_category", "Profil complet du candidat"],
           ["User", "id, email, password_hash, role, is_active", "Utilisateur syst\u00e8me multi-r\u00f4le"],
           ["DrivingSchool", "id, name, registration_number, city, is_approved", "Auto-\u00e9cole partenaire"]],
          [20, 50, 30]),

        heading2("10.2 Sch\u00e9ma exam"),
        makeTable(["Entit\u00e9", "Colonnes cl\u00e9s", "Description"],
          [["Question", "id, category, text, question_type, is_active", "Banque de questions officielle"],
           ["Answer", "id, question_id, text, is_correct", "R\u00e9ponses associ\u00e9es"],
           ["ExamSession", "id, center_id, date, category, max_candidates, status", "Session d\u2019examen planifi\u00e9e"],
           ["ExamAttempt", "id, candidate_id, session_id, score, is_passed, qr_code", "Tentative d\u2019examen"],
           ["ExamResponse", "id, attempt_id, question_id, answer_id, is_correct, response_time", "R\u00e9ponse individuelle"]],
          [20, 50, 30]),

        heading2("10.3 Sch\u00e9ma payment"),
        makeTable(["Entit\u00e9", "Colonnes cl\u00e9s", "Description"],
          [["Payment", "id, candidate_id, session_id, amount, method, status, transaction_ref", "Transaction de paiement"],
           ["Commission", "id, payment_id, center_share, platform_share, admin_share", "R\u00e9partition des commissions"]],
          [20, 50, 30]),

        heading2("10.4 Sch\u00e9ma center"),
        makeTable(["Entit\u00e9", "Colonnes cl\u00e9s", "Description"],
          [["Center", "id, name, region, city, capacity, is_approved, approval_date", "Centre agr\u00e9\u00e9"],
           ["CenterRoom", "id, center_id, name, capacity, has_camera, has_generator", "Salle d\u2019examen"],
           ["CenterWorkstation", "id, room_id, identifier, is_functional", "Poste informatique"]],
          [20, 50, 30]),

        heading2("10.5 Sch\u00e9ma audit"),
        makeTable(["Entit\u00e9", "Colonnes cl\u00e9s", "Description"],
          [["AuditLog", "id, user_id, action, entity_type, ip_address", "Journal d\u2019audit complet"],
           ["FraudAlert", "id, attempt_id, center_id, alert_type, severity, is_resolved", "Alerte de fraude d\u00e9tect\u00e9e"],
           ["SessionIncident", "id, session_id, incident_type, description", "Incident de session"]],
          [20, 50, 30]),

        // ═══════════════════════════════════════════════════════
        // SECTION 11: REGLES D'EXAMEN
        // ═══════════════════════════════════════════════════════
        heading1("11. R\u00e8gles d\u2019examen et agr\u00e9ment"),
        redLine(),
        heading2("11.1 Param\u00e9trage de l\u2019examen"),
        makeTable(
          ["Param\u00e8tre", "Valeur propos\u00e9e", "Configurable"],
          [
            ["Nombre de questions", "40", "Oui"],
            ["Dur\u00e9e", "30 minutes", "Oui"],
            ["Seuil de r\u00e9ussite", "35 bonnes r\u00e9ponses / 40", "Oui"],
            ["Tirage des questions", "Al\u00e9atoire", "Non"],
            ["Type de r\u00e9ponses", "Une ou multiples selon le type", "Oui"],
            ["R\u00e9sultat", "Imm\u00e9diat", "Non"],
            ["D\u00e9lai avant nouvelle tentative", "48h ou 7 jours", "Oui"],
            ["Certificat num\u00e9rique", "Unique par r\u00e9ussite", "Non"],
          ],
          [35, 35, 30]
        ),

        heading2("11.2 Conditions d\u2019agr\u00e9ment des centres"),
        bodyText("L\u2019\u00c9tat ou l\u2019autorit\u00e9 comp\u00e9tente d\u00e9finit un cahier des charges strict pour l\u2019agr\u00e9ment des centres d\u2019examen."),
        makeTable(
          ["Crit\u00e8re", "Exigence", "V\u00e9rification"],
          [
            ["Salle", "Ferm\u00e9e et s\u00e9curis\u00e9e", "Inspection physique"],
            ["\u00c9quipement", "Ordinateurs ou tablettes certifi\u00e9s", "Inventaire technique"],
            ["Connectivit\u00e9", "Connexion internet stable", "Test de d\u00e9bit"],
            ["Surveillance", "Cam\u00e9ra de surveillance", "V\u00e9rification installation"],
            ["Personnel", "Agent de supervision form\u00e9", "Certification formation"],
            ["\u00c9nergie", "Syst\u00e8me \u00e9lectrique fiable + onduleur/g\u00e9n\u00e9rateur", "Test de continuit\u00e9"],
            ["Agr\u00e9ment", "Valide 3 ans, renouvelable apr\u00e8s contr\u00f4le", "Audit p\u00e9riodique"],
          ],
          [25, 40, 35]
        ),

        // ═══════════════════════════════════════════════════════
        // SECTION 12: DASHBOARD
        // ═══════════════════════════════════════════════════════
        heading1("12. Dashboard national"),
        redLine(),
        bodyText("Le tableau de bord national constitue l\u2019outil de pilotage strat\u00e9gique de l\u2019administration. Il agr\u00e8ge en temps r\u00e9el les donn\u00e9es de l\u2019ensemble des centres agr\u00e9\u00e9s et fournit des indicateurs cl\u00e9s de performance (KPI) pour orienter les d\u00e9cisions en mati\u00e8re de s\u00e9curit\u00e9 routi\u00e8re."),
        bulletItem("Nombre de candidats inscrits (total et par p\u00e9riode)"),
        bulletItem("Nombre d\u2019examens pass\u00e9s et taux de r\u00e9ussite global"),
        bulletItem("Taux de r\u00e9ussite par ville, par centre et par auto-\u00e9cole"),
        bulletItem("Nombre de fraudes d\u00e9tect\u00e9es et types de fraude"),
        bulletItem("Revenus g\u00e9n\u00e9r\u00e9s et volume de paiements Mobile Money"),
        bulletItem("Questions les plus \u00e9chou\u00e9es (pour am\u00e9liorer la formation)"),
        bulletItem("\u00c9volution mensuelle des examens et tendances"),
        bodyText("Ce dashboard peut \u00eatre connect\u00e9 \u00e0 des outils de Business Intelligence tels que Apache Superset pour des analyses avanc\u00e9es. Les donn\u00e9es sont exportables en Excel et PDF pour les rapports institutionnels."),

        // ═══════════════════════════════════════════════════════
        // SECTION 13: MODELE ECONOMIQUE
        // ═══════════════════════════════════════════════════════
        heading1("13. Mod\u00e8le \u00e9conomique"),
        redLine(),
        bodyText("Trois mod\u00e8les \u00e9conomiques sont envisageables pour CodeRoute Guin\u00e9e. Chacun pr\u00e9sente des avantages et des risques sp\u00e9cifiques."),
        makeTable(
          ["Mod\u00e8le", "Description", "Avantages", "Risques"],
          [
            ["Public", "L\u2019\u00c9tat finance et contr\u00f4le toute la plateforme", "Contr\u00f4le total", "Co\u00fbt \u00e9lev\u00e9"],
            ["D\u00e9l\u00e9gation", "Centres priv\u00e9s sous contr\u00f4le public", "Efficacit\u00e9", "Risque de fraude"],
            ["PPP", "Partenariat public-priv\u00e9", "\u00c9quilibre", "Complexit\u00e9 contractuelle"],
          ],
          [15, 30, 25, 30]
        ),

        heading2("13.1 Mod\u00e8le recommand\u00e9 : PPP"),
        bodyText("Le partenariat public-priv\u00e9 (PPP) est le mod\u00e8le recommand\u00e9 pour la Guin\u00e9e. La r\u00e9partition des r\u00f4les est la suivante :"),
        bulletItem("\u00c9tat : R\u00e9glementation, agr\u00e9ment des centres, contr\u00f4le, validation officielle"),
        bulletItem("Plateforme : Technologie, s\u00e9curit\u00e9, supervision technique, maintenance"),
        bulletItem("Centres agr\u00e9\u00e9s : Accueil physique, surveillance des examens"),
        bulletItem("Auto-\u00e9coles : Pr\u00e9paration des candidats, inscription group\u00e9e"),
        bulletItem("Op\u00e9rateurs Mobile Money : Paiement s\u00e9curis\u00e9 des frais d\u2019examen"),
        bodyText("Le tarif de l\u2019examen est encadr\u00e9 par l\u2019\u00c9tat et r\u00e9parti entre les acteurs selon un sch\u00e9ma de commissions pr\u00e9d\u00e9fini. Par exemple, sur un tarif de 50 000 GNF : 30% pour le centre agr\u00e9\u00e9, 40% pour la plateforme, 30% pour l\u2019administration. Ces pourcentages sont configurables dans le syst\u00e8me de paiement."),

        // ═══════════════════════════════════════════════════════
        // SECTION 14: BENCHMARK
        // ═══════════════════════════════════════════════════════
        heading1("14. Benchmark international"),
        redLine(),
        bodyText("L\u2019analyse des syst\u00e8mes de code de la route dans d\u2019autres pays permet d\u2019identifier les bonnes pratiques et les pi\u00e8ges \u00e0 \u00e9viter. Quatre pays ont \u00e9t\u00e9 s\u00e9lectionn\u00e9s pour leur pertinence."),
        makeTable(
          ["Pays", "Mod\u00e8le", "Le\u00e7on pour la Guin\u00e9e"],
          [
            ["France", "D\u00e9l\u00e9gation \u00e0 des op\u00e9rateurs priv\u00e9s agr\u00e9\u00e9s. Tarif encadr\u00e9 (30 EUR). Fraude d\u00e9tect\u00e9e dans certains centres.", "Int\u00e9grer l\u2019anti-fraude d\u00e8s la conception"],
            ["S\u00e9n\u00e9gal", "Modernisation progressive. Centres informatis\u00e9s dans les grandes villes.", "Pr\u00e9voir la couverture rurale"],
            ["C\u00f4te d\u2019Ivoire", "Syst\u00e8me en cours de digitalisation. Fraude encore significative.", "Ne pas sous-estimer le contr\u00f4le continu"],
            ["Maroc", "Digitalisation avanc\u00e9e avec NARSA. Surveillance cam\u00e9ra, score imm\u00e9diat.", "La digitalisation compl\u00e8te est possible en Afrique du Nord"],
          ],
          [15, 50, 35]
        ),

        heading2("14.1 Enseignements cl\u00e9s"),
        bulletItem("L\u2019anti-fraude doit \u00eatre un pilier de la conception, pas un ajout ult\u00e9rieur."),
        bulletItem("La couverture g\u00e9ographique doit \u00eatre planifi\u00e9e d\u00e8s le d\u00e9part pour ne pas p\u00e9naliser les zones rurales."),
        bulletItem("Le paiement Mobile Money est un atout majeur en Afrique de l\u2019Ouest et doit \u00eatre int\u00e9gr\u00e9 nativement."),
        bulletItem("La transparence des r\u00e9sultats et la possibilit\u00e9 d\u2019audit sont essentielles pour la cr\u00e9dibilit\u00e9."),
        bulletItem("Le mod\u00e8le PPP offre le meilleur \u00e9quilibre entre contr\u00f4le public et efficacit\u00e9 priv\u00e9e."),

        // ═══════════════════════════════════════════════════════
        // SECTION 15: PLANNING
        // ═══════════════════════════════════════════════════════
        heading1("15. Planning chiffr\u00e9"),
        redLine(),
        bodyText("Le d\u00e9ploiement est planifi\u00e9 en deux phases principales : le MVP (Phase 1) permettant un lancement rapide, et la V2 (Phase 2) enrichissant la plateforme."),

        heading2("15.1 Phase 1 : MVP (Mois 1-6)"),
        makeTable(
          ["Mois", "Activit\u00e9", "Livrable"],
          [
            ["1-2", "Conception UX/UI et architecture", "Maquettes Figma, sp\u00e9cifications"],
            ["2-4", "D\u00e9veloppement backend", "API d\u00e9ploy\u00e9e en staging"],
            ["3-5", "D\u00e9veloppement frontend", "Web app d\u00e9ploy\u00e9e en staging"],
            ["4-5", "Int\u00e9gration Mobile Money sandbox", "Paiement test fonctionnel"],
            ["5-6", "Tests, s\u00e9curit\u00e9, formation", "Rapport de tests, centres form\u00e9s"],
            ["6", "D\u00e9ploiement pilote \u00e0 Conakry", "Plateforme en production"],
          ],
          [15, 45, 40]
        ),

        heading2("15.2 Phase 2 : V2 (Mois 7-14)"),
        makeTable(
          ["Mois", "Activit\u00e9", "Livrable"],
          [
            ["7-8", "Reconnaissance faciale et webcam", "Module anti-fraude avanc\u00e9"],
            ["8-9", "Int\u00e9gration Mobile Money r\u00e9elle", "Paiement en production"],
            ["9-10", "Application mobile React Native", "Apps iOS et Android"],
            ["10-11", "API permis biom\u00e9trique", "Connexion au syst\u00e8me national"],
            ["11-13", "Statistiques avanc\u00e9es et audit", "Dashboard BI, rapports automatiques"],
            ["13-14", "Extension nationale (10-15 centres)", "Couverture multi-r\u00e9gions"],
          ],
          [15, 45, 40]
        ),

        // ═══════════════════════════════════════════════════════
        // SECTION 16: BUDGET
        // ═══════════════════════════════════════════════════════
        heading1("16. Budget estimatif"),
        redLine(),
        bodyText("Le budget ci-dessous fournit une estimation indicative des co\u00fbts de d\u00e9veloppement, d\u2019infrastructure et de fonctionnement. Les montants sont exprim\u00e9s en euros (EUR)."),

        heading2("16.1 Co\u00fbts de d\u00e9veloppement (Phase 1 - MVP)"),
        makeTable(
          ["Poste", "D\u00e9tail", "Estimation (EUR)"],
          [
            ["Conception UX/UI", "Maquettes, prototypes, tests utilisateurs", "15 000 - 25 000"],
            ["D\u00e9veloppement Backend", "API, auth, examen, paiement, anti-fraude", "40 000 - 60 000"],
            ["D\u00e9veloppement Frontend", "Web app candidat, centre, admin", "30 000 - 50 000"],
            ["Int\u00e9gration Mobile Money", "Orange Money + MTN", "10 000 - 15 000"],
            ["Tests et s\u00e9curit\u00e9", "Tests fonctionnels, audit s\u00e9curit\u00e9", "10 000 - 15 000"],
            ["Formation et documentation", "Formation centres pilotes, manuels", "5 000 - 8 000"],
            ["Sous-total Phase 1", "", "110 000 - 173 000"],
          ],
          [25, 40, 35]
        ),

        heading2("16.2 Co\u00fbts de d\u00e9veloppement (Phase 2 - V2)"),
        makeTable(
          ["Poste", "Estimation (EUR)"],
          [
            ["Reconnaissance faciale : 15 000 - 25 000"],
            ["Application mobile : 25 000 - 40 000"],
            ["API permis biom\u00e9trique : 10 000 - 20 000"],
            ["Dashboard BI avanc\u00e9 : 15 000 - 25 000"],
            ["Audit automatis\u00e9 : 8 000 - 12 000"],
            ["Sous-total Phase 2 : 73 000 - 122 000"],
          ],
          [50, 50]
        ),

        heading2("16.3 Co\u00fbts d\u2019infrastructure annuelle"),
        makeTable(
          ["Poste", "Estimation annuelle (EUR)"],
          [
            ["H\u00e9bergement cloud hybride : 12 000 - 24 000"],
            ["Services SMS / WhatsApp : 5 000 - 10 000"],
            ["Licences et outils DevOps : 3 000 - 6 000"],
            ["Maintenance et support : 15 000 - 25 000"],
            ["Sous-total annuel : 35 000 - 65 000"],
          ],
          [50, 50]
        ),

        bodyText("Estimation totale sur 2 ans (d\u00e9veloppement + infrastructure) : 253 000 - 425 000 EUR, soit environ 280 000 000 - 470 000 000 GNF au taux actuel. Ce budget peut \u00eatre partiellement couvert par les revenus g\u00e9n\u00e9r\u00e9s par les frais d\u2019examen d\u00e8s la premi\u00e8re ann\u00e9e de fonctionnement."),

        // ═══════════════════════════════════════════════════════
        // SECTION 17: RISQUES
        // ═══════════════════════════════════════════════════════
        heading1("17. Analyse des risques"),
        redLine(),
        bodyText("L\u2019analyse des risques identifie les menaces principales pesant sur le projet, qu\u2019elles soient techniques, organisationnelles ou juridiques. Pour chaque risque, une strat\u00e9gie d\u2019att\u00e9nuation est propos\u00e9e."),
        makeTable(
          ["Risque", "Cat\u00e9gorie", "Probabilit\u00e9", "Impact", "Att\u00e9nuation"],
          [
            ["Fraude malgr\u00e9 le dispositif", "Technique", "Moyenne", "\u00c9lev\u00e9", "Monitoring continu, audits al\u00e9atoires"],
            ["Panne de connectivit\u00e9", "Technique", "\u00c9lev\u00e9e", "\u00c9lev\u00e9", "Onduleur, mode hors-ligne, lien redondant"],
            ["Corruption des agents", "Organisationnel", "Moyenne", "\u00c9lev\u00e9", "Rotation, surveillance vid\u00e9o, signalement anonyme"],
            ["R\u00e9sistance au changement", "Organisationnel", "\u00c9lev\u00e9e", "Moyen", "Formation, communication, p\u00e9riode de transition"],
            ["Donn\u00e9es compromises", "Juridique", "Faible", "\u00c9lev\u00e9", "Chiffrement, RGPD-like, DPO, audits"],
            ["Attaque informatique", "Technique", "Moyenne", "\u00c9lev\u00e9", "WAF, rate limiting, plan de r\u00e9ponse aux incidents"],
            ["Cadre juridique insuffisant", "Juridique", "Moyenne", "Moyen", "D\u00e9cret d\u2019application, conformit\u00e9 l\u00e9gale"],
          ],
          [20, 15, 12, 12, 41]
        ),

        // ═══════════════════════════════════════════════════════
        // SECTION 18: MVP
        // ═══════════════════════════════════════════════════════
        heading1("18. MVP \u2014 Phase 1"),
        redLine(),
        bodyText("Le Produit Minimum Viable (MVP) constitue la premi\u00e8re version d\u00e9ployable de la plateforme, int\u00e9grant les fonctionnalit\u00e9s essentielles pour un lancement pilote \u00e0 Conakry."),

        heading2("18.1 Modules du MVP"),
        bulletItem("Authentification candidat, centre, admin (JWT, r\u00f4les)"),
        bulletItem("Inscription candidat avec upload de documents"),
        bulletItem("Gestion des centres agr\u00e9\u00e9s (cr\u00e9ation, modification, suspension)"),
        bulletItem("R\u00e9servation d\u2019une session d\u2019examen"),
        bulletItem("Paiement fictif ou Mobile Money sandbox"),
        bulletItem("G\u00e9n\u00e9ration de convocation avec QR code"),
        bulletItem("Passage d\u2019un examen en ligne (tirage al\u00e9atoire, chronom\u00e8tre, correction auto)"),
        bulletItem("R\u00e9sultat PDF avec certificat num\u00e9rique"),
        bulletItem("Dashboard admin basique (statistiques, centres, candidats)"),
        bulletItem("Logs anti-fraude basiques (QR code, photo, verrouillage)"),

        heading2("18.2 Crit\u00e8res de succ\u00e8s du MVP"),
        makeTable(
          ["Crit\u00e8re", "Objectif"],
          [
            ["Centres pilotes op\u00e9rationnels", "3-5 centres \u00e0 Conakry"],
            ["Candidats inscrits en mois 1", "> 500"],
            ["Examens sans incident technique", "> 95%"],
            ["Fraude d\u00e9tect\u00e9e par le syst\u00e8me", "> 80% des cas simul\u00e9s"],
            ["Temps de r\u00e9ponse de l\u2019application", "< 3 secondes"],
            ["Satisfaction candidat", "> 80% positif"],
          ],
          [50, 50]
        ),

        // ═══════════════════════════════════════════════════════
        // SECTION 19: VISION FINALE
        // ═══════════════════════════════════════════════════════
        heading1("19. Vision finale et feuille de route"),
        redLine(),
        bodyText("\u00c0 terme, CodeRoute Guin\u00e9e vise \u00e0 devenir la plateforme nationale de r\u00e9f\u00e9rence pour la gestion compl\u00e8te du permis de conduire, bien au-del\u00e0 de l\u2019examen th\u00e9orique du code de la route."),

        heading2("19.1 Vision \u00e0 long terme"),
        bulletItem("Examen du code de la route (th\u00e9orique) \u2014 Phase 1 et 2"),
        bulletItem("Examen pratique de conduite avec tra\u00e7abilit\u00e9 num\u00e9rique"),
        bulletItem("Gestion int\u00e9gr\u00e9e des auto-\u00e9coles et des moniteurs"),
        bulletItem("Paiement unifi\u00e9 de tous les frais li\u00e9s au permis"),
        bulletItem("Statistiques nationales avanc\u00e9es et pr\u00e9dictives"),
        bulletItem("Contr\u00f4le anti-fraude de bout en bout (code + pratique + permis)"),
        bulletItem("Connexion au permis biom\u00e9trique national"),
        bulletItem("Sensibilisation \u00e0 la s\u00e9curit\u00e9 routi\u00e8re (campagnes, \u00e9ducation)"),

        heading2("19.2 Feuille de route"),
        makeTable(
          ["P\u00e9riode", "Phase", "Objectif cl\u00e9"],
          [
            ["Mois 1-6", "MVP", "Lancement pilote Conakry, 3-5 centres"],
            ["Mois 7-14", "V2", "Extension nationale, app mobile, reconnaissance faciale"],
            ["Mois 15-20", "V3", "Examen pratique, gestion moniteurs, API permis"],
            ["Mois 21-30", "V4", "Plateforme compl\u00e8te, BI avanc\u00e9, sensibilisation"],
            ["Mois 31+", "Exploitation", "Maintenance, \u00e9volution, extension r\u00e9gionale"],
          ],
          [20, 15, 65]
        ),

        bodyText("Ce projet est particuli\u00e8rement pertinent pour la Guin\u00e9e car il combine digitalisation administrative, s\u00e9curit\u00e9 routi\u00e8re, transparence, tra\u00e7abilit\u00e9 et cr\u00e9ation d\u2019un r\u00e9seau de centres agr\u00e9\u00e9s g\u00e9n\u00e9rateur d\u2019emplois et de revenus. Il constitue un investissement strat\u00e9gique pour l\u2019avenir de la s\u00e9curit\u00e9 routi\u00e8re en R\u00e9publique de Guin\u00e9e."),
      ],
    },
  ],
});

// ─── GENERATE FILE ───────────────────────────────────────────────
const outputPath = path.join(__dirname, "CodeRoute_Guinee_Cahier_des_Charges.docx");
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  const stats = fs.statSync(outputPath);
  console.log(`DOCX generated: ${outputPath}`);
  console.log(`Size: ${(stats.size / 1024).toFixed(1)} KB`);
}).catch(err => {
  console.error("Error generating DOCX:", err);
  process.exit(1);
});
