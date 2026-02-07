import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST || '',
    port: Number(env.SMTP_PORT) || 587,
    secure: Number(env.SMTP_PORT) === 465,
    auth: {
        user: env.SMTP_USER || '',
        pass: env.SMTP_PASS || '',
    },
});

export async function sendOrderConfirmation(to: string, orderDetails: {
    id: string;
    quantity: number;
    deliveryMethod: string;
    totalPrice: number;
}) {
    const { id, quantity, deliveryMethod, totalPrice } = orderDetails;

    const html = `
        <div style="font-family: sans-serif; color: #1c1917; max-width: 600px; margin: 0 auto; border: 1px solid #e7e5e4; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #1c1917; padding: 32px; text-align: center;">
                <h1 style="color: #fef3c7; margin: 0; font-size: 24px;">Ordrestadfesting</h1>
            </div>
            <div style="padding: 32px; background-color: #ffffff;">
                <p style="font-size: 16px; line-height: 1.5;">Takk for bestillinga di hjå Haugalandsved! Me har motteke betalinga di og ordren er no til behandling.</p>
                
                <div style="margin: 32px 0; padding: 24px; background-color: #f5f5f4; border-radius: 8px;">
                    <h2 style="font-size: 18px; margin-top: 0;">Ordredetaljar</h2>
                    <p style="margin: 8px 0;"><strong>Ordrenummer:</strong> ${id}</p>
                    <p style="margin: 8px 0;"><strong>Produkt:</strong> Blandingsved, 1000L storsekk</p>
                    <p style="margin: 8px 0;"><strong>Tal på:</strong> ${quantity} stk.</p>
                    <p style="margin: 8px 0;"><strong>Fraktmåte:</strong> ${deliveryMethod === 'pickup' ? 'Hent sjølv' : (deliveryMethod === 'express' ? 'Heimlevering (Ekspress)' : 'Heimlevering (Standard)')}</p>
                    <p style="margin: 16px 0; font-size: 20px; color: #b45309;"><strong>Totalpris: ${totalPrice.toLocaleString('no-NO')} kr</strong></p>
                </div>

                <p style="font-size: 14px; color: #57534e;">Me tek kontakt med deg for å avtale tidspunkt for ${deliveryMethod === 'pickup' ? 'henting' : 'levering'}.</p>
                
                <div style="margin-top: 32px; text-align: center;">
                    <a href="https://haugalandsved.no/profile/orders" style="background-color: #1c1917; color: #ffffff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold; font-size: 14px;">Sjå ordren min</a>
                </div>
            </div>
            <div style="padding: 24px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">&copy; ${new Date().getFullYear()} Haugalandsved</p>
            </div>
        </div>
    `;

    await transporter.sendMail({
        from: `"Haugalandsved" <${env.SMTP_FROM}>`,
        to,
        subject: `Ordrestadfesting - ${id}`,
        html,
    });
}

export async function sendAdminNotification(orderDetails: {
    id: string;
    quantity: number;
    deliveryMethod: string;
    totalPrice: number;
    customerEmail: string;
}) {
    const { id, quantity, deliveryMethod, totalPrice, customerEmail } = orderDetails;

    const html = `
        <div style="font-family: sans-serif; color: #1c1917; max-width: 600px; margin: 0 auto; border: 1px solid #e7e5e4; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #b45309; padding: 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Ny bestilling motteken!</h1>
            </div>
            <div style="padding: 32px; background-color: #ffffff;">
                <p style="font-size: 16px;">Det har kome inn ei ny bestilling på haugalandsved.no.</p>
                
                <div style="margin: 24px 0; padding: 20px; background-color: #f5f5f4; border-radius: 8px; border-left: 4px solid #b45309;">
                    <p style="margin: 8px 0;"><strong>Ordrenummer:</strong> ${id}</p>
                    <p style="margin: 8px 0;"><strong>Kunde:</strong> ${customerEmail}</p>
                    <p style="margin: 8px 0;"><strong>Tal på:</strong> ${quantity} stk. 1000L storsekk</p>
                    <p style="margin: 8px 0;"><strong>Frakt:</strong> ${deliveryMethod === 'pickup' ? 'Hent sjølv' : (deliveryMethod === 'express' ? 'Heimlevering (Ekspress)' : 'Heimlevering (Standard)')}</p>
                    <p style="margin: 8px 0;"><strong>Totalpris:</strong> ${totalPrice.toLocaleString('no-NO')} kr</p>
                </div>

                <div style="margin-top: 32px; text-align: center;">
                    <a href="https://db.haugalandsved.no/_/#/collections/orders/records/${id}" style="background-color: #1c1917; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Sjå ordren i PocketBase</a>
                </div>
            </div>
        </div>
    `;

    await transporter.sendMail({
        from: `"Haugalandsved System" <${env.SMTP_FROM}>`,
        to: [env.ADMIN_EMAIL || 'norleifj@online.no', 'erik@fjelldata.com'],
        subject: `NY ORDRE - ${id} - ${quantity} stk storsekk`,
        html,
    });
}
