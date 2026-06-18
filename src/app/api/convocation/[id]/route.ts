import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import PDFDocument from 'pdfkit'

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

    // Generate PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))

    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)))
    })

    // ─── Header: Republic of Guinea banner ───
    doc.rect(0, 0, doc.page.width, 8).fill('#CE1126') // Red stripe
    doc.rect(0, 8, doc.page.width, 8).fill('#FCD116') // Yellow stripe
    doc.rect(0, 16, doc.page.width, 8).fill('#009460') // Green stripe

    doc.fontSize(10).fillColor('#6B7280')
      .text('Republique de Guinee', 50, 40, { align: 'center' })
      .text('Ministere des Transports', 50, 54, { align: 'center' })
      .text('Direction Generale des Transports Terrestres', 50, 68, { align: 'center' })

    doc.moveDown(0.5)

    // ─── Title ───
    doc.rect(50, 95, doc.page.width - 100, 40).fill('#009460')
    doc.fontSize(18).fillColor('#FFFFFF')
      .text('CONVOCATION A L\'EXAMEN DU CODE DE LA ROUTE', 50, 100, {
        width: doc.page.width - 100,
        align: 'center',
      })

    doc.moveDown(1.5)
    doc.y = 150

    // ─── Convocation number ───
    doc.fontSize(10).fillColor('#1A2332')
      .text(`N° de convocation: ${booking.numeroConvocation || 'CONV-' + booking.id.substring(0, 8).toUpperCase()}`, 50, doc.y, { align: 'right' })

    doc.y = 180

    // ─── Candidate info section ───
    doc.rect(50, doc.y, doc.page.width - 100, 20).fill('#F0F7F4')
    doc.fontSize(12).fillColor('#009460')
      .text('INFORMATIONS DU CANDIDAT', 60, doc.y + 4)
    doc.y += 30

    const candidateInfo = [
      ['Nom complet', `${booking.candidat.prenom} ${booking.candidat.nom}`],
      ['N° unique', booking.candidat.numeroUnique],
      ['N° piece d\'identite', booking.candidat.numeroIdentite],
      ['Date de naissance', booking.candidat.dateNaissance],
      ['Telephone', booking.candidat.telephone],
      ['Email', booking.candidat.email],
      ['Categorie permis', booking.candidat.categoriePermis],
    ]

    for (const [label, value] of candidateInfo) {
      doc.fontSize(9).fillColor('#9CA3AF').text(`${label}:`, 60, doc.y, { continued: true })
      doc.fillColor('#1A2332').text(`  ${value}`)
      doc.moveDown(0.2)
    }

    doc.moveDown(0.5)

    // ─── Exam details section ───
    doc.rect(50, doc.y, doc.page.width - 100, 20).fill('#F0F7F4')
    doc.fontSize(12).fillColor('#009460')
      .text('DETAILS DE L\'EXAMEN', 60, doc.y + 4)
    doc.y += 30

    const examInfo = [
      ['Centre d\'examen', booking.centreNom],
      ['Adresse du centre', booking.centre.adresse],
      ['Ville', `${booking.centre.ville} (${booking.centre.region})`],
      ['Date de l\'examen', booking.date],
      ['Heure', booking.heure],
      ['Langue', booking.langue === 'fr' ? 'Francais' : booking.langue.toUpperCase()],
      ['Categorie', booking.categoriePermis],
    ]

    for (const [label, value] of examInfo) {
      doc.fontSize(9).fillColor('#9CA3AF').text(`${label}:`, 60, doc.y, { continued: true })
      doc.fillColor('#1A2332').text(`  ${value}`)
      doc.moveDown(0.2)
    }

    doc.moveDown(0.5)

    // ─── Payment info ───
    doc.rect(50, doc.y, doc.page.width - 100, 20).fill('#F0F7F4')
    doc.fontSize(12).fillColor('#009460')
      .text('INFORMATIONS DE PAIEMENT', 60, doc.y + 4)
    doc.y += 30

    const paymentInfo = [
      ['Montant', new Intl.NumberFormat('fr-GN').format(booking.montant) + ' GNF'],
      ['Moyen de paiement', booking.moyenPaiement === 'mobile_money' ? 'Mobile Money' : booking.moyenPaiement],
      ['Statut', 'Confirme'],
    ]

    for (const [label, value] of paymentInfo) {
      doc.fontSize(9).fillColor('#9CA3AF').text(`${label}:`, 60, doc.y, { continued: true })
      doc.fillColor('#1A2332').text(`  ${value}`)
      doc.moveDown(0.2)
    }

    doc.moveDown(1)

    // ─── Important notices ───
    doc.rect(50, doc.y, doc.page.width - 100, 20).fill('#FEF2F2')
    doc.fontSize(12).fillColor('#CE1126')
      .text('INSTRUCTIONS IMPORTANTES', 60, doc.y + 4)
    doc.y += 30

    const instructions = [
      'Presentez-vous au centre d\'examen avec cette convocation et une piece d\'identite valide.',
      'Arrivez au moins 30 minutes avant l\'heure prevue.',
      'Aucun telephone ou objet electronique n\'est autorise dans la salle d\'examen.',
      'La duree de l\'examen est de 30 minutes pour 40 questions.',
      'Le score minimum de reussite est de 35/40 (87.5%).',
      'En cas de retard, l\'acces a la salle d\'examen peut etre refuse.',
    ]

    for (let i = 0; i < instructions.length; i++) {
      doc.fontSize(9).fillColor('#6B7280')
        .text(`${i + 1}. ${instructions[i]}`, 60, doc.y)
      doc.moveDown(0.3)
    }

    doc.moveDown(1)

    // ─── QR Code reference ───
    if (booking.qrCodeData) {
      doc.fontSize(8).fillColor('#9CA3AF')
        .text(`Reference QR: ${booking.qrCodeData}`, 50, doc.y, { align: 'center' })
    }

    // ─── Footer ───
    const footerY = doc.page.height - 80
    doc.rect(0, footerY, doc.page.width, 8).fill('#CE1126')
    doc.rect(0, footerY + 8, doc.page.width, 8).fill('#FCD116')
    doc.rect(0, footerY + 16, doc.page.width, 8).fill('#009460')

    doc.fontSize(7).fillColor('#9CA3AF')
      .text(`Genere le ${new Date().toLocaleDateString('fr-FR')} - CodeRoute Guinee - Ce document est un titre de convocation officiel`, 50, footerY + 28, { align: 'center' })

    doc.end()

    const pdfBuffer = await pdfPromise

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="convocation_${booking.numeroConvocation || booking.id.substring(0, 8)}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Erreur lors de la generation du PDF' }, { status: 500 })
  }
}
