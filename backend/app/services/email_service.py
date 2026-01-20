import os
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
from fastapi_mail import FastMail, MessageSchema
from fastapi_mail.config import ConnectionConfig
from pydantic import EmailStr

# Carregar .env da raiz do backend
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(env_path)

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("SMTP_USER"),
    MAIL_PASSWORD=os.getenv("SMTP_PASSWORD"),
    MAIL_FROM=os.getenv("SMTP_FROM", os.getenv("SMTP_USER")),
    MAIL_FROM_NAME=os.getenv("SMTP_FROM_NAME", "SafeClicker"),
    MAIL_SERVER=os.getenv("SMTP_HOST", "smtp.gmail.com"),
    MAIL_PORT=int(os.getenv("SMTP_PORT", "587")),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)


class EmailService:
    def __init__(self) -> None:
        self.fm = FastMail(conf)

    async def send_html(
        self,
        subject: str,
        recipients: List[EmailStr],
        html: str,
        reply_to: Optional[EmailStr] = None,
    ) -> None:
        message = MessageSchema(
            subject=subject,
            recipients=recipients,
            body=html,
            subtype="html",
            reply_to=[reply_to] if reply_to else [],
        )
        await self.fm.send_message(message)


email_service = EmailService()
