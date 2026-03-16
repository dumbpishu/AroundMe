import { resend } from "../config/resend";

export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
    try {
        await resend.emails.send({
            from: process.env.EMAIL_FROM as string,
            to,
            subject,
            html
        });
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Failed to send email.");
    }
}