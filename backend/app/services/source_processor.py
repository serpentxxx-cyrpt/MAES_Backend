import io
import re
from pypdf import PdfReader
import requests
from bs4 import BeautifulSoup
from youtube_transcript_api import YouTubeTranscriptApi
from fastapi import UploadFile

async def extract_text_from_pdf(file: UploadFile) -> str:
    """Extracts text from a PDF file using PyMuPDF (fitz)."""
    import fitz
    import logging
    content = await file.read()
    logging.warning(f"PDF uploaded, bytes length: {len(content)}")
    doc = fitz.open(stream=content, filetype="pdf")
    text = ""
    for i, page in enumerate(doc):
        text += f"\n--- PAGE {i+1} ---\n"
        text += page.get_text() + "\n"
    text = text.strip()
    if not text:
        text = "SYSTEM NOTE: The uploaded PDF could not be read because it appears to be a scanned image or has no readable text layer. The AI cannot see the contents."
    
    logging.warning(f"Extracted text length: {len(text)}")
    return text

def extract_text_from_url(url: str) -> str:
    """Fetches a webpage and extracts visible text using BeautifulSoup."""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer", "header"]):
            script.extract()
            
        text = soup.get_text(separator=' ')
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = '\n'.join(chunk for chunk in chunks if chunk)
        
        return text
    except Exception as e:
        raise ValueError(f"Failed to extract text from URL: {e}")

def extract_text_from_youtube(url: str) -> str:
    """Extracts transcript from a YouTube video URL."""
    try:
        # Extract video ID
        video_id = None
        if "v=" in url:
            video_id = url.split("v=")[1].split("&")[0]
        elif "youtu.be/" in url:
            video_id = url.split("youtu.be/")[1].split("?")[0]
            
        if not video_id:
            raise ValueError("Invalid YouTube URL")
            
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        text = " ".join([entry['text'] for entry in transcript])
        return text
    except Exception as e:
        raise ValueError(f"Failed to fetch YouTube transcript: {e}")
