import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_4YWGnPgh_Mq867tg553vNXQE81TZB4zSo');

export async function sendPropertyApprovedEmail(email: string, propertyTitle: string) {
  try {
    await resend.emails.send({
      from: 'Mauluna Immobiliare <noreply@mauluna.com>',
      to: email,
      subject: `Il tuo annuncio "${propertyTitle}" è stato approvato!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #D97860;">Annuncio Approvato!</h2>
          <p>Ciao,</p>
          <p>Il tuo annuncio <strong>"${propertyTitle}"</strong> è stato approvato ed è ora visibile sul sito.</p>
          <p>Puoi visualizzarlo e gestirlo dal tuo profilo.</p>
          <p style="margin-top: 30px; color: #666;">Cordiali saluti,<br>Il team di Mauluna Immobiliare</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending approval email:', error);
  }
}

export async function sendPropertyRejectedEmail(email: string, propertyTitle: string, reason?: string) {
  try {
    await resend.emails.send({
      from: 'Mauluna Immobiliare <noreply@mauluna.com>',
      to: email,
      subject: `Il tuo annuncio "${propertyTitle}" richiede modifiche`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #D97860;">Annuncio Richiede Modifiche</h2>
          <p>Ciao,</p>
          <p>Il tuo annuncio <strong>"${propertyTitle}"</strong> non è stato approvato.${reason ? `<br><strong>Motivo:</strong> ${reason}` : ''}</p>
          <p>Puoi modificarlo e ripubblicarlo dal tuo profilo.</p>
          <p style="margin-top: 30px; color: #666;">Cordiali saluti,<br>Il team di Mauluna Immobiliare</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending rejection email:', error);
  }
}

export async function sendPropertyFavoritedEmail(ownerEmail: string, propertyTitle: string, favoritedBy: string) {
  try {
    await resend.emails.send({
      from: 'Mauluna Immobiliare <noreply@mauluna.com>',
      to: ownerEmail,
      subject: `Qualcuno ha aggiunto il tuo annuncio ai preferiti!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #D97860;">Nuovo Interesse!</h2>
          <p>Ciao,</p>
          <p>Qualcuno ha aggiunto il tuo annuncio <strong>"${propertyTitle}"</strong> ai preferiti.</p>
          <p style="margin-top: 30px; color: #666;">Cordiali saluti,<br>Il team di Mauluna Immobiliare</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending favorited email:', error);
  }
}

