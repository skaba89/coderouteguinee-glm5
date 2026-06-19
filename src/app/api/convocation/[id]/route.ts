import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

// ─── GET: Generate PDF convocation for a booking ────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    const { id } = await params

    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        candidat: {
          select: { id: true, nom: true, prenom: true, email: true, telephone: true, numeroUnique: true, dateNaissance: true, numeroIdentite: true, ville: true, categoriePermis: true },
        },
        centre: {
          select: { id: true, nom: true, ville: true, adresse: true, telephone: true, region: true },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Reservation non trouvee' }, { status: 404 })
    }

    // Only the booking owner or an admin can download the convocation
    if (booking.candidatId !== session.userId && session.role !== 'administration' && session.role !== 'super-admin') {
      return NextResponse.json({ error: 'Acces non autorise' }, { status: 403 })
    }

    if (!booking.confirmee && booking.statutPaiement !== 'confirme') {
      return NextResponse.json({ error: 'Le paiement doit etre confirme pour generer la convocation' }, { status: 400 })
    }

    // ─── Build PDF with pdf-lib ────────────────────────────
    const pdfDoc = await PDFDocument.create()
    pdfDoc.setTitle(`Convocation ${booking.numeroConvocation || booking.id}`)
    pdfDoc.setAuthor('CodeRoute Guinee')
    pdfDoc.setSubject('Convocation a l\'examen du code de la route')

    const page = pdfDoc.addPage([595.28, 841.89]) // A4 portrait in points
    const { width, height } = page.getSize()

    // ─── Fonts ───
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

    // ─── Colors (Guinea flag: red #CE1126, yellow #FCD116, green #009460) ───
    const COLOR_RED = rgb(0xCE / 255, 0x11 / 255, 0x26 / 255)
    const COLOR_YELLOW = rgb(0xFC / 255, 0xD1 / 255, 0x16 / 255)
    const COLOR_GREEN = rgb(0x00 / 255, 0x94 / 255, 0x60 / 255)
    const COLOR_DARK = rgb(0x1A / 255, 0x23 / 255, 0x32 / 255)
    const COLOR_GRAY = rgb(0x6B / 255, 0x72 / 255, 0x80 / 255)
    const COLOR_LIGHT_GRAY = rgb(0x9C / 255, 0xA3 / 255, 0xAF / 255)
    const COLOR_LIGHT_GREEN_BG = rgb(0xF0 / 255, 0xF7 / 255, 0xF4 / 255)
    const COLOR_LIGHT_RED_BG = rgb(0xFE / 255, 0xF2 / 255, 0xF2 / 255)

    // ─── Helper: sanitize text to WinAnsi/Latin-1 (pdf-lib's StandardFonts are WinAnsi) ───
    // Replace any character outside Latin-1 with a close ASCII equivalent.
    const sanitize = (s: string): string => {
      if (s == null) return ''
      return String(s)
        // Narrow no-break space, thin space, figure space, etc.
        .replace(/[\u202F\u2009\u200A\u2007\u2008\u205F]/g, ' ')
        // General non-breaking space → regular space
        .replace(/\u00A0/g, ' ')
        // Soft hyphen → empty
        .replace(/\u00AD/g, '')
        // Curly quotes → straight quotes
        .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
        .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
        // Em/en dash, bullet → ASCII equivalents
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/[\u2022\u25E6\u2043]/g, '-')
        // Ellipsis
        .replace(/\u2026/g, '...')
        // Final safety net: replace any remaining non-Latin-1 char with '?'
        .replace(/[^\x00-\xFF]/g, '?')
    }

    // ─── Helper: draw text ───
    const drawText = (
      text: string,
      x: number,
      y: number,
      opts: { size?: number; font?: typeof helvetica; color?: typeof COLOR_DARK; align?: 'left' | 'center' | 'right' } = {}
    ) => {
      const size = opts.size ?? 10
      const font = opts.font ?? helvetica
      const color = opts.color ?? COLOR_DARK
      const align = opts.align ?? 'left'
      const safeText = sanitize(text)
      const textWidth = font.widthOfTextAtSize(safeText, size)
      let drawX = x
      if (align === 'center') drawX = (width - textWidth) / 2
      else if (align === 'right') drawX = width - 50 - textWidth
      page.drawText(safeText, { x: drawX, y, size, font, color })
    }

    // ─── Top stripes (Guinea flag) ───
    page.drawRectangle({ x: 0, y: height - 8, width, height: 8, color: COLOR_RED })
    page.drawRectangle({ x: 0, y: height - 16, width, height: 8, color: COLOR_YELLOW })
    page.drawRectangle({ x: 0, y: height - 24, width, height: 8, color: COLOR_GREEN })

    // ─── Republic header ───
    let y = height - 40
    drawText('Republique de Guinee', 50, y, { size: 10, color: COLOR_GRAY, align: 'center' })
    y -= 14
    drawText('Ministere des Transports', 50, y, { size: 10, color: COLOR_GRAY, align: 'center' })
    y -= 14
    drawText('Direction Generale des Transports Terrestres', 50, y, { size: 10, color: COLOR_GRAY, align: 'center' })
    y -= 30

    // ─── Title banner ───
    page.drawRectangle({ x: 50, y: y - 30, width: width - 100, height: 40, color: COLOR_GREEN })
    drawText('CONVOCATION A L\'EXAMEN DU CODE DE LA ROUTE', 50, y - 18, {
      size: 14,
      font: helveticaBold,
      color: rgb(1, 1, 1),
      align: 'center',
    })
    y -= 60

    // ─── Convocation number (right-aligned) ───
    const convNumber = booking.numeroConvocation || 'CONV-' + booking.id.substring(0, 8).toUpperCase()
    drawText(`N° de convocation: ${convNumber}`, 50, y, { size: 10, align: 'right' })
    y -= 25

    // ─── Section helper ───
    const drawSection = (title: string, contentY: number): number => {
      page.drawRectangle({ x: 50, y: contentY - 14, width: width - 100, height: 20, color: COLOR_LIGHT_GREEN_BG })
      drawText(title, 60, contentY - 6, { size: 12, font: helveticaBold, color: COLOR_GREEN })
      return contentY - 30
    }

    const drawInfoRow = (label: string, value: string, currentY: number): number => {
      const safeValue = value == null ? '' : String(value)
      drawText(`${label}:`, 60, currentY, { size: 9, color: COLOR_LIGHT_GRAY })
      drawText(`  ${safeValue}`, 60 + helvetica.widthOfTextAtSize(`${label}:`, 9), currentY, { size: 9, color: COLOR_DARK })
      return currentY - 16
    }

    // ─── Candidate section ───
    y = drawSection('INFORMATIONS DU CANDIDAT', y)
    y = drawInfoRow('Nom complet', `${booking.candidat.prenom} ${booking.candidat.nom}`, y)
    y = drawInfoRow('N° unique', booking.candidat.numeroUnique, y)
    y = drawInfoRow('N° piece d\'identite', booking.candidat.numeroIdentite, y)
    y = drawInfoRow('Date de naissance', booking.candidat.dateNaissance, y)
    y = drawInfoRow('Telephone', booking.candidat.telephone, y)
    y = drawInfoRow('Email', booking.candidat.email, y)
    y = drawInfoRow('Categorie permis', booking.candidat.categoriePermis, y)
    y -= 10

    // ─── Exam details section ───
    y = drawSection('DETAILS DE L\'EXAMEN', y)
    y = drawInfoRow('Centre d\'examen', booking.centreNom, y)
    y = drawInfoRow('Adresse du centre', booking.centre?.adresse || '', y)
    y = drawInfoRow('Ville', `${booking.centre?.ville || ''} (${booking.centre?.region || ''})`, y)
    y = drawInfoRow('Date de l\'examen', booking.date, y)
    y = drawInfoRow('Heure', booking.heure, y)
    y = drawInfoRow('Langue', booking.langue === 'fr' ? 'Francais' : booking.langue.toUpperCase(), y)
    y = drawInfoRow('Categorie', booking.categoriePermis, y)
    y -= 10

    // ─── Payment section ───
    y = drawSection('INFORMATIONS DE PAIEMENT', y)
    const montantFmt = new Intl.NumberFormat('fr-GN').format(booking.montant) + ' GNF'
    y = drawInfoRow('Montant', montantFmt, y)
    const moyen = booking.moyenPaiement === 'mobile_money'
      ? 'Mobile Money'
      : booking.moyenPaiement || ''
    y = drawInfoRow('Moyen de paiement', moyen, y)
    y = drawInfoRow('Statut', 'Confirme', y)
    y -= 15

    // ─── Instructions section (red) ───
    page.drawRectangle({ x: 50, y: y - 14, width: width - 100, height: 20, color: COLOR_LIGHT_RED_BG })
    drawText('INSTRUCTIONS IMPORTANTES', 60, y - 6, { size: 12, font: helveticaBold, color: COLOR_RED })
    y -= 30

    const instructions = [
      'Presentez-vous au centre d\'examen avec cette convocation et une piece d\'identite valide.',
      'Arrivez au moins 30 minutes avant l\'heure prevue.',
      'Aucun telephone ou objet electronique n\'est autorise dans la salle d\'examen.',
      'La duree de l\'examen est de 30 minutes pour 40 questions.',
      'Le score minimum de reussite est de 35/40 (87.5%).',
      'En cas de retard, l\'acces a la salle d\'examen peut etre refuse.',
    ]
    for (let i = 0; i < instructions.length; i++) {
      drawText(`${i + 1}. ${instructions[i]}`, 60, y, { size: 9, color: COLOR_GRAY })
      y -= 14
    }
    y -= 15

    // ─── QR reference ───
    if (booking.qrCodeData) {
      drawText(`Reference QR: ${booking.qrCodeData}`, 50, y, { size: 8, color: COLOR_LIGHT_GRAY, align: 'center' })
    }

    // ─── Footer stripes ───
    const footerY = 60
    page.drawRectangle({ x: 0, y: footerY + 16, width, height: 8, color: COLOR_RED })
    page.drawRectangle({ x: 0, y: footerY + 8, width, height: 8, color: COLOR_YELLOW })
    page.drawRectangle({ x: 0, y: footerY, width, height: 8, color: COLOR_GREEN })

    drawText(
      `Genere le ${new Date().toLocaleDateString('fr-FR')} - CodeRoute Guinee - Ce document est un titre de convocation officiel`,
      50,
      footerY - 18,
      { size: 7, font: helveticaOblique, color: COLOR_LIGHT_GRAY, align: 'center' }
    )

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(new Uint8Array(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="convocation_${booking.numeroConvocation || booking.id.substring(0, 8)}.pdf"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Erreur lors de la generation du PDF' }, { status: 500 })
  }
}
