import { parse } from 'csv-parse/sync';
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// Set worker source for Node environment
pdfjsLib.GlobalWorkerOptions.workerSrc = "pdfjs-dist/legacy/build/pdf.worker.mjs";

export async function parsePDF(buffer: Buffer | Uint8Array): Promise<string> {
  const uint8Array = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({
    data: uint8Array,
    useSystemFonts: true,
    disableFontFace: true,
  });
  const pdf = await loadingTask.promise;

  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => (item as any).str).join(" ") + " ";
  }

  return text.trim();
}

export class FileService {
  static async parseCSV(buffer: Buffer): Promise<string[]> {
    console.log("[FileService] Parsing CSV...");
    try {
      const records = parse(buffer, {
        columns: false,
        skip_empty_lines: true
      });
      const data = records.flat().filter((text: any) => typeof text === 'string' && text.length > 0);
      console.log(`[FileService] CSV parsed. Rows: ${data.length}`);
      return data;
    } catch (err) {
      console.error("[FileService] CSV parsing failed:", err);
      throw new Error("Failed to parse CSV file.");
    }
  }

  static async parsePDF(buffer: Buffer): Promise<string> {
    console.log("[FileService] Parsing PDF with pdfjs-dist...");
    try {
      return await parsePDF(buffer);
    } catch (err) {
      console.error("[FileService] PDF parsing failed:", err);
      throw new Error("Failed to extract text from PDF.");
    }
  }

  static async parseText(buffer: Buffer): Promise<string> {
    console.log("[FileService] Parsing Text...");
    return buffer.toString('utf-8');
  }
}
