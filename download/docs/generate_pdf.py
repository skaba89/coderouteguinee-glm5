#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CodeRoute Guinée - Cahier des Charges PDF Generator
Uses ReportLab for body content, merged with Playwright cover
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm, inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, PageBreak, KeepTogether, CondPageBreak, HRFlowable
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.fonts import addMapping

# ─── PATHS ───────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIAGRAMS_DIR = os.path.join(BASE_DIR, '..', 'diagrams')
OUTPUT_PATH = os.path.join(BASE_DIR, 'body.pdf')

# ─── FONTS ───────────────────────────────────────────────────────────
# Register fonts (skip variable fonts - ReportLab doesn't support them)
font_paths = {
    'Carlito': '/usr/share/fonts/truetype/english/Carlito-Regular.ttf',
    'Carlito-Bold': '/usr/share/fonts/truetype/english/Carlito-Bold.ttf',
    'Carlito-Italic': '/usr/share/fonts/truetype/english/Carlito-Italic.ttf',
    'Carlito-BoldItalic': '/usr/share/fonts/truetype/english/Carlito-BoldItalic.ttf',
    'DejaVuSans': '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    'DejaVuSans-Bold': '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    'LiberationSans': '/usr/share/fonts/truetype/chinese/LiberationSans-Regular.ttf',
}

for name, path in font_paths.items():
    if os.path.exists(path):
        try:
            pdfmetrics.registerFont(TTFont(name, path))
        except Exception:
            pass  # Skip fonts that can't be registered

addMapping('Carlito', 0, 0, 'Carlito')
addMapping('Carlito', 1, 0, 'Carlito-Bold')
addMapping('Carlito', 0, 1, 'Carlito-Italic')
addMapping('Carlito', 1, 1, 'Carlito-BoldItalic')

# ─── COLORS ──────────────────────────────────────────────────────────
# Guinea-inspired institutional palette
C_PRIMARY = HexColor('#1A2332')
C_RED = HexColor('#CE1126')
C_YELLOW = HexColor('#FCD116')
C_GREEN = HexColor('#009460')
C_ACCENT = HexColor('#2C5F8A')
C_TEXT = HexColor('#1A2332')
C_TEXT_MUTED = HexColor('#5A6270')
C_TEXT_LIGHT = HexColor('#7A8290')
C_BG_PAGE = HexColor('#FFFFFF')
C_BG_SECTION = HexColor('#F7F8FA')
C_BG_HEADER = HexColor('#1A2332')
C_BORDER = HexColor('#D0D5DD')
C_TABLE_STRIPE = HexColor('#F5F7FA')
C_TABLE_HEADER = HexColor('#1A2332')
C_LINK = HexColor('#2C5F8A')

# ─── STYLES ──────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

# Override / add custom styles
styles.add(ParagraphStyle(
    name='DocTitle', fontName='Carlito-Bold', fontSize=28, leading=34,
    textColor=C_PRIMARY, spaceAfter=6, alignment=TA_LEFT
))
styles.add(ParagraphStyle(
    name='DocSubtitle', fontName='Carlito', fontSize=14, leading=18,
    textColor=C_ACCENT, spaceAfter=20, alignment=TA_LEFT
))
styles.add(ParagraphStyle(
    name='H1', fontName='Carlito-Bold', fontSize=20, leading=26,
    textColor=C_PRIMARY, spaceBefore=24, spaceAfter=12,
    borderWidth=0, borderColor=C_RED, borderPadding=0
))
styles.add(ParagraphStyle(
    name='H2', fontName='Carlito-Bold', fontSize=15, leading=20,
    textColor=C_ACCENT, spaceBefore=18, spaceAfter=8
))
styles.add(ParagraphStyle(
    name='H3', fontName='Carlito-Bold', fontSize=12, leading=16,
    textColor=C_PRIMARY, spaceBefore=12, spaceAfter=6
))
styles.add(ParagraphStyle(
    name='BodyFR', fontName='Carlito', fontSize=10, leading=15,
    textColor=C_TEXT, spaceAfter=8, alignment=TA_JUSTIFY,
    firstLineIndent=0
))
styles.add(ParagraphStyle(
    name='BodyEN', fontName='Carlito-Italic', fontSize=9, leading=13,
    textColor=C_TEXT_MUTED, spaceAfter=10, alignment=TA_JUSTIFY,
    leftIndent=12, borderColor=C_BORDER, borderWidth=0,
    borderPadding=4
))
styles.add(ParagraphStyle(
    name='MyBullet', fontName='Carlito', fontSize=10, leading=14,
    textColor=C_TEXT, spaceAfter=4, leftIndent=24, firstLineIndent=-12,
    bulletIndent=12
))
styles.add(ParagraphStyle(
    name='MyBulletSub', fontName='Carlito', fontSize=9.5, leading=13,
    textColor=C_TEXT_MUTED, spaceAfter=3, leftIndent=42, firstLineIndent=-12,
    bulletIndent=30
))
styles.add(ParagraphStyle(
    name='TableCell', fontName='Carlito', fontSize=9, leading=12,
    textColor=C_TEXT, alignment=TA_LEFT
))
styles.add(ParagraphStyle(
    name='TableCellBold', fontName='Carlito-Bold', fontSize=9, leading=12,
    textColor=white, alignment=TA_LEFT
))
styles.add(ParagraphStyle(
    name='Caption', fontName='Carlito-Italic', fontSize=8.5, leading=11,
    textColor=C_TEXT_LIGHT, spaceAfter=12, alignment=TA_CENTER
))
styles.add(ParagraphStyle(
    name='Note', fontName='Carlito-Italic', fontSize=9, leading=13,
    textColor=C_TEXT_MUTED, spaceAfter=8, leftIndent=12,
    borderColor=C_YELLOW, borderWidth=1, borderPadding=6,
    backColor=HexColor('#FFFBEB')
))
styles.add(ParagraphStyle(
    name='TOCEntry', fontName='Carlito', fontSize=11, leading=20,
    textColor=C_TEXT, leftIndent=20
))

# ─── HELPER FUNCTIONS ────────────────────────────────────────────────
def h1(text):
    """Section heading with red accent line below"""
    return [
        Paragraph(text, styles['H1']),
        HRFlowable(width="100%", thickness=2, color=C_RED, spaceAfter=10, spaceBefore=0),
    ]

def h2(text):
    return Paragraph(text, styles['H2'])

def h3(text):
    return Paragraph(text, styles['H3'])

def p(text, style='BodyFR'):
    return Paragraph(text, styles[style])

def bullet(text):
    return Paragraph(f'\u2022 {text}', styles['MyBullet'])

def bullet_sub(text):
    return Paragraph(f'\u2013 {text}', styles['MyBulletSub'])

def spacer(h=6):
    return Spacer(1, h)

def note(text):
    return Paragraph(text, styles['Note'])

def make_table(headers, rows, col_widths=None):
    """Create a styled table"""
    available_width = A4[0] - 2 * 2.2 * cm
    if col_widths is None:
        n = len(headers)
        col_widths = [available_width / n] * n
    else:
        total = sum(col_widths)
        col_widths = [w / total * available_width for w in col_widths]

    header_row = [Paragraph(h, styles['TableCellBold']) for h in headers]
    data = [header_row]
    for row in rows:
        data.append([Paragraph(str(c), styles['TableCell']) for c in row])

    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_TABLE_HEADER),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Carlito-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 1), (-1, -1), white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, C_TABLE_STRIPE]),
        ('TEXTCOLOR', (0, 1), (-1, -1), C_TEXT),
        ('FONTNAME', (0, 1), (-1, -1), 'Carlito'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('LINEBELOW', (0, 0), (-1, 0), 1.5, C_RED),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ]))
    return t

def add_diagram(story, image_path, caption_text, width_cm=16):
    """Add a diagram image with caption"""
    if os.path.exists(image_path):
        from reportlab.lib.utils import ImageReader
        img = ImageReader(image_path)
        iw, ih = img.getSize()
        aspect = ih / iw
        width = width_cm * cm
        height = width * aspect
        # Cap height
        max_h = 18 * cm
        if height > max_h:
            height = max_h
            width = height / aspect
        story.append(Image(image_path, width=width, height=height))
        story.append(Paragraph(caption_text, styles['Caption']))
    else:
        story.append(Paragraph(f'[Diagramme: {caption_text}]', styles['Caption']))

# ─── PAGE TEMPLATE ───────────────────────────────────────────────────
def add_page_number(canvas, doc):
    """Add header/footer to each page"""
    page_num = canvas.getPageNumber()
    # Header line
    canvas.setStrokeColor(C_BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(2.2*cm, A4[1] - 1.8*cm, A4[0] - 2.2*cm, A4[1] - 1.8*cm)
    # Header text
    canvas.setFont('Carlito', 8)
    canvas.setFillColor(C_TEXT_LIGHT)
    canvas.drawString(2.2*cm, A4[1] - 1.6*cm, 'CodeRoute Guin\u00e9e \u2014 Cahier des Charges')
    # Footer line
    canvas.line(2.2*cm, 1.6*cm, A4[0] - 2.2*cm, 1.6*cm)
    # Footer page number
    if page_num > 1:
        canvas.drawCentredString(A4[0] / 2, 1.0*cm, f'{page_num}')
    # Footer right
    canvas.drawRightString(A4[0] - 2.2*cm, 1.0*cm, 'R\u00e9publique de Guin\u00e9e')

# ─── BUILD DOCUMENT ──────────────────────────────────────────────────
doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=A4,
    topMargin=2.2*cm,
    bottomMargin=2.2*cm,
    leftMargin=2.2*cm,
    rightMargin=2.2*cm,
    title='CodeRoute Guin\u00e9e - Cahier des Charges',
    author='CodeRoute Guin\u00e9e',
    subject='Sp\u00e9cification technique de la plateforme CodeRoute Guin\u00e9e',
)

story = []

# ═══════════════════════════════════════════════════════════════════════
# TABLE OF CONTENTS
# ═══════════════════════════════════════════════════════════════════════
story.append(Paragraph('Table des mati\u00e8res', styles['DocTitle']))
story.append(HRFlowable(width="100%", thickness=2, color=C_RED, spaceAfter=16))
story.append(Spacer(1, 12))

toc_entries = [
    ('1', 'R\u00e9sum\u00e9 ex\u00e9cutif / Executive Summary'),
    ('2', 'Contexte et probl\u00e9matique'),
    ('3', 'Objectifs du projet'),
    ('4', 'Acteurs du syst\u00e8me'),
    ('5', 'Parcours candidat complet'),
    ('6', 'Fonctionnalit\u00e9s principales'),
    ('7', 'Module anti-fraude'),
    ('8', 'Architecture technique'),
    ('9', 'Diagrammes d\'architecture'),
    ('10', 'Mod\u00e8le de donn\u00e9es'),
    ('11', 'R\u00e8gles d\'examen et agr\u00e9ment'),
    ('12', 'Dashboard national'),
    ('13', 'Mod\u00e8le \u00e9conomique'),
    ('14', 'Benchmark international'),
    ('15', 'Planning chiffr\u00e9'),
    ('16', 'Budget estimatif'),
    ('17', 'Analyse des risques'),
    ('18', 'MVP - Phase 1'),
    ('19', 'Vision finale et feuille de route'),
]

for num, title in toc_entries:
    story.append(Paragraph(
        f'<b>{num}.</b>&nbsp;&nbsp;&nbsp;{title}',
        ParagraphStyle('TOCItem', parent=styles['BodyFR'], fontSize=11, leading=20,
                       spaceAfter=2, leftIndent=10)
    ))

story.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════════
# SECTION 1: EXECUTIVE SUMMARY
# ═══════════════════════════════════════════════════════════════════════
story.extend(h1('1. R\u00e9sum\u00e9 ex\u00e9cutif'))

story.append(p(
    'CodeRoute Guin\u00e9e est une plateforme num\u00e9rique nationale con\u00e7ue pour moderniser et s\u00e9curiser '
    'le processus d\u2019examen th\u00e9orique du code de la route en R\u00e9publique de Guin\u00e9e. Ce projet strat\u00e9gique '
    'vise \u00e0 remplacer les proc\u00e9dures manuelles et opaques par un syst\u00e8me digitalis\u00e9, tra\u00e7able et connect\u00e9 '
    'aux autorit\u00e9s comp\u00e9tentes, dans le but de r\u00e9duire significativement la fraude, les faux permis, '
    'les lenteurs administratives et le manque de statistiques nationales sur la s\u00e9curit\u00e9 routi\u00e8re.'
))

story.append(p(
    'La plateforme permettra aux candidats de s\u2019inscrire en ligne, de r\u00e9server une session d\u2019examen '
    'dans un centre agr\u00e9\u00e9, de payer via Mobile Money ou carte bancaire, de passer l\u2019examen sur des '
    'postes informatis\u00e9s s\u00e9curis\u00e9s, et de recevoir automatiquement leurs r\u00e9sultats. Le dispositif '
    'anti-fraude, au c\u0153ur du syst\u00e8me, int\u00e8gre la v\u00e9rification d\u2019identit\u00e9 par QR code, la photographie '
    'en temps r\u00e9el, le tirage al\u00e9atoire des questions, la surveillance par webcam et la d\u00e9tection '
    'automatique des anomalies statistiques.'
))

story.append(p(
    'Le projet adopte un mod\u00e8le de partenariat public-priv\u00e9 (PPP), o\u00f9 l\u2019\u00c9tat assure la r\u00e9glementation '
    'et le contr\u00f4le, la plateforme fournit la technologie et la s\u00e9curit\u00e9, et les centres agr\u00e9\u00e9s assurent '
    'l\u2019accueil physique et la surveillance. Ce mod\u00e8le s\u2019inspire des bonnes pratiques fran\u00e7aises tout en '
    'int\u00e9grant des mesures anti-fraude renforc\u00e9es d\u00e8s la conception, \u00e9vitant les \u00e9cueils observ\u00e9s '
    'dans certains centres priv\u00e9s fran\u00e7ais.'
))

# English summary
story.append(Spacer(1, 8))
story.append(p(
    '<i>Executive Summary \u2014 CodeRoute Guin\u00e9e is a national digital platform designed to modernize and '
    'secure the theoretical driving exam process in the Republic of Guinea. This strategic project aims '
    'to replace manual and opaque procedures with a digitalized, traceable system connected to the competent '
    'authorities, significantly reducing fraud, fake licenses, administrative delays, and the lack of national '
    'road safety statistics. The platform enables candidates to register online, book exam sessions at '
    'accredited centers, pay via Mobile Money or bank card, take the exam on secure computerized stations, '
    'and automatically receive their results. The anti-fraud system, at the core of the platform, integrates '
    'QR code identity verification, real-time photography, randomized questions, webcam monitoring, and '
    'automatic statistical anomaly detection.</i>', 'BodyEN'
))

story.append(Spacer(1, 8))

# Key figures table
story.append(h3('Chiffres cl\u00e9s estim\u00e9s'))
story.append(make_table(
    ['Indicateur', 'Valeur cible'],
    [
        ['R\u00e9duction de la fraude', '> 90%'],
        ['Temps de d\u00e9livrance des r\u00e9sultats', 'Imm\u00e9diat (vs. jours/semaines)'],
        ['Centres agr\u00e9\u00e9s (Phase 1)', '10-15 centres'],
        ['Couverture g\u00e9ographique (Phase 1)', 'Conakry + 3 r\u00e9gions'],
        ['Candidats trait\u00e9s par an (objectif)', '> 50 000'],
        ['Taux de tra\u00e7abilit\u00e9 des examens', '100%'],
    ],
    col_widths=[3, 2]
))

story.append(Spacer(1, 12))

# ═══════════════════════════════════════════════════════════════════════
# SECTION 2: CONTEXTE ET PROBLEMATIQUE
# ═══════════════════════════════════════════════════════════════════════
story.extend(h1('2. Contexte et probl\u00e9matique'))

story.append(p(
    'La R\u00e9publique de Guin\u00e9e fait face \u00e0 des d\u00e9fis majeurs en mati\u00e8re de s\u00e9curit\u00e9 routi\u00e8re. '
    'Le syst\u00e8me actuel de d\u00e9livrance du permis de conduire souffre de lacunes structurelles importantes '
    'qui compromettent la s\u00e9curit\u00e9 des usagers de la route et la cr\u00e9dibilit\u00e9 de l\u2019administration. '
    'Les examens du code de la route sont encore largement organis\u00e9s de mani\u00e8re manuelle, sans '
    'tra\u00e7abilit\u00e9 num\u00e9rique, ce qui ouvre la porte \u00e0 de multiples formes de fraude et de corruption.'
))

story.append(h2('2.1 Probl\u00e8mes identifi\u00e9s'))

problems = [
    ('Fraude et faux permis', 'L\u2019absence de syst\u00e8me num\u00e9rique s\u00e9curis\u00e9 permet la falsification des r\u00e9sultats, '
     'la substitution de candidats lors des examens, et la d\u00e9livrance de faux permis de conduire. '
     'Ces pratiques mettent en danger la vie des citoyens et minent la confiance dans les institutions.'),
    ('Examens non trac\u00e9s', 'Aucun registre num\u00e9rique fiable ne permet de suivre les examens pass\u00e9s, '
     'les r\u00e9sultats obtenus, ou les centres o\u00f9 les examens ont \u00e9t\u00e9 effectu\u00e9s. Cette opacit\u00e9 '
     'rend tout audit ou contr\u00f4le quasiment impossible et facilite la corruption.'),
    ('Lenteurs administratives', 'Les processus manuels de v\u00e9rification des dossiers, de planification '
     'des sessions, et de transmission des r\u00e9sultats aux autorit\u00e9s comp\u00e9tentes g\u00e9n\u00e8rent des d\u00e9lais '
     'inacceptables pour les candidats et un surcro\u00eet de travail pour les agents administratifs.'),
    ('D\u00e9placements inutiles', 'Les candidats sont souvent contraints de se d\u00e9placer physiquement '
     'pour s\u2019inscrire, v\u00e9rifier leur dossier, ou obtenir leurs r\u00e9sultats. Ces d\u00e9placements '
     'repr\u00e9sentent un co\u00fbt significatif dans un pays o\u00f9 les infrastructures de transport restent limit\u00e9es.'),
    ('Absence de statistiques nationales', 'Sans syst\u00e8me centralis\u00e9, il est impossible de produire '
     'des statistiques fiables sur le nombre de candidats, les taux de r\u00e9ussite par r\u00e9gion, les centres '
     'les plus performants, ou les questions les plus \u00e9chou\u00e9es. Cette absence de donn\u00e9es emp\u00eache '
     'toute politique bas\u00e9e sur les preuves en mati\u00e8re de s\u00e9curit\u00e9 routi\u00e8re.'),
]
for title, desc in problems:
    story.append(Paragraph(f'<b>{title}</b>', styles['H3']))
    story.append(p(desc))

story.append(h2('2.2 Justification de la digitalisation'))

story.append(p(
    'La digitalisation du processus d\u2019examen du code de la route n\u2019est pas une simple modernisation '
    'technologique : c\u2019est une n\u00e9cessit\u00e9 strat\u00e9gique pour la s\u00e9curit\u00e9 routi\u00e8re en Guin\u00e9e. En s\u2019appuyant '
    'sur les technologies num\u00e9riques et mobiles, le pays peut r\u00e9sorber les failles du syst\u00e8me actuel '
    'tout en cr\u00e9ant un \u00e9cosyst\u00e8me de centres agr\u00e9\u00e9s g\u00e9n\u00e9rateur d\u2019emplois et de revenus. '
    'L\u2019exemple fran\u00e7ais, malgr\u00e9 ses propres d\u00e9fis en mati\u00e8re de fraude dans certains centres priv\u00e9s, '
    'd\u00e9montre que la d\u00e9l\u00e9gation \u00e0 des op\u00e9rateurs agr\u00e9\u00e9s fonctionne lorsqu\u2019elle est accompagn\u00e9e '
    'de mesures anti-fraude robustes d\u00e8s la conception.'
))

story.append(p(
    'La Guin\u00e9e dispose d\u2019atouts consid\u00e9rables pour r\u00e9ussir cette transition : une p\u00e9n\u00e9tration '
    'mobile importante (Orange Money et MTN Mobile Money sont largement r\u00e9pandus), une jeunesse '
    'connect\u00e9e et dynamique, et une volont\u00e9 politique de modernisation administrative. Le projet '
    'CodeRoute Guin\u00e9e s\u2019inscrit dans cette dynamique en proposant une solution cl\u00e9 en main, '
    's\u00e9curis\u00e9e et \u00e9volutive, adapt\u00e9e au contexte guin\u00e9en.'
))

# ═══════════════════════════════════════════════════════════════════════
# SECTION 3: OBJECTIFS DU PROJET
# ═══════════════════════════════════════════════════════════════════════
story.extend(h1('3. Objectifs du projet'))

story.append(h2('3.1 Objectifs primaires'))

objectifs_primaire = [
    '\u00c9liminer la fraude lors des examens du code de la route gr\u00e2ce \u00e0 un dispositif anti-fraude int\u00e9gr\u00e9.',
    'Garantir la tra\u00e7abilit\u00e9 compl\u00e8te de chaque examen, de l\u2019inscription \u00e0 la transmission du r\u00e9sultat.',
    'R\u00e9duire les d\u00e9lais de d\u00e9livrance des r\u00e9sultats de plusieurs jours \u00e0 un traitement imm\u00e9diat.',
    'Cr\u00e9er un r\u00e9seau national de centres agr\u00e9\u00e9s, g\u00e9ographiquement accessible et encadr\u00e9.',
    'Produire des statistiques nationales fiables pour orienter la politique de s\u00e9curit\u00e9 routi\u00e8re.',
]
for obj in objectifs_primaire:
    story.append(bullet(obj))

story.append(h2('3.2 Objectifs secondaires'))

objectifs_secondaire = [
    'Connecter les r\u00e9sultats au syst\u00e8me de permis biom\u00e9trique national.',
    'Faciliter l\u2019acc\u00e8s des candidats via le paiement Mobile Money (Orange Money, MTN).',
    'R\u00e9duire les d\u00e9placements physiques des candidats gr\u00e2ce \u00e0 l\u2019inscription et la r\u00e9servation en ligne.',
    'Fournir aux auto-\u00e9coles des outils de suivi et de pr\u00e9paration de leurs \u00e9l\u00e8ves.',
    'Cr\u00e9er un \u00e9cosyst\u00e8me \u00e9conomique autour des centres agr\u00e9\u00e9s (emplois, commissions).',
    'Sensibiliser \u00e0 la s\u00e9curit\u00e9 routi\u00e8re \u00e0 travers des tests d\u2019entra\u00eenement accessibles au public.',
]
for obj in objectifs_secondaire:
    story.append(bullet(obj))

# ═══════════════════════════════════════════════════════════════════════
# SECTION 4: ACTEURS DU SYSTEME
# ═══════════════════════════════════════════════════════════════════════
story.extend(h1('4. Acteurs du syst\u00e8me'))

story.append(p(
    'La plateforme CodeRoute Guin\u00e9e est con\u00e7ue autour de cinq acteurs principaux, chacun disposant '
    'd\u2019un espace d\u00e9di\u00e9 avec des fonctionnalit\u00e9s sp\u00e9cifiques adapt\u00e9es \u00e0 son r\u00f4le dans l\u2019\u00e9cosyst\u00e8me. '
    'Cette architecture multi-acteurs garantit la s\u00e9paration des responsabilit\u00e9s, la tra\u00e7abilit\u00e9 '
    'des actions et le contr\u00f4le crois\u00e9, \u00e9l\u00e9ments essentiels pour la pr\u00e9vention de la fraude.'
))

actors = [
    ('4.1 Candidat', [
        'Cr\u00e9er un compte avec pi\u00e8ces d\u2019identit\u00e9',
        'Choisir une cat\u00e9gorie de permis : A, B, C, D, E',
        'R\u00e9server une session d\u2019examen dans un centre agr\u00e9\u00e9',
        'Payer en ligne ou via Mobile Money',
        'Recevoir une convocation avec QR code',
        'Passer l\u2019examen dans un centre agr\u00e9\u00e9',
        'Recevoir son r\u00e9sultat automatiquement',
    ]),
    ('4.2 Auto-\u00e9cole', [
        'Inscrire ses \u00e9l\u00e8ves et suivre leur progression',
        'R\u00e9server des cr\u00e9neaux d\u2019examen pour ses \u00e9l\u00e8ves',
        'Consulter les r\u00e9sultats et pr\u00e9parer les candidats avec des tests blancs',
        'G\u00e9rer ses paiements, commissions et facturation',
        'Acc\u00e9der aux statistiques de r\u00e9ussite et au classement de ses \u00e9l\u00e8ves',
    ]),
    ('4.3 Centre agr\u00e9\u00e9', [
        'G\u00e9rer les salles, postes d\u2019examen et planning des sessions',
        'V\u00e9rifier l\u2019identit\u00e9 du candidat (QR code, pi\u00e8ce d\u2019identit\u00e9)',
        'Surveiller l\u2019examen en temps r\u00e9el et valider la pr\u00e9sence',
        'Lancer les sessions et transmettre automatiquement les r\u00e9sultats',
        'D\u00e9clarer les incidents et g\u00e9n\u00e9rer les rapports de session',
    ]),
    ('4.4 Autorit\u00e9 nationale', [
        'Agr\u00e9er ou suspendre un centre',
        'Auditer les sessions et suivre les statistiques nationales',
        'G\u00e9rer la banque officielle de questions',
        'Contr\u00f4ler les fraudes et connecter les r\u00e9sultats au permis',
        'Exporter les rapports et analyses en Excel / PDF',
    ]),
    ('4.5 Super administrateur', [
        'G\u00e9rer les utilisateurs, r\u00f4les et centres',
        'Superviser les paiements, examens, logs et audits',
        'Configurer les param\u00e8tres nationaux et les alertes de fraude',
        'Administrer les alertes de fraude et les sanctions',
    ]),
]

for title, items in actors:
    story.append(h2(title))
    for item in items:
        story.append(bullet(item))

# ═══════════════════════════════════════════════════════════════════════
# SECTION 5: PARCOURS CANDIDAT
# ═══════════════════════════════════════════════════════════════════════
story.extend(h1('5. Parcours candidat complet'))

story.append(p(
    'Le parcours candidat constitue le c\u0153ur de l\u2019exp\u00e9rience utilisateur de la plateforme. '
    'Il a \u00e9t\u00e9 con\u00e7u pour \u00eatre \u00e0 la fois simple et s\u00e9curis\u00e9, en huit \u00e9tapes cl\u00e9s allant '
    'de l\u2019inscription \u00e0 la transmission du r\u00e9sultat au syst\u00e8me de permis biom\u00e9trique. '
    'Chaque \u00e9tape int\u00e8gre des contr\u00f4les de v\u00e9rification pour garantir l\u2019int\u00e9grit\u00e9 du processus.'
))

# Candidate journey diagram
add_diagram(story,
    os.path.join(DIAGRAMS_DIR, 'candidate-journey.png'),
    'Figure 1 : Parcours complet du candidat de l\u2019inscription \u00e0 la transmission du permis',
    width_cm=15
)

journey_steps = [
    ('\u00c9tape 1 : Inscription', [
        'Le candidat cr\u00e9e son compte avec : nom, pr\u00e9nom, date de naissance, num\u00e9ro d\u2019identit\u00e9, t\u00e9l\u00e9phone, email, ville, cat\u00e9gorie de permis, photo, justificatif d\u2019identit\u00e9.',
        'Le syst\u00e8me g\u00e9n\u00e8re un num\u00e9ro candidat unique, par exemple : <b>GN-CODE-2026-000001</b>.',
    ]),
    ('\u00c9tape 2 : V\u00e9rification', [
        'Le dossier peut \u00eatre v\u00e9rifi\u00e9 par : une auto-\u00e9cole, un centre agr\u00e9\u00e9, l\u2019administration, ou automatiquement avec contr\u00f4le documentaire.',
    ]),
    ('\u00c9tape 3 : Choix du centre', [
        'Le candidat choisit la r\u00e9gion, la ville, le centre agr\u00e9\u00e9, la date, l\u2019heure et la cat\u00e9gorie d\u2019examen.',
        'Exemple : Conakry > Kaloum > Centre Agr\u00e9\u00e9 RouteSafe Kaloum > 20 juin 2026 > 10h00.',
    ]),
    ('\u00c9tape 4 : Paiement', [
        'Paiements possibles : Orange Money, MTN Mobile Money, carte bancaire, paiement bancaire, paiement guichet, bon de paiement auto-\u00e9cole.',
    ]),
    ('\u00c9tape 5 : Convocation', [
        'Le candidat re\u00e7oit : un QR code, le centre, l\u2019heure, les consignes et les documents \u00e0 pr\u00e9senter.',
    ]),
    ('\u00c9tape 6 : Passage de l\u2019examen', [
        'Dans le centre : v\u00e9rification pi\u00e8ce d\u2019identit\u00e9, scan QR code, photo instantan\u00e9e, affectation automatique \u00e0 un poste, questions tir\u00e9es al\u00e9atoirement, dur\u00e9e limit\u00e9e, correction automatique.',
    ]),
    ('\u00c9tape 7 : R\u00e9sultat', [
        'Le r\u00e9sultat est g\u00e9n\u00e9r\u00e9 imm\u00e9diatement ou apr\u00e8s validation : admis/ajourn\u00e9, score, date, centre, r\u00e9f\u00e9rence d\u2019examen, certificat num\u00e9rique.',
    ]),
    ('\u00c9tape 8 : Transmission au permis', [
        'Si le candidat est admis, son r\u00e9sultat est transmis au syst\u00e8me de permis biom\u00e9trique ou \u00e0 l\u2019administration comp\u00e9tente.',
    ]),
]

for title, items in journey_steps:
    story.append(h2(title))
    for item in items:
        story.append(p(item))

# ═══════════════════════════════════════════════════════════════════════
# SECTION 6: FONCTIONNALITES PRINCIPALES
# ═══════════════════════════════════════════════════════════════════════
story.extend(h1('6. Fonctionnalit\u00e9s principales'))

story.append(p(
    'La plateforme CodeRoute Guin\u00e9e est structur\u00e9e autour de sept modules fonctionnels couvrant '
    'l\u2019ensemble du processus, de l\u2019inscription du candidat \u00e0 la g\u00e9n\u00e9ration des statistiques nationales. '
    'Chaque module est con\u00e7u pour fonctionner de mani\u00e8re autonome tout en \u00e9tant int\u00e9gr\u00e9 aux autres, '
    'assurant ainsi la coh\u00e9rence et la tra\u00e7abilit\u00e9 de bout en bout.'
))

modules = [
    ('6.1 Module Candidat', [
        'Inscription en ligne avec upload de documents',
        'Tableau de bord candidat personnalis\u00e9',
        'R\u00e9servation de session avec choix du centre et cr\u00e9neau',
        'Paiement int\u00e9gr\u00e9 (Mobile Money, carte, virement)',
        'Convocation avec QR code s\u00e9curis\u00e9',
        'Historique des examens et r\u00e9sultats t\u00e9l\u00e9chargeables',
        'Tests d\u2019entra\u00eenement et simulations',
        'Notifications SMS / WhatsApp / email',
    ]),
    ('6.2 Module Examen', [
        'Banque officielle de questions g\u00e9r\u00e9e par l\u2019administration',
        'Questions par cat\u00e9gorie (A, B, C, D, E) avec images, vid\u00e9os et audio',
        'Tirage al\u00e9atoire s\u00e9curis\u00e9 des questions',
        'Chronom\u00e8tre et dur\u00e9e limit\u00e9e configurable',
        'Correction automatique et score minimum configurable',
        'Verrouillage de l\u2019examen apr\u00e8s soumission',
    ]),
    ('6.3 Module Centre agr\u00e9\u00e9', [
        'Gestion des salles et postes d\u2019examen',
        'Planning des sessions et r\u00e9servations',
        'Contr\u00f4le de pr\u00e9sence par scan QR code',
        'Supervision en temps r\u00e9el des examens en cours',
        'Rapport de session automatique',
        'Journal d\u2019incidents',
    ]),
    ('6.4 Module Auto-\u00e9cole', [
        'Gestion des \u00e9l\u00e8ves et inscription group\u00e9e',
        'Pr\u00e9paration au code avec tests blancs',
        'Suivi des r\u00e9sultats et statistiques de r\u00e9ussite',
        'R\u00e9servation group\u00e9e de cr\u00e9neaux',
        'Facturation et gestion des paiements',
    ]),
    ('6.5 Module Administration', [
        'Agr\u00e9ment et suspension des centres',
        'Audit des sessions et gestion des questions officielles',
        'Statistiques nationales et tableau de bord',
        'Suivi des fraudes et export Excel / PDF',
        'API vers le syst\u00e8me national de permis',
    ]),
    ('6.6 Module Paiement', [
        'Paiement Mobile Money (Orange Money, MTN), bancaire, guichet',
        'Re\u00e7us automatiques et rapprochement financier',
        'Commission centre / plateforme / administration',
        'Historique complet des transactions',
    ]),
]

for title, items in modules:
    story.append(h2(title))
    for item in items:
        story.append(bullet(item))

# ═══════════════════════════════════════════════════════════════════════
# SECTION 7: MODULE ANTI-FRAUDE
# ═══════════════════════════════════════════════════════════════════════
story.extend(h1('7. Module anti-fraude'))

story.append(p(
    'Le module anti-fraude constitue le pilier le plus critique de la plateforme CodeRoute Guin\u00e9e. '
    'Contrairement au mod\u00e8le fran\u00e7ais o\u00f9 les dispositifs anti-fraude ont \u00e9t\u00e9 ajout\u00e9s apr\u00e8s coup, '
    'la conception de CodeRoute Guin\u00e9e int\u00e8gre ces mesures d\u00e8s l\u2019origine. Cette approche proactive '
    'permet de pr\u00e9venir les failles plut\u00f4t que de les corriger, en s\u2019appuyant sur une combinaison '
    'de mesures techniques, organisationnelles et statistiques.'
))

story.append(h2('7.1 Mesures techniques'))

fraud_technical = [
    ('Scan QR code obligatoire', 'Chaque candidat doit pr\u00e9senter son QR code de convocation \u00e0 l\u2019entr\u00e9e du centre. Le scan v\u00e9rifie l\u2019authenticit\u00e9 de la convocation, l\u2019identit\u00e9 du candidat et la validit\u00e9 de la r\u00e9servation.'),
    ('Photographie le jour de l\u2019examen', 'Une photo est prise automatiquement lors de l\u2019entr\u00e9e dans la salle d\u2019examen et compar\u00e9e avec la photo du dossier d\u2019inscription. Toute diff\u00e9rence significative d\u00e9clenche une alerte.'),
    ('Surveillance webcam', 'La webcam du poste d\u2019examen enregistre p\u00e9riodiquement des captures d\u2019\u00e9cran et des images du candidat pendant l\u2019examen, permettant une v\u00e9rification ult\u00e9rieure ou en temps r\u00e9el.'),
    ('Verrouillage du navigateur', 'Le poste d\u2019examen est verrouill\u00e9 en mode kiosque : le candidat ne peut pas ouvrir d\u2019autres onglets, d\u2019applications, ou quitter l\u2019interface d\u2019examen sans que cela soit enregistr\u00e9.'),
    ('Tirage al\u00e9atoire des questions', 'Chaque candidat re\u00e7oit un ensemble de questions tir\u00e9es al\u00e9atoirement dans la banque officielle, rendant la copie entre candidats voisins impossible.'),
    ('Ordre des r\u00e9ponses m\u00e9lang\u00e9', 'M\u00eame pour une m\u00eame question, l\u2019ordre des r\u00e9ponses propos\u00e9es est m\u00e9lang\u00e9 pour chaque candidat, emp\u00eachant la triche par position.'),
    ('Interdiction du retour arri\u00e8re', 'Selon la configuration, le candidat ne peut pas revenir aux questions pr\u00e9c\u00e9dentes une fois sa r\u00e9ponse valid\u00e9e, r\u00e9duisant les tentatives de modification.'),
]
for title, desc in fraud_technical:
    story.append(Paragraph(f'<b>{title}</b>', styles['H3']))
    story.append(p(desc))

story.append(h2('7.2 Mesures statistiques et d\u00e9tection'))

fraud_stats = [
    'D\u00e9tection des centres avec taux de r\u00e9ussite anormal (sup\u00e9rieur \u00e0 2 \u00e9carts-types de la moyenne nationale).',
    'D\u00e9tection des candidats inscrits plusieurs fois avec des identit\u00e9s diff\u00e9rentes.',
    'Analyse des temps de r\u00e9ponse : des r\u00e9ponses anormalement rapides ou uniformes d\u00e9clenchent des alertes.',
    'G\u00e9olocalisation du centre pour v\u00e9rifier que l\u2019examen se d\u00e9roule bien dans le centre d\u00e9clar\u00e9.',
    'Comparaison croisée des r\u00e9sultats entre centres, sessions et p\u00e9riodes.',
]
for item in fraud_stats:
    story.append(bullet(item))

story.append(h2('7.3 Sanctions et tra\u00e7abilit\u00e9'))

sanctions = [
    'Logs de toutes les actions (connexion, r\u00e9ponses, soumission, tentatives de triche).',
    'Signature num\u00e9rique du r\u00e9sultat garantissant son int\u00e9grit\u00e9.',
    'Audit vid\u00e9o ou capture p\u00e9riodique conserv\u00e9 pendant 5 ans.',
    'Blacklist des fraudeurs avec interdiction de repasser l\u2019examen pendant une p\u00e9riode d\u00e9finie.',
    'Suspension automatique d\u2019un centre en cas d\u2019anomalie grave.',
]
for item in sanctions:
    story.append(bullet(item))

# ═══════════════════════════════════════════════════════════════════════
# SECTION 8: ARCHITECTURE TECHNIQUE
# ═══════════════════════════════════════════════════════════════════════
story.extend(h1('8. Architecture technique'))

story.append(p(
    'L\u2019architecture technique de CodeRoute Guin\u00e9e est con\u00e7ue pour r\u00e9pondre aux exigences de s\u00e9curit\u00e9, '
    'de disponibilit\u00e9 et d\u2019\u00e9volutivit\u00e9 d\u2019un syst\u00e8me national critique. Elle repose sur une '
    'architecture en microservices, une base de donn\u00e9es PostgreSQL segment\u00e9e par sch\u00e9mas '
    'm\u00e9tier, et un h\u00e9bergement hybride combinant infrastructure locale et scalabilit\u00e9 cloud.'
))

story.append(h2('8.1 Frontend'))
story.append(make_table(
    ['Composant', 'Technologie', 'Description'],
    [
        ['Web App', 'React.js / Next.js', 'Interface web responsive, 5 modes utilisateur'],
        ['Mobile App', 'React Native', 'Application mobile native iOS/Android'],
        ['UI Framework', 'Tailwind CSS + Shadcn UI', 'Composants accessibles et coh\u00e9rents'],
        ['Animations', 'Framer Motion', 'Transitions et interactions fluides'],
    ],
    col_widths=[2, 2, 4]
))

story.append(h2('8.2 Backend'))
story.append(make_table(
    ['Service', 'Technologie', 'R\u00f4le'],
    [
        ['API', 'FastAPI / NestJS', 'API REST s\u00e9curis\u00e9e avec authentification JWT'],
        ['Auth', 'OAuth2 + JWT', 'Gestion des r\u00f4les et permissions'],
        ['T\u00e2ches async', 'Celery / BullMQ + Redis', 'Notifications, g\u00e9n\u00e9ration PDF, etc.'],
        ['Fichiers', 'MinIO / S3', 'Stockage photos, documents, certificats'],
    ],
    col_widths=[2, 2, 4]
))

story.append(h2('8.3 Base de donn\u00e9es'))
story.append(p(
    'PostgreSQL est le SGBD principal, organis\u00e9 en sch\u00e9mas s\u00e9par\u00e9s par domaine fonctionnel : '
    'identity (candidats, utilisateurs, auto-\u00e9coles), exam (questions, sessions, tentatives), '
    'payment (paiements, commissions), center (centres, salles, postes), '
    'audit (logs, alertes, incidents), reporting (statistiques journali\u00e8res). '
    'Redis est utilis\u00e9 pour le cache, les sessions et les files d\u2019attente.'
))

story.append(h2('8.4 S\u00e9curit\u00e9'))
sec_items = [
    'HTTPS obligatoire sur toutes les communications',
    'Chiffrement des donn\u00e9es sensibles (AES-256 au repos, TLS 1.3 en transit)',
    'Journal d\u2019audit complet et immuable',
    'Sauvegardes automatiques quotidiennes avec r\u00e9tention 30 jours',
    'Authentification forte pour les administrateurs (2FA)',
    'S\u00e9paration stricte des r\u00f4les (RBAC)',
    'Protection contre la triche et signature num\u00e9rique des r\u00e9sultats',
]
for item in sec_items:
    story.append(bullet(item))

story.append(h2('8.5 H\u00e9bergement'))
story.append(p(
    'Pour un projet national, une architecture hybride est recommand\u00e9e : les donn\u00e9es sensibles '
    '(identit\u00e9 des candidats, r\u00e9sultats, audit) sont h\u00e9berg\u00e9es dans un environnement contr\u00f4l\u00e9 '
    '(data center local en Guin\u00e9e ou VPS s\u00e9curis\u00e9), tandis que les services \u00e0 forte charge '
    '(examens, notifications, cache) b\u00e9n\u00e9ficient de la scalabilit\u00e9 cloud (Azure, AWS ou GCP). '
    'Les options incluent : cloud local guin\u00e9en, VPS s\u00e9curis\u00e9, Azure/AWS/GCP, ou cloud hybride.'
))

# ═══════════════════════════════════════════════════════════════════════
# SECTION 9: DIAGRAMMES D'ARCHITECTURE
# ═══════════════════════════════════════════════════════════════════════
story.extend(h1('9. Diagrammes d\u2019architecture'))

story.append(p(
    'Les diagrammes suivants illustrent l\u2019architecture globale du syst\u00e8me CodeRoute Guin\u00e9e, '
    'montrant les interactions entre les diff\u00e9rentes couches logicielles, les services backend, '
    'les bases de donn\u00e9es et les int\u00e9grations externes. Cette architecture en couches garantit '
    'la s\u00e9paration des pr\u00e9occupations, la s\u00e9curit\u00e9 des \u00e9changes et l\u2019\u00e9volutivit\u00e9 du syst\u00e8me.'
))

add_diagram(story,
    os.path.join(DIAGRAMS_DIR, 'architecture.png'),
    'Figure 2 : Architecture technique du syst\u00e8me CodeRoute Guin\u00e9e',
    width_cm=16
)

# ═══════════════════════════════════════════════════════════════════════
# SECTION 10: MODELE DE DONNEES
# ═══════════════════════════════════════════════════════════════════════
story.extend(h1('10. Mod\u00e8le de donn\u00e9es'))

story.append(p(
    'Le mod\u00e8le de donn\u00e9es de CodeRoute Guin\u00e9e est structur\u00e9 autour de six sch\u00e9mas PostgreSQL '
    'couvrant les domaines fonctionnels du syst\u00e8me. Cette segmentation garantit la s\u00e9paration '
    'des donn\u00e9es, facilite les audits et permet une gestion fine des permissions d\u2019acc\u00e8s. '
    'Le diagramme entit\u00e9-relation ci-dessous d\u00e9taille les tables, colonnes et relations du syst\u00e8me.'
))

add_diagram(story,
    os.path.join(DIAGRAMS_DIR, 'data-model.png'),
    'Figure 3 : Mod\u00e8le entit\u00e9-relation de la base de donn\u00e9es CodeRoute Guin\u00e9e',
    width_cm=16
)

story.append(h2('10.1 Sch\u00e9ma identity'))
story.append(make_table(
    ['Entit\u00e9', 'Colonnes cl\u00e9s', 'Description'],
    [
        ['Candidate', 'id, candidate_number, last_name, first_name, date_of_birth, national_id, permit_category, status', 'Profil complet du candidat'],
        ['User', 'id, email, password_hash, role, is_active, last_login', 'Utilisateur syst\u00e8me multi-r\u00f4le'],
        ['DrivingSchool', 'id, name, registration_number, city, is_approved', 'Auto-\u00e9cole partenaire'],
    ],
    col_widths=[2, 3, 2]
))

story.append(h2('10.2 Sch\u00e9ma exam'))
story.append(make_table(
    ['Entit\u00e9', 'Colonnes cl\u00e9s', 'Description'],
    [
        ['Question', 'id, category, text, image_path, question_type, is_active', 'Banque de questions officielle'],
        ['Answer', 'id, question_id, text, is_correct, order_index', 'R\u00e9ponses associ\u00e9es'],
        ['ExamSession', 'id, center_id, date, start_time, category, max_candidates, status', 'Session d\u2019examen planifi\u00e9e'],
        ['ExamAttempt', 'id, candidate_id, session_id, score, is_passed, status, qr_code', 'Tentative d\u2019examen'],
        ['ExamResponse', 'id, attempt_id, question_id, answer_id, is_correct, response_time', 'R\u00e9ponse individuelle'],
    ],
    col_widths=[2, 3, 2]
))

story.append(h2('10.3 Sch\u00e9ma payment'))
story.append(make_table(
    ['Entit\u00e9', 'Colonnes cl\u00e9s', 'Description'],
    [
        ['Payment', 'id, candidate_id, session_id, amount, method, status, transaction_ref', 'Transaction de paiement'],
        ['Commission', 'id, payment_id, center_share, platform_share, admin_share', 'R\u00e9partition des commissions'],
    ],
    col_widths=[2, 3, 2]
))

story.append(h2('10.4 Sch\u00e9ma center'))
story.append(make_table(
    ['Entit\u00e9', 'Colonnes cl\u00e9s', 'Description'],
    [
        ['Center', 'id, name, region, city, capacity, is_approved, approval_date, expiry_date', 'Centre agr\u00e9\u00e9'],
        ['CenterRoom', 'id, center_id, name, capacity, has_camera, has_generator', 'Salle d\u2019examen'],
        ['CenterWorkstation', 'id, room_id, identifier, is_functional', 'Poste informatique'],
    ],
    col_widths=[2, 3, 2]
))

story.append(h2('10.5 Sch\u00e9ma audit'))
story.append(make_table(
    ['Entit\u00e9', 'Colonnes cl\u00e9s', 'Description'],
    [
        ['AuditLog', 'id, user_id, action, entity_type, entity_id, ip_address', 'Journal d\u2019audit complet'],
        ['FraudAlert', 'id, attempt_id, center_id, alert_type, severity, is_resolved', 'Alerte de fraude d\u00e9tect\u00e9e'],
        ['SessionIncident', 'id, session_id, incident_type, description, reported_by', 'Incident de session'],
    ],
    col_widths=[2, 3, 2]
))

story.append(h2('10.6 Sch\u00e9ma reporting'))
story.append(make_table(
    ['Entit\u00e9', 'Colonnes cl\u00e9s', 'Description'],
    [
        ['DailyStatistic', 'id, date, region, center_id, total_candidates, total_passed, fraud_count, revenue', 'Statistiques journali\u00e8res agr\u00e9g\u00e9es'],
    ],
    col_widths=[2, 3, 2]
))

# ═══════════════════════════════════════════════════════════════════════
# SECTION 11: REGLES D'EXAMEN ET AGREMENT
# ═══════════════════════════════════════════════════════════════════════
story.extend(h1('11. R\u00e8gles d\u2019examen et agr\u00e9ment'))

story.append(h2('11.1 Param\u00e9trage de l\u2019examen'))
story.append(make_table(
    ['Param\u00e8tre', 'Valeur propos\u00e9e', 'Configurable'],
    [
        ['Nombre de questions', '40', 'Oui'],
        ['Dur\u00e9e', '30 minutes', 'Oui'],
        ['Seuil de r\u00e9ussite', '35 bonnes r\u00e9ponses / 40', 'Oui'],
        ['Tirage des questions', 'Al\u00e9atoire', 'Non'],
        ['Type de r\u00e9ponses', 'Une ou multiples selon le type', 'Oui'],
        ['R\u00e9sultat', 'Imm\u00e9diat', 'Non'],
        ['D\u00e9lai avant nouvelle tentative', '48h ou 7 jours', 'Oui'],
        ['Conservation de l\u2019historique', 'Illimit\u00e9e', 'Non'],
        ['Certificat num\u00e9rique', 'Unique par r\u00e9ussite', 'Non'],
    ],
    col_widths=[3, 2, 1.5]
))

story.append(p(
    'Ces r\u00e8gles sont propos\u00e9es comme configuration initiale et peuvent \u00eatre adapt\u00e9es par l\u2019autorit\u00e9 '
    'guin\u00e9enne comp\u00e9tente. Le syst\u00e8me permet de modifier les param\u00e8tres configurables sans d\u00e9ploiement '
    'de code, via l\u2019interface d\u2019administration.'
))

story.append(h2('11.2 Conditions d\u2019agr\u00e9ment des centres'))

story.append(p(
    'L\u2019\u00c9tat ou l\u2019autorit\u00e9 comp\u00e9tente d\u00e9finit un cahier des charges strict pour l\u2019agr\u00e9ment '
    'des centres d\u2019examen. Cette d\u00e9marche garantit que chaque centre offre des conditions '
    'optimales pour le d\u00e9roulement des examens et la pr\u00e9vention de la fraude.'
))

story.append(make_table(
    ['Crit\u00e8re', 'Exigence', 'V\u00e9rification'],
    [
        ['Salle', 'Ferm\u00e9e et s\u00e9curis\u00e9e', 'Inspection physique'],
        ['\u00c9quipement', 'Ordinateurs ou tablettes certifi\u00e9s', 'Inventaire technique'],
        ['Connectivit\u00e9', 'Connexion internet stable', 'Test de d\u00e9bit'],
        ['Surveillance', 'Cam\u00e9ra de surveillance', 'V\u00e9rification installation'],
        ['Personnel', 'Agent de supervision form\u00e9', 'Certification formation'],
        ['\u00c9nergie', 'Syst\u00e8me \u00e9lectrique fiable + onduleur/g\u00e9n\u00e9rateur', 'Test de continuit\u00e9'],
        ['Acc\u00e8s', 'Accessible aux personnes handicap\u00e9es', 'Conformit\u00e9 normes'],
        ['Agr\u00e9ment', 'Valide 3 ans, renouvelable apr\u00e8s contr\u00f4le', 'Audit p\u00e9riodique'],
    ],
    col_widths=[2, 3, 2]
))

# ═══════════════════════════════════════════════════════════════════════
# SECTION 12: DASHBOARD NATIONAL
# ═══════════════════════════════════════════════════════════════════════
story.extend(h1('12. Dashboard national'))

story.append(p(
    'Le tableau de bord national constitue l\u2019outil de pilotage strat\u00e9gique de l\u2019administration. '
    'Il agr\u00e8ge en temps r\u00e9el les donn\u00e9es de l\u2019ensemble des centres agr\u00e9\u00e9s et fournit des '
    'indicateurs cl\u00e9s de performance (KPI) pour orienter les d\u00e9cisions en mati\u00e8re de s\u00e9curit\u00e9 '
    'routi\u00e8re, de contr\u00f4le des centres et d\u2019am\u00e9lioration de la formation.'
))

dashboard_kpis = [
    'Nombre de candidats inscrits (total et par p\u00e9riode)',
    'Nombre d\u2019examens pass\u00e9s et taux de r\u00e9ussite global',
    'Taux de r\u00e9ussite par ville, par centre et par auto-\u00e9cole',
    'Nombre de fraudes d\u00e9tect\u00e9es et types de fraude',
    'Revenus g\u00e9n\u00e9r\u00e9s et volume de paiements Mobile Money',
    'Centres les plus actifs et r\u00e9gions avec plus d\u2019\u00e9checs',
    'Questions les plus \u00e9chou\u00e9es (pour am\u00e9liorer la formation)',
    '\u00c9volution mensuelle des examens et tendances',
]
for kpi in dashboard_kpis:
    story.append(bullet(kpi))

story.append(p(
    'Ce dashboard peut \u00eatre connect\u00e9 \u00e0 des outils de Business Intelligence tels que Apache Superset '
    'pour des analyses avanc\u00e9es, des tableaux de bord interactifs et des rapports automatis\u00e9s. '
    'Les donn\u00e9es sont exportables en Excel et PDF pour les rapports institutionnels.'
))

# ═══════════════════════════════════════════════════════════════════════
# SECTION 13: MODELE ECONOMIQUE
# ═══════════════════════════════════════════════════════════════════════
story.extend(h1('13. Mod\u00e8le \u00e9conomique'))

story.append(p(
    'Trois mod\u00e8les \u00e9conomiques sont envisageables pour CodeRoute Guin\u00e9e. Chacun pr\u00e9sente des '
    'avantages et des risques sp\u00e9cifiques qui doivent \u00eatre \u00e9valu\u00e9s en fonction du contexte '
    'institutionnel, des capacit\u00e9s techniques de l\u2019\u00c9tat et des objectifs de p\u00e9rennit\u00e9 du syst\u00e8me.'
))

story.append(make_table(
    ['Mod\u00e8le', 'Description', 'Avantages', 'Risques'],
    [
        ['Public', 'L\u2019\u00c9tat finance et contr\u00f4le toute la plateforme', 'Contr\u00f4le total, souverainet\u00e9 des donn\u00e9es', 'Co\u00fbt \u00e9lev\u00e9, lenteur d\u2019innovation'],
        ['D\u00e9l\u00e9gation', 'Centres priv\u00e9s sous contr\u00f4le public (mod\u00e8le fran\u00e7ais)', 'Efficacit\u00e9, rapidit\u00e9 de d\u00e9ploiement', 'Risque de fraude si contr\u00f4le insuffisant'],
        ['PPP', 'Partenariat public-priv\u00e9 avec partage des r\u00f4les', 'Equilibre contr\u00f4le/innovation, p\u00e9rennit\u00e9', 'Complexit\u00e9 contractuelle'],
    ],
    col_widths=[1.5, 2.5, 2, 2]
))

story.append(h2('13.1 Mod\u00e8le recommand\u00e9 : Partenariat public-priv\u00e9'))

story.append(p(
    'Le partenariat public-priv\u00e9 (PPP) est le mod\u00e8le recommand\u00e9 pour la Guin\u00e9e. Il permet '
    'de combiner la l\u00e9gitimit\u00e9 et le contr\u00f4le de l\u2019\u00c9tat avec l\u2019efficacit\u00e9 technique et '
    'l\u2019innovation du secteur priv\u00e9. La r\u00e9partition des r\u00f4les est la suivante :'
))

ppp_roles = [
    ('\u00c9tat', 'R\u00e9glementation, agr\u00e9ment des centres, contr\u00f4le, validation officielle des r\u00e9sultats'),
    ('Plateforme', 'Technologie, s\u00e9curit\u00e9, supervision technique, maintenance'),
    ('Centres agr\u00e9\u00e9s', 'Accueil physique, surveillance des examens, maintenance \u00e9quipements'),
    ('Auto-\u00e9coles', 'Pr\u00e9paration des candidats, inscription group\u00e9e'),
    ('Op\u00e9rateurs Mobile Money', 'Paiement s\u00e9curis\u00e9 des frais d\u2019examen'),
]
for role, desc in ppp_roles:
    story.append(bullet(f'<b>{role}</b> : {desc}'))

story.append(p(
    'Le tarif de l\u2019examen est encadr\u00e9 par l\u2019\u00c9tat et r\u00e9parti entre les acteurs selon un sch\u00e9ma '
    'de commissions pr\u00e9d\u00e9fini. Par exemple, sur un tarif de 50 000 GNF, la r\u00e9partition pourrait \u00eatre : '
    '30% pour le centre agr\u00e9\u00e9, 40% pour la plateforme, 30% pour l\u2019administration. '
    'Ces pourcentages sont configurables dans le syst\u00e8me de paiement.'
))

# ═══════════════════════════════════════════════════════════════════════
# SECTION 14: BENCHMARK INTERNATIONAL
# ═══════════════════════════════════════════════════════════════════════
story.extend(h1('14. Benchmark international'))

story.append(p(
    'L\u2019analyse des syst\u00e8mes de code de la route dans d\u2019autres pays permet d\u2019identifier les bonnes '
    'pratiques et les pi\u00e8ges \u00e0 \u00e9viter. Quatre pays ont \u00e9t\u00e9 s\u00e9lectionn\u00e9s pour leur pertinence '
    'par rapport au contexte guin\u00e9en : la France pour son mod\u00e8le de d\u00e9l\u00e9gation, le S\u00e9n\u00e9gal et '
    'la C\u00f4te d\u2019Ivoire pour leur proximit\u00e9 r\u00e9gionale, et le Maroc pour son exp\u00e9rience de digitalisation.'
))

story.append(make_table(
    ['Pays', 'Mod\u00e8le', 'Anti-fraude', 'Le\u00e7on pour la Guin\u00e9e'],
    [
        ['France', 'D\u00e9l\u00e9gation \u00e0 des op\u00e9rateurs priv\u00e9s agr\u00e9\u00e9s. Tarif encadr\u00e9 (30 EUR). Inscription en ligne.',
         'V\u00e9rification identit\u00e9, tirage al\u00e9atoire. Mais fraude d\u00e9tect\u00e9e dans certains centres.',
         'Int\u00e9grer l\u2019anti-fraude d\u00e8s la conception, ne pas la traiter en secondaire.'],
        ['S\u00e9n\u00e9gal', 'Modernisation progressive. Centres d\u2019examen informatis\u00e9s dans les grandes villes.',
         'Contr\u00f4le d\u2019identit\u00e9 basique. Manque de surveillance num\u00e9rique.',
         'Pr\u00e9voir la couverture rurale et ne pas se limiter aux grandes villes.'],
        ['C\u00f4te d\u2019Ivoire', 'Syst\u00e8me en cours de digitalisation. Partenariat avec des op\u00e9rateurs priv\u00e9s.',
         'Faible. Fraude encore significative dans certains centres.',
         'Ne pas sous-estimer l\u2019importance du contr\u00f4le continu des centres.'],
        ['Maroc', 'Digitalisation avanc\u00e9e avec NARSA. Paiement en ligne, centres agr\u00e9\u00e9s.',
         'Surveillance cam\u00e9ra, tirage al\u00e9atoire, score imm\u00e9diat.',
         'La digitalisation compl\u00e8te est possible et efficace en Afrique du Nord.'],
    ],
    col_widths=[1.2, 2, 2, 2.5]
))

story.append(h2('14.1 Enseignements cl\u00e9s'))

lessons = [
    'L\u2019anti-fraude doit \u00eatre un pilier de la conception, pas un ajout ult\u00e9rieur. La France a montr\u00e9 que la d\u00e9l\u00e9gation sans contr\u00f4le suffisant m\u00e8ne \u00e0 la fraude.',
    'La couverture g\u00e9ographique doit \u00eatre planifi\u00e9e d\u00e8s le d\u00e9part pour ne pas p\u00e9naliser les zones rurales.',
    'Le paiement Mobile Money est un atout majeur en Afrique de l\u2019Ouest et doit \u00eatre int\u00e9gr\u00e9 nativement.',
    'La transparence des r\u00e9sultats et la possibilit\u00e9 d\u2019audit sont essentielles pour la cr\u00e9dibilit\u00e9 du syst\u00e8me.',
    'Le mod\u00e8le PPP offre le meilleur \u00e9quilibre entre contr\u00f4le public et efficacit\u00e9 priv\u00e9e.',
]
for lesson in lessons:
    story.append(bullet(lesson))

# ═══════════════════════════════════════════════════════════════════════
# SECTION 15: PLANNING CHIFFRE
# ═══════════════════════════════════════════════════════════════════════
story.extend(h1('15. Planning chiffr\u00e9'))

story.append(p(
    'Le d\u00e9ploiement de CodeRoute Guin\u00e9e est planifi\u00e9 en deux phases principales : le MVP '
    '(Phase 1) permettant un lancement rapide avec les fonctionnalit\u00e9s essentielles, et la V2 '
    '(Phase 2) enrichissant la plateforme avec des capacit\u00e9s avanc\u00e9es. Le planning ci-dessous '
    'est estimatif et devra \u00eatre ajust\u00e9 en fonction des ressources disponibles et des d\u00e9cisions '
    'institutionnelles.'
))

story.append(h2('15.1 Phase 1 : MVP (Mois 1-6)'))
story.append(make_table(
    ['Mois', 'Activit\u00e9', 'Livrable'],
    [
        ['1-2', 'Conception UX/UI et architecture', 'Maquettes Figma, sp\u00e9cifications techniques'],
        ['2-4', 'D\u00e9veloppement backend (auth, examen, paiement)', 'API d\u00e9ploy\u00e9e en staging'],
        ['3-5', 'D\u00e9veloppement frontend (candidat, centre, admin)', 'Web app d\u00e9ploy\u00e9e en staging'],
        ['4-5', 'Int\u00e9gration Mobile Money sandbox', 'Paiement test fonctionnel'],
        ['5-6', 'Tests, s\u00e9curit\u00e9, formation des centres pilotes', 'Rapport de tests, centres form\u00e9s'],
        ['6', 'D\u00e9ploiement pilote \u00e0 Conakry (3-5 centres)', 'Plateforme en production'],
    ],
    col_widths=[1, 3.5, 2.5]
))

story.append(h2('15.2 Phase 2 : V2 (Mois 7-14)'))
story.append(make_table(
    ['Mois', 'Activit\u00e9', 'Livrable'],
    [
        ['7-8', 'Reconnaissance faciale et webcam monitoring', 'Module anti-fraude avanc\u00e9'],
        ['8-9', 'Int\u00e9gration Mobile Money r\u00e9elle (Orange, MTN)', 'Paiement en production'],
        ['9-10', 'Application mobile React Native', 'Apps iOS et Android'],
        ['10-11', 'API permis biom\u00e9trique', 'Connexion au syst\u00e8me national'],
        ['11-13', 'Statistiques avanc\u00e9es et audit automatis\u00e9', 'Dashboard BI, rapports automatiques'],
        ['13-14', 'Extension nationale (10-15 centres)', 'Couverture multi-r\u00e9gions'],
    ],
    col_widths=[1, 3.5, 2.5]
))

# ═══════════════════════════════════════════════════════════════════════
# SECTION 16: BUDGET ESTIMATIF
# ═══════════════════════════════════════════════════════════════════════
story.extend(h1('16. Budget estimatif'))

story.append(p(
    'Le budget ci-dessous fournit une estimation indicative des co\u00fbts de d\u00e9veloppement, '
    'd\u2019infrastructure et de fonctionnement de la plateforme CodeRoute Guin\u00e9e. Ces estimations '
    'sont bas\u00e9es sur les taux pratiqu\u00e9s en Afrique de l\u2019Ouest et pourront \u00eatre affin\u00e9es '
    'lors de la phase de soumission des offres. Les montants sont exprim\u00e9s en euros (EUR).'
))

story.append(h2('16.1 Co\u00fbts de d\u00e9veloppement (Phase 1 - MVP)'))
story.append(make_table(
    ['Poste', 'D\u00e9tail', 'Estimation (EUR)'],
    [
        ['Conception UX/UI', 'Maquettes, prototypes, tests utilisateurs', '15 000 - 25 000'],
        ['D\u00e9veloppement Backend', 'API, auth, examen, paiement, anti-fraude', '40 000 - 60 000'],
        ['D\u00e9veloppement Frontend', 'Web app candidat, centre, admin', '30 000 - 50 000'],
        ['Int\u00e9gration Mobile Money', 'Orange Money + MTN (sandbox puis prod)', '10 000 - 15 000'],
        ['Tests et s\u00e9curit\u00e9', 'Tests fonctionnels, audit s\u00e9curit\u00e9, penetration testing', '10 000 - 15 000'],
        ['Formation et documentation', 'Formation centres pilotes, manuels', '5 000 - 8 000'],
        ['Sous-total Phase 1', '', '110 000 - 173 000'],
    ],
    col_widths=[2, 3, 2]
))

story.append(h2('16.2 Co\u00fbts de d\u00e9veloppement (Phase 2 - V2)'))
story.append(make_table(
    ['Poste', 'D\u00e9tail', 'Estimation (EUR)'],
    [
        ['Reconnaissance faciale', 'Int\u00e9gration SDK, tests, calibrage', '15 000 - 25 000'],
        ['Application mobile', 'React Native iOS + Android', '25 000 - 40 000'],
        ['API permis biom\u00e9trique', 'Int\u00e9gration avec le syst\u00e8me national', '10 000 - 20 000'],
        ['Dashboard BI avanc\u00e9', 'Superset, dbt, mod\u00e8les statistiques', '15 000 - 25 000'],
        ['Audit automatis\u00e9', 'Syst\u00e8me de sanctions, alertes', '8 000 - 12 000'],
        ['Sous-total Phase 2', '', '73 000 - 122 000'],
    ],
    col_widths=[2, 3, 2]
))

story.append(h2('16.3 Co\u00fbts d\u2019infrastructure annuelle'))
story.append(make_table(
    ['Poste', 'Estimation annuelle (EUR)'],
    [
        ['H\u00e9bergement cloud hybride', '12 000 - 24 000'],
        ['Services SMS / WhatsApp', '5 000 - 10 000'],
        ['Licences et outils DevOps', '3 000 - 6 000'],
        ['Maintenance et support', '15 000 - 25 000'],
        ['Sous-total annuel', '35 000 - 65 000'],
    ],
    col_widths=[3, 2]
))

story.append(p(
    '<b>Estimation totale sur 2 ans (d\u00e9veloppement + infrastructure)</b> : '
    '<b>253 000 - 425 000 EUR</b>, soit environ 280 000 000 - 470 000 000 GNF au taux actuel. '
    'Ce budget peut \u00eatre partiellement couvert par les revenus g\u00e9n\u00e9r\u00e9s par les frais d\u2019examen '
    'd\u00e8s la premi\u00e8re ann\u00e9e de fonctionnement.'
))

# ═══════════════════════════════════════════════════════════════════════
# SECTION 17: ANALYSE DES RISQUES
# ═══════════════════════════════════════════════════════════════════════
story.extend(h1('17. Analyse des risques'))

story.append(p(
    'L\u2019analyse des risques identifie les menaces principales pesant sur le projet CodeRoute Guin\u00e9e, '
    'qu\u2019elles soient techniques, organisationnelles ou juridiques. Pour chaque risque, une strat\u00e9gie '
    'd\u2019att\u00e9nuation est propos\u00e9e afin de minimiser la probabilit\u00e9 d\u2019occurrence et l\u2019impact potentiel.'
))

story.append(make_table(
    ['Risque', 'Cat\u00e9gorie', 'Probabilit\u00e9', 'Impact', 'Att\u00e9nuation'],
    [
        ['Fraude malgr\u00e9 le dispositif', 'Technique', 'Moyenne', '\u00c9lev\u00e9', 'Monitoring continu, audits al\u00e9atoires, mise \u00e0 jour r\u00e9guli\u00e8re des mesures anti-fraude'],
        ['Panne de connectivit\u00e9', 'Technique', '\u00c9lev\u00e9e', '\u00c9lev\u00e9', 'Onduleur/g\u00e9n\u00e9rateur, mode hors-ligne avec synchronisation, lien redondant'],
        ['Panne de courant', 'Infrastructure', '\u00c9lev\u00e9e', '\u00c9lev\u00e9', 'Onduleur + g\u00e9n\u00e9rateur obligatoire dans les centres, sauvegarde automatique'],
        ['Corruption des agents de centre', 'Organisationnel', 'Moyenne', '\u00c9lev\u00e9', 'Rotation des agents, surveillance vid\u00e9o, audits inopin\u00e9s, signalement anonyme'],
        ['R\u00e9sistance au changement', 'Organisationnel', '\u00c9lev\u00e9e', 'Moyen', 'Formation approfondie, communication, p\u00e9riode de transition'],
        ['Donn\u00e9es personnelles compromisees', 'Juridique', 'Faible', '\u00c9lev\u00e9', 'Chiffrement, RGPD-like, DPO, audit de s\u00e9curit\u00e9 r\u00e9gulier'],
        ['D\u00e9pendance fournisseur Mobile Money', 'Technique', 'Faible', 'Moyen', 'Multi-op\u00e9rateur (Orange + MTN), contrat SLA'],
        ['Non-adoption par les candidats', 'Organisationnel', 'Faible', '\u00c9lev\u00e9', 'UX intuitive, support multicanal, communication nationale'],
        ['Attaque informatique (DDoS, injection)', 'Technique', 'Moyenne', '\u00c9lev\u00e9', 'WAF, rate limiting, audit de s\u00e9curit\u00e9, plan de r\u00e9ponse aux incidents'],
        ['Cadre juridique insuffisant', 'Juridique', 'Moyenne', 'Moyen', 'R\u00e9daction d\u2019un d\u00e9cret d\u2019application, conformit\u00e9 l\u00e9gale pr\u00e9alable'],
    ],
    col_widths=[1.8, 1.2, 1, 1, 2.5]
))

# ═══════════════════════════════════════════════════════════════════════
# SECTION 18: MVP - PHASE 1
# ═══════════════════════════════════════════════════════════════════════
story.extend(h1('18. MVP \u2014 Phase 1'))

story.append(p(
    'Le Produit Minimum Viable (MVP) constitue la premi\u00e8re version d\u00e9ployable de la plateforme, '
    'int\u00e9grant les fonctionnalit\u00e9s essentielles pour un lancement pilote \u00e0 Conakry. L\u2019objectif '
    'est de valider le mod\u00e8le, de tester le dispositif anti-fraude en conditions r\u00e9elles et de '
    'recueillir les retours des utilisateurs avant le d\u00e9ploiement national.'
))

story.append(h2('18.1 Modules du MVP'))

mvp_modules = [
    'Authentification candidat, centre, admin (JWT, r\u00f4les)',
    'Inscription candidat avec upload de documents',
    'Gestion des centres agr\u00e9\u00e9s (cr\u00e9ation, modification, suspension)',
    'R\u00e9servation d\u2019une session d\u2019examen',
    'Paiement fictif ou Mobile Money sandbox',
    'G\u00e9n\u00e9ration de convocation avec QR code',
    'Passage d\u2019un examen en ligne (tirage al\u00e9atoire, chronom\u00e8tre, correction auto)',
    'R\u00e9sultat PDF avec certificat num\u00e9rique',
    'Dashboard admin basique (statistiques, centres, candidats)',
    'Logs anti-fraude basiques (QR code, photo, verrouillage)',
]
for item in mvp_modules:
    story.append(bullet(item))

story.append(h2('18.2 Crit\u00e8res de succ\u00e8s du MVP'))
story.append(make_table(
    ['Crit\u00e8re', 'Objectif'],
    [
        ['Centres pilotes op\u00e9rationnels', '3-5 centres \u00e0 Conakry'],
        ['Candidats inscrits en mois 1', '> 500'],
        ['Examens r\u00e9ussis sans incident technique', '> 95%'],
        ['Fraude d\u00e9tect\u00e9e par le syst\u00e8me', '> 80% des cas simul\u00e9s'],
        ['Temps de r\u00e9ponse de l\u2019application', '< 3 secondes'],
        ['Satisfaction candidat', '> 80% positif'],
    ],
    col_widths=[3, 3]
))

# ═══════════════════════════════════════════════════════════════════════
# SECTION 19: VISION FINALE ET FEUILLE DE ROUTE
# ═══════════════════════════════════════════════════════════════════════
story.extend(h1('19. Vision finale et feuille de route'))

story.append(p(
    '\u00c0 terme, CodeRoute Guin\u00e9e vise \u00e0 devenir la plateforme nationale de r\u00e9f\u00e9rence pour la gestion '
    'compl\u00e8te du permis de conduire, bien au-del\u00e0 de l\u2019examen th\u00e9orique du code de la route. '
    'La feuille de route ci-dessous pr\u00e9sente les grandes \u00e9tapes d\u2019\u00e9volution du syst\u00e8me, '
    'de la plateforme initiale \u00e0 l\u2019\u00e9cosyst\u00e8me complet de s\u00e9curit\u00e9 routi\u00e8re.'
))

story.append(h2('19.1 Vision \u00e0 long terme'))

vision_items = [
    'Examen du code de la route (th\u00e9orique) \u2014 Phase 1 et 2',
    'Examen pratique de conduite avec tra\u00e7abilit\u00e9 num\u00e9rique',
    'Gestion int\u00e9gr\u00e9e des auto-\u00e9coles et des moniteurs',
    'Gestion compl\u00e8te des centres agr\u00e9\u00e9s (code + pratique)',
    'Paiement unifi\u00e9 de tous les frais li\u00e9s au permis',
    'D\u00e9livrance de certificats et dipl\u00f4mes num\u00e9riques',
    'Statistiques nationales avanc\u00e9es et pr\u00e9dictives',
    'Contr\u00f4le anti-fraude de bout en bout (code + pratique + permis)',
    'Connexion au permis biom\u00e9trique national',
    'Sensibilisation \u00e0 la s\u00e9curit\u00e9 routi\u00e8re (campagnes, \u00e9ducation)',
]
for item in vision_items:
    story.append(bullet(item))

story.append(h2('19.2 Feuille de route'))

story.append(make_table(
    ['P\u00e9riode', 'Phase', 'Objectif cl\u00e9'],
    [
        ['Mois 1-6', 'MVP', 'Lancement pilote Conakry, 3-5 centres'],
        ['Mois 7-14', 'V2', 'Extension nationale, app mobile, reconnaissance faciale'],
        ['Mois 15-20', 'V3', 'Examen pratique, gestion moniteurs, API permis'],
        ['Mois 21-30', 'V4', 'Plateforme compl\u00e8te, BI avanc\u00e9, sensibilisation routi\u00e8re'],
        ['Mois 31+', 'Exploitation', 'Maintenance, \u00e9volution, extension r\u00e9gionale'],
    ],
    col_widths=[1.5, 1.5, 3.5]
))

story.append(p(
    'Ce projet est particuli\u00e8rement pertinent pour la Guin\u00e9e car il combine digitalisation '
    'administrative, s\u00e9curit\u00e9 routi\u00e8re, transparence, tra\u00e7abilit\u00e9 et cr\u00e9ation d\u2019un r\u00e9seau '
    'de centres agr\u00e9\u00e9s g\u00e9n\u00e9rateur d\u2019emplois et de revenus. Il constitue un investissement '
    'strat\u00e9gique pour l\u2019avenir de la s\u00e9curit\u00e9 routi\u00e8re en R\u00e9publique de Guin\u00e9e.'
))

# ═══════════════════════════════════════════════════════════════════════
# BUILD PDF
# ═══════════════════════════════════════════════════════════════════════
doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
print(f'PDF body generated: {OUTPUT_PATH}')
